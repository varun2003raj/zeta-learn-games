import {
  ATTACK_CHAIN_CASES,
  AUTH_FLAW_CASES,
  BREACH_CASES,
  CODE_REVIEW_CASES,
  CSRF_CASES,
  EXPLOIT_CHAIN_CASES,
  HASH_SIGNATURES,
  JWT_CASES,
  LEVEL_BANDS,
  PASSWORD_CASES,
  PHISHING_SCENARIOS,
  SECURITY_TERMS,
  SESSION_CASES,
  SQLI_CASES,
  TOTAL_LEVELS,
  WEB_CASE_ANALYSIS,
  XSS_CASES,
} from "../data/levelBands";
import { caesarEncrypt, normalizeAnswer, textToBinary, toBase64, xorEncodeHex } from "../utils/cryptoHelpers";
import { clamp, createSeededRandom, pickOne, randomInt, seedFromLevel, shuffle } from "../utils/random";

const HEX = "0123456789abcdef";
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const TXT = [...SECURITY_TERMS, "verify mfa", "sanitize input", "review auth logs", "block suspicious ip"];
const XOR_TXT = ["patch critical service", "rotate token keys", "inspect failed login", "restrict admin api"];
const MULTI_TXT = ["isolate affected host", "reset compromised creds", "preserve forensic evidence", "review privileged activity"];
const REV_TXT = ["verify jwt signature", "enforce least privilege", "sanitize request payload", "rotate service secrets"];
const HASH_WORDS = ["admin123", "trustno1", "letmein", "sunset88", "security42", "backup2024", "monitor77", "winter2025"];
const JS_TXT = ["rotate jwt secret", "disable exposed debug", "lock privileged account", "enable strict csp"];

const VULN_CHAINS = [
  {
    scenario: "Reset token leaks in logs, token reuse enables takeover, takeover unlocks admin console.",
    answer: "token-leak>token-reuse>takeover>admin-console",
    hint: "Leak occurs before reuse.",
  },
  {
    scenario: "IDOR reveals endpoint, endpoint allows role change, role change enables data export.",
    answer: "idor>endpoint-discovery>role-change>data-export",
    hint: "Start with object reference flaw.",
  },
  {
    scenario: "Stored XSS steals cookie, cookie opens support console, console reveals api key, key allows storage theft.",
    answer: "xss>cookie-theft>console-access>api-key>storage-theft",
    hint: "Credential theft is step two.",
  },
];

const PRIVESC = [
  {
    q: "User can run /usr/bin/tar with sudo and no password. Primary risk?",
    o: ["A) Privilege escalation via command option abuse", "B) Availability only", "C) No security impact"],
    a: "a",
    h: "Limited sudo scope can still escalate.",
  },
  {
    q: "Root service executes scripts from world-writable directory. Core finding?",
    o: ["A) Session timeout issue", "B) Writable execution path escalation", "C) Benign behavior"],
    a: "b",
    h: "Writable path + high privilege is dangerous.",
  },
  {
    q: "Session ID does not rotate after login. Which issue?",
    o: ["A) Session fixation risk", "B) Certificate pinning issue", "C) No risk"],
    a: "a",
    h: "Auth boundary should rotate session IDs.",
  },
];

const CMD_CASES = [
  { s: "exec('ping ' + req.query.host);", a: "vulnerable", h: "User input is concatenated into shell." },
  { s: "spawn('ping', ['-c', '1', validatedHost]);", a: "safe", h: "Arguments are separated and input validated." },
  { s: "const cmd = `nslookup ${domainInput}`; exec(cmd);", a: "vulnerable", h: "Template interpolation into shell." },
  { s: "if (ALLOWLIST.includes(host)) runLookup(host);", a: "safe", h: "Strict allowlist reduces injection risk." },
];

const getBandForLevel = (level) => {
  const safe = clamp(level, 1, TOTAL_LEVELS);
  return LEVEL_BANDS.find((band) => safe >= band.min && safe <= band.max) || LEVEL_BANDS[0];
};

const buildChallenge = (base, details) => ({
  id: `${base.level}-${details.categoryKey}-${base.variant}`,
  level: base.level,
  bandKey: base.band.key,
  bandLabel: base.band.label,
  bandSubtitle: base.band.subtitle,
  difficulty: base.band.difficulty,
  category: details.category,
  categoryKey: details.categoryKey,
  title: details.title,
  briefing: details.briefing,
  prompt: details.prompt,
  hints: details.hints,
  acceptedAnswers: [...new Set((details.answers || []).map((a) => normalizeAnswer(a)).filter(Boolean))],
  formatHint: details.formatHint || "Free text",
  formatRegex: details.formatRegex || null,
  inputPlaceholder: details.inputPlaceholder || "Write your answer...",
  timeLimit: details.timeLimit || base.timeLimit,
  baseScore: details.baseScore || base.baseScore,
  difficultyMultiplier: details.difficultyMultiplier || base.difficultyMultiplier,
  steps:
    details.steps?.map((step, index) => ({
      id: `${base.level}-step-${index + 1}`,
      title: step.title,
      briefing: step.briefing,
      prompt: step.prompt,
      hints: step.hints,
      acceptedAnswers: [...new Set((step.answers || []).map((a) => normalizeAnswer(a)).filter(Boolean))],
      formatHint: step.formatHint || "Free text",
      formatRegex: step.formatRegex || null,
      inputPlaceholder: step.inputPlaceholder || "Write stage answer...",
    })) || null,
});

const getLevelScaling = (level, band) => {
  const span = Math.max(1, band.max - band.min);
  const ratio = (level - band.min) / span;
  return {
    timeLimit: Math.max(70, Math.round(band.baseTime - ratio * 20)),
    baseScore: Math.round(band.baseScore + ratio * 44),
    difficultyMultiplier: Number((1 + Math.floor((level - 1) / 25) * 0.08).toFixed(2)),
  };
};

const randomHex = (rng, len) => Array.from({ length: len }, () => HEX[randomInt(rng, 0, HEX.length - 1)]).join("");
const randomIp = (rng) => `${pickOne(rng, [23, 45, 61, 77, 88, 103, 121, 144, 166, 185, 203])}.${randomInt(rng, 1, 254)}.${randomInt(rng, 1, 254)}.${randomInt(rng, 1, 254)}`;
const uniqueIps = (rng, count) => {
  const set = new Set();
  while (set.size < count) set.add(randomIp(rng));
  return [...set];
};
const simHash = (value) => {
  let state = 0;
  for (const ch of value) state = (state * 131 + ch.charCodeAt(0)) % 0xffffff;
  return state.toString(16).padStart(6, "0");
};
const hashAns = (algo) => (algo === "sha1" ? ["sha1", "sha-1"] : ["md5"]);
const time = (h, m) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

const genPassword = (base, rng) => {
  const item = pickOne(rng, PASSWORD_CASES);
  return buildChallenge(base, {
    category: "Password Security",
    categoryKey: "password-strength",
    title: "Credential Strength Classification",
    briefing: "Classify if the password is strong or weak.",
    prompt: `Candidate: ${item.candidate}\nReply: strong or weak`,
    answers: item.answer === "strong" ? ["strong", "secure"] : ["weak", "insecure"],
    hints: [item.hint, "Check length, predictability, and character diversity."],
    formatHint: "strong | weak",
    formatRegex: /^(strong|weak|secure|insecure)$/i,
    inputPlaceholder: "strong or weak",
  });
};

const genCaesar = (base, rng) => {
  const phrase = pickOne(rng, TXT);
  const shift = randomInt(rng, 1, 5);
  return buildChallenge(base, {
    category: "Caesar Cipher",
    categoryKey: "caesar-basic",
    title: "Shift Cipher Fundamentals",
    briefing: "Decode the shifted phrase.",
    prompt: `Cipher: ${caesarEncrypt(phrase, shift)}\nShift used: +${shift}\nDecode to plaintext.`,
    answers: [phrase],
    hints: ["Reverse the shift.", "Spaces are unchanged."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded phrase",
  });
};

const genBinary = (base, rng) => {
  const phrase = pickOne(rng, TXT);
  return buildChallenge(base, {
    category: "Binary to ASCII",
    categoryKey: "binary-ascii",
    title: "Binary Message Decode",
    briefing: "Decode 8-bit binary into text.",
    prompt: `Binary:\n${textToBinary(phrase)}`,
    answers: [phrase],
    hints: ["Each byte is one character.", "Convert base-2 chunks."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded text",
  });
};

const genHashId = (base, rng) => {
  const sig = pickOne(rng, HASH_SIGNATURES);
  return buildChallenge(base, {
    category: "Hash Identification",
    categoryKey: "hash-id",
    title: "Digest Fingerprint Recognition",
    briefing: "Identify hash type by signature length.",
    prompt: `Digest:\n${randomHex(rng, sig.length)}\nType? (md5 or sha1)`,
    answers: hashAns(sig.algorithm),
    hints: [sig.hint],
    formatHint: "md5 | sha1",
    formatRegex: /^(md5|sha1|sha-1)$/i,
    inputPlaceholder: "md5 or sha1",
  });
};

const genPhishing = (base, rng) => {
  const sample = pickOne(rng, PHISHING_SCENARIOS);
  return buildChallenge(base, {
    category: "Phishing Detection",
    categoryKey: "phishing-basic",
    title: "Message Triage",
    briefing: "Classify this communication.",
    prompt: sample.prompt,
    answers: sample.answer === "phishing" ? ["phishing", "suspicious"] : ["legitimate", "safe"],
    hints: [sample.hint],
    formatHint: "phishing | legitimate",
    formatRegex: /^(phishing|legitimate|safe|suspicious)$/i,
    inputPlaceholder: "classification",
  });
};

const genBase64 = (base, rng) => {
  const phrase = pickOne(rng, MULTI_TXT);
  return buildChallenge(base, {
    category: "Base64 Decoding",
    categoryKey: "base64-core",
    title: "Encoded Incident Note",
    briefing: "Decode base64 payload.",
    prompt: `Base64:\n${toBase64(phrase)}`,
    answers: [phrase],
    hints: ["Base64 decode to plaintext."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded text",
  });
};

const genXor = (base, rng) => {
  const phrase = pickOne(rng, XOR_TXT);
  const key = randomInt(rng, 3, 14);
  return buildChallenge(base, {
    category: "XOR Decryption",
    categoryKey: "xor-core",
    title: "Single-Byte XOR Training",
    briefing: "Decode the XOR hex payload.",
    prompt: `Hex cipher: ${xorEncodeHex(phrase, key)}\nXOR key (decimal): ${key}`,
    answers: [phrase],
    hints: ["XOR each byte with key.", "Output is lowercase text."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded message",
  });
};

const genLogIp = (base, rng) => {
  const ips = uniqueIps(rng, 4);
  const suspect = ips[randomInt(rng, 0, ips.length - 1)];
  const lines = shuffle(
    rng,
    ips.map((ip) => ({
      ip,
      failed: ip === suspect ? randomInt(rng, 7, 12) : randomInt(rng, 0, 3),
      success: randomInt(rng, 1, 14),
    }))
  )
    .map((r, i) => `${i + 1}) src=${r.ip} failed=${r.failed} success=${r.success}`)
    .join("\n");
  return buildChallenge(base, {
    category: "Log Analysis",
    categoryKey: "log-ip",
    title: "Suspicious Source Identification",
    briefing: "Find likely brute-force source IP.",
    prompt: `${lines}\n\nWhich source is suspicious?`,
    answers: [suspect],
    hints: ["Highest failed count is key.", "Return IPv4 only."],
    formatHint: "x.x.x.x",
    formatRegex: IPV4,
    inputPlaceholder: "203.0.113.10",
  });
};

const genSqli = (base, rng) => {
  const sample = pickOne(rng, SQLI_CASES);
  return buildChallenge(base, {
    category: "SQL Injection Detection",
    categoryKey: "sqli-detect",
    title: "Query Safety Review",
    briefing: "Classify snippet as safe or vulnerable.",
    prompt: sample.snippet,
    answers: sample.answer === "vulnerable" ? ["vulnerable", "unsafe", "sqli"] : ["safe", "not vulnerable"],
    hints: [sample.hint],
    formatHint: "safe | vulnerable",
    formatRegex: /^(safe|vulnerable|unsafe|not vulnerable|sqli)$/i,
    inputPlaceholder: "safe or vulnerable",
  });
};

const genXss = (base, rng) => {
  const sample = pickOne(rng, XSS_CASES);
  return buildChallenge(base, {
    category: "XSS Pattern Detection",
    categoryKey: "xss-detect",
    title: "Client-Side Injection Review",
    briefing: "Classify snippet as xss or safe.",
    prompt: sample.snippet,
    answers: sample.answer === "xss" ? ["xss", "vulnerable"] : ["safe", "not vulnerable"],
    hints: [sample.hint],
    formatHint: "xss | safe",
    formatRegex: /^(xss|safe|vulnerable|not vulnerable)$/i,
    inputPlaceholder: "xss or safe",
  });
};

const genAuth = (base, rng) => {
  const sample = pickOne(rng, AUTH_FLAW_CASES);
  return buildChallenge(base, {
    category: "Authentication Logic",
    categoryKey: "auth-flaw",
    title: "Authorization Control Analysis",
    briefing: "Name the core auth flaw.",
    prompt: sample.prompt,
    answers: [sample.answer],
    hints: [sample.hint],
    formatRegex: /^[a-z- ]+$/i,
    inputPlaceholder: "flaw type",
  });
};

const genMulti = (base, rng) => {
  const phrase = pickOne(rng, MULTI_TXT);
  const shift = randomInt(rng, 2, 6);
  return buildChallenge(base, {
    category: "Multi-Layer Encoding",
    categoryKey: "multi-encode",
    title: "Base64 + Caesar Decode",
    briefing: "Decode layered encoded payload.",
    prompt: `Blob: ${toBase64(caesarEncrypt(phrase, shift))}\nPipeline: plain -> Caesar(+${shift}) -> Base64`,
    answers: [phrase],
    hints: ["Decode base64 first.", "Then reverse Caesar shift."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded plaintext",
  });
};

const genJwt = (base, rng) => {
  const sample = pickOne(rng, JWT_CASES);
  return buildChallenge(base, {
    category: "JWT Security",
    categoryKey: "jwt-analysis",
    title: "Token Validation Weakness",
    briefing: "Identify the JWT issue.",
    prompt: sample.prompt,
    answers: [sample.answer],
    hints: [sample.hint],
    formatRegex: /^[a-z\- ]+$/i,
    inputPlaceholder: "issue name",
  });
};

const genVulnSnippet = (base, rng) => {
  const sample = pickOne(rng, CODE_REVIEW_CASES);
  return buildChallenge(base, {
    category: "Vulnerable Code Review",
    categoryKey: "vuln-snippet",
    title: "Snippet Risk Classification",
    briefing: "Name the main vulnerability class.",
    prompt: sample.snippet,
    answers:
      sample.answer === "safe"
        ? ["safe", "secure"]
        : sample.answer === "idor"
        ? ["idor", "insecure direct object reference"]
        : [sample.answer],
    hints: [sample.hint],
    formatRegex: /^[a-z\- ]+$/i,
    inputPlaceholder: "vulnerability label",
  });
};

const genReverse = (base, rng) => {
  const phrase = pickOne(rng, REV_TXT);
  const stored = phrase.replace(/\s+/g, "-").split("").reverse().join("");
  return buildChallenge(base, {
    category: "Reverse Engineering Logic",
    categoryKey: "reverse-logic",
    title: "String Transform Recovery",
    briefing: "Reverse pseudo-code transform and recover output.",
    prompt: `stored="${stored}"\nstep1=reverse(stored)\nstep2=step1.replaceAll("-", " ")\nRecovered output?`,
    answers: [phrase],
    hints: ["Undo in reverse order."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "recovered phrase",
  });
};

const genPacket = (base, rng) => {
  const suspicious = pickOne(rng, [
    "GET /search?q=%3Cscript%3Ealert(1)%3C/script%3E HTTP/1.1",
    "GET /ping?host=8.8.8.8;cat /etc/passwd HTTP/1.1",
    "POST /login body=username=admin' OR '1'='1 HTTP/1.1",
  ]);
  const packets = shuffle(rng, [
    { s: "TLS ClientHello to api.internal:443", bad: false },
    { s: "GET /status HTTP/1.1", bad: false },
    { s: "POST /metrics body=uptime=127", bad: false },
    { s: suspicious, bad: true },
  ]).map((p, i) => ({ ...p, id: `pkt-${i + 1}` }));
  const answer = packets.find((p) => p.bad)?.id || "pkt-1";
  return buildChallenge(base, {
    category: "Packet Inspection",
    categoryKey: "packet-reason",
    title: "Suspicious Packet Triage",
    briefing: "Pick packet with injection-like payload.",
    prompt: `${packets.map((p) => `${p.id.toUpperCase()}: ${p.s}`).join("\n")}\n\nWhich packet is suspicious?`,
    answers: [answer, answer.toUpperCase()],
    hints: ["Look for payload injection patterns."],
    formatHint: "pkt-<n>",
    formatRegex: /^pkt-\d+$/i,
    inputPlaceholder: "pkt-3",
  });
};

const genCmd = (base, rng) => {
  const sample = pickOne(rng, CMD_CASES);
  return buildChallenge(base, {
    category: "Command Injection Logic",
    categoryKey: "cmd-injection-logic",
    title: "Command Execution Safety Check",
    briefing: "Classify snippet as safe or vulnerable.",
    prompt: sample.s,
    answers: sample.a === "vulnerable" ? ["vulnerable", "unsafe"] : ["safe", "secure"],
    hints: [sample.h],
    formatHint: "safe | vulnerable",
    formatRegex: /^(safe|vulnerable|secure|unsafe)$/i,
    inputPlaceholder: "safe or vulnerable",
  });
};

const genCrypto = (base, rng) => {
  const phrase = pickOne(rng, MULTI_TXT);
  const shift = randomInt(rng, 1, 5);
  const key = randomInt(rng, 2, 9);
  return buildChallenge(base, {
    category: "Multi-Step Cryptography",
    categoryKey: "crypto-multistep",
    title: "Caesar + XOR Decode",
    briefing: "Decode payload encrypted with Caesar then XOR->hex.",
    prompt: `Hex: ${xorEncodeHex(caesarEncrypt(phrase, shift), key)}\nPipeline: plain -> Caesar(+${shift}) -> XOR(key=${key}) -> hex`,
    answers: [phrase],
    hints: ["XOR-decode first, then reverse Caesar."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded plaintext",
  });
};

const genHashCrack = (base, rng) => {
  const candidates = shuffle(rng, HASH_WORDS).slice(0, 4);
  const answer = pickOne(rng, candidates);
  const digits = (answer.match(/\d/g) || []).length;
  return buildChallenge(base, {
    category: "Hash Cracking Logic",
    categoryKey: "hash-crack-logic",
    title: "Dictionary Match Simulation",
    briefing: "Match simulated hash fingerprint to candidate.",
    prompt: [
      "Fingerprint format: SIM-<prefix>-LEN<length>-D<digits>",
      `Target: SIM-${simHash(answer).slice(0, 4)}-LEN${answer.length}-D${digits}`,
      "Candidates:",
      ...candidates.map((c, i) => `${i + 1}) ${c}`),
      "Which candidate matches?",
    ].join("\n"),
    answers: [answer],
    hints: ["Use all metadata fields together."],
    formatRegex: /^[a-z0-9]+$/i,
    inputPlaceholder: "matching candidate",
  });
};

const genPrivesc = (base, rng) => {
  const sample = pickOne(rng, PRIVESC);
  return buildChallenge(base, {
    category: "Privilege Escalation Reasoning",
    categoryKey: "privesc-reason",
    title: "Escalation Risk Assessment",
    briefing: "Pick the best finding.",
    prompt: `${sample.q}\n${sample.o.join("\n")}\nAnswer A, B, or C.`,
    answers: [sample.a],
    hints: [sample.h],
    formatHint: "A | B | C",
    formatRegex: /^[abc]$/i,
    inputPlaceholder: "A",
  });
};

const genFirewall = (base, rng) => {
  const port = pickOne(rng, [22, 3389, 8443]);
  const dst = `10.0.${randomInt(rng, 10, 40)}.${randomInt(rng, 10, 240)}`;
  const trusted = `192.168.50.${randomInt(rng, 2, 220)}`;
  const src = pickOne(rng, [trusted, randomIp(rng)]);
  const allowFirst = rng() > 0.5;
  const rules = allowFirst
    ? [`1) ALLOW tcp 192.168.50.0/24 -> ${dst}:${port}`, `2) DENY tcp any -> ${dst}:${port}`]
    : [`1) DENY tcp any -> ${dst}:${port}`, `2) ALLOW tcp 192.168.50.0/24 -> ${dst}:${port}`];
  const verdict = allowFirst && src.startsWith("192.168.50.") ? "allowed" : "blocked";
  return buildChallenge(base, {
    category: "Firewall Bypass Logic",
    categoryKey: "firewall-bypass",
    title: "Rule Order Evaluation",
    briefing: "Apply first-match firewall logic.",
    prompt: `${["Rules:", ...rules, `Packet: src=${src} dst=${dst}:${port}`].join("\n")}\nAllowed or blocked?`,
    answers: [verdict, verdict === "allowed" ? "allow" : "block"],
    hints: ["First matching rule wins."],
    formatHint: "allowed | blocked",
    formatRegex: /^(allowed|blocked|allow|block)$/i,
    inputPlaceholder: "allowed or blocked",
  });
};

const genCsrf = (base, rng) => {
  const sample = pickOne(rng, CSRF_CASES);
  return buildChallenge(base, {
    category: "CSRF Identification",
    categoryKey: "csrf-identify",
    title: "CSRF Exposure Check",
    briefing: "Classify scenario as csrf or safe.",
    prompt: sample.prompt,
    answers: sample.answer === "csrf" ? ["csrf", "vulnerable"] : ["safe", "protected"],
    hints: [sample.hint],
    formatHint: "csrf | safe",
    formatRegex: /^(csrf|safe|vulnerable|protected)$/i,
    inputPlaceholder: "csrf or safe",
  });
};

const genSession = (base, rng) => {
  const sample = pickOne(rng, SESSION_CASES);
  return buildChallenge(base, {
    category: "Session Security",
    categoryKey: "session-hijack",
    title: "Session Hijacking Risk",
    briefing: "Assess session handling risk.",
    prompt: sample.prompt,
    answers: sample.answer === "safe" ? ["safe", "protected"] : ["session hijacking risk", "hijacking risk", "vulnerable"],
    hints: [sample.hint],
    formatRegex: /^[a-z\- ]+$/i,
    inputPlaceholder: "risk assessment",
  });
};

const genAttack = (base, rng) => {
  const sample = pickOne(rng, ATTACK_CHAIN_CASES);
  return buildChallenge(base, {
    category: "Attack Chain Reasoning",
    categoryKey: "attack-chain",
    title: "Stage Sequence Reconstruction",
    briefing: "Reconstruct intrusion sequence.",
    prompt: `${sample.scenario}\nFormat: step1>step2>...`,
    answers: [sample.answer],
    hints: [sample.hint],
    formatHint: "stage>stage>stage",
    formatRegex: /^[a-z0-9-]+(>[a-z0-9-]+){2,}$/i,
    inputPlaceholder: "stage1>stage2>stage3",
  });
};

const genVulnChain = (base, rng) => {
  const sample = pickOne(rng, VULN_CHAINS);
  return buildChallenge(base, {
    category: "Vulnerability Chaining",
    categoryKey: "vuln-chain",
    title: "Exploit Path Assembly",
    briefing: "Build correct exploit order.",
    prompt: `${sample.scenario}\nSubmit chain with > separators.`,
    answers: [sample.answer],
    hints: [sample.hint],
    formatHint: "step>step>step",
    formatRegex: /^[a-z0-9-]+(>[a-z0-9-]+){2,}$/i,
    inputPlaceholder: "step1>step2>step3",
  });
};

const genWebCase = (base, rng) => {
  const sample = pickOne(rng, WEB_CASE_ANALYSIS);
  return buildChallenge(base, {
    category: "Web Case Analysis",
    categoryKey: "web-case",
    title: "Web Vulnerability Classification",
    briefing: "Identify primary web vulnerability.",
    prompt: sample.caseText,
    answers: sample.answer === "sqli" ? ["sqli", "sql injection"] : [sample.answer],
    hints: [sample.hint],
    formatRegex: /^[a-z- ]+$/i,
    inputPlaceholder: "vulnerability type",
  });
};

const genForensics = (base, rng) => {
  const start = randomInt(rng, 6, 20);
  const events = [
    { id: "ev1", m: start, a: "Phishing email delivered" },
    { id: "ev2", m: start + randomInt(rng, 3, 6), a: "Unknown-ASN login" },
    { id: "ev3", m: start + randomInt(rng, 8, 12), a: "Privileged role created" },
    { id: "ev4", m: start + randomInt(rng, 15, 20), a: "Bulk export started" },
  ];
  const ordered = [...events].sort((l, r) => l.m - r.m).map((e) => e.id).join(">");
  const listing = shuffle(rng, events).map((e) => `${e.id.toUpperCase()} ${time(14, e.m)} ${e.a}`).join("\n");
  return buildChallenge(base, {
    category: "Forensics Reconstruction",
    categoryKey: "forensics-reconstruct",
    title: "Incident Timeline Ordering",
    briefing: "Order events earliest to latest.",
    prompt: `${listing}\nSubmit as evX>evY>evZ>evN`,
    answers: [ordered],
    hints: ["Sort strictly by timestamp."],
    formatHint: "ev1>ev2>ev3>ev4",
    formatRegex: /^ev\d(>ev\d){3}$/i,
    inputPlaceholder: "ev1>ev2>ev3>ev4",
  });
};

const genAnomaly = (base, rng) => {
  const idx = randomInt(rng, 0, 3);
  const hosts = Array.from({ length: 4 }, (_, i) => {
    const baseMb = randomInt(rng, 80, 180);
    return i === idx
      ? { id: `h${i + 1}`, baseMb, obs: baseMb * randomInt(rng, 5, 8), fail: randomInt(rng, 18, 34) }
      : { id: `h${i + 1}`, baseMb, obs: baseMb + randomInt(rng, -15, 35), fail: randomInt(rng, 0, 5) };
  });
  return buildChallenge(base, {
    category: "Network Anomaly Detection",
    categoryKey: "network-anomaly",
    title: "Anomalous Host Identification",
    briefing: "Find host with strongest anomaly.",
    prompt: `${hosts.map((h) => `${h.id.toUpperCase()} base=${h.baseMb} observed=${h.obs} failed_auth=${h.fail}`).join("\n")}\nMost suspicious host?`,
    answers: [`h${idx + 1}`, `H${idx + 1}`],
    hints: ["Look for outbound spike plus failed auth spike."],
    formatHint: "h1 | h2 | h3 | h4",
    formatRegex: /^h[1-4]$/i,
    inputPlaceholder: "h2",
  });
};

const genObfuscated = (base, rng) => {
  const message = pickOne(rng, JS_TXT);
  return buildChallenge(base, {
    category: "Obfuscated JavaScript",
    categoryKey: "obfuscated-js",
    title: "JavaScript Decode Reasoning",
    briefing: "Infer snippet output.",
    prompt: `const payload='${toBase64(message)}';\nconst decoded=atob(payload);\nconsole.log(decoded);\nWhat prints?`,
    answers: [message],
    hints: ["atob decodes base64."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded output",
  });
};

const genLayered = (base, rng) => {
  const phrase = pickOne(rng, ["secure backup rotation", "revoke stale sessions", "harden access policy", "inspect audit stream"]);
  const shift = randomInt(rng, 3, 8);
  const key = randomInt(rng, 4, 15);
  const blob = toBase64(xorEncodeHex(caesarEncrypt(phrase, shift), key));
  return buildChallenge(base, {
    category: "Multi-Layer Encryption",
    categoryKey: "multi-layer-encryption",
    title: "Three-Layer Decode Challenge",
    briefing: "Decode Base64->hex->XOR->Caesar.",
    prompt: `Blob: ${blob}\nPipeline: plain -> Caesar(+${shift}) -> XOR(key=${key}) -> hex -> Base64`,
    answers: [phrase],
    hints: ["Decode base64 then XOR, then reverse Caesar."],
    formatRegex: /^[a-z ]+$/i,
    inputPlaceholder: "decoded plaintext",
  });
};

const genCombined = (base, rng) => {
  const shift = randomInt(rng, 2, 6);
  const port = pickOne(rng, [22, 443, 8080, 3306, 6379]);
  const clue = toBase64(caesarEncrypt(`focus-port:${port}`, shift));
  const target = randomInt(rng, 1, 4);
  const ports = [22, 443, 8080, 3306, 6379, 8443];
  const hosts = Array.from({ length: 4 }, (_, i) => {
    const id = i + 1;
    const p = shuffle(rng, ports).slice(0, randomInt(rng, 2, 3));
    if (id === target) {
      if (!p.includes(port)) p[0] = port;
      return { id, p: p.sort((a, b) => a - b), s: randomInt(rng, 8, 10) };
    }
    return { id, p: p.filter((x) => x !== port).sort((a, b) => a - b), s: randomInt(rng, 1, 7) };
  });
  return buildChallenge(base, {
    category: "Combined Crypto + Logic",
    categoryKey: "combined-crypto-logic",
    title: "Decoded Clue Host Selection",
    briefing: "Decode clue and pick matching host.",
    prompt: [
      `Encoded clue: ${clue}`,
      `Encoding: clue -> Caesar(+${shift}) -> Base64`,
      "Decoded clue format: focus-port:<port>",
      "Pick host with decoded port open and anomaly_score >= 8.",
      ...hosts.map((h) => `H${h.id} ports=[${h.p.join(",")}] anomaly_score=${h.s}`),
    ].join("\n"),
    answers: [`h${target}`, `H${target}`],
    hints: ["Decode clue first.", "Only one host should satisfy both conditions."],
    formatHint: "h1 | h2 | h3 | h4",
    formatRegex: /^h[1-4]$/i,
    inputPlaceholder: "h3",
  });
};

const genBreach = (base, rng) => {
  const sample = pickOne(rng, BREACH_CASES);
  return buildChallenge(base, {
    category: "Breach Investigation",
    categoryKey: "breach-investigation",
    title: "Incident Root Cause Assessment",
    briefing: "Identify likely root cause.",
    prompt: sample.summary,
    answers: [sample.answer],
    hints: [sample.hint],
    formatRegex: /^[a-z\- ]+$/i,
    inputPlaceholder: "root cause",
  });
};

const genExploit = (base, rng) => {
  const sample = pickOne(rng, EXPLOIT_CHAIN_CASES);
  return buildChallenge(base, {
    category: "Exploit Chain Reasoning",
    categoryKey: "exploit-chain-reasoning",
    title: "Exploit Ordering Decision",
    briefing: "Choose first dependency in the chain.",
    prompt: sample.prompt,
    answers: [sample.answer],
    hints: [sample.hint],
    formatRegex: /^[a-z\- ]+$/i,
    inputPlaceholder: "first chain step",
  });
};

const genFinal = (base, rng) => {
  const token = pickOne(rng, ["contain", "isolate", "eradicate", "recover"]);
  const sig = pickOne(rng, HASH_SIGNATURES);
  const sigAns = hashAns(sig.algorithm);
  const service = pickOne(rng, ["auth-gateway", "db-replica", "api-edge", "vault-node"]);
  const shift = randomInt(rng, 2, 6);
  const ips = uniqueIps(rng, 3);
  const suspect = pickOne(rng, ips);
  const logs = shuffle(
    rng,
    ips.map((ip) => ({
      ip,
      failed: ip === suspect ? randomInt(rng, 9, 15) : randomInt(rng, 0, 3),
      action: ip === suspect ? "privileged-api-call" : pickOne(rng, ["token-refresh", "health-check", "metrics-pull"]),
    }))
  )
    .map((r, i) => `${i + 1}) src=${r.ip} failed=${r.failed} action=${r.action}`)
    .join("\n");
  const finalKey = `ops-${token}-${sig.algorithm}-${service}-${suspect}`;
  return buildChallenge(base, {
    category: "Final Cyber Operations",
    categoryKey: "final-cyber-operation",
    title: "Level 250: Advanced Cyber Operations",
    briefing: "Solve all stages to generate final containment key.",
    prompt: "Complete each stage in order.",
    answers: [finalKey],
    hints: ["Each stage output is used later."],
    timeLimit: Math.max(300, base.timeLimit + 145),
    baseScore: Math.round(base.baseScore * 1.85),
    difficultyMultiplier: Number((base.difficultyMultiplier + 0.3).toFixed(2)),
    steps: [
      {
        title: "Stage 1: Binary Token",
        briefing: "Decode binary token.",
        prompt: `Binary token:\n${textToBinary(token)}`,
        answers: [token],
        hints: ["Decode 8-bit chunks."],
        formatRegex: /^[a-z]+$/i,
        inputPlaceholder: "decoded token",
      },
      {
        title: "Stage 2: Hash Type",
        briefing: "Identify digest type.",
        prompt: `Digest:\n${randomHex(rng, sig.length)}\nmd5 or sha1?`,
        answers: sigAns,
        hints: [sig.hint],
        formatHint: "md5 | sha1",
        formatRegex: /^(md5|sha1|sha-1)$/i,
        inputPlaceholder: "md5 or sha1",
      },
      {
        title: "Stage 3: Service Decode",
        briefing: "Decode service identifier.",
        prompt: `Blob: ${toBase64(caesarEncrypt(service, shift))}\nPipeline: service -> Caesar(+${shift}) -> Base64`,
        answers: [service],
        hints: ["Decode base64, then reverse shift."],
        formatRegex: /^[a-z-]+$/i,
        inputPlaceholder: "service-id",
      },
      {
        title: "Stage 4: Source Analysis",
        briefing: "Find suspicious source.",
        prompt: `${logs}\nReturn suspicious source IP.`,
        answers: [suspect],
        hints: ["Highest failed count is key."],
        formatHint: "x.x.x.x",
        formatRegex: IPV4,
        inputPlaceholder: "203.0.113.22",
      },
      {
        title: "Stage 5: Final Key",
        briefing: "Assemble final containment key.",
        prompt: "Format: ops-<stage1>-<stage2>-<stage3>-<stage4>",
        answers: [finalKey],
        hints: ["Reuse exact outputs from stages 1-4."],
        formatHint: "ops-token-hash-service-ip",
        formatRegex: /^ops-[a-z]+-(md5|sha1)-[a-z-]+-(?:\d{1,3}\.){3}\d{1,3}$/i,
        inputPlaceholder: "ops-contain-sha1-auth-gateway-203.0.113.22",
      },
    ],
  });
};

const MAP = {
  "password-strength": genPassword,
  "caesar-basic": genCaesar,
  "binary-ascii": genBinary,
  "hash-id": genHashId,
  "phishing-basic": genPhishing,
  "base64-core": genBase64,
  "xor-core": genXor,
  "log-ip": genLogIp,
  "sqli-detect": genSqli,
  "xss-detect": genXss,
  "auth-flaw": genAuth,
  "multi-encode": genMulti,
  "jwt-analysis": genJwt,
  "vuln-snippet": genVulnSnippet,
  "reverse-logic": genReverse,
  "packet-reason": genPacket,
  "cmd-injection-logic": genCmd,
  "crypto-multistep": genCrypto,
  "hash-crack-logic": genHashCrack,
  "privesc-reason": genPrivesc,
  "firewall-bypass": genFirewall,
  "csrf-identify": genCsrf,
  "session-hijack": genSession,
  "attack-chain": genAttack,
  "vuln-chain": genVulnChain,
  "web-case": genWebCase,
  "forensics-reconstruct": genForensics,
  "network-anomaly": genAnomaly,
  "obfuscated-js": genObfuscated,
  "multi-layer-encryption": genLayered,
  "combined-crypto-logic": genCombined,
  "breach-investigation": genBreach,
  "exploit-chain-reasoning": genExploit,
};

const getGeneratorKey = (level, band) => band.generators[(level - band.min) % band.generators.length];

export const generateChallenge = (level, variant = 0) => {
  const safe = clamp(level, 1, TOTAL_LEVELS);
  const band = getBandForLevel(safe);
  const scaling = getLevelScaling(safe, band);
  const base = {
    level: safe,
    variant,
    band,
    timeLimit: scaling.timeLimit,
    baseScore: scaling.baseScore,
    difficultyMultiplier: scaling.difficultyMultiplier,
  };
  const rng = createSeededRandom(seedFromLevel(safe, variant + 51));
  if (safe === TOTAL_LEVELS) return genFinal(base, rng);
  const generatorKey = getGeneratorKey(safe, band);
  const generator = MAP[generatorKey];
  return (generator || genPassword)(base, rng);
};

export const evaluateAnswer = (challenge, rawInput, stepIndex = 0) => {
  const target = challenge.steps?.length ? challenge.steps[stepIndex] : challenge;
  const input = normalizeAnswer(rawInput);
  if (!input) return { correct: false, completed: false, advanceStep: false, feedback: "No answer entered.", timePenalty: 0 };
  if (!target.acceptedAnswers.includes(input)) {
    return {
      correct: false,
      completed: false,
      advanceStep: false,
      feedback: "Answer did not match.",
      timePenalty: challenge.steps?.length ? 8 : 6,
    };
  }
  if (challenge.steps?.length && stepIndex < challenge.steps.length - 1) {
    return {
      correct: true,
      completed: false,
      advanceStep: true,
      nextStepIndex: stepIndex + 1,
      feedback: "Stage cleared. Proceed to next stage.",
      timePenalty: 0,
    };
  }
  return { correct: true, completed: true, advanceStep: false, feedback: "Challenge cleared.", timePenalty: 0 };
};

export const getLiveValidation = (challenge, rawInput, stepIndex = 0) => {
  const target = challenge.steps?.length ? challenge.steps[stepIndex] : challenge;
  const trimmed = String(rawInput || "").trim();
  if (!trimmed) return { status: "idle", message: `Awaiting answer. Format: ${target.formatHint}.` };
  const normalized = normalizeAnswer(trimmed);
  if (target.acceptedAnswers.includes(normalized)) return { status: "match", message: "Exact match. Submit to continue." };
  if (target.formatRegex && !target.formatRegex.test(trimmed)) {
    return { status: "invalid", message: `Format mismatch. Expected: ${target.formatHint}.` };
  }
  if (target.acceptedAnswers.some((a) => a.startsWith(normalized))) {
    return { status: "progress", message: "Close. Continue refining your answer." };
  }
  return { status: "valid", message: "Format accepted. Submit when ready." };
};

export const getBandMetadata = (level) => getBandForLevel(level);
