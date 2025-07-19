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
let selected = null;      // currently picked-up square {r,c} or null
let legalMoves = [];
let captured = { white: [], black: [] };
let moveLog = [];

let dragInfo = {
  isDragging: false,
  dragElem: null,
  origin: null,
  piece: null,
  holdTimeout: null,
  mouseX: 0,
  mouseY: 0,
};

function isUpper(c) { return c === c.toUpperCase(); }
function isLower(c) { return c === c.toLowerCase(); }
function inBounds(r,c) { return r>=0 && r<boardSize && c>=0 && c<boardSize; }
function getColor(p) { return isUpper(p) ? 'white' : 'black'; }

function getLegalMoves(r,c) {
  const piece = board[r][c];
  if(!piece) return [];
  const color = getColor(piece);
  const moves = [];
  const dir = color === 'white' ? -1 : 1;

  function addMove(tr, tc) {
    if(!inBounds(tr, tc)) return;
    const target = board[tr][tc];
    if(!target || getColor(target) !== color) moves.push([tr, tc]);
  }

  switch(piece.toLowerCase()) {
    case 'p':
      // Forward moves
      if(inBounds(r+dir, c) && !board[r+dir][c]) moves.push([r+dir,c]);
      // Double forward
      if((color==='white' && r===6) || (color==='black' && r===1)) {
        if(!board[r+dir][c] && !board[r+2*dir][c]) moves.push([r+2*dir, c]);
      }
      // Captures
      for(let dc of [-1,1]) {
        let tr = r + dir, tc = c + dc;
        if(inBounds(tr,tc)) {
          let target = board[tr][tc];
          if(target && getColor(target) !== color) moves.push([tr,tc]);
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
      for(let dr=-1; dr<=1; dr++) {
        for(let dc=-1; dc<=1; dc++) {
          if(dr !== 0 || dc !== 0) {
            let tr = r+dr, tc=c+dc;
            if(inBounds(tr,tc)) {
              let target = board[tr][tc];
              if(!target || getColor(target) !== color) moves.push([tr,tc]);
            }
          }
        }
      }
      break;
  }
  return moves;
}

function canMove(sr, sc, tr, tc) {
  if(!inBounds(sr,sc) || !inBounds(tr,tc)) return false;
  const piece = board[sr][sc];
  if(!piece) return false;
  if(turn !== getColor(piece)) return false;
  return getLegalMoves(sr, sc).some(([r,c]) => r===tr && c===tc);
}

function movePiece(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  const target = board[tr][tc];
  if(target) captured[turn].push(target);
  board[tr][tc] = piece;
  board[sr][sc] = '';
  // Pawn promotion automatic queen
  if(piece.toLowerCase() === 'p' && (tr === 0 || tr === 7)) {
    board[tr][tc] = turn === 'white' ? 'Q' : 'q';
  }
  addMoveLog(sr, sc, tr, tc, piece, !!target);
  turn = turn === 'white' ? 'black' : 'white';
}

function addMoveLog(sr, sc, tr, tc, piece, capture) {
  const files = ['a','b','c','d','e','f','g','h'];
  const from = files[sc] + (8 - sr);
  const to = files[tc] + (8 - tr);
  const symbol = piece.toLowerCase() === 'p' ? '' : unicodePieces[piece];
  const captureSymbol = capture ? 'x' : '-';
  const logText = `${symbol}${from}${captureSymbol}${to}`;
  const moveLogList = document.getElementById('move-log-list');
  const li = document.createElement('li');
  li.textContent = logText;
  moveLogList.appendChild(li);
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.remove());
}

function renderBoard() {
  const boardElem = document.getElementById('chessboard');
  boardElem.innerHTML = '';
  clearHighlights();

  for(let r=0; r<boardSize; r++) {
    for(let c=0; c<boardSize; c++) {
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

        // On click: pick up or drop piece
        pieceDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          if(selected && selected.r === r && selected.c === c) {
            // Clicking selected piece cancels pick-up
            cleanupDragPiece();
            selected = null;
            legalMoves = [];
            renderBoard();
            return;
          }
          if(turn !== getColor(piece)) return;

          selected = {r, c};
          legalMoves = getLegalMoves(r, c);
          createDragPiece(piece, e.clientX, e.clientY);
          dragInfo.isDragging = false;
          dragInfo.origin = {r, c};
          dragInfo.piece = piece;

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);

          dragInfo.holdTimeout = setTimeout(() => {
            dragInfo.isDragging = true;
            pieceDiv.style.visibility = 'hidden';
          }, 200);

          renderBoard();
        });

        // On mousedown: start drag hold timer (same as click but for dragging)
        pieceDiv.addEventListener('mousedown', (e) => {
          e.preventDefault(); // prevent text selection etc
        });

        square.appendChild(pieceDiv);
      }

      // Highlight legal moves if selected
      if(selected) {
        legalMoves.forEach(([mr, mc]) => {
          if(mr === r && mc === c) {
            const hl = document.createElement('div');
            hl.className = 'highlight';
            hl.style.position = 'absolute';
            hl.style.top = '15px';
            hl.style.left = '15px';
            hl.style.width = '30px';
            hl.style.height = '30px';
            hl.style.borderRadius = '50%';
            hl.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
            hl.style.pointerEvents = 'none';
            square.appendChild(hl);
          }
        });
      }

      // Allow dropping by clicking on empty or opponent square when piece selected
      square.addEventListener('click', () => {
        if(!selected) return;
        if(canMove(selected.r, selected.c, r, c)) {
          movePiece(selected.r, selected.c, r, c);
        }
        cleanupDragPiece();
        selected = null;
        legalMoves = [];
        renderBoard();
      });

      boardElem.appendChild(square);
    }
  }
}

function createDragPiece(piece, x, y) {
  cleanupDragPiece();
  dragInfo.dragElem = document.createElement('div');
  dragInfo.dragElem.className = 'dragging-piece';
  dragInfo.dragElem.textContent = unicodePieces[piece];
  dragInfo.dragElem.style.position = 'fixed';
  dragInfo.dragElem.style.top = (y - 20) + 'px';
  dragInfo.dragElem.style.left = (x - 20) + 'px';
  dragInfo.dragElem.style.fontSize = '40px';
  dragInfo.dragElem.style.pointerEvents = 'none';
  dragInfo.dragElem.style.userSelect = 'none';
  dragInfo.dragElem.style.zIndex = 10000;
  document.body.appendChild(dragInfo.dragElem);
}

function onMouseMove(e) {
  dragInfo.mouseX = e.clientX;
  dragInfo.mouseY = e.clientY;
  if(dragInfo.dragElem) {
    dragInfo.dragElem.style.top = (e.clientY - 20) + 'px';
    dragInfo.dragElem.style.left = (e.clientX - 20) + 'px';
  }
}

function onMouseUp(e) {
  clearTimeout(dragInfo.holdTimeout);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  if(!selected) {
    cleanupDragPiece();
    return;
  }

  const boardRect = document.getElementById('chessboard').getBoundingClientRect();
  const x = e.clientX - boardRect.left;
  const y = e.clientY - boardRect.top;
  const col = Math.floor(x / (boardRect.width / 8));
  const row = Math.floor(y / (boardRect.height / 8));

  if(canMove(selected.r, selected.c, row, col)) {
    movePiece(selected.r, selected.c, row, col);
  }

  cleanupDragPiece();
  selected = null;
  legalMoves = [];
  dragInfo.isDragging = false;
  renderBoard();
}

function cleanupDragPiece() {
  if(dragInfo.dragElem) {
    dragInfo.dragElem.remove();
    dragInfo.dragElem = null;
  }
}

function updateCaptured() {
  const whiteCapturedElem = document.getElementById('white-captured');
  const blackCapturedElem = document.getElementById('black-captured');
  whiteCapturedElem.textContent = captured.white.map(p => unicodePieces[p]).join(' ');
  blackCapturedElem.textContent = captured.black.map(p => unicodePieces[p]).join(' ');
}

// Init
renderBoard();
updateCaptured();
