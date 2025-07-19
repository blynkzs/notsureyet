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

const unicodePieces = {
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚'
};

let board = JSON.parse(JSON.stringify(initialBoard));
let turn = 'white';
let selected = null;
let legalMoves = [];
let moveLog = [];
let captured = { white: [], black: [] };

// Variables for drag vs click
let holdTimeout = null;
let isDragging = false;
let dragPiece = null;
let dragOrigin = null;
let dragElem = null;
let mouseX = 0;
let mouseY = 0;

// Utils
const isUpper = c => c === c.toUpperCase();
const isLower = c => c === c.toLowerCase();
const inBounds = (r,c) => r >= 0 && r < boardSize && c >= 0 && c < boardSize;
const getColor = p => isUpper(p) ? 'white' : 'black';

// Legal moves (basic, no castling or check for brevity here - can expand)
function getLegalMoves(r,c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = getColor(piece);
  const moves = [];
  const dir = color === 'white' ? -1 : 1;

  function addMove(tr, tc) {
    if (!inBounds(tr, tc)) return;
    const target = board[tr][tc];
    if (!target || getColor(target) !== color) moves.push([tr, tc]);
  }

  switch(piece.toLowerCase()) {
    case 'p':
      if(!board[r+dir] || !board[r+dir][c]) break; // no moves if out of bounds
      if(!board[r+dir][c]) moves.push([r+dir, c]);
      if((color === 'white' && r === 6) || (color === 'black' && r ===1))
        if(!board[r+2*dir][c]) moves.push([r+2*dir, c]);
      for(const dc of [-1,1]) {
        let tr = r + dir, tc = c + dc;
        if(inBounds(tr, tc)) {
          const target = board[tr][tc];
          if(target && getColor(target) !== color) moves.push([tr, tc]);
        }
      }
      break;
    case 'n':
      [[-2,1],[2,1],[1,2],[-1,2],[-2,-1],[2,-1],[1,-2],[-1,-2]].forEach(([dr,dc])=>{
        let tr = r+dr, tc=c+dc;
        if(inBounds(tr,tc)) {
          const target = board[tr][tc];
          if(!target || getColor(target) !== color) moves.push([tr,tc]);
        }
      });
      break;
    case 'b':
      for(let [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let tr = r+dr, tc = c+dc;
        while(inBounds(tr, tc)) {
          if(!board[tr][tc]) moves.push([tr, tc]);
          else {
            if(getColor(board[tr][tc]) !== color) moves.push([tr,tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    case 'r':
      for(let [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        let tr = r+dr, tc = c+dc;
        while(inBounds(tr, tc)) {
          if(!board[tr][tc]) moves.push([tr, tc]);
          else {
            if(getColor(board[tr][tc]) !== color) moves.push([tr,tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    case 'q':
      for(let [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]) {
        let tr = r+dr, tc = c+dc;
        while(inBounds(tr, tc)) {
          if(!board[tr][tc]) moves.push([tr, tc]);
          else {
            if(getColor(board[tr][tc]) !== color) moves.push([tr,tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    case 'k':
      for(let dr = -1; dr <=1; dr++) {
        for(let dc = -1; dc <=1; dc++) {
          if(dr !== 0 || dc !== 0) {
            let tr = r + dr, tc = c + dc;
            if(inBounds(tr, tc)) {
              const target = board[tr][tc];
              if(!target || getColor(target) !== color) moves.push([tr, tc]);
            }
          }
        }
      }
      break;
  }

  return moves;
}

function canMove(sr, sc, tr, tc) {
  if(!inBounds(sr, sc) || !inBounds(tr, tc)) return false;
  const piece = board[sr][sc];
  if(!piece) return false;
  const color = getColor(piece);
  if(turn !== color) return false;
  const legal = getLegalMoves(sr, sc);
  return legal.some(([r,c]) => r === tr && c === tc);
}

function movePiece(sr, sc, tr, tc) {
  let piece = board[sr][sc];
  let target = board[tr][tc];
  if(target) captured[turn].push(target);
  board[tr][tc] = piece;
  board[sr][sc] = '';
  // Pawn promotion (auto to queen)
  if(piece.toLowerCase() === 'p' && (tr === 0 || tr === 7)) {
    board[tr][tc] = turn === 'white' ? 'Q' : 'q';
  }
  turn = turn === 'white' ? 'black' : 'white';
  addMoveLog(sr, sc, tr, tc, piece, !!target);
}

function addMoveLog(sr, sc, tr, tc, piece, capture) {
  const files = ['a','b','c','d','e','f','g','h'];
  const from = files[sc] + (8 - sr);
  const to = files[tc] + (8 - tr);
  const symbol = piece.toLowerCase() === 'p' ? '' : unicodePieces[piece];
  const captureSymbol = capture ? 'x' : '-';
  const text = `${symbol}${from}${captureSymbol}${to}`;
  const logList = document.getElementById('move-log-list');
  const li = document.createElement('li');
  li.textContent = text;
  logList.appendChild(li);
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.remove());
}

function renderBoard() {
  const boardElem = document.getElementById('chessboard');
  boardElem.innerHTML = '';
  clearHighlights();

  for(let r=0; r < 8; r++) {
    for(let c=0; c < 8; c++) {
      const square = document.createElement('div');
      square.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      square.dataset.r = r;
      square.dataset.c = c;
      square.style.position = 'relative';

      let piece = board[r][c];
      if(piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'piece';
        pieceDiv.textContent = unicodePieces[piece];
        pieceDiv.style.color = isUpper(piece) ? 'white' : 'black';
        pieceDiv.style.userSelect = 'none';
        pieceDiv.style.cursor = 'grab';

        // Drag handlers
        pieceDiv.draggable = true;

        pieceDiv.addEventListener('mousedown', (e) => {
          e.preventDefault();
          selected = {r,c};
          legalMoves = getLegalMoves(r,c);
          dragOrigin = {r,c};
          dragPiece = piece;
          mouseX = e.clientX;
          mouseY = e.clientY;
          isDragging = false;
          holdTimeout = setTimeout(() => {
            isDragging = true;
            pieceDiv.style.visibility = 'hidden';
            createDragPiece(pieceDiv, e.clientX, e.clientY);
          }, 200);
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
          renderBoard();
        });

        pieceDiv.addEventListener('dragstart', (e) => {
          e.preventDefault(); // disable default drag
        });

        square.appendChild(pieceDiv);
      }

      // Highlight legal moves if selected
      if(selected && selected.r === r && selected.c === c) {
        legalMoves.forEach(([mr, mc]) => {
          if(mr === r && mc === c) {
            const hl = document.createElement('div');
            hl.className = 'highlight';
            hl.style.position = 'absolute';
            hl.style.top = '0';
            hl.style.left = '0';
            hl.style.width = '100%';
            hl.style.height = '100%';
            hl.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
            hl.style.borderRadius = '50%';
            square.appendChild(hl);
          }
        });
      }

      // Square click to move or select
      square.addEventListener('click', () => {
        if(isDragging) return; // Ignore click while dragging
        if(selected) {
          // If clicked square is legal move, move piece
          if(canMove(selected.r, selected.c, r, c)) {
            movePiece(selected.r, selected.c, r, c);
            selected = null;
            legalMoves = [];
            cleanupDragPiece();
            renderBoard();
          } else {
            selected = null;
            legalMoves = [];
            cleanupDragPiece();
            renderBoard();
          }
        } else {
          // Select piece if belongs to turn
          if(piece && getColor(piece) === turn) {
            selected = {r,c};
            legalMoves = getLegalMoves(r,c);
            renderBoard();
          }
        }
      });

      boardElem.appendChild(square);
    }
  }
}

// Drag piece follow cursor
function createDragPiece(pieceDiv, x, y) {
  dragElem = document.createElement('div');
  dragElem.className = 'dragging-piece';
  dragElem.textContent = unicodePieces[dragPiece];
  dragElem.style.position = 'fixed';
  dragElem.style.top = `${y - 20}px`;
  dragElem.style.left = `${x - 20}px`;
  dragElem.style.fontSize = '40px';
  dragElem.style.pointerEvents = 'none';
  dragElem.style.zIndex = '1000';
  document.body.appendChild(dragElem);
}

function onMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if(isDragging && dragElem) {
    dragElem.style.top = `${mouseY - 20}px`;
    dragElem.style.left = `${mouseX - 20}px`;
  }
}

function onMouseUp(e) {
  clearTimeout(holdTimeout);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  if(isDragging) {
    const boardRect = document.getElementById('chessboard').getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    const col = Math.floor(x / (boardRect.width / 8));
    const row = Math.floor(y / (boardRect.height / 8));

    if(canMove(dragOrigin.r, dragOrigin.c, row, col)) {
      movePiece(dragOrigin.r, dragOrigin.c, row, col);
    }
    // Snapback if illegal
  }
  isDragging = false;
  cleanupDragPiece();
  selected = null;
  legalMoves = [];
  renderBoard();
}

function cleanupDragPiece() {
  if(dragElem) {
    dragElem.remove();
    dragElem = null;
  }
}
renderBoard();
