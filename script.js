const boardElem = document.getElementById('chessboard');
const whiteCapturedElem = document.getElementById('white-captured');
const blackCapturedElem = document.getElementById('black-captured');
const moveLogContainer = document.getElementById('move-log-container');
const files = ['a','b','c','d','e','f','g','h'];

const initialBoard = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R'],
];

let board = JSON.parse(JSON.stringify(initialBoard));
let selected = null;
let turn = 'white';
let captured = { white: [], black: [] };
let moveHistory = [];

function isUpper(piece) {
  return piece && piece === piece.toUpperCase();
}
function isLower(piece) {
  return piece && piece === piece.toLowerCase();
}
function unicodeForPiece(p) {
  switch(p) {
    case 'P': return '♙';
    case 'R': return '♖';
    case 'N': return '♘';
    case 'B': return '♗';
    case 'Q': return '♕';
    case 'K': return '♔';
    case 'p': return '♟';
    case 'r': return '♜';
    case 'n': return '♞';
    case 'b': return '♝';
    case 'q': return '♛';
    case 'k': return '♚';
    default: return '';
  }
}

function renderBoard() {
  boardElem.innerHTML = '';
  boardElem.style.gridTemplateColumns = 'repeat(8, 60px)';
  boardElem.style.gridTemplateRows = 'repeat(8, 60px)';
  boardElem.style.display = 'grid';
  boardElem.style.gap = '1px';
  boardElem.style.backgroundColor = '#333';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      const isLight = (r + c) % 2 === 0;
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.style.width = '60px';
      square.style.height = '60px';
      square.style.lineHeight = '60px';
      square.style.fontSize = '40px';
      square.style.textAlign = 'center';
      square.style.userSelect = 'none';
      square.style.cursor = 'pointer';
      square.dataset.r = r;
      square.dataset.c = c;

      const piece = board[r][c];
      if (piece) {
        const pieceElem = document.createElement('span');
        pieceElem.textContent = unicodeForPiece(piece);
        pieceElem.draggable = true;
        pieceElem.dataset.r = r;
        pieceElem.dataset.c = c;

        pieceElem.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', `${r},${c}`);
        });

        square.appendChild(pieceElem);
      }

      square.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      square.addEventListener('drop', (e) => {
        e.preventDefault();
        const [fromR, fromC] = e.dataTransfer.getData('text/plain').split(',').map(Number);
        const toR = parseInt(square.dataset.r);
        const toC = parseInt(square.dataset.c);
        if (canMove(fromR, fromC, toR, toC)) {
          movePiece(fromR, fromC, toR, toC);
          turn = turn === 'white' ? 'black' : 'white';
          selected = null;
          renderBoard();
          updateCaptured();
          updateMoveLog();
        }
      });

      boardElem.appendChild(square);
    }
  }
}

function canMove(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  if (!piece) return false;
  const target = board[tr][tc];
  if (target && ((isUpper(piece) && isUpper(target)) || (isLower(piece) && isLower(target)))) return false;

  const dr = tr - sr;
  const dc = tc - sc;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  switch(piece.toLowerCase()) {
    case 'p': {
      let direction = isUpper(piece) ? -1 : 1;
      if (dc === 0 && dr === direction && !target) return true;
      if (dc === 0 && dr === 2*direction && !target && ((sr === 6 && isUpper(piece)) || (sr === 1 && isLower(piece)))) {
        if (board[sr + direction][sc] === '') return true;
      }
      if (absDc === 1 && dr === direction && target) return true;
      return false;
    }
    case 'r': {
      if (dr !== 0 && dc !== 0) return false;
      return clearPath(sr, sc, tr, tc);
    }
    case 'n': {
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }
    case 'b': {
      if (absDr !== absDc) return false;
      return clearPath(sr, sc, tr, tc);
    }
    case 'q': {
      if (dr === 0 || dc === 0 || absDr === absDc) {
        return clearPath(sr, sc, tr, tc);
      }
      return false;
    }
    case 'k': {
      return absDr <= 1 && absDc <= 1;
    }
  }
  return false;
}

function clearPath(sr, sc, tr, tc) {
  const dr = Math.sign(tr - sr);
  const dc = Math.sign(tc - sc);
  let r = sr + dr;
  let c = sc + dc;
  while (r !== tr || c !== tc) {
    if (board[r][c] !== '') return false;
    r += dr;
    c += dc;
  }
  return true;
}

function movePiece(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  const target = board[tr][tc];
  moveHistory.push({
    board: JSON.parse(JSON.stringify(board)),
    captured: JSON.parse(JSON.stringify(captured)),
    turn,
    move: {from: {r: sr, c: sc}, to: {r: tr, c: tc}, piece, captured: target}
  });
  if (target) {
    if (isUpper(target)) captured.black.push(target);
    else captured.white.push(target);
  }
  board[tr][tc] = piece;
  board[sr][sc] = '';
}

function updateCaptured() {
  whiteCapturedElem.textContent = captured.white.map(p => unicodeForPiece(p)).join(' ');
  blackCapturedElem.textContent = captured.black.map(p => unicodeForPiece(p)).join(' ');
}

function updateMoveLog() {
  moveLogContainer.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Move Log';
  title.style.marginTop = '0';
  title.style.color = 'white';
  moveLogContainer.appendChild(title);

  const movesList = document.createElement('ol');
  movesList.style.paddingLeft = '20px';
  movesList.style.maxHeight = '400px';
  movesList.style.overflowY = 'auto';
  movesList.style.color = 'white';
  moveLogContainer.appendChild(movesList);

  for (let i = 0; i < moveHistory.length; i++) {
    const m = moveHistory[i].move;
    const from = files[m.from.c] + (8 - m.from.r);
    const to = files[m.to.c] + (8 - m.to.r);
    const pieceSymbol = unicodeForPiece(m.piece);
    const captureSymbol = m.captured ? 'x' : '-';
    const moveText = `${pieceSymbol} ${from}${captureSymbol}${to}`;
    const li = document.createElement('li');
    li.textContent = moveText;
    movesList.appendChild(li);
  }

  const undoBtn = document.createElement('button');
  undoBtn.textContent = 'Undo';
  undoBtn.style.marginTop = '10px';
  undoBtn.style.padding = '5px 10px';
  undoBtn.style.cursor = 'pointer';
  undoBtn.addEventListener('click', undoMove);
  moveLogContainer.appendChild(undoBtn);
}

function undoMove() {
  if (moveHistory.length === 0) return;
  const last = moveHistory.pop();
  board = JSON.parse(JSON.stringify(last.board));
  captured = JSON.parse(JSON.stringify(last.captured));
  turn = last.turn;
  selected = null;
  renderBoard();
  updateCaptured();
  updateMoveLog();
}

renderBoard();
updateCaptured();
updateMoveLog();
