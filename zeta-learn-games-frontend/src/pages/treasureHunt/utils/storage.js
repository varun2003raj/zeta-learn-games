import { TOTAL_LEVELS } from "../data/levelBands";

const STORAGE_KEY = "pirate-lost-treasure-progress-v1";

const toSortedUniqueLevels = (levels) => {
  return [...new Set(levels)]
    .map((level) => Number(level))
    .filter((level) => Number.isInteger(level) && level >= 1 && level <= TOTAL_LEVELS)
    .sort((a, b) => a - b);
};

export const createInitialProgress = () => ({
  highestUnlockedLevel: 1,
  completedLevels: [],
  bestScores: {},
  totalScore: 0,
  totalAttempts: 0,
  totalHintsUsed: 0,
  lastPlayedLevel: 1,
});

const hasStorage = () => {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
};

const sanitizeProgress = (raw) => {
  const base = createInitialProgress();
  if (!raw || typeof raw !== "object") {
    return base;
  }

  const completedLevels = toSortedUniqueLevels(raw.completedLevels || []);
  const safeBestScores = Object.fromEntries(
    Object.entries(raw.bestScores || {}).filter(([key, value]) => {
      const numericKey = Number(key);
      return (
        Number.isInteger(numericKey) &&
        numericKey >= 1 &&
        numericKey <= TOTAL_LEVELS &&
        Number.isFinite(value) &&
        value >= 0
      );
    })
  );

  const totalScore = Object.values(safeBestScores).reduce((sum, score) => sum + Number(score), 0);
  const highestCompleted = completedLevels.length ? completedLevels[completedLevels.length - 1] : 0;
  const highestUnlockedLevel = Math.min(
    TOTAL_LEVELS,
    Math.max(1, Number(raw.highestUnlockedLevel) || highestCompleted + 1)
  );

  const lastPlayedLevel = Math.min(
    highestUnlockedLevel,
    Math.max(1, Number(raw.lastPlayedLevel) || 1)
  );

  return {
    ...base,
    completedLevels,
    bestScores: safeBestScores,
    totalScore,
    highestUnlockedLevel,
    totalAttempts: Math.max(0, Number(raw.totalAttempts) || 0),
    totalHintsUsed: Math.max(0, Number(raw.totalHintsUsed) || 0),
    lastPlayedLevel,
  };
};

export const loadProgress = () => {
  if (!hasStorage()) {
    return createInitialProgress();
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return createInitialProgress();
    }

    return sanitizeProgress(JSON.parse(rawValue));
  } catch {
    return createInitialProgress();
  }
};

export const saveProgress = (progress) => {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProgress(progress)));
  } catch {
    // Ignore quota failures and continue with in-memory state.
  }
};

export const clearProgress = () => {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
};
