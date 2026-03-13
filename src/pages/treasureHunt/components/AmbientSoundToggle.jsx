import { useEffect, useRef, useState } from "react";

const buildNoiseBuffer = (context) => {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
};

function AmbientSoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext));
  const engineRef = useRef(null);

  const stopEngine = async () => {
    if (!engineRef.current) {
      return;
    }

    const { context } = engineRef.current;
    await context.suspend();
    setEnabled(false);
  };

  const startEngine = async () => {
    if (!supported) {
      return;
    }

    if (!engineRef.current) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtor();

      const master = context.createGain();
      master.gain.value = 0.055;
      master.connect(context.destination);

      const noiseSource = context.createBufferSource();
      noiseSource.buffer = buildNoiseBuffer(context);
      noiseSource.loop = true;

      const lowpass = context.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 720;
      lowpass.Q.value = 0.5;

      const waveGain = context.createGain();
      waveGain.gain.value = 0.16;

      const swellLfo = context.createOscillator();
      swellLfo.type = "sine";
      swellLfo.frequency.value = 0.09;

      const swellDepth = context.createGain();
      swellDepth.gain.value = 0.08;

      const shimmer = context.createOscillator();
      shimmer.type = "triangle";
      shimmer.frequency.value = 180;

      const shimmerGain = context.createGain();
      shimmerGain.gain.value = 0.003;

      noiseSource.connect(lowpass);
      lowpass.connect(waveGain);
      waveGain.connect(master);

      swellLfo.connect(swellDepth);
      swellDepth.connect(waveGain.gain);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(master);

      noiseSource.start();
      swellLfo.start();
      shimmer.start();

      engineRef.current = {
        context,
        nodes: [noiseSource, swellLfo, shimmer],
      };
    }

    await engineRef.current.context.resume();
    setEnabled(true);
  };

  useEffect(() => {
    return () => {
      if (!engineRef.current) {
        return;
      }

      const { context, nodes } = engineRef.current;
      nodes.forEach((node) => {
        if (typeof node.stop === "function") {
          try {
            node.stop();
          } catch {
            // Node may already be stopped.
          }
        }
      });

      context.close();
      engineRef.current = null;
    };
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      await stopEngine();
    } else {
      await startEngine();
    }
  };

  return (
    <button type="button" className="ambient-toggle" onClick={handleToggle} disabled={!supported}>
      {enabled ? "Ambient: ON" : "Ambient: OFF"}
    </button>
  );
}

export default AmbientSoundToggle;
