function ProgressHud({
  completedCount,
  totalLevels,
  completionPercent,
  goldCoins,
  currentLevel,
  highestUnlockedLevel,
  timeLeft,
  difficulty,
}) {
  return (
    <section className="panel parchment-panel progress-panel">
      <header className="panel-header">
        <h2>Mission Progress Matrix</h2>
      </header>

      <div className="progress-meta">
        <span>Level {currentLevel} / {totalLevels}</span>
        <span>{completionPercent.toFixed(1)}% completed</span>
      </div>

      <div className="map-indicator" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
        <div className="map-path" />
        <div className="map-marker" style={{ left: `${completionPercent}%` }} />
      </div>

      <div className="stat-grid">
        <div>
          <span className="stat-label">Completed</span>
          <strong>{completedCount}</strong>
        </div>
        <div>
          <span className="stat-label">Unlocked</span>
          <strong>{highestUnlockedLevel}</strong>
        </div>
        <div>
          <span className="stat-label">Gold Coins</span>
          <strong>{goldCoins}</strong>
        </div>
        <div>
          <span className="stat-label">Mission Timer</span>
          <strong>{timeLeft}s</strong>
        </div>
      </div>

      <p className="difficulty-text">Threat Tier: {difficulty}</p>
    </section>
  );
}

export default ProgressHud;
