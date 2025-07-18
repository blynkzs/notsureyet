const boardElem = document.getElementById('chessboard');

let board = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

let turn = 'white';
let selected = null;
let draggingPiece = null;
let mouseX = 0;
let mouseY = 0;

function isUpper(char) {
  return char === char.toUpperCase();
}

function isLower(char) {
  return char === char.toLowerCase();
}

function unicodeForPiece(piece) {
  const map = {
    'K':'♔', 'Q':'♕', 'R':'♖', 'B':'♗', 'N':'♘', 'P':'♙',
    'k':'♚', 'q':'♛', 'r':'♜', 'b':'♝', 'n':'♞', 'p':'♟'
  };
  return map[piece] || '';
}

function canMove(r1, c1, r2, c2) {
  return true; // placeholder for logic
}

function movePiece(r1, c1, r2, c2) {
  board[r2][c2] = board[r1][c1];
  board[r1][c1] = '';
}

function renderBoard() {
  boardElem.innerHTML = '';
  boardElem.style.display = 'grid';
  boardElem.style.gridTemplateColumns = 'repeat(8, 60px)';
  boardElem.style.gridTemplateRows = 'repeat(8, 60px)';
  boardElem.style.gap = '1px';
  boardElem.style.position = 'relative';

  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      const light = (r + c) % 2 === 0;
      square.className = 'square ' + (light ? 'light' : 'dark');
      square.style.width = '60px';
      square.style.height = '60px';
      square.style.display = 'flex';
      square.style.justifyContent = 'center';
      square.style.alignItems = 'center';
      square.style.fontSize = '40px';

      square.dataset.r = r;
      square.dataset.c = c;

      const piece = board[r][c];
      if (piece) {
        if (draggingPiece && draggingPiece.r === r && draggingPiece.c === c) {
          square.textContent = '';
        } else {
          square.textContent = unicodeForPiece(piece);
        }
      }

      if (selected && selected.r === r && selected.c === c) {
        square.style.outline = '3px solid yellow';
      }

      square.addEventListener('click', () => onSquareClick(r, c));
      boardElem.appendChild(square);
    }
  }

  if (draggingPiece) {
    const drag = document.createElement('div');
    drag.className = 'dragging-piece';
    drag.textContent = unicodeForPiece(draggingPiece.piece);
    drag.style.position = 'absolute';
    drag.style.fontSize = '40px';
    drag.style.width = '60px';
    drag.style.height = '60px';
    drag.style.textAlign = 'center';
    drag.style.lineHeight = '60px';
    drag.style.pointerEvents = 'none';
    drag.style.zIndex = '1000';
    const rect = boardElem.getBoundingClientRect();
    drag.style.transform = `translate(${mouseX - rect.left - 30}px, ${mouseY - rect.top - 30}px)`;
    boardElem.appendChild(drag);
    draggingPiece.elem = drag;
  }
}

function onSquareClick(r, c) {
  const clickedPiece = board[r][c];
  if (draggingPiece) {
    if (canMove(draggingPiece.r, draggingPiece.c, r, c)) {
      movePiece(draggingPiece.r, draggingPiece.c, r, c);
      turn = (turn === 'white') ? 'black' : 'white';
      draggingPiece = null;
      selected = null;
      renderBoard();
    } else {
      draggingPiece = null;
      renderBoard();
    }
  } else {
    if (clickedPiece && (
      (turn === 'white' && isUpper(clickedPiece)) ||
      (turn === 'black' && isLower(clickedPiece))
    )) {
      draggingPiece = { r, c, piece: clickedPiece };
      selected = { r, c };
      renderBoard();
    } else {
      selected = null;
      renderBoard();
    }
  }
}

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (draggingPiece && draggingPiece.elem) {
    const rect = boardElem.getBoundingClientRect();
    const x = mouseX - rect.left - 30;
    const y = mouseY - rect.top - 30;
    draggingPiece.elem.style.transform = `translate(${x}px, ${y}px)`;
  }
});

renderBoard();
