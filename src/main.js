import "./style.css";

const board = document.querySelector(".board");
const gameSection = document.querySelector(".game-section");
const startBtn = document.querySelector(".btn-start");
const loadBtns = document.querySelectorAll(".btn-load");
const newGameBtn = document.querySelector(".btn-new-game");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const gameOverAlert = document.querySelector(".game-over-alert");
const okBtn = document.querySelector(".btn-ok");
const restartBtn = document.querySelector(".btn-restart");
const pauseBtn = document.querySelector(".btn-pause");
const saveBtn = document.querySelector(".btn-save");
const highScoreELement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

const blockHeight = 50;
const blockWidth = 50;
const baseMoveDelay = 300;
const boostMoveDelay = 140;
const foodColors = ["#ff5e7e", "#ffd166", "#06d6a0", "#4cc9f0", "#a78bfa", "#f97316"];
const storageKeys = {
  highScore: "snakeGame.highScore",
  savedGame: "snakeGame.savedState",
};

const blocks = [];
let cols = 0;
let rows = 0;

let highScore = Number(localStorage.getItem(storageKeys.highScore) || 0);
let score = 0;
let elapsedSeconds = 0;
let direction = "down";
let intervalId = null;
let timerIntervalId = null;
let isPaused = false;
let isGameActive = false;
let isBoosted = false;
let snake = [
  {
    x: 1,
    y: 3,
  },
];
let food = {
  x: 0,
  y: 0,
};
let foodColor = foodColors[0];
let isFedHead = false;

const hasSavedGame = () => Boolean(localStorage.getItem(storageKeys.savedGame));
const isSmallScreen = () => window.matchMedia("(max-width: 640px)").matches;

const syncHighScore = () => {
  highScoreELement.innerText = highScore;
  localStorage.setItem(storageKeys.highScore, highScore.toString());
};

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const updateTimeDisplay = () => {
  timeElement.innerText = formatTime(elapsedSeconds);
};

const updateScoreDisplay = () => {
  scoreElement.innerText = score;
};

const updateLoadButtons = () => {
  const disabled = !hasSavedGame();

  loadBtns.forEach((button) => {
    button.disabled = disabled;
  });
};

const updatePauseButton = () => {
  pauseBtn.innerText = isPaused ? "Resume" : "Pause";
  pauseBtn.disabled = !isGameActive;
};

const updateSaveButton = () => {
  saveBtn.disabled = !isGameActive;
};

const updateActionButtons = () => {
  updatePauseButton();
  updateSaveButton();
  updateLoadButtons();
};

const buildBoard = () => {
  const boardRect = board.getBoundingClientRect();
  cols = Math.max(6, Math.floor(boardRect.width / blockWidth));
  rows = Math.max(6, Math.floor(boardRect.height / blockHeight));
  board.innerHTML = "";
  blocks.length = 0;
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  board.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const block = document.createElement("div");
      block.classList.add("block");
      board.appendChild(block);
      blocks[`${row}-${col}`] = block;
    }
  }
};

const showGameSection = () => {
  gameSection.classList.remove("is-hidden");
};

const hideGameSection = () => {
  if (!isSmallScreen()) {
    return;
  }

  gameSection.classList.add("is-hidden");
};

const hideGameOverAlert = () => {
  gameOverAlert.style.display = "none";
};

const showGameOverAlert = () => {
  gameOverAlert.style.display = "flex";
};

const clearSnakeClasses = () => {
  snake.forEach((segment) => {
    const block = blocks[`${segment.x}-${segment.y}`];
    if (!block) {
      return;
    }

    block.classList.remove("fill", "snake-head", "snake-head-fed");
    block.style.removeProperty("--snake-glow");
  });
};

const clearFoodBlock = () => {
  const foodBlock = blocks[`${food.x}-${food.y}`];

  if (!foodBlock) {
    return;
  }

  foodBlock.classList.remove("food");
  foodBlock.style.removeProperty("--food-color");
};

const paintFood = () => {
  const foodBlock = blocks[`${food.x}-${food.y}`];

  if (!foodBlock) {
    return;
  }

  foodBlock.classList.add("food");
  foodBlock.style.setProperty("--food-color", foodColor);
};

const paintSnake = () => {
  snake.forEach((segment, index) => {
    const block = blocks[`${segment.x}-${segment.y}`];

    if (!block) {
      return;
    }

    block.classList.add("fill");

    if (index === 0) {
      block.classList.add(isFedHead ? "snake-head-fed" : "snake-head");
      block.style.removeProperty("--snake-glow");
      return;
    }

    const hue = (index * 42 + Date.now() / 12) % 360;
    block.style.setProperty("--snake-glow", `hsla(${hue}, 100%, 70%, 0.95)`);
  });
};

const renderBoardState = () => {
  clearSnakeClasses();
  clearFoodBlock();
  paintFood();
  paintSnake();
};

const getRandomFoodPosition = () => {
  let nextFood = {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols),
  };

  while (snake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y)) {
    nextFood = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
  }

  return nextFood;
};

const getNextFoodColor = () => {
  const availableColors = foodColors.filter((color) => color !== foodColor);
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

const stopTimer = () => {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
};

const startTimer = () => {
  stopTimer();
  timerIntervalId = setInterval(() => {
    elapsedSeconds += 1;
    updateTimeDisplay();
  }, 1000);
};

const resetTimer = () => {
  elapsedSeconds = 0;
  updateTimeDisplay();
};

const stopGameLoop = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const getCurrentMoveDelay = () => (isBoosted ? boostMoveDelay : baseMoveDelay);

const startGameLoop = () => {
  stopGameLoop();
  intervalId = setInterval(() => {
    stepGame();
  }, getCurrentMoveDelay());
};

const refreshGameLoop = () => {
  if (!isGameActive || isPaused) {
    return;
  }

  startGameLoop();
};

const hideModal = () => {
  modal.style.display = "none";
};

const showStartScreen = () => {
  hideGameOverAlert();
  modal.style.display = "flex";
  startGameModal.style.display = "flex";
  gameOverModal.style.display = "none";
};

const showGameOverScreen = () => {
  hideGameOverAlert();
  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
};

const setGameStoppedState = () => {
  stopGameLoop();
  stopTimer();
  isPaused = false;
  isGameActive = false;
  isBoosted = false;
  updateActionButtons();
};

const pauseGame = () => {
  if (!isGameActive || isPaused) {
    return;
  }

  isPaused = true;
  stopGameLoop();
  stopTimer();
  updateActionButtons();
};

const resumeGame = () => {
  if (!isPaused) {
    return;
  }

  isPaused = false;
  isGameActive = true;
  startTimer();
  startGameLoop();
  updateActionButtons();
};

const saveGame = () => {
  if (!isGameActive) {
    return;
  }

  const savedState = {
    snake,
    food,
    foodColor,
    direction,
    score,
    elapsedSeconds,
    highScore,
  };

  localStorage.setItem(storageKeys.savedGame, JSON.stringify(savedState));
  updateLoadButtons();
};

const resetBoard = () => {
  clearSnakeClasses();
  clearFoodBlock();
};

const isInsideBoard = (position) =>
  position.x >= 0 &&
  position.x < rows &&
  position.y >= 0 &&
  position.y < cols;

const applyGameState = (state) => {
  setGameStoppedState();
  resetBoard();

  const savedSnake = Array.isArray(state.snake) ? state.snake : [];
  const hasInvalidSegments = savedSnake.some((segment) => !isInsideBoard(segment));
  const hasInvalidFood = !state.food || !isInsideBoard(state.food);

  if (!savedSnake.length || hasInvalidSegments || hasInvalidFood) {
    startFreshGame();
    return;
  }

  snake = savedSnake.map((segment) => ({
    x: segment.x,
    y: segment.y,
  }));
  food = {
    x: state.food.x,
    y: state.food.y,
  };
  foodColor = state.foodColor;
  direction = state.direction || "down";
  score = state.score ?? 0;
  elapsedSeconds = state.elapsedSeconds ?? 0;
  highScore = Number(state.highScore ?? highScore ?? 0);
  isFedHead = false;
  isPaused = false;
  isBoosted = false;
  isGameActive = true;

  showGameSection();
  hideGameOverAlert();
  syncHighScore();
  updateScoreDisplay();
  updateTimeDisplay();
  renderBoardState();
  hideModal();
  startTimer();
  startGameLoop();
  updateActionButtons();
};

const loadSavedGame = () => {
  const savedState = localStorage.getItem(storageKeys.savedGame);

  if (!savedState) {
    return;
  }

  try {
    const parsedState = JSON.parse(savedState);
    applyGameState(parsedState);
  } catch (error) {
    localStorage.removeItem(storageKeys.savedGame);
    updateLoadButtons();
  }
};

const startFreshGame = ({ resetHighScore = false } = {}) => {
  setGameStoppedState();
  resetBoard();

  snake = [
    {
      x: 1,
      y: 3,
    },
  ];
  food = getRandomFoodPosition();
  foodColor = foodColors[Math.floor(Math.random() * foodColors.length)];
  direction = "down";
  score = 0;
  isFedHead = false;

  if (resetHighScore) {
    highScore = 0;
    syncHighScore();
  }

  showGameSection();
  hideGameOverAlert();
  resetTimer();
  updateScoreDisplay();
  renderBoardState();
  hideModal();
  isGameActive = true;
  startTimer();
  startGameLoop();
  updateActionButtons();
};

function stepGame() {
  const head = snake[0];
  const newHead = {
    x: head.x,
    y: head.y,
  };

  if (direction === "right") {
    newHead.y += 1;
  }
  if (direction === "left") {
    newHead.y -= 1;
  }
  if (direction === "up") {
    newHead.x -= 1;
  }
  if (direction === "down") {
    newHead.x += 1;
  }

  const hitWall =
    newHead.x < 0 ||
    newHead.x >= rows ||
    newHead.y < 0 ||
    newHead.y >= cols;
  const willEatFood = newHead.x === food.x && newHead.y === food.y;
  const snakeBody = willEatFood ? snake : snake.slice(0, -1);
  const hitSelf = snakeBody.some(
    (segment) => segment.x === newHead.x && segment.y === newHead.y
  );

  if (hitWall || hitSelf) {
    setGameStoppedState();

    if (isSmallScreen()) {
      hideGameSection();
      hideModal();
      showGameOverAlert();
      return;
    }

    showGameOverScreen();
    return;
  }

  isFedHead = false;

  if (willEatFood) {
    clearFoodBlock();
    snake.push(newHead);
    score += 10;
    updateScoreDisplay();
    isFedHead = true;

    if (score > highScore) {
      highScore = score;
      syncHighScore();
    }

    food = getRandomFoodPosition();
    foodColor = getNextFoodColor();
  }

  clearSnakeClasses();
  snake.unshift(newHead);
  const tail = snake.pop();
  const tailBlock = blocks[`${tail.x}-${tail.y}`];
  tailBlock.classList.remove("fill", "snake-head", "snake-head-fed");
  tailBlock.style.removeProperty("--snake-glow");

  paintFood();
  paintSnake();
}

addEventListener("keydown", (event) => {
  const isArrowKey = event.key.startsWith("Arrow");

  if (isArrowKey) {
    event.preventDefault();

    if (event.key === "ArrowRight") {
      direction = "right";
    }
    if (event.key === "ArrowLeft") {
      direction = "left";
    }
    if (event.key === "ArrowUp") {
      direction = "up";
    }
    if (event.key === "ArrowDown") {
      direction = "down";
    }
  }

  if (event.key === "Shift" || (isArrowKey && event.shiftKey)) {
    if (!isBoosted) {
      isBoosted = true;
      refreshGameLoop();
    }
  }
});

addEventListener("keyup", (event) => {
  if (event.key !== "Shift") {
    return;
  }

  if (!isBoosted) {
    return;
  }

  isBoosted = false;
  refreshGameLoop();
});

window.addEventListener("resize", () => {
  if (isGameActive || isPaused) {
    return;
  }

  buildBoard();
  resetBoard();
  food = getRandomFoodPosition();
  foodColor = foodColors[Math.floor(Math.random() * foodColors.length)];
  renderBoardState();
});

startBtn.addEventListener("click", () => {
  startFreshGame();
});

newGameBtn.addEventListener("click", () => {
  startFreshGame({ resetHighScore: true });
});

loadBtns.forEach((button) => {
  button.addEventListener("click", loadSavedGame);
});

restartBtn.addEventListener("click", () => {
  startFreshGame();
});

pauseBtn.addEventListener("click", () => {
  if (isPaused) {
    resumeGame();
    return;
  }

  pauseGame();
});

saveBtn.addEventListener("click", saveGame);
okBtn.addEventListener("click", () => {
  showGameSection();
  showGameOverScreen();
});

buildBoard();
syncHighScore();
resetTimer();
updateScoreDisplay();
food = getRandomFoodPosition();
foodColor = foodColors[Math.floor(Math.random() * foodColors.length)];
renderBoardState();
showStartScreen();
hideGameOverAlert();
showGameSection();
updateActionButtons();
