// === Constants ===
const boardSize = 8;
const initialBoard = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

let board = JSON.parse(JSON.stringify(initialBoard));
let selected = null;
let turn = 'white';
let moveLog = [];
let heldTimeout = null;
let isDragging = false;

// === Utils ===
const isUpper = p => p === p.toUpperCase();
const isLower = p => p === p.toLowerCase();
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const getColor = p => isUpper(p) ? 'white' : 'black';

// === Legal Move Logic ===
function getLegalMoves(r, c) {
  const piece = board[r][c];
  const moves = [];
  const color = getColor(piece);
  const dir = color === 'white' ? -1 : 1;

  function addMove(tr, tc) {
    if (!inBounds(tr, tc)) return;
    const target = board[tr][tc];
    if (!target || getColor(target) !== color) moves.push([tr, tc]);
  }

  if (piece.toLowerCase() === 'p') {
    // One step forward
    if (!board[r+dir]?.[c]) moves.push([r+dir, c]);
    // Two steps if initial
    if ((color === 'white' && r === 6 || color === 'black' && r === 1) && !board[r+dir]?.[c] && !board[r+2*dir]?.[c]) {
      moves.push([r+2*dir, c]);
    }
    // Diagonal captures
    for (const dc of [-1, 1]) {
      if (inBounds(r+dir, c+dc)) {
        const target = board[r+dir][c+dc];
        if (target && getColor(target) !== color) moves.push([r+dir, c+dc]);
      }
    }
  } else if (piece.toLowerCase() === 'n') {
    const jumps = [[-2,1],[2,1],[1,2],[-1,2],[-2,-1],[2,-1],[1,-2],[-1,-2]];
    jumps.forEach(([dr,dc]) => addMove(r+dr, c+dc));
  } else if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
    const dirs = [];
    if ('brq'.includes(piece.toLowerCase())) dirs.push(...[[1,1],[1,-1],[-1,1],[-1,-1]]);
    if ('rq'.includes(piece.toLowerCase())) dirs.push(...[[1,0],[-1,0],[0,1],[0,-1]]);
    for (const [dr,dc] of dirs) {
      let tr = r + dr, tc = c + dc;
      while (inBounds(tr, tc)) {
        const target = board[tr][tc];
        if (!target) {
          moves.push([tr, tc]);
        } else {
          if (getColor(target) !== color) moves.push([tr, tc]);
          break;
        }
        tr += dr;
        tc += dc;
      }
    }
  } else if (piece.toLowerCase() === 'k') {
    for (let dr=-1; dr<=1; dr++) {
      for (let dc=-1; dc<=1; dc++) {
        if (dr !== 0 || dc !== 0) addMove(r+dr, c+dc);
      }
    }
    // Castling could go here later
  }
  return moves;
}

function canMove(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  if (!piece) return false;
  const color = getColor(piece);
  if ((color === 'white' && turn !== 'white') || (color === 'black' && turn !== 'black')) return false;
  return getLegalMoves(sr, sc).some(([r, c]) => r === tr && c === tc);
}

function movePiece(sr, sc, tr, tc) {
  const moveNotation = `${board[sr][sc]}${String.fromCharCode(97+sc)}${8-sr} to ${String.fromCharCode(97+tc)}${8-tr}`;
  board[tr][tc] = board[sr][sc];
  board[sr][sc] = '';
  moveLog.push(moveNotation);
  turn = turn === 'white' ? 'black' : 'white';
}

// === Rendering ===
function renderBoard() {
  const boardDiv = document.getElementById('chessboard');
  boardDiv.innerHTML = '';

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      sq.dataset.r = r;
      sq.dataset.c = c;

      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.textContent = piece;
        pieceEl.draggable = true;

        pieceEl.addEventListener('mousedown', (e) => {
          heldTimeout = setTimeout(() => {
            isDragging = true;
            pieceEl.classList.add('dragging');
          }, 200);
        });

        pieceEl.addEventListener('mouseup', () => {
          clearTimeout(heldTimeout);
          if (!isDragging) {
            selected = { r, c };
            renderBoard();
          }
          isDragging = false;
        });

        pieceEl.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ r, c }));
        });

        pieceEl.addEventListener('dragend', () => {
          isDragging = false;
          renderBoard();
        });

        sq.appendChild(pieceEl);
      }

      // Highlight legal moves
      if (selected && selected.r === r && selected.c === c) {
        getLegalMoves(r, c).forEach(([mr, mc]) => {
          const hl = document.createElement('div');
          hl.className = 'highlight';
          const target = document.querySelector(`[data-r='${mr}'][data-c='${mc}']`);
          if (target) target.appendChild(hl);
        });
      }

      sq.addEventListener('click', () => handleSquareClick(r, c));
      sq.addEventListener('dragover', e => e.preventDefault());
      sq.addEventListener('drop', e => handleDrop(e, r, c));

      boardDiv.appendChild(sq);
    }
  }

  // Move log
  const logList = document.getElementById('move-log-list');
  logList.innerHTML = '';
  moveLog.forEach(move => {
    const li = document.createElement('li');
    li.textContent = move;
    logList.appendChild(li);
  });
}

function handleDrop(e, tr, tc) {
  const from = JSON.parse(e.dataTransfer.getData('text/plain'));
  if (canMove(from.r, from.c, tr, tc)) {
    movePiece(from.r, from.c, tr, tc);
  }
  selected = null;
  renderBoard();
}

function handleSquareClick(r, c) {
  if (selected) {
    if (canMove(selected.r, selected.c, r, c)) {
      movePiece(selected.r, selected.c, r, c);
      selected = null;
    } else {
      selected = null;
    }
    renderBoard();
  } else {
    const piece = board[r][c];
    if (piece && getColor(piece) === turn) {
      selected = { r, c };
      renderBoard();
    }
  }
}

window.addEventListener('DOMContentLoaded', renderBoard);
