const boardElem = document.getElementById('board');

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
  return true; // Placeholder, always allows movement
}

function movePiece(r1, c1, r2, c2) {
  board[r2][c2] = board[r1][c1];
  board[r1][c1] = '';
}

function renderBoard() {
  boardElem.innerHTML = '';

  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const square = document.createElement('div');
      const isLight = (r + c) % 2 === 0;
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.dataset.r = r;
      square.dataset.c = c;

      let piece = board[r][c];

      if(piece) {
        if(draggingPiece && draggingPiece.r === r && draggingPiece.c === c) {
          square.textContent = '';
        } else {
          square.textContent = unicodeForPiece(piece);
        }
      }

      if(selected && selected.r === r && selected.c === c) {
        square.style.outline = '3px solid yellow';
      }

      square.addEventListener('click', () => onSquareClick(r, c));

      boardElem.appendChild(square);
    }
  }

  if(draggingPiece) {
    let dragDiv = document.createElement('div');
    dragDiv.className = 'dragging-piece';
    dragDiv.textContent = unicodeForPiece(draggingPiece.piece);
    boardElem.appendChild(dragDiv);

    draggingPiece.elem = dragDiv;

    const boardRect = boardElem.getBoundingClientRect();
    const x = mouseX - boardRect.left - 30;
    const y = mouseY - boardRect.top - 30;
    draggingPiece.elem.style.transform = `translate(${x}px, ${y}px)`;
  }
}

function onSquareClick(r, c) {
  const clickedPiece = board[r][c];

  if(draggingPiece) {
    if(canMove(draggingPiece.r, draggingPiece.c, r, c)) {
      movePiece(draggingPiece.r, draggingPiece.c, r, c);
      turn = turn === 'white' ? 'black' : 'white';
      draggingPiece = null;
      selected = null;
      renderBoard();
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

renderBoard();
