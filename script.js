// script.js
const boardElement = document.getElementById("chessboard");
const moveLogList = document.getElementById("move-log-list");
const whiteCaptured = document.getElementById("white-captured");
const blackCaptured = document.getElementById("black-captured");

const boardSize = 8;
const board = [];
let selectedPiece = null;
let turn = "white";
let moveLog = [];

const initialSetup = {
  0: ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  1: Array(8).fill("♟"),
  6: Array(8).fill("♙"),
  7: ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
};

function createBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const square = document.createElement("div");
      square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("click", onSquareClick);

      const piece = initialSetup[row]?.[col] || "";
      square.textContent = piece;
      board.push({ row, col, piece });

      boardElement.appendChild(square);
    }
  }
}

function onSquareClick(e) {
  const square = e.currentTarget;
  const row = +square.dataset.row;
  const col = +square.dataset.col;
  const index = row * boardSize + col;
  const clickedPiece = board[index].piece;

  if (selectedPiece) {
    const from = selectedPiece.index;
    const to = index;
    if (from === to) {
      selectedPiece = null;
      return;
    }

    const targetPiece = board[to].piece;
    if (targetPiece) {
      if (isWhite(targetPiece) === isWhite(selectedPiece.piece)) {
        selectedPiece = { index: to, piece: targetPiece };
        return;
      }
      capturePiece(targetPiece);
    }

    board[to].piece = selectedPiece.piece;
    board[from].piece = "";
    selectedPiece = null;
    turn = turn === "white" ? "black" : "white";
    updateBoard();
    logMove(row, col);
  } else if (clickedPiece && isPlayersTurn(clickedPiece)) {
    selectedPiece = { index, piece: clickedPiece };
  }
}

function updateBoard() {
  document.querySelectorAll(".square").forEach((sq, i) => {
    sq.textContent = board[i].piece;
  });
}

function logMove(row, col) {
  const move = `${turn === "white" ? "Black" : "White"} moved to ${String.fromCharCode(
    97 + col
  )}${8 - row}`;
  moveLog.push(move);
  const li = document.createElement("li");
  li.textContent = move;
  moveLogList.appendChild(li);
  moveLogList.scrollTop = moveLogList.scrollHeight;
}

function capturePiece(piece) {
  const target = isWhite(piece) ? whiteCaptured : blackCaptured;
  const span = document.createElement("span");
  span.textContent = piece;
  target.appendChild(span);
}

function isWhite(piece) {
  return /[♔♕♖♗♘♙]/.test(piece);
}

function isPlayersTurn(piece) {
  return (turn === "white" && isWhite(piece)) || (turn === "black" && !isWhite(piece));
}

createBoard();
