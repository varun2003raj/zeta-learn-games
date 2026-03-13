import { clamp } from "../utils/random";

export const calculateLevelScore = ({
  baseScore,
  difficultyMultiplier,
  timeLeft,
  timeLimit,
  attempts,
  hintsUsed,
  stepBonus = 0,
}) => {
  const safeTimeLimit = Math.max(1, timeLimit);
  const remainingRatio = clamp(timeLeft / safeTimeLimit, 0, 1);
  const speedFactor = 0.45 + remainingRatio * 0.55;
  const accuracyFactor = Math.max(0.4, 1 - Math.max(0, attempts - 1) * 0.1);
  const hintPenalty = hintsUsed * 16;

  const rawScore =
    (baseScore + stepBonus) *
      Math.max(1, difficultyMultiplier) *
      speedFactor *
      accuracyFactor -
    hintPenalty;

  return Math.max(10, Math.round(rawScore));
};
