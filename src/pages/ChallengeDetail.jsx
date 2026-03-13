import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { showPopup } from "../utils/popup";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const themeModel = useRotatingPublicTheme();

  const [challenge, setChallenge] = useState(null);
  const [ctfStatus, setCtfStatus] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [flag, setFlag] = useState("");
  const [partyState, setPartyState] = useState("hidden"); // hidden | show | fade
  const [successText, setSuccessText] = useState("");
  const [sparks, setSparks] = useState([]);
  const [failState, setFailState] = useState("hidden"); // hidden | show | fade
  const [thumbs, setThumbs] = useState([]);
  const timersRef = useRef([]);

  const difficultyColor = (value) => {
    if (value === "easy") return "#22c55e";
    if (value === "medium") return "#3b82f6";
    if (value === "hard") return "#ef4444";
    if (value === "ultra_hard") return "#a855f7";
    return "#cbd5e1";
  };

  const difficultyLabel = (value) => {
    if (value === "ultra_hard") return "Ultra Hard";
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
  };

  const setManagedTimeout = (cb, ms) => {
    const idValue = setTimeout(cb, ms);
    timersRef.current.push(idValue);
  };

  const apiBase = API.defaults.baseURL || "";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  const resolveFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${backendBase}${url}`;
    return `${backendBase}/${url}`;
  };

  const playFirecrackerAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.18; // louder but still controlled
      master.connect(ctx.destination);

      const playPop = (when, freq, dur, vol) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, when);
        osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.5), when + dur);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(vol, when + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(when);
        osc.stop(when + dur + 0.02);
      };

      const playCrackle = (when, dur, vol) => {
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i += 1) output[i] = (Math.random() * 2 - 1) * 0.8;

        const noise = ctx.createBufferSource();
        const band = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        noise.buffer = buffer;
        band.type = "highpass";
        band.frequency.value = 1800 + Math.random() * 1400;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(vol, when + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        noise.connect(band);
        band.connect(gain);
        gain.connect(master);
        noise.start(when);
        noise.stop(when + dur + 0.02);
      };

      const start = ctx.currentTime + 0.04;
      for (let i = 0; i < 28; i += 1) {
        const t = start + Math.random() * 5;
        playPop(t, 220 + Math.random() * 500, 0.05 + Math.random() * 0.06, 0.12 + Math.random() * 0.11);
        playCrackle(t + 0.02, 0.05 + Math.random() * 0.08, 0.07 + Math.random() * 0.08);
      }

      setManagedTimeout(() => {
        try {
          ctx.close();
        } catch {
          // ignore audio shutdown errors
        }
      }, 8000);
    } catch {
      // ignore if browser blocks audio
    }
  };

  const buildSparks = () => {
    const next = [];
    for (let i = 0; i < 180; i += 1) {
      const originX = 10 + Math.random() * 80;
      const originY = 8 + Math.random() * 55;
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 240;
      next.push({
        id: i,
        x: originX,
        y: originY,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance + 40,
        hue: Math.floor(Math.random() * 360),
        size: 3 + Math.random() * 4,
        delay: Math.random() * 0.85,
        duration: 2.3 + Math.random() * 1.7,
      });
    }
    setSparks(next);
  };

  const playBooAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = 0.22;
      gain.connect(ctx.destination);

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i += 1) out[i] = (Math.random() * 2 - 1) * 0.6;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 420;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      noise.connect(lowpass);
      lowpass.connect(g);
      g.connect(gain);
      noise.start();
      noise.stop(ctx.currentTime + 0.58);

      setManagedTimeout(() => {
        try {
          ctx.close();
        } catch {
          // ignore
        }
      }, 900);
    } catch {
      // ignore
    }
  };

  const startWrongEffect = () => {
    const list = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 20 + Math.random() * 18,
      delay: Math.random() * 0.35,
      dur: 1.2 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 50,
    }));
    setThumbs(list);
    playBooAudio();
    setFailState("show");
    setManagedTimeout(() => setFailState("fade"), 1200);
    setManagedTimeout(() => setFailState("hidden"), 2000);
  };

  useEffect(() => {
    API.get(`ctf/challenges/${id}/`)
      .then((res) => setChallenge(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error loading challenge";
        if (err?.response?.status === 403) {
          if (msg.toLowerCase().includes("team")) {
            void showPopup("Create or join a team first.", "Access Required");
            navigate("/my-team");
            return;
          }
          void showPopup(msg, "CTF Status");
          navigate("/");
          return;
        }
        void showPopup(msg, "Error");
      });
  }, [id, navigate]);

  useEffect(() => {
    API.get("ctf/challenges/ctf/state/")
      .then((res) => setCtfStatus(res?.data?.status || null))
      .catch(() => setCtfStatus(null));
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const submitFlag = async () => {
    if (ctfStatus === "finished") {
      await showPopup("CTF is finished. Flag submissions are disabled.", "CTF Finished");
      return;
    }
    try {
      const res = await API.post("ctf/submissions/submit/", {
        challenge_id: id,
        flag: flag,
      });

      const message = res?.data?.message || "";
      const isCorrect = message.toLowerCase().includes("correct flag");

      if (isCorrect) {
        setSuccessText(message);
        buildSparks();
        playFirecrackerAudio();
        setPartyState("show");
        setManagedTimeout(() => setPartyState("fade"), 5000);
        setManagedTimeout(() => {
          setPartyState("hidden");
          navigate("/challenges");
        }, 7200);
      } else {
        if (message.toLowerCase().includes("wrong")) {
          startWrongEffect();
        } else {
          await showPopup(message || "Unable to submit flag.", "Notice");
        }
      }

      setFlag("");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Wrong Flag!";
      if (err?.response?.status === 403) {
        if ((msg || "").toLowerCase().includes("team")) {
          await showPopup("Create or join a team first.", "Access Required");
          navigate("/my-team");
        } else {
          await showPopup(msg, "CTF Status");
        }
        return;
      }
      if ((msg || "").toLowerCase().includes("wrong")) {
        startWrongEffect();
      } else {
        await showPopup(msg, "Error");
      }
    }
  };

  if (!challenge) {
    return <p className="text-white">Loading...</p>;
  }

  const showParty = partyState !== "hidden";
  const overlayOpacity = partyState === "show" ? 1 : partyState === "fade" ? 0 : 0;
  const showFail = failState !== "hidden";
  const failOpacity = failState === "show" ? 1 : failState === "fade" ? 0 : 0;
  const finished = ctfStatus === "finished";

  return (
    <div className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white public-model-${themeModel}`}>
      {showParty && (
        <div
          style={{
            ...styles.partyOverlay,
            opacity: overlayOpacity,
            transition: partyState === "fade" ? "opacity 2.2s ease-out" : "opacity 0.2s linear",
          }}
        >
          {sparks.map((p) => (
            <span
              key={p.id}
              style={{
                ...styles.particle,
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: `hsl(${p.hue} 95% 65%)`,
                boxShadow: `0 0 8px hsl(${p.hue} 95% 65%)`,
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
          <div style={styles.partyBanner}>
            <h2 style={styles.partyHeading}>CHALLENGE COMPLETED</h2>
            <p style={styles.partyText}>{successText || "Correct Flag!"}</p>
          </div>
        </div>
      )}

      {showFail && (
        <div
          style={{
            ...styles.failOverlay,
            opacity: failOpacity,
            transition: failState === "fade" ? "opacity 0.8s ease-out" : "opacity 0.15s linear",
          }}
        >
          {thumbs.map((t) => (
            <span
              key={t.id}
              style={{
                ...styles.thumb,
                left: `${t.left}%`,
                fontSize: `${t.size}px`,
                animationDelay: `${t.delay}s`,
                animationDuration: `${t.dur}s`,
                "--drift": `${t.drift}px`,
              }}
            >
              👎
            </span>
          ))}
        </div>
      )}

      <Navbar />

      <div className="p-6">
        <h1 className="text-4xl font-bold text-green-400">{challenge.title}</h1>

        <p className="text-gray-400 mt-2">{challenge.category_name}</p>
        <p className="mt-1 font-bold" style={{ color: difficultyColor(challenge.difficulty) }}>
          Difficulty: {difficultyLabel(challenge.difficulty)}
        </p>

        <p className="mt-6 bg-gray-900 p-4 rounded-2xl border border-gray-800">{challenge.description}</p>

        {challenge.file_url ? (
          <a
            href={resolveFileUrl(challenge.file_url)}
            className="inline-block mt-4 bg-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-700"
            
            rel="noreferrer"
          >
            Download File
          </a>
        ) : null}

        {finished && (
          <p className="mt-4 text-yellow-400 font-bold">
            CTF is finished. You can view and download files, but flag submission is disabled.
          </p>
        )}

        <div className="mt-4">
          <button
            onClick={() => setShowHints((v) => !v)}
            className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold hover:bg-yellow-400"
          >
            Hints
          </button>
        </div>

        {showHints && (
          <div className="mt-3 bg-gray-900 p-4 rounded-2xl border border-gray-800">
            {(challenge.visible_hints || []).length === 0 ? (
              <p className="text-gray-300">No hints currently available.</p>
            ) : (
              <ul className="list-disc pl-5">
                {challenge.visible_hints.map((h, idx) => (
                  <li key={idx} className="text-yellow-300 mb-2">{h}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6">
          <input
            className="p-3 rounded-xl bg-gray-800 w-[400px] disabled:opacity-60"
            placeholder="Enter flag here..."
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            disabled={finished}
          />

          <button
            onClick={submitFlag}
            className="ml-3 bg-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60"
            disabled={finished}
          >
            Submit Flag
          </button>
        </div>
      </div>

      <style>{`
        @keyframes firecrackerBurst {
          0% { transform: translate(0, 0) scale(0.6); opacity: 1; }
          70% { opacity: 0.95; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.25); opacity: 0; }
        }
        @keyframes thumbsFall {
          0% { transform: translate(0, -120px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--drift), 105vh) rotate(24deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  partyOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 5000,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at center, var(--ctf-success-glow, rgba(34,197,94,0.22)), rgba(15,23,42,0.94))",
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    borderRadius: "999px",
    animationName: "firecrackerBurst",
    animationTimingFunction: "cubic-bezier(0.16, 0.84, 0.25, 1)",
    animationIterationCount: "infinite",
  },
  partyBanner: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid var(--ctf-panel-border-strong, rgba(250,204,21,0.5))",
    borderRadius: "16px",
    padding: "20px 28px",
  },
  partyHeading: {
    margin: 0,
    color: "var(--ctf-accent-strong, #facc15)",
    fontSize: "34px",
    fontWeight: 900,
    letterSpacing: "1px",
  },
  partyText: {
    margin: "8px 0 0 0",
    color: "#e2e8f0",
    fontSize: "16px",
  },
  failOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 5001,
    pointerEvents: "none",
    background: "rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  thumb: {
    position: "absolute",
    top: "-40px",
    animationName: "thumbsFall",
    animationTimingFunction: "linear",
    animationIterationCount: 1,
    filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))",
  },
};
