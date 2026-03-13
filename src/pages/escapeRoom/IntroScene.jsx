import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./styles.css";

const MotionDiv = motion.div;

const PHASES = {
  FOREST: "forest",
  CRACK: "crack",
  FALL: "fall",
  TRANSITION: "transition",
  UNDERGROUND: "underground",
};

// Timeline in milliseconds for the cutscene state machine.
const TIMELINE = {
  crackAt: 4300,
  fallAt: 5200,
  transitionAt: 6600,
  undergroundAt: 7700,
};

const ROOM_NODES = [
  { id: "start", label: "Start", x: 10, y: 72, type: "start" },
  { id: "web", label: "Web Challenge", x: 30, y: 54, type: "normal" },
  { id: "crypto", label: "Crypto Challenge", x: 49, y: 70, type: "normal" },
  {
    id: "reverse",
    label: "Reverse Engineering",
    x: 70,
    y: 47,
    type: "normal",
  },
  { id: "final", label: "Final Flag", x: 88, y: 28, type: "final" },
];

const ROOM_CONNECTIONS = [
  ["start", "web"],
  ["web", "crypto"],
  ["crypto", "reverse"],
  ["reverse", "final"],
];

function TrapAnimation({ phase }) {
  const crackVisible =
    phase === PHASES.CRACK ||
    phase === PHASES.FALL ||
    phase === PHASES.TRANSITION;
  const trapOpen = phase === PHASES.FALL || phase === PHASES.TRANSITION;

  return (
    <div className="intro-trap-zone" aria-hidden="true">
      <motion.div
        className="intro-ground-crack"
        initial={false}
        animate={{
          scaleX: crackVisible ? 1 : 0,
          opacity: crackVisible ? 1 : 0,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <div className="intro-trap-door-frame">
        <motion.div
          className="intro-trap-door intro-trap-door-left"
          initial={false}
          animate={{ rotateY: trapOpen ? -74 : 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.25, 1] }}
        />
        <motion.div
          className="intro-trap-door intro-trap-door-right"
          initial={false}
          animate={{ rotateY: trapOpen ? 74 : 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.25, 1] }}
        />

        <motion.div
          className="intro-trap-depth"
          initial={false}
          animate={{ opacity: trapOpen ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </div>
  );
}

function FallAnimation() {
  return (
    <MotionDiv
      className="intro-fall-impact"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 0.75, 0.1], scale: [0.4, 1, 1.45] }}
      transition={{ duration: 1.25, ease: "easeOut" }}
      aria-hidden="true"
    >
      <motion.span
        className="intro-fall-ring"
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0], scale: [0.2, 1.2, 1.8] }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.08 }}
      />
    </MotionDiv>
  );
}

function ForestScene({ phase }) {
  const isWalking = phase === PHASES.FOREST || phase === PHASES.CRACK;

  return (
    <div className="intro-forest-scene">
      <motion.div
        className="intro-parallax-layer intro-forest-back"
        animate={{ x: [0, -24, 0] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
      <motion.div
        className="intro-parallax-layer intro-forest-mid"
        animate={{ x: [0, 18, 0] }}
        transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
      <motion.div
        className="intro-parallax-layer intro-forest-front"
        animate={{ x: [0, -14, 0] }}
        transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      <TrapAnimation phase={phase} />

      <div className="intro-character-track" aria-hidden="true">
        <motion.div
          className="intro-character-walker"
          initial={{ left: "-12%", y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            left: "46%",
            y: phase === PHASES.FALL ? 290 : phase === PHASES.TRANSITION ? 460 : 0,
            opacity: phase === PHASES.TRANSITION ? 0 : 1,
            rotate: phase === PHASES.FALL ? 14 : phase === PHASES.TRANSITION ? 30 : 0,
            scale: phase === PHASES.TRANSITION ? 0.68 : 1,
          }}
          transition={{
            left: { duration: 5, ease: "linear" },
            y:
              phase === PHASES.FALL || phase === PHASES.TRANSITION
                ? { duration: 1.2, ease: [0.2, 0.85, 0.25, 1] }
                : { duration: 0.2 },
            opacity: { duration: 0.45 },
            rotate: { duration: 0.8, ease: "easeOut" },
            scale: { duration: 0.8, ease: "easeOut" },
          }}
        >
          <motion.div
            className="intro-character-sprite"
            animate={
              isWalking
                ? { y: [0, -6, 0], rotate: [0, -1.2, 0, 1.2, 0] }
                : { y: 0, rotate: 0 }
            }
            transition={
              isWalking
                ? {
                    duration: 0.45,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
                : { duration: 0.2 }
            }
          >
            <span className="intro-character-visor" />
            <span className="intro-character-legs" />
          </motion.div>
        </motion.div>
      </div>

      <div className="intro-forest-caption">
        <p className="intro-kicker">Escape Protocol</p>
        <h2>Forest Perimeter</h2>
        <p>Agent enters the hidden zone. Watch for unstable ground signatures.</p>
      </div>
    </div>
  );
}

function UndergroundMap({ nodes, connections }) {
  // Room coordinates are data-driven so new rooms can be added without layout rewrites.
  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  return (
    <section className="intro-underground-shell">
      <header className="intro-underground-header">
        <p className="intro-kicker">CTF Dungeon Map</p>
        <h2>Subsurface Breach Detected</h2>
        <p>
          Explore the room path. Each node is clickable and ready for gameplay
          wiring.
        </p>
      </header>

      <div className="intro-map-stage">
        <svg
          className="intro-map-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {connections.map(([from, to], index) => {
            const fromNode = nodeMap[from];
            const toNode = nodeMap[to];
            if (!fromNode || !toNode) return null;

            return (
              <motion.line
                key={`${from}-${to}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 + index * 0.14 }}
              />
            );
          })}
        </svg>

        <div className="intro-node-layer">
          {nodes.map((node, index) => (
            <motion.button
              key={node.id}
              type="button"
              className={`intro-room-node intro-room-node-${node.type}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              initial={{ opacity: 0, scale: 0.6, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 + index * 0.1 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                console.log("CTF room clicked:", node.id, node.label);
              }}
            >
              <span>{node.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function IntroScene() {
  const [phase, setPhase] = useState(PHASES.FOREST);

  useEffect(() => {
    // Simple one-pass cutscene progression from forest to underground map.
    const crackTimer = window.setTimeout(() => setPhase(PHASES.CRACK), TIMELINE.crackAt);
    const fallTimer = window.setTimeout(() => setPhase(PHASES.FALL), TIMELINE.fallAt);
    const transitionTimer = window.setTimeout(
      () => setPhase(PHASES.TRANSITION),
      TIMELINE.transitionAt
    );
    const undergroundTimer = window.setTimeout(
      () => setPhase(PHASES.UNDERGROUND),
      TIMELINE.undergroundAt
    );

    return () => {
      window.clearTimeout(crackTimer);
      window.clearTimeout(fallTimer);
      window.clearTimeout(transitionTimer);
      window.clearTimeout(undergroundTimer);
    };
  }, []);

  const inForest = phase !== PHASES.UNDERGROUND;

  return (
    <div className="intro-cutscene-root">
      <AnimatePresence mode="wait">
        {inForest ? (
          <motion.section
            key="forest"
            className="intro-scene-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <motion.div
              className="intro-camera"
              animate={{
                scale:
                  phase === PHASES.TRANSITION
                    ? 1.28
                    : phase === PHASES.FALL
                      ? 1.12
                      : 1,
                filter: phase === PHASES.TRANSITION ? "blur(1.6px)" : "blur(0px)",
              }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
            >
              <ForestScene phase={phase} />
            </motion.div>

            <motion.div
              className="intro-fade-overlay"
              initial={false}
              animate={{ opacity: phase === PHASES.TRANSITION ? 1 : 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          </motion.section>
        ) : (
          <motion.section
            key="underground"
            className="intro-scene-frame intro-underground-scene"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <FallAnimation />
            <UndergroundMap nodes={ROOM_NODES} connections={ROOM_CONNECTIONS} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
