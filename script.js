const unicodePieces = { 
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚"
};

let board = [];
let selectedPiece = null;
let isDragging = false;
let legalMoves = [];
let turn = 'white';
let moveHistory = [];

let offsetX = 0, offsetY = 0;
let draggingPiece = null;

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
  return piece && piece === piece.toUpperCase();
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
      square.className = "square " + ((x + y) % 2 === 0 ? "light" : "dark");
      square.dataset.x = x;
      square.dataset.y = y;
      square.style.width = "60px";
      square.style.height = "60px";
      square.style.lineHeight = "60px";
      square.style.fontSize = "40px";
      square.style.textAlign = "center";
      square.style.userSelect = "none";
      square.style.position = "relative";
      square.style.cursor = "pointer";

      const piece = board[y][x];
      if (piece) {
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
}

function getLegalMoves(x, y, piece) {
  if (!piece) return [];
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
        return !target; // Continue in sliding moves only if empty
      }
    }
    return false;
  }

  if (piece.toUpperCase() === 'P') {
    // Pawns move
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // One square forward
    if (y + dir >= 0 && y + dir < 8 && !board[y + dir][x]) {
      moves.push([x, y + dir]);
      // Two squares forward from start
      if (y === startRow && !board[y + 2 * dir][x]) {
        moves.push([x, y + 2 * dir]);
      }
    }
    // Captures
    for (let dx of [-1, 1]) {
      const nx = x + dx, ny = y + dir;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = board[ny][nx];
        if (target && isWhite !== isWhitePiece(target)) {
          moves.push([nx, ny]);
        }
      }
    }
  } else if (piece.toUpperCase() === 'N') {
    for (let [dx, dy] of directions.N) pushIfValid(x + dx, y + dy);
  } else if (piece.toUpperCase() === 'B') {
    for (let [dx, dy] of directions.B) {
      for (let i = 1; i < 8; i++) {
        if (!pushIfValid(x + dx*i, y + dy*i)) break;
      }
    }
  } else if (piece.toUpperCase() === 'R') {
    for (let [dx, dy] of directions.R) {
      for (let i = 1; i < 8; i++) {
        if (!pushIfValid(x + dx*i, y + dy*i)) break;
      }
    }
  } else if (piece.toUpperCase() === 'Q') {
    for (let [dx, dy] of directions.Q) {
      for (let i = 1; i < 8; i++) {
        if (!pushIfValid(x + dx*i, y + dy*i)) break;
      }
    }
  } else if (piece.toUpperCase() === 'K') {
    for (let [dx, dy] of directions.K) pushIfValid(x + dx, y + dy);
  }

  return moves;
}

function highlightLegalMoves(moves) {
  clearHighlights();
  for (const [x, y] of moves) {
    const square = document.querySelector(`.square[data-x='${x}'][data-y='${y}']`);
    if (square) {
      const dot = document.createElement('div');
      dot.className = 'highlight';
      square.appendChild(dot);
    }
  }
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.remove());
}

function logMove(fromX, fromY, toX, toY, piece, captured) {
  const logContainer = document.getElementById('move-log-container');
  const moveText = `${unicodePieces[piece]}: ${String.fromCharCode(97 + fromX)}${8 - fromY} → ${String.fromCharCode(97 + toX)}${8 - toY}${captured ? ` x${unicodePieces[captured]}` : ''}`;
  const entry = document.createElement('div');
  entry.textContent = moveText;
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function undoMove() {
  if (moveHistory.length === 0) return;
  const lastMove = moveHistory.pop();

  // Revert board state
  board[lastMove.fromY][lastMove.fromX] = lastMove.piece;
  board[lastMove.toY][lastMove.toX] = lastMove.captured || "";

  turn = lastMove.turn;

  // Clear move log container and reprint moves except last
  const logContainer = document.getElementById('move-log-container');
  logContainer.innerHTML = '';
  for (const move of moveHistory) {
    logMove(move.fromX, move.fromY, move.toX, move.toY, move.piece, move.captured);
  }

  renderBoard();
}

function onSquareClick(e) {
  // If clicking on a piece during dragging, ignore
  if (isDragging) return;

  const target = e.target.closest('.square');
  if (!target) return;

  const x = +target.dataset.x;
  const y = +target.dataset.y;
  const piece = board[y][x];

  // Clicking own piece to select
  if (piece && ((turn === 'white' && isWhitePiece(piece)) || (turn === 'black' && !isWhitePiece(piece)))) {
    selectedPiece = { x, y, piece };
    legalMoves = getLegalMoves(x, y, piece);
    highlightLegalMoves(legalMoves);
    createDraggingPiece(piece, x, y, e.pageX, e.pageY);
  } else if (selectedPiece) {
    // Try to move selected piece here
    const isValid = legalMoves.some(m => m[0] === x && m[1] === y);
    if (isValid) {
      // Save move history for undo
      moveHistory.push({
        fromX: selectedPiece.x,
        fromY: selectedPiece.y,
        toX: x,
        toY: y,
        piece: selectedPiece.piece,
        captured: board[y][x],
        turn: turn
      });

      board[y][x] = selectedPiece.piece;
      board[selectedPiece.y][selectedPiece.x] = "";
      turn = turn === 'white' ? 'black' : 'white';
      logMove(selectedPiece.x, selectedPiece.y, x, y, selectedPiece.piece, moveHistory[moveHistory.length-1].captured);
    }
    selectedPiece = null;
    legalMoves = [];
    clearHighlights();
    removeDraggingPiece();
    renderBoard();
  }
}

function createDraggingPiece(piece, x, y, pageX, pageY) {
  removeDraggingPiece();
  draggingPiece = document.createElement("div");
  draggingPiece.className = "piece dragging-piece";
  draggingPiece.textContent = unicodePieces[piece];
  draggingPiece.style.position = "absolute";
  draggingPiece.style.pointerEvents = "none";
  draggingPiece.style.fontSize = "40px";
  draggingPiece.style.left = (pageX - 30) + "px";
  draggingPiece.style.top = (pageY - 30) + "px";
  document.body.appendChild(draggingPiece);

  function onMove(ev) {
    draggingPiece.style.left = (ev.pageX - 30) + "px";
    draggingPiece.style.top = (ev.pageY - 30) + "px";
  }

  function onUp(ev) {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    removeDraggingPiece();
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function removeDraggingPiece() {
  if (draggingPiece) {
    draggingPiece.remove();
    draggingPiece = null;
  }
}

function initBoard() {
  board = JSON.parse(JSON.stringify(startPosition));
  turn = 'white';
  moveHistory = [];
  selectedPiece = null;
  legalMoves = [];
  clearHighlights();
  renderBoard();

  // Clear move log container
  const logContainer = document.getElementById('move-log-container');
  logContainer.innerHTML = '';
}

// Create Undo button and hook
function createUndoButton() {
  let undoBtn = document.getElementById('undo-button');
  if (!undoBtn) {
    undoBtn = document.createElement('button');
    undoBtn.id = 'undo-button';
    undoBtn.textContent = 'Undo';
    undoBtn.style.margin = '10px';
    undoBtn.style.padding = '6px 12px';
    undoBtn.style.fontSize = '16px';
    undoBtn.style.cursor = 'pointer';
    document.body.insertBefore(undoBtn, document.getElementById('chessboard'));
    undoBtn.addEventListener('click', undoMove);
  }
}

document.getElementById("chessboard").addEventListener("click", onSquareClick);

initBoard();
createUndoButton();
