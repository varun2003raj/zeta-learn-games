function PirateBackground() {
  return (
    <div className="pirate-background" aria-hidden="true">
      <div className="sky-gradient" />
      <div className="sun-halo" />

      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" />

      <div className="birds">
        <span className="bird bird-a" />
        <span className="bird bird-b" />
        <span className="bird bird-c" />
      </div>

      <div className="island-silhouette" />

      <div className="ocean-layer ocean-back" />
      <div className="ocean-layer ocean-mid" />
      <div className="ocean-layer ocean-front" />
    </div>
  );
}

export default PirateBackground;
