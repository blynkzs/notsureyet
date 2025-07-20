const board = Array.from({ length: 8 }, () => Array(8).fill(""));
let selectedPiece = null;
let isDragging = false;
let draggingPiece = null;
let offsetX = 0, offsetY = 0;
let moveLog = [];
let turn = "white";

// Setup starting position
function initBoard() {
  const pieces = {
    R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙",
    r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟"
  };

  const whiteBack = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  const blackBack = ["r", "n", "b", "q", "k", "b", "n", "r"];

  for (let i = 0; i < 8; i++) {
    board[0][i] = blackBack[i];
    board[1][i] = "p";
    board[6][i] = "P";
    board[7][i] = whiteBack[i];
  }
}

function renderBoard() {
  const chessboard = document.getElementById("chessboard");
  chessboard.innerHTML = "";

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.x = x;
      square.dataset.y = y;

      const isDark = (x + y) % 2 === 1;
      square.style.backgroundColor = isDark ? "#444" : "#ddd";
      square.style.color = board[y][x] === board[y][x].toLowerCase() ? "black" : "white";
      square.textContent = board[y][x] ? getPieceSymbol(board[y][x]) : "";

      square.addEventListener("mousedown", onMouseDown);
      square.addEventListener("mouseup", onMouseUp);

      chessboard.appendChild(square);
    }
  }
}

function getPieceSymbol(letter) {
  const map = {
    R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙",
    r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟"
  };
  return map[letter] || "";
}

function onMouseDown(e) {
  const x = +this.dataset.x;
  const y = +this.dataset.y;
  const piece = board[y][x];
  if (!piece) return;

  const isWhite = piece === piece.toUpperCase();
  if ((turn === "white" && !isWhite) || (turn === "black" && isWhite)) return;

  selectedPiece = { piece, x, y };

  draggingPiece = document.createElement("div");
  draggingPiece.classList.add("dragging-piece");
  draggingPiece.textContent = getPieceSymbol(piece);
  document.body.appendChild(draggingPiece);
  isDragging = true;
  updateDraggingPiece(e);
}

function onMouseUp(e) {
  if (!isDragging || !selectedPiece) return;

  const x = +this.dataset.x;
  const y = +this.dataset.y;

  const fromX = selectedPiece.x;
  const fromY = selectedPiece.y;

  if ((fromX !== x || fromY !== y) && isLegalMove(selectedPiece, x, y)) {
    const captured = board[y][x];
    board[y][x] = selectedPiece.piece;
    board[fromY][fromX] = "";

    moveLog.push({
      piece: selectedPiece.piece,
      from: { x: fromX, y: fromY },
      to: { x, y },
      captured
    });

    logMove(selectedPiece.piece, fromX, fromY, x, y);
    turn = turn === "white" ? "black" : "white";
  }

  selectedPiece = null;
  isDragging = false;
  if (draggingPiece) draggingPiece.remove();
  draggingPiece = null;

  renderBoard();
}

function isLegalMove(pieceObj, x, y) {
  const target = board[y][x];
  const isWhite = pieceObj.piece === pieceObj.piece.toUpperCase();
  const targetIsWhite = target && target === target.toUpperCase();

  if (target && isWhite === targetIsWhite) return false;

  // Simplified legality: allow any move unless blocked by own piece
  return true;
}

function updateDraggingPiece(e) {
  if (draggingPiece) {
    draggingPiece.style.left = e.pageX - offsetX + "px";
    draggingPiece.style.top = e.pageY - offsetY + "px";
  }
}

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    updateDraggingPiece(e);
  }
});

document.addEventListener("mouseup", () => {
  if (isDragging && draggingPiece) {
    draggingPiece.remove();
    draggingPiece = null;
    isDragging = false;
  }
});

function logMove(piece, fromX, fromY, toX, toY) {
  const file = (x) => String.fromCharCode(97 + x);
  const rank = (y) => 8 - y;
  const moveStr = `${piece} ${file(fromX)}${rank(fromY)} → ${file(toX)}${rank(toY)}\n`;

  const logEl = document.getElementById("moveLog");
  logEl.textContent += moveStr;
}

document.getElementById("undoBtn").addEventListener("click", () => {
  const last = moveLog.pop();
  if (!last) return;

  board[last.from.y][last.from.x] = last.piece;
  board[last.to.y][last.to.x] = last.captured || "";
  turn = turn === "white" ? "black" : "white";

  const logEl = document.getElementById("moveLog");
  const lines = logEl.textContent.trim().split("\n");
  lines.pop();
  logEl.textContent = lines.join("\n") + "\n";

  renderBoard();
});

initBoard();
renderBoard();
