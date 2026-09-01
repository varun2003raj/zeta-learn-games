import { Link, Navigate } from "react-router-dom";

import memoryMatchBackground from "../../assets/memorymatch/background.avif";
import blueFire from "../../assets/memorymatch/bluefire.png";
import greenFire from "../../assets/memorymatch/greenfire.png";
import purpleFire from "../../assets/memorymatch/purpulefire.png";
import redFire from "../../assets/memorymatch/redfire.png";

import "./MemoryMatchLevels.css";

const levels = [
  {
    name: "EASY",
    grid: "4 × 4",
    fire: greenFire,
    pair: "+100",
    wrong: "-5",
    hint: "-25",
    advantage: "NO PENALTY FOR 10 SEC",
    hasSpecial: false,
    description: "A perfect starting challenge for beginners.",
  },

  {
    name: "MEDIUM",
    grid: "5 × 5",
    fire: blueFire,
    pair: "+150",
    wrong: "-10",
    hint: "-30",
    advantage: "NO PENALTY FOR 10 SEC",
    special: "+50 & REVEAL 1 PAIR",
    hasSpecial: true,
    description: "The challenge gets harder. Stay focused.",
  },

  {
    name: "HARD",
    grid: "6 × 6",
    fire: purpleFire,
    pair: "+200",
    wrong: "-15",
    hint: "-35",
    advantage: "NO PENALTY FOR 10 SEC",
    hasSpecial: false,
    description: "Only sharp minds can survive this level.",
  },

  {
    name: "EXPERT",
    grid: "7 × 7",
    fire: redFire,
    pair: "+250",
    wrong: "-20",
    hint: "-40",
    advantage: "NO PENALTY FOR 10 SEC",
    special: "+50 & REVEAL 1 PAIR",
    hasSpecial: true,
    description: "The ultimate Memory Match challenge.",
  },
];

export default function MemoryMatchLevels() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="memory-level-page"
      style={{
        backgroundImage: `url(${memoryMatchBackground})`,
      }}
    >
      <div className="memory-level-overlay"></div>

      <div className="memory-level-content">

        {/* HEADER */}
        <header className="memory-level-header">
          <p>CYBER MEMORY MATCH</p>

          <h1>Choose Your Challenge</h1>

          <span>
            Enter the fire gateway to begin your challenge
          </span>

          <Link to="/" className="memory-back-button">
            ← BACK TO DASHBOARD
          </Link>
        </header>

        {/* LEVELS */}
        <section className="memory-levels">

          {levels.map((level) => (
            <LevelFire
              key={level.name}
              level={level}
            />
          ))}

        </section>

      </div>
    </div>
  );
}


/* =========================================
   FIRE LEVEL COMPONENT
========================================= */

function LevelFire({ level }) {
  const openPopup = () => {
    const popup = document.getElementById(
      `memory-popup-${level.name}`
    );

    if (popup) {
      popup.showModal();
    }
  };

  const closePopup = () => {
    const popup = document.getElementById(
      `memory-popup-${level.name}`
    );

    if (popup) {
      popup.close();
    }
  };

  return (
    <>
      <div className="memory-fire-level">

        {/* LEVEL NAME */}
        <h2>{level.name}</h2>

        {/* FIRE */}
        <button
          className="memory-fire-button"
          onClick={openPopup}
          aria-label={`Open ${level.name} details`}
        >
          <div className="memory-fire-glow"></div>

          <img
            src={level.fire}
            alt={`${level.name} fire gateway`}
            className="memory-fire-image"
          />
        </button>

      </div>


      {/* =========================================
          LEVEL INFORMATION POPUP
      ========================================= */}

      <dialog
        id={`memory-popup-${level.name}`}
        className="memory-level-dialog"
      >

        <div className="memory-popup-content">

          {/* CLOSE BUTTON */}
          <button
            className="memory-popup-close"
            onClick={closePopup}
            aria-label="Close"
          >
            ×
          </button>


          {/* POPUP HEADER */}
          <div className="memory-popup-header">

            <span>CYBER MEMORY MATCH</span>

            <h2>{level.name}</h2>

            <p>{level.description}</p>

          </div>


          {/* GRID */}
          <div className="memory-popup-grid-info">

            <span>GRID</span>

            <strong>
              {level.grid}
            </strong>

          </div>


          {/* CHALLENGE RULES */}
          <div className="memory-popup-rules">

            <h3>⚡ CHALLENGE RULES</h3>


            {/* 1 PAIR */}
            <div className="memory-rule">
              <span>🃏 1 Pair</span>

              <strong>
                {level.pair}
              </strong>
            </div>


            {/* WRONG MATCH */}
            <div className="memory-rule">
              <span>❌ Wrong Match</span>

              <strong>
                {level.wrong}
              </strong>
            </div>


            {/* HINT */}
            <div className="memory-rule">
              <span>💡 Hint</span>

              <strong>
                {level.hint}
              </strong>
            </div>


            {/* ADVANTAGE CARD */}
            <div className="memory-rule">
              <span>🛡️ Advantage Card</span>

              <strong>
                {level.advantage}
              </strong>
            </div>


            {/* DISADVANTAGE CARD */}
            <div className="memory-rule">
              <span>🔀 Disadvantage Card</span>

              <strong>
                SHUFFLE CARDS
              </strong>
            </div>


            {/* SPECIAL CARD
                ONLY MEDIUM + EXPERT */}
            {level.hasSpecial && (
              <div className="memory-rule">
                <span>⭐ Special Card</span>

                <strong>
                  {level.special}
                </strong>
              </div>
            )}

          </div>


          {/* ENTER LEVEL */}
          <Link
            to={`/memory-match/games?level=${level.name}`}
            className="memory-enter-level"
            onClick={closePopup}
          >
            ENTER LEVEL →
          </Link>

        </div>

      </dialog>
    </>
  );
}