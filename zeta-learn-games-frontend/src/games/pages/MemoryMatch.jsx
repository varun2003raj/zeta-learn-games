import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import "./MemoryMatch.css";

import greenBackground from "../../assets/memorymatch/greenbackground.jpg";
import blueBackground from "../../assets/memorymatch/bluebackground.webp";
import purpleBackground from "../../assets/memorymatch/purplebackground.webp";
import redBackground from "../../assets/memorymatch/redbackground.avif";

import greenFire from "../../assets/memorymatch/greenfire.png";
import blueFire from "../../assets/memorymatch/bluefire.png";
import purpleFire from "../../assets/memorymatch/purpulefire.png";
import redFire from "../../assets/memorymatch/redfire.png";

/* =====================================================
   CYBER / PROGRAMMING EMOJIS
===================================================== */

const cardIcons = [
  "🐧",
  "🐍",
  "⚛️",
  "💻",
  "🔐",
  "🌐",
  "🔥",
  "⚡",
  "💾",
  "🧠",
  "🤖",
  "🔑",
  "📡",
  "🕵️",
  "🖥️",
  "📱",
  "☁️",
  "🐛",
  "⚙️",
  "💡",
  "🧩",
  "🚀",
  "🔒",
  "🌎",
];

/* =====================================================
   COMPONENT
===================================================== */

function MemoryMatch() {
  const [searchParams] = useSearchParams();

  const level = searchParams.get("level");

  /* =====================================================
     GAME STATE
  ===================================================== */

  const [settings, setSettings] = useState([]);
  const [cards, setCards] = useState([]);
  const [boardCards, setBoardCards] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [usedPowerCards, setUsedPowerCards] = useState([]);

  const [specialUsed, setSpecialUsed] = useState(false);

  const [shieldUsed, setShieldUsed] = useState(false);
  const [shuffleUsed, setShuffleUsed] = useState(false);

  const [shieldActive, setShieldActive] = useState(false);
  const [shieldTimeLeft, setShieldTimeLeft] = useState(0);

  const [specialRevealed, setSpecialRevealed] = useState(false);

  const [hintCard, setHintCard] = useState([]);

  /* =====================================================
     POWER POPUP
  ===================================================== */

  const [powerPopup, setPowerPopup] = useState(null);

  /* =====================================================
     SCORE / GAME
  ===================================================== */

  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  /* =====================================================
     LOAD GAME SETTINGS
  ===================================================== */

  useEffect(() => {
    fetch(
      "https://zeta-learn-games.onrender.com/api/memory-match/settings/"
      //"http://127.0.0.1:8000/api/memory-match/settings/"
    )
      .then((response) => response.json())
      .then((data) => {
        setSettings(data);

        if (data.length > 0) {
          const selected = data.find(
            (item) => item.difficulty === level
          );

          setSelectedDifficulty(selected || data[0]);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error loading game settings:",
          error
        );

        setLoading(false);
      });
  }, [level]);

  /* =====================================================
     LOAD CARDS
  ===================================================== */

  useEffect(() => {
    if (!selectedDifficulty) return;

    fetch(
      "https://zeta-learn-games.onrender.com/api/memory-match/cards/"
      //"http://127.0.0.1:8000/api/memory-match/cards/"
    )
      .then((response) => response.json())
      .then((data) => {
        setCards(data);
      })
      .catch((error) => {
        console.error(
          "Error loading memory cards:",
          error
        );
      });
  }, [selectedDifficulty]);

  /* =====================================================
     START GAME AUTOMATICALLY
  ===================================================== */

  useEffect(() => {
    if (
      !selectedDifficulty ||
      cards.length === 0
    ) {
      return;
    }

    startGame();
  }, [selectedDifficulty, cards]);

  /* =====================================================
     GAME TIMER
  ===================================================== */

  useEffect(() => {
    if (
      !gameStarted ||
      gameWon ||
      timeLeft <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(
        (previous) => previous - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameStarted,
    gameWon,
    timeLeft,
  ]);

  /* =====================================================
     SHIELD TIMER
  ===================================================== */

  useEffect(() => {
    if (
      !shieldActive ||
      shieldTimeLeft <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      setShieldTimeLeft(
        (previous) => previous - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    shieldActive,
    shieldTimeLeft,
  ]);

  /* =====================================================
     DISABLE SHIELD WHEN TIME ENDS
  ===================================================== */

  useEffect(() => {
    if (
      shieldActive &&
      shieldTimeLeft === 0
    ) {
      setShieldActive(false);
    }
  }, [
    shieldActive,
    shieldTimeLeft,
  ]);

  /* =====================================================
     TIME'S UP
  ===================================================== */

  useEffect(() => {
    if (
      gameStarted &&
      timeLeft === 0 &&
      !gameWon
    ) {
      setGameStarted(false);
    }
  }, [
    timeLeft,
    gameStarted,
    gameWon,
  ]);

  /* =====================================================
     POWER POPUP
  ===================================================== */

  function showPowerPopup(type) {
    if (type === "advantage") {
      setPowerPopup({
        icon: "🛡️",
        title: "ADVANTAGE",
        message: "SHIELD ACTIVATED",
        description:
          "No score penalty for wrong matches for 15 seconds.",
      });
    }

    if (type === "disadvantage") {
      setPowerPopup({
        icon: "🔀",
        title: "DISADVANTAGE",
        message: "GRID SHUFFLED",
        description:
          "The board positions have been shuffled.",
      });
    }

    if (type === "special") {
      setPowerPopup({
        icon: "⭐",
        title: "SPECIAL POWER",
        message: "PAIR REVEALED",
        description:
          "A matching pair is automatically revealed.",
      });
    }

    setTimeout(() => {
      setPowerPopup(null);
    }, 1800);
  }

  /* =====================================================
     START / RESTART GAME
  ===================================================== */

  function startGame() {
    if (
      !selectedDifficulty ||
      cards.length === 0
    ) {
      return;
    }

    const gridSize =
      selectedDifficulty.grid_size;

    const totalCards =
      gridSize ** 2;

    /*
      4x4 = 16
      7 pairs + 2 power cards

      5x5 = 25
      11 pairs + 2 power cards + 1 special

      6x6 = 36
      17 pairs + 2 power cards

      7x7 = 49
      23 pairs + 2 power cards + 1 special
    */

    const hasSpecial =
      totalCards % 2 !== 0;

    const powerCardCount =
      hasSpecial ? 3 : 2;

    const pairCount = Math.floor(
      (totalCards - powerCardCount) / 2
    );

    /* =====================================================
       SELECT NORMAL CARDS
    ===================================================== */

    const shuffledCards = [...cards]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount)
      .map((card, index) => ({
        ...card,
        icon:
          cardIcons[
            index % cardIcons.length
          ],
      }));

    /* =====================================================
       CREATE PAIRS
    ===================================================== */

    const pairCards =
      shuffledCards.flatMap((card) => [
        {
          ...card,
          uniqueId: `${card.id}-a`,
        },

        {
          ...card,
          uniqueId: `${card.id}-b`,
        },
      ]);

    /* =====================================================
       ADVANTAGE CARD
    ===================================================== */

    pairCards.push({
      id: "advantage",
      uniqueId: "advantage",

      name: "🛡️",
      icon: "🛡️",

      category: "ADVANTAGE",

      advantage: true,
    });

    /* =====================================================
       DISADVANTAGE CARD
    ===================================================== */

    pairCards.push({
      id: "disadvantage",
      uniqueId: "disadvantage",

      name: "🔀",
      icon: "🔀",

      category: "DISADVANTAGE",

      disadvantage: true,
    });

    /* =====================================================
       SPECIAL CARD
       ONLY FOR 5x5 / 7x7
    ===================================================== */

    if (hasSpecial) {
      pairCards.push({
        id: "special",
        uniqueId: "special",

        name: "⭐",
        icon: "⭐",

        category: "SPECIAL",

        special: true,
      });
    }

    /* =====================================================
       FINAL SHUFFLE
    ===================================================== */

    const finalCards = [
      ...pairCards,
    ].sort(
      () => Math.random() - 0.5
    );

    /* =====================================================
       RESET GAME
    ===================================================== */

    setBoardCards(finalCards);

    setFlippedCards([]);
    setMatchedCards([]);
    setUsedPowerCards([]);

    setSpecialUsed(false);
    setSpecialRevealed(false);

    setShieldUsed(false);
    setShuffleUsed(false);

    setShieldActive(false);
    setShieldTimeLeft(0);

    setHintCard([]);

    setPowerPopup(null);

    setScore(0);
    setMoves(0);
    setCombo(0);

    setTimeLeft(
      selectedDifficulty.time_limit_seconds
    );

    setGameStarted(true);
    setGameWon(false);
  }

  /* =====================================================
     CARD CLICK
  ===================================================== */

  function handleCardClick(card) {
    if (!gameStarted) {
      return;
    }

    if (hintCard.length > 0) {
      return;
    }

    /* Already matched */

    if (
      matchedCards.includes(card.id)
    ) {
      return;
    }

    /* Already used power card */

    if (
      card.advantage &&
      shieldUsed
    ) {
      return;
    }

    if (
      card.disadvantage &&
      shuffleUsed
    ) {
      return;
    }

    if (
      card.special &&
      specialUsed
    ) {
      return;
    }

    /* Already open */

    if (
      flippedCards.some(
        (item) =>
          item.uniqueId ===
          card.uniqueId
      )
    ) {
      return;
    }

    /* =====================================================
       ADVANTAGE / SHIELD
    ===================================================== */

    if (card.advantage) {
      setShieldUsed(true);

      setUsedPowerCards(
        (previous) => [
          ...previous,
          card.id,
        ]
      );

      setFlippedCards(
        (previous) => [
          ...previous,
          card,
        ]
      );

      setShieldActive(true);

      setShieldTimeLeft(15);

      setMoves(
        (previous) => previous + 1
      );

      showPowerPopup(
        "advantage"
      );

      setTimeout(() => {
        setFlippedCards(
          (previous) =>
            previous.filter(
              (item) =>
                item.uniqueId !==
                card.uniqueId
            )
        );
      }, 1000);

      return;
    }

    /* =====================================================
       DISADVANTAGE / SHUFFLE
    ===================================================== */

    if (card.disadvantage) {
      setShuffleUsed(true);

      setUsedPowerCards(
        (previous) => [
          ...previous,
          card.id,
        ]
      );

      setFlippedCards(
        (previous) => [
          ...previous,
          card,
        ]
      );

      setMoves(
        (previous) => previous + 1
      );

      showPowerPopup(
        "disadvantage"
      );

      const currentlyOpen = [
        ...flippedCards,
      ];

      setBoardCards(
        (previous) =>
          [...previous].sort(
            () =>
              Math.random() -
              0.5
          )
      );

      setTimeout(() => {
        setFlippedCards(
          currentlyOpen
        );
      }, 800);

      return;
    }

    /* =====================================================
       SPECIAL CARD
    ===================================================== */

    if (card.special) {
      if (specialUsed) {
        return;
      }

      setSpecialUsed(true);
      setSpecialRevealed(true);

      setMoves(
        (previous) => previous + 1
      );

      showPowerPopup(
        "special"
      );

      /* SPECIAL AS FIRST CARD */

      if (
        flippedCards.length ===
        0
      ) {
        const availableCards =
          boardCards.filter(
            (item) =>
              !item.special &&
              !item.advantage &&
              !item.disadvantage &&
              !matchedCards.includes(
                item.id
              )
          );

        if (
          availableCards.length ===
          0
        ) {
          return;
        }

        const randomCard =
          availableCards[
            Math.floor(
              Math.random() *
                availableCards.length
            )
          ];

        const matchingCard =
          boardCards.find(
            (item) =>
              !item.special &&
              !item.advantage &&
              !item.disadvantage &&
              item.id ===
                randomCard.id &&
              item.uniqueId !==
                randomCard.uniqueId &&
              !matchedCards.includes(
                item.id
              )
          );

        if (!matchingCard) {
          return;
        }

        setFlippedCards([
          card,
          randomCard,
          matchingCard,
        ]);

        setScore(
          (previous) =>
            previous +
            50 +
            selectedDifficulty.points_per_pair
        );

        setMatchedCards(
          (previous) => [
            ...previous,
            randomCard.id,
          ]
        );

        setTimeout(() => {
          setFlippedCards([]);
          setSpecialRevealed(false);
        }, 1200);

        return;
      }

      /* SPECIAL AS SECOND CARD */

      const firstCard =
        flippedCards[0];

      if (!firstCard) {
        return;
      }

      const matchingCard =
        boardCards.find(
          (item) =>
            !item.special &&
            !item.advantage &&
            !item.disadvantage &&
            item.id ===
              firstCard.id &&
            item.uniqueId !==
              firstCard.uniqueId &&
            !matchedCards.includes(
              item.id
            )
        );

      if (!matchingCard) {
        return;
      }

      setFlippedCards([
        firstCard,
        card,
        matchingCard,
      ]);

      setScore(
        (previous) =>
          previous +
          50 +
          selectedDifficulty.points_per_pair
      );

      setMatchedCards(
        (previous) => [
          ...previous,
          firstCard.id,
        ]
      );

      setTimeout(() => {
        setFlippedCards([]);
        setSpecialRevealed(false);
      }, 1200);

      return;
    }

    /* =====================================================
       NORMAL CARD
    ===================================================== */

    if (
      flippedCards.length >= 2
    ) {
      return;
    }

    const newFlippedCards = [
      ...flippedCards,
      card,
    ];

    setFlippedCards(
      newFlippedCards
    );

    /* =====================================================
       TWO CARDS OPEN
    ===================================================== */

    if (
      newFlippedCards.length ===
      2
    ) {
      setMoves(
        (previous) => previous + 1
      );

      const firstCard =
        newFlippedCards[0];

      const secondCard =
        newFlippedCards[1];

      /* CORRECT PAIR */

      if (
        firstCard.id ===
          secondCard.id &&
        firstCard.id !==
          "special" &&
        !firstCard.advantage &&
        !firstCard.disadvantage
      ) {
        setMatchedCards(
          (previous) => [
            ...previous,
            firstCard.id,
          ]
        );

        setCombo(
          (previous) =>
            previous + 1
        );

        setScore(
          (previous) =>
            previous +
            selectedDifficulty.points_per_pair +
            combo * 10
        );

        setFlippedCards([]);
      } else {
        /* WRONG PAIR */

        setCombo(0);

        if (!shieldActive) {
          setScore(
            (previous) =>
              Math.max(
                0,
                previous -
                  selectedDifficulty.wrong_move_penalty
              )
          );
        }

        setTimeout(() => {
          setFlippedCards([]);
        }, 800);
      }
    }
  }

  /* =====================================================
     HINT SYSTEM
  ===================================================== */

  function useHint() {
    if (!gameStarted) {
      return;
    }

    if (hintCard.length > 0) {
      return;
    }

    const availableCards =
      boardCards.filter(
        (card) =>
          !card.special &&
          !card.advantage &&
          !card.disadvantage &&
          !matchedCards.includes(
            card.id
          )
      );

    if (
      availableCards.length ===
      0
    ) {
      return;
    }

    /* HINT PENALTY */

    setScore(
      (previous) =>
        Math.max(
          0,
          previous -
            selectedDifficulty.hint_penalty
        )
    );

    /* ONE CARD ALREADY OPEN */

    if (
      flippedCards.length ===
      1
    ) {
      const firstCard =
        flippedCards[0];

      const matchingCard =
        availableCards.find(
          (card) =>
            card.id ===
              firstCard.id &&
            card.uniqueId !==
              firstCard.uniqueId
        );

      if (!matchingCard) {
        return;
      }

      setHintCard([
        matchingCard.uniqueId,
      ]);

      setTimeout(() => {
        setHintCard([]);
      }, 1000);

      return;
    }

    /* NO CARD OPEN */

    const randomCard =
      availableCards[
        Math.floor(
          Math.random() *
            availableCards.length
        )
      ];

    const matchingCard =
      availableCards.find(
        (card) =>
          card.id ===
            randomCard.id &&
          card.uniqueId !==
            randomCard.uniqueId
      );

    if (!matchingCard) {
      return;
    }

    setHintCard([
      randomCard.uniqueId,
      matchingCard.uniqueId,
    ]);

    setTimeout(() => {
      setHintCard([]);
    }, 1000);
  }

  /* =====================================================
     CHECK WIN + SAVE SCORE
  ===================================================== */

  useEffect(() => {
    if (
      !selectedDifficulty ||
      !gameStarted
    ) {
      return;
    }

    const totalCards =
      selectedDifficulty.grid_size ** 2;

    const matchedCardCount =
      matchedCards.length * 2;

    const powerCardCount =
      (shieldUsed ? 1 : 0) +
      (shuffleUsed ? 1 : 0) +
      (specialUsed ? 1 : 0);

    const completedCards =
      matchedCardCount +
      powerCardCount;

    if (
      completedCards >=
      totalCards
    ) {
      setGameWon(true);
      setGameStarted(false);

      /* =================================================
         SAVE BEST SCORE TO BACKEND
      ================================================= */

      const token =
        localStorage.getItem(
          "token"
        );

      fetch(
        "https://zeta-learn-games.onrender.com/api/memory-match/score/",
        //"http://127.0.0.1:8000/api/memory-match/score/",
        {
          method: "POST",

          headers: {
  "Content-Type": "application/json",

  Authorization: `Token ${token}`,
},

          body: JSON.stringify({
            difficulty:
              selectedDifficulty.difficulty,

            score: score,
          }),
        }
      )
        .then(async (response) => {
          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Failed to save score"
            );
          }

          return data;
        })

        .then((data) => {
          console.log(
            "Memory Match score saved:",
            data
          );
        })

        .catch((error) => {
          console.error(
            "Error saving Memory Match score:",
            error
          );
        });
    }
  }, [
    matchedCards,
    shieldUsed,
    shuffleUsed,
    specialUsed,
    selectedDifficulty,
    gameStarted,
    score,
  ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <h2>
        Loading Memory Match...
      </h2>
    );
  }

  /* =====================================================
     THEMES
  ===================================================== */

  const themeData = {
    EASY: {
      className: "theme-green",
      background:
        greenBackground,
      fire: greenFire,
    },

    MEDIUM: {
      className: "theme-blue",
      background:
        blueBackground,
      fire: blueFire,
    },

    HARD: {
      className: "theme-purple",
      background:
        purpleBackground,
      fire: purpleFire,
    },

    EXPERT: {
      className: "theme-red",
      background:
        redBackground,
      fire: redFire,
    },
  };

  const currentTheme =
    themeData[
      selectedDifficulty?.difficulty
    ] || themeData.EASY;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`memory-game-page ${currentTheme.className}`}
      style={{
        backgroundImage: `url(${currentTheme.background})`,
      }}
    >
      <div className="memory-game-atmosphere" />

      {/* FIRE LEFT */}

      <img
        src={currentTheme.fire}
        alt=""
        className="memory-theme-fire memory-theme-fire-left"
      />

      {/* FIRE RIGHT */}

      <img
        src={currentTheme.fire}
        alt=""
        className="memory-theme-fire memory-theme-fire-right"
      />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="memory-game-header">
        <div className="memory-game-title">
          <span className="memory-game-kicker">
            CYBER MEMORY MATCH
          </span>

          <h1>
            {selectedDifficulty?.difficulty}
          </h1>

          <span className="memory-game-grid-label">
            {selectedDifficulty?.grid_size} ×{" "}
            {selectedDifficulty?.grid_size}
          </span>
        </div>

        {/* GAME STATS */}

        <div className="memory-game-stats">
          <div className="memory-stat">
            <span>TIME</span>

            <strong>
              {timeLeft}s
            </strong>
          </div>

          <div className="memory-stat">
            <span>SCORE</span>

            <strong>
              {score}
            </strong>
          </div>

          <div className="memory-stat">
            <span>MOVES</span>

            <strong>
              {moves}
            </strong>
          </div>

          <div className="memory-stat combo-stat">
            <span>COMBO</span>

            <strong>
              ×{combo}
            </strong>
          </div>
        </div>
      </header>

      {/* =================================================
          POWER STATUS
      ================================================= */}

      <div className="memory-power-status">
        {shieldActive && (
          <div className="power-status shield-status">
            🛡 SHIELD ACTIVE

            <span>
              {shieldTimeLeft}s
            </span>
          </div>
        )}

        {specialRevealed && (
          <div className="power-status special-status">
            ✦ SPECIAL REVEAL
          </div>
        )}
      </div>

      {/* =================================================
          GAME AREA
      ================================================= */}

      <main className="memory-game-main">
        <div className="memory-board-frame">
          <div className="memory-board-topline">
            <span>
              MEMORY GRID
            </span>

            <span>
              {matchedCards.length} PAIRS FOUND
            </span>
          </div>

          {/* MEMORY BOARD */}

          <div
            className={`memory-board memory-board-${selectedDifficulty?.grid_size}`}
            style={{
              gridTemplateColumns: `repeat(${selectedDifficulty?.grid_size}, 1fr)`,
            }}
          >
            {boardCards.map(
              (card) => {
                /* CARD STATES */

                const isFlipped =
                  (card.special &&
                    specialUsed) ||
                  flippedCards.some(
                    (item) =>
                      item.uniqueId ===
                      card.uniqueId
                  );

                const isMatched =
                  matchedCards.includes(
                    card.id
                  );

                const isPowerUsed =
                  usedPowerCards.includes(
                    card.id
                  );

                const isHinted =
                  hintCard.includes(
                    card.uniqueId
                  );

                const visible =
                  isMatched ||
                  isFlipped ||
                  isPowerUsed ||
                  isHinted;

                /* CARD CLASS */

                let cardClass =
                  "memory-card";

                if (isMatched) {
                  cardClass +=
                    " matched";
                }

                if (
                  isFlipped ||
                  isPowerUsed
                ) {
                  cardClass +=
                    " flipped";
                }

                if (isHinted) {
                  cardClass +=
                    " hinted";
                }

                if (
                  card.advantage
                ) {
                  cardClass +=
                    " advantage-card";
                }

                if (
                  card.disadvantage
                ) {
                  cardClass +=
                    " disadvantage-card";
                }

                if (card.special) {
                  cardClass +=
                    " special-card";
                }

                /* CARD */

                return (
                  <button
                    key={
                      card.uniqueId
                    }
                    className={
                      cardClass
                    }
                    onClick={() =>
                      handleCardClick(
                        card
                      )
                    }
                    disabled={
                      isMatched ||
                      isPowerUsed
                    }
                  >
                    <span className="memory-card-inner">

                      {/* CARD FRONT */}

                      <span className="memory-card-front">
                        <span className="memory-card-symbol">
                          ?
                        </span>
                      </span>

                      {/* CARD BACK */}

                      <span className="memory-card-back">
                        {visible ? (
                          <span className="memory-card-emoji">
                            {card.icon ||
                              "💻"}
                          </span>
                        ) : (
                          "?"
                        )}
                      </span>

                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="memory-controls">

          <button
            className="memory-control-button restart-button"
            onClick={
              startGame
            }
          >
            ↻ RESTART
          </button>

          <button
            className="memory-control-button hint-button"
            onClick={
              useHint
            }
            disabled={
              hintCard.length >
              0
            }
          >
            ◈ HINT{" "}
            <small>
              -
              {
                selectedDifficulty?.hint_penalty
              }
            </small>
          </button>

        </div>
      </main>

      {/* =====================================================
          POWER POPUP
      ===================================================== */}

      {powerPopup && (
        <div className="memory-power-popup-overlay">

          <div className="memory-power-popup">

            <div className="memory-power-popup-icon">
              {
                powerPopup.icon
              }
            </div>

            <span className="memory-power-popup-title">
              {
                powerPopup.title
              }
            </span>

            <h2>
              {
                powerPopup.message
              }
            </h2>

            <p>
              {
                powerPopup.description
              }
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          WIN POPUP
      ===================================================== */}

      {gameWon && (
        <div className="memory-result-overlay">

          <div className="memory-result-panel">

            <div className="result-icon">
              ✦
            </div>

            <span className="result-label">
              MEMORY GRID CLEARED
            </span>

            <h2>
              YOU WON
            </h2>

            <div className="result-stats">

              <div>
                <span>
                  FINAL SCORE
                </span>

                <strong>
                  {score}
                </strong>
              </div>

              <div>
                <span>
                  TOTAL MOVES
                </span>

                <strong>
                  {moves}
                </strong>
              </div>

            </div>

            {/* =================================================
                LEVEL PAGE BUTTON
            ================================================= */}

            <Link
              to="/memory-match/levels"
              className="result-restart-button"
            >
              LEVEL PAGE
            </Link>

          </div>

        </div>
      )}

      {/* =====================================================
          TIME UP POPUP
      ===================================================== */}

      {!gameStarted &&
        !gameWon &&
        timeLeft === 0 && (
          <div className="memory-result-overlay">

            <div className="memory-result-panel time-up-panel">

              <div className="result-icon">
                !
              </div>

              <span className="result-label">
                SYSTEM TIMEOUT
              </span>

              <h2>
                TIME'S UP
              </h2>

              <div className="result-stats">

                <div>
                  <span>
                    FINAL SCORE
                  </span>

                  <strong>
                    {score}
                  </strong>
                </div>

                <div>
                  <span>
                    TOTAL MOVES
                  </span>

                  <strong>
                    {moves}
                  </strong>
                </div>

              </div>

              <button
                className="result-restart-button"
                onClick={
                  startGame
                }
              >
                TRY AGAIN
              </button>

            </div>

          </div>
        )}

    </div>
  );
}

export default MemoryMatch;