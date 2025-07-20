const unicodePieces = {
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚"
};

let board = [];
let selectedPiece = null; // {x, y, piece}
let legalMoves = [];
let turn = 'white';

let history = [];

let draggingPieceEl = null;
let offsetX = 0, offsetY = 0;

const startPosition = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

function isWhitePiece(piece) {
  return piece === piece.toUpperCase() && piece !== "";
}

function toAlgebraic(x, y) {
  const files = "abcdefgh";
  return files[x] + (8 - y);
}

function pieceLetter(piece) {
  const p = piece.toUpperCase();
  return p === 'P' ? '' : p;
}

function renderBoard() {
  const boardEl = document.getElementById("chessboard");
  boardEl.innerHTML = "";
  boardEl.style.display = "grid";
  boardEl.style.gridTemplateColumns = "repeat(8, 60px)";
  boardEl.style.gridTemplateRows = "repeat(8, 60px)";
  boardEl.style.gap = "1px";
  boardEl.style.backgroundColor = "#333";

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const square = document.createElement("div");
      square.className = `square ${(x + y) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.x = x;
      square.dataset.y = y;
      square.style.width = "60px";
      square.style.height = "60px";
      square.style.lineHeight = "60px";
      square.style.fontSize = "40px";
      square.style.textAlign = "center";
      square.style.userSelect = "none";
      square.style.cursor = "pointer";
      square.style.position = "relative";

      const piece = board[y][x];

      // Hide the piece in the original square when dragging to avoid duplicates
      if (
        selectedPiece &&
        draggingPieceEl &&
        selectedPiece.x === x &&
        selectedPiece.y === y
      ) {
        // Don't render piece here while dragging
      } else if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.className = "piece";
        pieceEl.textContent = unicodePieces[piece];
        pieceEl.dataset.piece = piece;
        pieceEl.dataset.x = x;
        pieceEl.dataset.y = y;
        pieceEl.style.userSelect = "none";
        square.appendChild(pieceEl);
      }

      boardEl.appendChild(square);
    }
  }

  clearHighlights();

  // Highlight legal moves with dots
  legalMoves.forEach(([mx, my]) => {
    const square = document.querySelector(`.square[data-x='${mx}'][data-y='${my}']`);
    if (square) {
      const dot = document.createElement("div");
      dot.className = "highlight";
      square.appendChild(dot);
    }
  });
}

function getLegalMoves(x, y, piece) {
  const moves = [];
  const isWhite = isWhitePiece(piece);

  const directions = {
    N: [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]],
    B: [[1,1], [-1,-1], [-1,1], [1,-1]],
    R: [[1,0], [-1,0], [0,1], [0,-1]],
    Q: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [-1,1], [1,-1]],
    K: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [-1,1], [1,-1]]
  };

  function pushIfValid(nx, ny) {
    if (nx >= 0 && ny >= 0 && nx < 8 && ny < 8) {
      const target = board[ny][nx];
      if (!target || (isWhite !== isWhitePiece(target))) {
        moves.push([nx, ny]);
        return !target; // continue sliding only if empty
      }
    }
    return false;
  }

  if (piece.toUpperCase() === 'P') {
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    // Forward 1
    if (y + dir >= 0 && y + dir < 8 && !board[y + dir][x]) moves.push([x, y + dir]);
    // Forward 2 from start position
    if (y === startRow && !board[y + dir][x] && !board[y + 2*dir][x]) moves.push([x, y + 2*dir]);
    // Captures
    for (let dx of [-1, 1]) {
      const nx = x + dx, ny = y + dir;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = board[ny][nx];
        if (target && isWhite !== isWhitePiece(target)) moves.push([nx, ny]);
      }
    }
  } else if (piece.toUpperCase() === 'N') {
    for (let [dx, dy] of directions.N) pushIfValid(x + dx, y + dy);
  } else if (piece.toUpperCase() === 'B') {
    for (let [dx, dy] of directions.B) for (let i = 1; i < 8 && pushIfValid(x + dx*i, y + dy*i); i++);
  } else if (piece.toUpperCase() === 'R') {
    for (let [dx, dy] of directions.R) for (let i = 1; i < 8 && pushIfValid(x + dx*i, y + dy*i); i++);
  } else if (piece.toUpperCase() === 'Q') {
    for (let [dx, dy] of directions.Q) for (let i = 1; i < 8 && pushIfValid(x + dx*i, y + dy*i); i++);
  } else if (piece.toUpperCase() === 'K') {
    for (let [dx, dy] of directions.K) pushIfValid(x + dx, y + dy);
  }

  return moves;
}

function moveToNotation(x1, y1, x2, y2, piece) {
  const from = toAlgebraic(x1, y1);
  const to = toAlgebraic(x2, y2);
  const isPawn = piece.toUpperCase() === 'P';
  const capture = board[y2][x2] !== "" && board[y2][x2] !== piece;

  if (isPawn) {
    if (capture) {
      return from[0] + 'x' + to;
    }
    return to;
  } else {
    let notation = pieceLetter(piece);
    if (capture) notation += 'x';
    notation += to;
    return notation;
  }
}

function addMoveToLog(moveNotation) {
  const log = document.getElementById("move-log-container");
  if (!log) return;

  let moveNumber = Math.floor(history.length / 2) + 1;
  if (history.length % 2 === 1) {
    const entry = document.createElement("div");
    entry.textContent = `${moveNumber}. ${moveNotation}`;
    entry.dataset.moveIndex = history.length - 1;
    log.appendChild(entry);
  } else {
    const lastEntry = log.lastChild;
    if (lastEntry) {
      lastEntry.textContent += ` ${moveNotation}`;
    } else {
      const entry = document.createElement("div");
      entry.textContent = `${moveNumber}. ... ${moveNotation}`;
      entry.dataset.moveIndex = history.length - 1;
      log.appendChild(entry);
    }
  }
  log.scrollTop = log.scrollHeight;
}

function undoMove() {
  if (history.length === 0) return;

  const lastState = history.pop();
  board = JSON.parse(JSON.stringify(lastState.board));
  turn = lastState.turn;

  renderBoard();

  const log = document.getElementById("move-log-container");
  if (log) {
    if (history.length === 0) {
      log.innerHTML = "";
    } else {
      log.innerHTML = "";
      for (let i = 0; i < history.length; i++) {
        addMoveToLog(history[i].moveNotation);
      }
    }
  }

  selectedPiece = null;
  legalMoves = [];

  if (draggingPieceEl) {
    draggingPieceEl.remove();
    draggingPieceEl = null;
  }
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.remove());
}

function setupUndoButton() {
  if (!document.getElementById("undo-btn")) {
    const btn = document.createElement("button");
    btn.id = "undo-btn";
    btn.textContent = "Undo";
    btn.style.marginTop = "10px";
    btn.style.padding = "5px 10px";
    btn.style.fontSize = "16px";
    btn.style.cursor = "pointer";
    btn.addEventListener("click", undoMove);

    document.body.appendChild(btn);
  }
}

// Updates dragging piece position following mouse
function onMouseMove(e) {
  if (draggingPieceEl) {
    draggingPieceEl.style.left = e.pageX - offsetX + "px";
    draggingPieceEl.style.top = e.pageY - offsetY + "px";
  }
}

// When user clicks on board
function onSquareClick(e) {
  const target = e.target.closest(".square");
  if (!target) return;

  const x = +target.dataset.x;
  const y = +target.dataset.y;
  const piece = board[y][x];

  // If no piece selected yet, select if piece belongs to current player
  if (!selectedPiece) {
    if (!piece) return; 
    if ((turn === 'white' && !isWhitePiece(piece)) || (turn === 'black' && isWhitePiece(piece))) return;

    selectedPiece = { x, y, piece };
    legalMoves = getLegalMoves(x, y, piece);
    createDraggingPiece(e, piece);
    renderBoard();
    document.addEventListener("mousemove", onMouseMove);
    return;
  }

  // If clicked on same piece square deselect
  if (selectedPiece.x === x && selectedPiece.y === y) {
    selectedPiece = null;
    legalMoves = [];
    removeDraggingPiece();
    renderBoard();
    document.removeEventListener("mousemove", onMouseMove);
    return;
  }

  // If clicked a legal move square, move the piece
  if (legalMoves.some(m => m[0] === x && m[1] === y)) {
    history.push({
      board: JSON.parse(JSON.stringify(board)),
      turn,
      moveNotation: moveToNotation(selectedPiece.x, selectedPiece.y, x, y, selectedPiece.piece)
    });

    board[y][x] = selectedPiece.piece;
    board[selectedPiece.y][selectedPiece.x] = "";

    turn = turn === 'white' ? 'black' : 'white';

    addMoveToLog(history[history.length - 1].moveNotation);

    selectedPiece = null;
    legalMoves = [];
    removeDraggingPiece();
    renderBoard();
    document.removeEventListener("mousemove", onMouseMove);
    return;
  }

  // Clicked invalid square — deselect piece
  selectedPiece = null;
  legalMoves = [];
  removeDraggingPiece();
  renderBoard();
  document.removeEventListener("mousemove", onMouseMove);
}

function createDraggingPiece(e, piece) {
  removeDraggingPiece();
  draggingPieceEl = document.createElement("div");
  draggingPieceEl.className = "dragging-piece";
  draggingPieceEl.textContent = unicodePieces[piece];
  draggingPieceEl.style.position = "absolute";
  draggingPieceEl.style.pointerEvents = "none";
  draggingPieceEl.style.fontSize = "40px";
  draggingPieceEl.style.lineHeight = "60px";
  draggingPieceEl.style.width = "60px";
  draggingPieceEl.style.height = "60px";
  draggingPieceEl.style.textAlign = "center";
  draggingPieceEl.style.userSelect = "none";
  draggingPieceEl.style.zIndex = 1000;
  document.body.appendChild(draggingPieceEl);

  offsetX = e.offsetX;
  offsetY = e.offsetY;

  draggingPieceEl.style.left = e.pageX - offsetX + "px";
  draggingPieceEl.style.top = e.pageY - offsetY + "px";
}

function removeDraggingPiece() {
  if (draggingPieceEl) {
    draggingPieceEl.remove();
    draggingPieceEl = null;
  }
}

function initBoard() {
  board = JSON.parse(JSON.stringify(startPosition));
  renderBoard();
  setupUndoButton();
}

initBoard();

document.getElementById("chessboard").addEventListener("click", onSquareClick);
