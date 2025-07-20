<script>
const unicodePieces = {
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚"
};

let board = [];
let selectedPiece = null;
let draggingPiece = null;
let isDragging = false;
let legalMoves = [];
let turn = 'white';
let moveLog = [];

let offsetX = 30, offsetY = 30;

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
  return piece === piece.toUpperCase();
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
        return !target;
      }
    }
    return false;
  }

  if (piece.toUpperCase() === 'P') {
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    if (y + dir >= 0 && y + dir < 8 && !board[y + dir][x]) moves.push([x, y + dir]);
    if (y === startRow && !board[y + dir][x] && !board[y + 2 * dir][x]) moves.push([x, y + 2 * dir]);
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

function onMouseDown(e) {
  if (!e.target.classList.contains('piece')) return;

  const pieceEl = e.target;
  const piece = pieceEl.dataset.piece;
  const x = +pieceEl.dataset.x;
  const y = +pieceEl.dataset.y;

  if ((turn === 'white' && !isWhitePiece(piece)) || (turn === 'black' && isWhitePiece(piece))) return;

  selectedPiece = { x, y, piece };
  legalMoves = getLegalMoves(x, y, piece);
  highlightLegalMoves(legalMoves);

  isDragging = true;
  draggingPiece = pieceEl.cloneNode(true);
  draggingPiece.classList.add('dragging-piece');
  draggingPiece.style.position = "absolute";
  draggingPiece.style.pointerEvents = "none";
  draggingPiece.style.zIndex = 1000;
  document.body.appendChild(draggingPiece);

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (isDragging && draggingPiece) {
    draggingPiece.style.left = (e.pageX - offsetX) + "px";
    draggingPiece.style.top = (e.pageY - offsetY) + "px";
  }
}

function onMouseUp(e) {
  const boardRect = document.getElementById("chessboard").getBoundingClientRect();
  const x = Math.floor((e.clientX - boardRect.left) / (boardRect.width / 8));
  const y = Math.floor((e.clientY - boardRect.top) / (boardRect.height / 8));

  const isValid = legalMoves.some(m => m[0] === x && m[1] === y);
  if (isValid && selectedPiece) {
    moveLog.push({
      from: { x: selectedPiece.x, y: selectedPiece.y },
      to: { x, y },
      piece: selectedPiece.piece,
      captured: board[y][x]
    });

    board[y][x] = selectedPiece.piece;
    board[selectedPiece.y][selectedPiece.x] = "";

    document.getElementById("moveLog").innerText +=
      `${selectedPiece.piece} ${String.fromCharCode(97 + selectedPiece.x)}${8 - selectedPiece.y} → ${String.fromCharCode(97 + x)}${8 - y}\n`;

    turn = turn === 'white' ? 'black' : 'white';
  }

  draggingPiece?.remove();
  selectedPiece = null;
  draggingPiece = null;
  isDragging = false;
  clearHighlights();
  renderBoard();

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

function initBoard() {
  board = JSON.parse(JSON.stringify(startPosition));
  renderBoard();
}

document.addEventListener("mousedown", onMouseDown);

document.getElementById("undoBtn").addEventListener("click", () => {
  const last = moveLog.pop();
  if (!last) return;

  board[last.from.y][last.from.x] = last.piece;
  board[last.to.y][last.to.x] = last.captured || "";
  turn = turn === 'white' ? 'black' : 'white';
  document.getElementById("moveLog").innerText = "";
  moveLog.forEach(m => {
    document.getElementById("moveLog").innerText +=
      `${m.piece} ${String.fromCharCode(97 + m.from.x)}${8 - m.from.y} → ${String.fromCharCode(97 + m.to.x)}${8 - m.to.y}\n`;
  });
  renderBoard();
});

initBoard();
</script>
