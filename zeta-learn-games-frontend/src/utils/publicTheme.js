const PUBLIC_THEME_MODELS = ["green", "cyan", "blue", "red", "purple"];
const PUBLIC_THEME_BODY_PREFIX = "public-theme-";
const PUBLIC_THEME_TRANSITION_CLASS = "public-theme-transitioning";
const PUBLIC_THEME_TRANSITION_MS = 1200;

let transitionTimeoutId = null;
let transitionFrameId = null;

export const pickPublicThemeModel = () => {
  const index = Math.floor(Math.random() * PUBLIC_THEME_MODELS.length);
  return PUBLIC_THEME_MODELS[index];
};

const shuffleModels = (models) => {
  const next = [...models];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const buildPool = (currentModel) => {
  const pool = shuffleModels(PUBLIC_THEME_MODELS);
  if (pool.length > 1 && pool[0] === currentModel) {
    const swapIndex = 1 + Math.floor(Math.random() * (pool.length - 1));
    [pool[0], pool[swapIndex]] = [pool[swapIndex], pool[0]];
  }
  return pool;
};

export const getNextPublicThemeState = (currentModel, currentPool = []) => {
  let pool = [...currentPool];

  if (pool.length === 0) {
    pool = buildPool(currentModel);
  }

  let nextModel = pool.shift();
  if (nextModel === currentModel && pool.length > 0) {
    nextModel = pool.shift();
  }

  if (!nextModel) {
    nextModel = pickPublicThemeModel();
    if (nextModel === currentModel && PUBLIC_THEME_MODELS.length > 1) {
      const alternatives = PUBLIC_THEME_MODELS.filter((model) => model !== currentModel);
      nextModel = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
  }

  return {
    model: nextModel,
    pool,
  };
};

export const applyPublicThemeToDocument = (model) => {
  if (typeof document === "undefined") return () => {};

  const classes = PUBLIC_THEME_MODELS.map((name) => `${PUBLIC_THEME_BODY_PREFIX}${name}`);
  const className = `${PUBLIC_THEME_BODY_PREFIX}${model}`;
  const targets = [document.documentElement, document.body];

  const applyThemeClass = () => {
    targets.forEach((target) => {
      if (!target) return;
      target.classList.remove(...classes);
      target.classList.add(className);
    });
  };

  targets.forEach((target) => {
    if (!target) return;
    target.classList.add(PUBLIC_THEME_TRANSITION_CLASS);
  });

  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    if (transitionFrameId) {
      window.cancelAnimationFrame(transitionFrameId);
    }
    transitionFrameId = window.requestAnimationFrame(() => {
      applyThemeClass();
      transitionFrameId = null;
    });
  } else {
    applyThemeClass();
  }

  if (typeof window !== "undefined") {
    if (transitionTimeoutId) {
      window.clearTimeout(transitionTimeoutId);
    }
    transitionTimeoutId = window.setTimeout(() => {
      targets.forEach((target) => {
        if (!target) return;
        target.classList.remove(PUBLIC_THEME_TRANSITION_CLASS);
      });
      transitionTimeoutId = null;
    }, PUBLIC_THEME_TRANSITION_MS);
  }

  return () => {
    targets.forEach((target) => {
      if (!target) return;
      target.classList.remove(className);
      target.classList.remove(PUBLIC_THEME_TRANSITION_CLASS);
    });
  };
};

export default PUBLIC_THEME_MODELS;
