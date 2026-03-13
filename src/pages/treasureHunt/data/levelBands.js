export const TOTAL_LEVELS = 250;

export const LEVEL_BANDS = [
  {
    key: "fundamentals",
    min: 1,
    max: 25,
    label: "Levels 1-25 Beginner Fundamentals",
    subtitle: "Passwords, Caesar ciphers, binary basics, hash IDs, phishing awareness",
    difficulty: "Beginner",
    baseScore: 110,
    baseTime: 190,
    generators: ["password-strength", "caesar-basic", "binary-ascii", "hash-id", "phishing-basic"],
  },
  {
    key: "core",
    min: 26,
    max: 75,
    label: "Levels 26-75 Intermediate Core Concepts",
    subtitle: "Base64, XOR, log analysis, SQLi/XSS detection, auth flaws",
    difficulty: "Intermediate",
    baseScore: 145,
    baseTime: 180,
    generators: ["base64-core", "xor-core", "log-ip", "sqli-detect", "xss-detect", "auth-flaw"],
  },
  {
    key: "advanced",
    min: 76,
    max: 125,
    label: "Levels 76-125 Advanced Practical Security",
    subtitle: "Multi-layer encoding, JWT analysis, code review, packet reasoning",
    difficulty: "Advanced",
    baseScore: 185,
    baseTime: 170,
    generators: [
      "multi-encode",
      "jwt-analysis",
      "vuln-snippet",
      "reverse-logic",
      "packet-reason",
      "cmd-injection-logic",
    ],
  },
  {
    key: "expert",
    min: 126,
    max: 175,
    label: "Levels 126-175 Expert Offensive Security",
    subtitle: "Crypto stacks, hash cracking logic, privilege and session security",
    difficulty: "Expert",
    baseScore: 230,
    baseTime: 160,
    generators: [
      "crypto-multistep",
      "hash-crack-logic",
      "privesc-reason",
      "firewall-bypass",
      "csrf-identify",
      "session-hijack",
    ],
  },
  {
    key: "professional",
    min: 176,
    max: 225,
    label: "Levels 176-225 Professional Red Team Simulation",
    subtitle: "Attack chains, forensics reconstruction, anomaly detection, obfuscation",
    difficulty: "Professional",
    baseScore: 285,
    baseTime: 150,
    generators: [
      "attack-chain",
      "vuln-chain",
      "web-case",
      "forensics-reconstruct",
      "network-anomaly",
      "obfuscated-js",
    ],
  },
  {
    key: "elite",
    min: 226,
    max: 250,
    label: "Levels 226-250 Elite Cyber Operations",
    subtitle: "Breach investigations, exploit-chain reasoning, multi-layer crypto",
    difficulty: "Elite",
    baseScore: 350,
    baseTime: 140,
    generators: [
      "multi-layer-encryption",
      "combined-crypto-logic",
      "breach-investigation",
      "exploit-chain-reasoning",
    ],
  },
];

export const SECURITY_TERMS = [
  "secure login",
  "rotate keys",
  "patch server",
  "audit trail",
  "least privilege",
  "zero trust",
  "token guard",
  "safe session",
];

export const PASSWORD_CASES = [
  {
    candidate: "P@ssw0rd!",
    answer: "weak",
    hint: "Common dictionary root despite symbols.",
  },
  {
    candidate: "RedSky!2027",
    answer: "strong",
    hint: "Long enough with mixed character classes.",
  },
  {
    candidate: "admin123",
    answer: "weak",
    hint: "Very predictable and short.",
  },
  {
    candidate: "Tide#Vector92",
    answer: "strong",
    hint: "Good entropy and multiple character sets.",
  },
  {
    candidate: "Winter2025",
    answer: "weak",
    hint: "Season + year pattern is easy to guess.",
  },
  {
    candidate: "M0on$ignal!47",
    answer: "strong",
    hint: "Length and diversity are good.",
  },
];

export const PHISHING_SCENARIOS = [
  {
    prompt:
      "Email claims 'urgent payroll issue' and asks you to open an attachment from an unknown sender domain.",
    answer: "phishing",
    hint: "Urgency + unknown sender + attachment is suspicious.",
  },
  {
    prompt:
      "Internal IT message in corporate portal asks users to review scheduled maintenance details only in the portal.",
    answer: "legitimate",
    hint: "No credential request and uses official internal channel.",
  },
  {
    prompt:
      "Message says your account will be disabled in 10 minutes unless you verify password through a shortened link.",
    answer: "phishing",
    hint: "Credential request via urgent external link.",
  },
  {
    prompt:
      "Vendor newsletter from known domain contains release notes and no request for credentials or payments.",
    answer: "legitimate",
    hint: "Informational content without sensitive actions.",
  },
];

export const HASH_SIGNATURES = [
  { algorithm: "md5", length: 32, hint: "32 hex characters" },
  { algorithm: "sha1", length: 40, hint: "40 hex characters" },
];

export const XSS_CASES = [
  {
    snippet: "const el = `<div>${userInput}</div>`; container.innerHTML = el;",
    answer: "xss",
    hint: "Untrusted input is inserted into HTML context.",
  },
  {
    snippet: "element.textContent = userInput;",
    answer: "safe",
    hint: "Text is encoded and not interpreted as HTML.",
  },
  {
    snippet: "res.send(`<h1>${req.query.q}</h1>`);",
    answer: "xss",
    hint: "Reflected user input in HTML response.",
  },
  {
    snippet: "const escaped = escapeHtml(userInput); output.innerHTML = escaped;",
    answer: "safe",
    hint: "Input is sanitized before rendering.",
  },
];

export const SQLI_CASES = [
  {
    snippet: "query = \"SELECT * FROM users WHERE name='\" + input + \"'\";",
    answer: "vulnerable",
    hint: "String concatenation with user input into SQL.",
  },
  {
    snippet: "db.execute('SELECT * FROM users WHERE name = ?', [input]);",
    answer: "safe",
    hint: "Parameterized query binding is used.",
  },
  {
    snippet: "sql = `DELETE FROM items WHERE id = ${req.body.id}`;",
    answer: "vulnerable",
    hint: "Interpolated input directly in SQL statement.",
  },
  {
    snippet: "stmt = db.prepare('UPDATE users SET role=? WHERE id=?');",
    answer: "safe",
    hint: "Prepared statements reduce injection risk.",
  },
];

export const AUTH_FLAW_CASES = [
  {
    prompt: "API endpoint checks authentication but never verifies user role before admin actions.",
    answer: "broken authorization",
    hint: "Identity is checked, permissions are not.",
  },
  {
    prompt: "Application trusts role value sent by client-side hidden field.",
    answer: "privilege tampering",
    hint: "Authorization data must be server-side.",
  },
  {
    prompt: "Password reset token never expires and can be reused multiple times.",
    answer: "token lifecycle flaw",
    hint: "Credential recovery tokens need expiry and single-use.",
  },
];

export const JWT_CASES = [
  {
    prompt: "JWT header shows {\"alg\":\"none\"} and server accepts it.",
    answer: "unsigned token acceptance",
    hint: "Tokens should require verified signatures.",
  },
  {
    prompt: "JWT payload lacks exp and token remains valid indefinitely.",
    answer: "missing expiration",
    hint: "Session tokens need lifetime limits.",
  },
  {
    prompt: "Token audience claim is never validated by service.",
    answer: "audience validation missing",
    hint: "Accepting tokens for wrong audience is risky.",
  },
];

export const CODE_REVIEW_CASES = [
  {
    snippet: "app.get('/user/:id', (req,res)=>res.json(db.find(req.params.id))); // no ownership check",
    answer: "idor",
    hint: "Direct object access without authorization check.",
  },
  {
    snippet: "exec('ping ' + hostInput);",
    answer: "command injection",
    hint: "User input appended to shell command.",
  },
  {
    snippet: "response.setHeader('X-Frame-Options', 'DENY');",
    answer: "safe",
    hint: "This is a protective header.",
  },
  {
    snippet: "render(`<img src='${avatarUrl}'>`);",
    answer: "xss",
    hint: "Unsanitized dynamic HTML attributes.",
  },
];

export const CSRF_CASES = [
  {
    prompt: "Money transfer endpoint uses session cookies but has no CSRF token check.",
    answer: "csrf",
    hint: "Cross-site request forgery risk.",
  },
  {
    prompt: "State-changing endpoint requires random anti-CSRF token tied to session.",
    answer: "safe",
    hint: "Token-based verification mitigates CSRF.",
  },
  {
    prompt: "Profile update accepts only cookie auth and validates Origin/Referer poorly.",
    answer: "csrf",
    hint: "Insufficient request origin validation.",
  },
];

export const SESSION_CASES = [
  {
    prompt: "Session cookie sent without HttpOnly and Secure flags.",
    answer: "session hijacking risk",
    hint: "Cookie exposure increases takeover risk.",
  },
  {
    prompt: "Session ID rotates after login and privilege elevation.",
    answer: "safe",
    hint: "Session fixation defense in place.",
  },
  {
    prompt: "Application accepts session ID in URL query parameters.",
    answer: "session hijacking risk",
    hint: "URLs leak session identifiers.",
  },
];

export const ATTACK_CHAIN_CASES = [
  {
    scenario: "Phishing email steals credentials, then attacker bypasses MFA gap, pivots internally, and exfiltrates data.",
    answer: "phish>access>pivot>exfil",
    hint: "Start with initial access and end with exfiltration.",
  },
  {
    scenario: "Public file upload bug leads to code execution, then privilege escalation, then database dump.",
    answer: "upload>rce>privesc>dump",
    hint: "Exploit, execute, escalate, extract.",
  },
  {
    scenario: "Compromised API key enables cloud login, role misuse, storage access, and data theft.",
    answer: "key>login>role-abuse>theft",
    hint: "Credential misuse occurs first.",
  },
];

export const WEB_CASE_ANALYSIS = [
  {
    caseText: "Web app allows account deletion by changing numeric userId in request URL.",
    answer: "idor",
    hint: "Object reference without ownership enforcement.",
  },
  {
    caseText: "Search input reflected in page unsanitized and executes script tags.",
    answer: "xss",
    hint: "Client-side script injection.",
  },
  {
    caseText: "Login query built via string concatenation with raw input.",
    answer: "sqli",
    hint: "SQL injection risk pattern.",
  },
];

export const BREACH_CASES = [
  {
    summary: "Alerts show anomalous admin login from unfamiliar ASN followed by bulk data export.",
    answer: "credential compromise",
    hint: "Initial access likely via stolen credentials.",
  },
  {
    summary: "WAF blocks repeated malformed search requests, then DB errors spike.",
    answer: "sqli attempt",
    hint: "Search endpoint abuse with database side effects.",
  },
  {
    summary: "Browser telemetry reveals token replay from multiple geolocations within minutes.",
    answer: "session token theft",
    hint: "Same token reused from distant origins.",
  },
];

export const EXPLOIT_CHAIN_CASES = [
  {
    prompt: "A vulnerable upload endpoint and exposed admin panel are both present. Which should be chained first?",
    answer: "upload endpoint",
    hint: "Initial foothold before privilege misuse.",
  },
  {
    prompt: "You can exploit XSS or weak password reset flow. Which path most directly targets account takeover?",
    answer: "weak password reset flow",
    hint: "Credential lifecycle weakness gives direct takeover.",
  },
  {
    prompt: "RCE requires authenticated session; auth bypass requires IDOR. Which vulnerability is first in chain?",
    answer: "idor",
    hint: "Unlock prerequisite access first.",
  },
];
