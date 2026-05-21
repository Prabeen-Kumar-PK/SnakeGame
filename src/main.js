import "./style.css";

const board = document.querySelector(".board");
const startBtn = document.querySelector(".btn-start");
const modal = document.querySelector(".modal");


const blockHeight = 50;
const blockWidth = 50;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

const blocks = [];

let direction;

let intervalId = null;

const snake = [
  {
    x: 1,
    y: 3,
  }
];

let food = {
  x: Math.floor(Math.random() * rows),
  y: Math.floor(Math.random() * cols),
};




for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    // block.innerText = `${row}-${col}`;
    blocks[`${row}-${col}`] = block;
  }
}

addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    direction = "right";
  }
  if (e.key === "ArrowLeft") {
    direction = "left";
  }
  if (e.key === "ArrowUp") {
    direction = "up";
  }
  if (e.key === "ArrowDown") {
    direction = "down";
  }
});

const render = () => {
  const head = snake[0];
  blocks[`${food.x}-${food.y}`] .classList.add("food");
  const newHead = {
    x: head.x,
    y: head.y,
  };
  if (direction === "right") {
    newHead.y++;
  }
  if (direction === "left") {
    newHead.y--;
  }
  if (direction === "up") {
    newHead.x--;
  }
  if (direction === "down") {
    newHead.x++;
  }

  if (
    newHead.x < 0 ||
    newHead.x >= rows ||
    newHead.y < 0 ||
    newHead.y >= cols
  ) {
    alert("Game Over");
    clearInterval(intervalId);
    return;
  }

if (newHead.x === food.x && newHead.y === food.y) {
    blocks[`${food.x}-${food.y}`] .classList.remove("food");
    // delete blocks[`${food.x}-${food.y}`];
    snake.push(newHead);
    food = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };

     blocks[`${food.x}-${food.y}`] .classList.add("food");


}

  snake.unshift(newHead);
  const tail = snake.pop();
  blocks[`${tail.x}-${tail.y}`].classList.remove("fill");
  snake.forEach((segment) => {
    blocks[`${segment.x}-${segment.y}`].classList.add("fill");
  });
};

render();

startBtn.addEventListener("click", () => {
  modal.style.display = "none";
  intervalId = setInterval(() => {
    render();
  }, 500);
});


// intervalId = setInterval(() => {
//   render();
// }, 500);

