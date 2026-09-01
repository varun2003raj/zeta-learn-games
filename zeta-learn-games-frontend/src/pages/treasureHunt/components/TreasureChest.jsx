function TreasureChest({ open }) {
  return (
    <div className={`treasure-chest${open ? " is-open" : ""}`} aria-hidden="true">
      <div className="chest-glow" />
      <div className="chest-lid" />
      <div className="chest-base" />
      <div className="chest-lock" />
    </div>
  );
}

export default TreasureChest;
