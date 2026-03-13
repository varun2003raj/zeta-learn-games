/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import PirateBackground from "./components/PirateBackground";
import AmbientSoundToggle from "./components/AmbientSoundToggle";
import TypewriterText from "./components/TypewriterText";
import LevelGrid from "./components/LevelGrid";
import ProgressHud from "./components/ProgressHud";
import ParchmentInput from "./components/ParchmentInput";
import CaptainLog from "./components/CaptainLog";
import TreasureChest from "./components/TreasureChest";
import PremiumCursor from "./components/PremiumCursor";
import { TOTAL_LEVELS } from "./data/levelBands";
import { evaluateAnswer, generateChallenge, getBandMetadata, getLiveValidation } from "./engine/challengeEngine";
import { calculateLevelScore } from "./engine/scoring";
import { clearProgress, createInitialProgress, loadProgress, saveProgress } from "./utils/storage";
import "./treasureHuntGame.css";

const buildLogEntry = (type, text) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  text,
  time: new Date().toLocaleTimeString("en-US", { hour12: false }),
});

function TreasureHuntGame() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [currentLevel, setCurrentLevel] = useState(() => {
    const loaded = loadProgress();
    return Math.min(Math.max(loaded.lastPlayedLevel || 1, 1), loaded.highestUnlockedLevel);
  });
  const [challengeVariant, setChallengeVariant] = useState(0);
  const [screenState, setScreenState] = useState("active");
  const [timeLeft, setTimeLeft] = useState(0);
  const [parchmentValue, setParchmentValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [lastLevelGold, setLastLevelGold] = useState(0);
  const [logs, setLogs] = useState(() => [
    buildLogEntry("captain", "Captain's journal opened."),
    buildLogEntry("captain", "Crew assembled at the tropical dock."),
  ]);

  const challenge = useMemo(
    () => generateChallenge(currentLevel, challengeVariant),
    [currentLevel, challengeVariant]
  );

  const bandMetadata = useMemo(() => getBandMetadata(currentLevel), [currentLevel]);

  const addLog = useCallback((type, text) => {
    setLogs((previous) => {
      const next = [...previous, buildLogEntry(type, text)];
      return next.slice(-120);
    });
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (currentLevel > progress.highestUnlockedLevel) {
      setCurrentLevel(progress.highestUnlockedLevel);
    }
  }, [currentLevel, progress.highestUnlockedLevel]);

  useEffect(() => {
    setProgress((previous) => {
      if (previous.lastPlayedLevel === currentLevel) {
        return previous;
      }

      return {
        ...previous,
        lastPlayedLevel: currentLevel,
      };
    });
  }, [currentLevel]);

  useEffect(() => {
    setScreenState("active");
    setTimeLeft(challenge.timeLimit);
    setParchmentValue("");
    setAttempts(0);
    setHintsUsed(0);
    setRevealedHints(0);
    setStepIndex(0);
    setLastLevelGold(0);

    addLog("captain", `Preparing Trial ${currentLevel}: ${challenge.title}`);
    addLog("event", `${challenge.category} | timeglass ${challenge.timeLimit}s`);
  }, [addLog, challenge.id, challenge.timeLimit, challenge.title, challenge.category, currentLevel]);

  useEffect(() => {
    if (screenState !== "active") {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [screenState, challenge.id]);

  useEffect(() => {
    if (screenState === "active" && timeLeft === 0) {
      setScreenState("failed");
      addLog("danger", `Trial ${currentLevel} failed. The ship struck the rocks.`);
    }
  }, [screenState, timeLeft, currentLevel, addLog]);

  const completionPercent = useMemo(() => {
    return (progress.completedLevels.length / TOTAL_LEVELS) * 100;
  }, [progress.completedLevels.length]);

  const currentTarget = challenge.steps?.length ? challenge.steps[stepIndex] : challenge;
  const shownHints = currentTarget.hints.slice(0, revealedHints);

  const liveValidation = useMemo(() => {
    return getLiveValidation(challenge, parchmentValue, stepIndex);
  }, [challenge, parchmentValue, stepIndex]);

  const applyLevelSuccess = useCallback(
    (goldAwarded, attemptCount) => {
      setProgress((previous) => {
        const existingBest = Number(previous.bestScores[currentLevel] || 0);
        const updatedBest = Math.max(existingBest, goldAwarded);
        const bestScores =
          updatedBest === existingBest
            ? previous.bestScores
            : { ...previous.bestScores, [currentLevel]: updatedBest };

        const completedSet = new Set(previous.completedLevels);
        completedSet.add(currentLevel);
        const completedLevels = [...completedSet].sort((left, right) => left - right);

        const totalScore = Object.values(bestScores).reduce((sum, value) => sum + Number(value), 0);
        const highestUnlockedLevel = Math.min(
          TOTAL_LEVELS,
          Math.max(previous.highestUnlockedLevel, currentLevel + 1)
        );

        return {
          ...previous,
          bestScores,
          totalScore,
          completedLevels,
          highestUnlockedLevel,
          totalAttempts: previous.totalAttempts + attemptCount,
          totalHintsUsed: previous.totalHintsUsed + hintsUsed,
          lastPlayedLevel: currentLevel,
        };
      });
    },
    [currentLevel, hintsUsed]
  );

  const handleSubmit = useCallback(
    (input) => {
      if (screenState !== "active") {
        return;
      }

      const trimmed = input.trim();
      if (!trimmed) {
        return;
      }

      const nextAttemptCount = attempts + 1;
      setAttempts(nextAttemptCount);

      const result = evaluateAnswer(challenge, trimmed, stepIndex);

      if (result.correct) {
        if (result.advanceStep) {
          const nextStep = result.nextStepIndex;
          setStepIndex(nextStep);
          setRevealedHints(0);
          setParchmentValue("");
          addLog("success", `Stage ${nextStep + 1}/${challenge.steps.length} unlocked.`);
          return;
        }

        const stepBonus = challenge.steps?.length ? challenge.steps.length * 35 : 0;
        const goldAwarded = calculateLevelScore({
          baseScore: challenge.baseScore,
          difficultyMultiplier: challenge.difficultyMultiplier,
          timeLeft,
          timeLimit: challenge.timeLimit,
          attempts: nextAttemptCount,
          hintsUsed,
          stepBonus,
        });

        setLastLevelGold(goldAwarded);
        applyLevelSuccess(goldAwarded, nextAttemptCount);
        setParchmentValue("");
        addLog("success", `Trial ${currentLevel} cleared. +${goldAwarded} gold coins.`);

        if (currentLevel === TOTAL_LEVELS) {
          setScreenState("victory");
          addLog("success", "The legendary vault has opened.");
        } else {
          setScreenState("cleared");
        }

        return;
      }

      const penalty = result.timePenalty || 6;
      setTimeLeft((previous) => Math.max(previous - penalty, 0));
      setParchmentValue("");
      addLog("danger", `Wrong clue answer. ${penalty}s lost from the sand timer.`);
    },
    [
      addLog,
      applyLevelSuccess,
      attempts,
      challenge,
      currentLevel,
      hintsUsed,
      screenState,
      stepIndex,
      timeLeft,
    ]
  );

  const handleHintRequest = () => {
    if (screenState !== "active") {
      return;
    }

    if (revealedHints >= currentTarget.hints.length) {
      addLog("warning", "No more hints remain on this parchment.");
      return;
    }

    const nextHintCount = revealedHints + 1;
    setRevealedHints(nextHintCount);
    setHintsUsed((previous) => previous + 1);
    addLog("warning", `Hint ${nextHintCount} revealed. Gold reward will be reduced.`);
  };

  const handleSelectLevel = (levelNumber) => {
    if (levelNumber > progress.highestUnlockedLevel) {
      return;
    }

    setCurrentLevel(levelNumber);
    setChallengeVariant(0);
  };

  const handleRetryLevel = () => {
    setChallengeVariant((previous) => previous + 1);
    addLog("captain", `Redrawing Trial ${currentLevel} with a fresh clue.`);
  };

  const handleNextLevel = () => {
    const nextUnlocked = Math.max(progress.highestUnlockedLevel, currentLevel + 1);
    const nextLevel = Math.min(currentLevel + 1, nextUnlocked);
    setCurrentLevel(nextLevel);
    setChallengeVariant(0);
  };

  const handleRestartSimulation = () => {
    clearProgress();
    const fresh = createInitialProgress();
    setProgress(fresh);
    setCurrentLevel(1);
    setChallengeVariant((previous) => previous + 1);
    setLogs([
      buildLogEntry("captain", "Voyage restarted from the first island."),
      buildLogEntry("captain", "Crew ready to hunt the lost treasure."),
    ]);
  };

  return (
    <main className="treasure-app-shell">
      <PremiumCursor />
      <PirateBackground />

      <div className="app-content">
        <header className="hero-header">
          <p className="hero-kicker">Live Cyber Expedition</p>
          <h1 className="hero-title">Treasure Hunt Arena</h1>
          <p className="hero-subtitle">Decode clues, clear 250 trials, and unlock the vault.</p>
          <AmbientSoundToggle />
        </header>

        <ProgressHud
          completedCount={progress.completedLevels.length}
          totalLevels={TOTAL_LEVELS}
          completionPercent={completionPercent}
          goldCoins={progress.totalScore}
          currentLevel={currentLevel}
          highestUnlockedLevel={progress.highestUnlockedLevel}
          timeLeft={timeLeft}
          difficulty={challenge.difficulty}
        />

        <section className="dashboard-grid">
          <LevelGrid
            totalLevels={TOTAL_LEVELS}
            currentLevel={currentLevel}
            highestUnlockedLevel={progress.highestUnlockedLevel}
            completedLevels={progress.completedLevels}
            onSelectLevel={handleSelectLevel}
          />

          <section key={`${challenge.id}-${stepIndex}`} className="panel parchment-panel mission-panel">
            <header className="panel-header mission-header">
              <h2>{challenge.title}</h2>
              <span>{challenge.category}</span>
            </header>

            <p className="band-label">{bandMetadata.label}</p>

            {challenge.steps?.length ? (
              <p className="step-indicator">
                Vault Stage {stepIndex + 1} / {challenge.steps.length}: {currentTarget.title}
              </p>
            ) : null}

            <TypewriterText text={currentTarget.briefing} className="briefing-text" speed={12} />
            <pre className="challenge-prompt">{currentTarget.prompt}</pre>

            <section className="hint-panel parchment-soft">
              <div className="hint-head">
                <h3>Hint Scroll</h3>
                <button type="button" onClick={handleHintRequest} disabled={screenState !== "active"}>
                  Reveal Hint (-16 gold)
                </button>
              </div>

              {shownHints.length ? (
                <ul className="hint-list">
                  {shownHints.map((hint, index) => (
                    <li key={`${challenge.id}-hint-${index}`}>{hint}</li>
                  ))}
                </ul>
              ) : (
                <p className="hint-empty">No hint revealed yet.</p>
              )}
            </section>

            <ParchmentInput
              value={parchmentValue}
              onChange={setParchmentValue}
              onSubmit={handleSubmit}
              validation={liveValidation}
              disabled={screenState !== "active"}
              placeholder={currentTarget.inputPlaceholder}
            />

            <div className="mission-actions">
              <button type="button" onClick={handleRetryLevel}>Redraw Trial</button>
              <button type="button" className="danger" onClick={handleRestartSimulation}>Restart Voyage</button>
            </div>

            {screenState === "failed" ? (
              <div className="state-overlay failure">
                <h3>Shipwrecked!</h3>
                <p>The timer ran out before the clue was solved.</p>
                <div className="overlay-actions">
                  <button type="button" onClick={handleRetryLevel}>Try Again</button>
                  <button type="button" onClick={handleRestartSimulation}>Return to Harbor</button>
                </div>
              </div>
            ) : null}

            {screenState === "cleared" ? (
              <div className="state-overlay success">
                <TreasureChest open />
                <h3>Treasure Found for This Trial</h3>
                <p>Gold earned: +{lastLevelGold}</p>
                <div className="overlay-actions">
                  <button type="button" onClick={handleNextLevel}>Sail to Next Trial</button>
                  <button type="button" onClick={handleRetryLevel}>Replay Trial</button>
                </div>
              </div>
            ) : null}

            {screenState === "victory" ? (
              <div className="state-overlay success">
                <TreasureChest open />
                <h3>You Found the Legendary Treasure!</h3>
                <p>All 250 pirate trials have been conquered.</p>
                <div className="overlay-actions">
                  <button type="button" onClick={handleRestartSimulation}>Start New Voyage</button>
                </div>
              </div>
            ) : null}
          </section>

          <CaptainLog logs={logs} />
        </section>
      </div>
    </main>
  );
}

export default TreasureHuntGame;
