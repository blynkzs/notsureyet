const boardElem = document.getElementById('chessboard');
const whiteCapturedElem = document.getElementById('white-captured');
const blackCapturedElem = document.getElementById('black-captured');
const moveLogContainer = document.getElementById('move-log-container');
const moveLogList = document.getElementById('move-log-list');
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
let draggingPiece = null;
let mouseX = 0;
let mouseY = 0;

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
  boardElem.style.position = 'relative';

  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const square = document.createElement('div');
      const isLight = (r + c) % 2 === 0;
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.style.width = '60px';
      square.style.height = '60px';
      square.style.lineHeight = '60px';
      square.style.fontSize = '40px';
      square.style.textAlign = 'center';
      square.style.userSelect = 'none';
      square.style.cursor = 'grab';
      square.dataset.r = r;
      square.dataset.c = c;

      let piece = board[r][c];

      if(piece) {
        if(draggingPiece && draggingPiece.r === r && draggingPiece.c === c) {
          square.textContent = '';
        } else {
          square.textContent = unicodeForPiece(piece);
        }
        square.draggable = false;
        square.addEventListener('click', () => onSquareClick(r, c));
      } else {
        square.addEventListener('click', () => onSquareClick(r, c));
      }

      if(selected && selected.r === r && selected.c === c) {
        square.style.outline = '3px solid yellow';
      }

      boardElem.appendChild(square);
    }
  }

  if(draggingPiece) {
    let dragDiv = document.createElement('div');
    dragDiv.className = 'dragging-piece';
    dragDiv.style.position = 'absolute';
    dragDiv.style.pointerEvents = 'none';
    dragDiv.style.fontSize = '40px';
    dragDiv.style.lineHeight = '60px';
    dragDiv.style.width = '60px';
    dragDiv.style.height = '60px';
    dragDiv.style.textAlign = 'center';
    dragDiv.style.userSelect = 'none';
    dragDiv.style.zIndex = 1000;
    dragDiv.textContent = unicodeForPiece(draggingPiece.piece);
    boardElem.appendChild(dragDiv);

    draggingPiece.elem = dragDiv;

    // Position dragged piece at current mouse position
    const boardRect = boardElem.getBoundingClientRect();
    const x = mouseX - boardRect.left - 30;
    const y = mouseY - boardRect.top - 30;
    draggingPiece.elem.style.transform = `translate(${x}px, ${y}px)`;
  }
}

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if(draggingPiece && draggingPiece.elem) {
    const boardRect = boardElem.getBoundingClientRect();
    const x = mouseX - boardRect.left - 30;
    const y = mouseY - boardRect.top - 30;
    draggingPiece.elem.style.transform = `translate(${x}px, ${y}px)`;
  }
});

function onSquareClick(r, c) {
  const clickedPiece = board[r][c];

  if(draggingPiece) {
    if(canMove(draggingPiece.r, draggingPiece.c, r, c)) {
      movePiece(draggingPiece.r, draggingPiece.c, r, c);
      turn = turn === 'white' ? 'black' : 'white';
      draggingPiece = null;
      selected = null;
      renderBoard();
      updateCaptured();
      updateMoveLog();
    } else {
      draggingPiece = null;
      renderBoard();
    }
  } else {
    if(clickedPiece && ((turn === 'white' && isUpper(clickedPiece)) || (turn === 'black' && isLower(clickedPiece)))) {
      draggingPiece = {r, c, piece: clickedPiece};
      selected = {r, c};
      renderBoard();
    } else {
      selected = null;
      renderBoard();
    }
  }
}

function canMove(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  if(!piece) return false;
  const target = board[tr][tc];
  if(target && ((isUpper(piece) && isUpper(target)) || (isLower(piece) && isLower(target)))) return false;

  const dr = tr - sr;
  const dc = tc - sc;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  switch(piece.toLowerCase()) {
    case 'p': {
      let direction = isUpper(piece) ? -1 : 1;
      if(dc === 0 && dr === direction && !target) return true;
      if(dc === 0 && dr === 2*direction && !target && ((sr === 6 && isUpper(piece)) || (sr === 1 && isLower(piece)))) {
        if(board[sr + direction][sc] === '') return true;
      }
      if(absDc === 1 && dr === direction && target) return true;
      return false;
    }
    case 'r': {
      if(dr !== 0 && dc !== 0) return false;
      return clearPath(sr, sc, tr, tc);
    }
    case 'n': {
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }
    case 'b': {
      if(absDr !== absDc) return false;
      return clearPath(sr, sc, tr, tc);
    }
    case 'q': {
      if(dr === 0 || dc === 0 || absDr === absDc) {
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
  while(r !== tr || c !== tc) {
    if(board[r][c] !== '') return false;
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
  if(target) {
    if(isUpper(target)) captured.black.push(target);
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
  moveLogList.innerHTML = '';
  for(let i = 0; i < moveHistory.length; i++) {
    const m = moveHistory[i].move;
    const from = files[m.from.c] + (8 - m.from.r);
    const to = files[m.to.c] + (8 - m.to.r);
    const pieceSymbol = unicodeForPiece(m.piece);
    const captureSymbol = m.captured ? 'x' : '-';
    const moveText = `${pieceSymbol} ${from}${captureSymbol}${to}`;
    const li = document.createElement('li');
    li.textContent = moveText;
    moveLogList.appendChild(li);
  }
  if (!document.getElementById('undo-button')) {
    const undoBtn = document.createElement('button');
    undoBtn.id = 'undo-button';
    undoBtn.textContent = 'Undo';
    undoBtn.style.marginTop = '10px';
    undoBtn.style.padding = '5px 10px';
    undoBtn.style.cursor = 'pointer';
    undoBtn.addEventListener('click', undoMove);
    moveLogContainer.appendChild(undoBtn);
  }
}

function undoMove() {
  if(moveHistory.length === 0) return;
  const last = moveHistory.pop();
  board = JSON.parse(JSON.stringify(last.board));
  captured = JSON.parse(JSON.stringify(last.captured));
  turn = last.turn;
  selected = null;
  draggingPiece = null;
  renderBoard();
  updateCaptured();
  updateMoveLog();
}

boardElem.addEventListener('dragstart', e => e.preventDefault());
boardElem.addEventListener('dragend', e => e.preventDefault());
boardElem.addEventListener('drop', e => e.preventDefault());
boardElem.addEventListener('dragover', e => e.preventDefault());

renderBoard();
updateCaptured();
updateMoveLog();
