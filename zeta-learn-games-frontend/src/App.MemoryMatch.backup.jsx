import React, { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function MemoryMatch() {
  const [settings, setSettings] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [cards, setCards] = useState([]);
  const [cardsForGame, setCardsForGame] = useState([]);

  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [hintCard, setHintCard] = useState(null);
  const [specialCard, setSpecialCard] = useState(null);

  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings
  useEffect(() => {
    fetch(`${API_BASE}/api/memory-match/settings/`)
      .then((response) => response.json())
      .then((data) => {
        setSettings(data);

        if (data.length > 0) {
          setSelectedDifficulty(data[0]);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading game settings:", error);
        setLoading(false);
      });
  }, []);

  // Load cards
  useEffect(() => {
    fetch(`${API_BASE}/api/memory-match/cards/`)
      .then((response) => response.json())
      .then((data) => {
        setCards(data);
      })
      .catch((error) => {
        console.error("Error loading memory cards:", error);
      });
  }, []);

  // Start automatically
  useEffect(() => {
    if (selectedDifficulty && cards.length > 0) {
      startGame();
    }
  }, [selectedDifficulty, cards]);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    if (timeLeft <= 0) {
      setGameOver(true);
      setGameStarted(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft]);

  // Check cards after two are flipped
  useEffect(() => {
    if (flippedCards.length !== 2) return;

    const first = flippedCards[0];
    const second = flippedCards[1];

    setMoves((previous) => previous + 1);

    if (first.id === second.id) {
      setMatchedCards((previous) => [
        ...previous,
        first.uniqueId,
        second.uniqueId,
      ]);

      setScore(
        (previous) =>
          previous + selectedDifficulty.points_per_pair
      );

      setFlippedCards([]);
    } else {
      setScore((previous) =>
        Math.max(
          0,
          previous -
            selectedDifficulty.wrong_move_penalty
        )
      );

      setTimeout(() => {
        setFlippedCards([]);
      }, 800);
    }
  }, [flippedCards]);

  // Check win
useEffect(() => {
  if (!gameStarted || cardsForGame.length === 0) return;

  const isSpecialBoard =
    cardsForGame.some((card) => card.special);

  const normalCardsMatched =
    matchedCards.length;

  const allNormalCardsMatched =
    normalCardsMatched ===
    cardsForGame.filter((card) => !card.special).length;

  const specialCardCompleted =
    !isSpecialBoard || specialCard === "used";

  if (
    allNormalCardsMatched &&
    specialCardCompleted
  ) {
    setGameStarted(false);
    setGameOver(true);
  }
}, [
  matchedCards,
  cardsForGame,
  specialCard,
  gameStarted,
]);

  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  // Start / restart game
  function startGame() {
    if (!selectedDifficulty || cards.length === 0) return;

    const totalCards =
      selectedDifficulty.grid_size *
      selectedDifficulty.grid_size;

    const pairCount = Math.floor(totalCards / 2);

    const selectedCards = shuffle(cards).slice(
      0,
      pairCount
    );

    const pairedCards = selectedCards.flatMap(
      (card) => [
        {
          ...card,
          uniqueId: `${card.id}-a`,
        },
        {
          ...card,
          uniqueId: `${card.id}-b`,
        },
      ]
    );

    // ⭐ Add special card for odd grids (5x5 and 7x7)
if (totalCards % 2 !== 0) {
  pairedCards.push({
    id: "special",
    uniqueId: "special",
    name: "⭐",
    category: "SPECIAL",
    special: true,
  });
}

    setCardsForGame(shuffle(pairedCards));

    setFlippedCards([]);
    setMatchedCards([]);
    setSpecialCard(null);
    setHintCard(null);

    setScore(0);
    setMoves(0);

    setTimeLeft(
      selectedDifficulty.time_limit_seconds
    );

    setGameOver(false);
    setGameStarted(true);
  }

  // Card click
  function handleCardClick(card) {
  if (!gameStarted) return;

  if (flippedCards.length >= 2) return;

  if (flippedCards.some((item) => item.uniqueId === card.uniqueId)) {
    return;
  }

  if (matchedCards.includes(card.uniqueId)) {
    return;
  }

  // ⭐ SPECIAL CARD
if (card.special) {
  // ⭐ Special card can only be used once
  if (specialCard === "used") return;

  // Cannot use special card when 2 cards are already open
  if (flippedCards.length >= 2) return;

  // Mark special card as used
  setSpecialCard("used");

  // ⭐ +50 bonus
  setScore((previous) => previous + 50);

  // CASE 1: One card is already open
  if (flippedCards.length === 1) {
    const openedCard = flippedCards[0];

    const matchingCard = cardsForGame.find(
      (item) =>
        item.id === openedCard.id &&
        item.uniqueId !== openedCard.uniqueId &&
        !matchedCards.includes(item.uniqueId) &&
        !item.special
    );

    if (matchingCard) {
      // Keep the opened card and reveal its matching card
      setFlippedCards([
        openedCard,
        matchingCard,
      ]);

      setTimeout(() => {
        // Match both cards
        setMatchedCards((previous) => [
          ...previous,
          openedCard.uniqueId,
          matchingCard.uniqueId,
        ]);

        // ⭐ Special + normal pair
        setScore((previous) => previous + 100);

        // Close the normal pair
        setFlippedCards([]);
      }, 1500);
    }

    return;
  }

  // CASE 2: No card is open
  const availableCards = cardsForGame.filter(
    (item) =>
      !item.special &&
      !matchedCards.includes(item.uniqueId)
  );

  if (availableCards.length < 2) return;

  const randomCard =
    availableCards[
      Math.floor(
        Math.random() * availableCards.length
      )
    ];

  const matchingCard = availableCards.find(
    (item) =>
      item.id === randomCard.id &&
      item.uniqueId !== randomCard.uniqueId
  );

  if (!matchingCard) return;

  // Reveal one complete pair
  setFlippedCards([
    randomCard,
    matchingCard,
  ]);

  setTimeout(() => {
    // Match the revealed pair
    setMatchedCards((previous) => [
      ...previous,
      randomCard.uniqueId,
      matchingCard.uniqueId,
    ]);

    // ⭐ Special + normal pair
    setScore((previous) => previous + 100);

    // Close the revealed pair
    setFlippedCards([]);
  }, 1500);

  return;
}

  // NORMAL CARD
  setFlippedCards((previous) => [
    ...previous,
    card,
  ]);
}

  // 💡 Hint
  function useHint() {
  if (!gameStarted) return;

  if (hintCard !== null) return;

  // CASE 1: One card is already open
  if (flippedCards.length === 1) {
    const openedCard = flippedCards[0];

    const matchingCard = cardsForGame.find(
      (card) =>
        card.id === openedCard.id &&
        card.uniqueId !== openedCard.uniqueId &&
        !matchedCards.includes(card.uniqueId)
    );

    if (!matchingCard) return;

    // Deduct hint penalty
    setScore((previous) =>
      Math.max(
        0,
        previous - selectedDifficulty.hint_penalty
      )
    );

    // Reveal the matching card
    setHintCard(matchingCard.uniqueId);

    // Hide after 1.5 seconds
    setTimeout(() => {
      setHintCard(null);
    }, 1500);

    return;
  }

  // CASE 2: No card is open
  if (flippedCards.length === 0) {
    const availableCards = cardsForGame.filter(
      (card) =>
        !card.special &&
        !matchedCards.includes(card.uniqueId)
    );

    if (availableCards.length === 0) return;

    const randomCard =
      availableCards[
        Math.floor(
          Math.random() * availableCards.length
        )
      ];

    const matchingCard = availableCards.find(
      (card) =>
        card.id === randomCard.id &&
        card.uniqueId !== randomCard.uniqueId
    );

    if (!matchingCard) return;

    // Deduct hint penalty
    setScore((previous) =>
      Math.max(
        0,
        previous - selectedDifficulty.hint_penalty
      )
    );

    // Reveal both cards
    setHintCard([
      randomCard.uniqueId,
      matchingCard.uniqueId,
    ]);

    // Hide after 1.5 seconds
    setTimeout(() => {
      setHintCard(null);
    }, 1500);
  }
}

  if (loading) {
    return <h2>Loading Memory Match...</h2>;
  }

  return (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
      }}
    >
      <h1>Cyber Memory Match</h1>

      <p>
        Choose your difficulty and start matching!
      </p>

      {/* Difficulty */}
      <div
        style={{
          marginBottom: "20px",
        }}
      >
        {settings.map((setting) => (
          <button
            key={setting.difficulty}
            onClick={() =>
              setSelectedDifficulty(setting)
            }
            style={{
              marginRight: "10px",
              padding: "10px 15px",
              cursor: "pointer",
            }}
          >
            {setting.difficulty} -{" "}
            {setting.grid_size}x
            {setting.grid_size}
          </button>
        ))}
      </div>

      {selectedDifficulty && (
        <>
          <h2>Game Information</h2>

          <p>
            Difficulty:{" "}
            {selectedDifficulty.difficulty}
          </p>

          <p>
            Grid: {selectedDifficulty.grid_size}x
            {selectedDifficulty.grid_size}
          </p>

          <p>
            Time: {timeLeft} seconds
          </p>

          <p>
            Points per pair:{" "}
            {selectedDifficulty.points_per_pair}
          </p>

          <p>
            Wrong move penalty: -
            {selectedDifficulty.wrong_move_penalty}
          </p>

          <p>
            Hint penalty: -
            {selectedDifficulty.hint_penalty}
          </p>

          <p>Score: {score}</p>

          <p>Moves: {moves}</p>

          {/* Buttons */}
          <div
            style={{
              margin: "20px 0",
            }}
          >
            <button
              onClick={startGame}
              style={{
                padding: "12px 20px",
                margin: "5px",
                cursor: "pointer",
              }}
            >
              Restart Game
            </button>

            <button
              onClick={useHint}
              disabled={
                !gameStarted ||
                hintCard !== null
              }
              style={{
                padding: "12px 20px",
                margin: "5px",
                cursor:
                  !gameStarted ||
                  hintCard !== null
                    ? "not-allowed"
                    : "pointer",
                backgroundColor: "#f59e0b",
                color: "#000000",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              Hint (-{selectedDifficulty.hint_penalty})
            </button>
          </div>

          <h2>Memory Match Board</h2>

          {/* Board */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${selectedDifficulty.grid_size}, 1fr)`,
              gap: "12px",
              width: "100%",
              maxWidth: "600px",
              margin: "20px auto",
            }}
          >
            {cardsForGame.map((card) => {
              const isFlipped =
                flippedCards.some(
                  (item) =>
                    item.uniqueId ===
                    card.uniqueId
                );

              const isMatched =
                matchedCards.includes(
                  card.uniqueId
                );

                const isSpecialUsed =
  card.special && specialCard === "used";

              const isHinted =
  Array.isArray(hintCard)
    ? hintCard.includes(card.uniqueId)
    : hintCard === card.uniqueId;

              return (
                <button
                  key={card.uniqueId}
                  onClick={() =>
                    handleCardClick(card)
                  }
                  disabled={isMatched || (card.special && specialCard === "used")}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: "12px",
                    border:
                      "2px solid #334155",
                    backgroundColor:
                      isFlipped ||
                      isMatched ||
                      isHinted
                        ? "#1e293b"
                        : "#0f172a",
                    color: "#ffffff",
                    fontSize: "20px",
                    fontWeight: "600",
                    cursor:
                      isMatched
                        ? "default"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                >
                  {isFlipped ||
                  isMatched ||
                  isHinted ||
                  isSpecialUsed
                    ? card.name
                    : "?"}
                </button>
              );
            })}
          </div>

          {/* Game over */}
          {gameOver && (
            <div
              style={{
                marginTop: "30px",
              }}
            >
              <h2>
                {matchedCards.length ===
                cardsForGame.length - 1
                  ? "You Won!"
                  : "Game Over!"}
              </h2>

              <p>
                Final Score: {score}
              </p>

              <p>
                Total Moves: {moves}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MemoryMatch;