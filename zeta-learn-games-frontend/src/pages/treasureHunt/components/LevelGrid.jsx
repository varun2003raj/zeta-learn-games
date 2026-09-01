import { useMemo } from "react";

function LevelGrid({ totalLevels, currentLevel, highestUnlockedLevel, completedLevels, onSelectLevel }) {
  const completedSet = useMemo(() => new Set(completedLevels), [completedLevels]);

  return (
    <section className="panel parchment-panel level-panel">
      <header className="panel-header">
        <h2>Level Network</h2>
      </header>

      <div className="level-grid">
        {Array.from({ length: totalLevels }, (_, index) => {
          const levelNumber = index + 1;
          const isLocked = levelNumber > highestUnlockedLevel;
          const isCompleted = completedSet.has(levelNumber);
          const isCurrent = currentLevel === levelNumber;

          return (
            <button
              key={levelNumber}
              type="button"
              className={`level-cell${isLocked ? " is-locked" : ""}${isCompleted ? " is-completed" : ""}${isCurrent ? " is-current" : ""}`}
              onClick={() => onSelectLevel(levelNumber)}
              disabled={isLocked}
              title={isLocked ? `Level ${levelNumber} locked` : `Open Level ${levelNumber}`}
            >
              {levelNumber}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default LevelGrid;
