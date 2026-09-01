export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const seedFromLevel = (level, salt = 0) => {
  const raw = (level * 2654435761 + salt * 1013904223) >>> 0;
  return raw;
};

export const createSeededRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomInt = (rng, min, max) => {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  return Math.floor(rng() * (upper - lower + 1)) + lower;
};

export const pickOne = (rng, collection) => {
  if (!collection.length) {
    return undefined;
  }

  return collection[Math.floor(rng() * collection.length)];
};

export const shuffle = (rng, collection) => {
  const clone = [...collection];

  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }

  return clone;
};
