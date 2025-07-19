const boardElem = document.getElementById('chessboard');
const whiteCapturedElem = document.getElementById('white-captured');
const blackCapturedElem = document.getElementById('black-captured');
const moveLogList = document.getElementById('move-log-list');

const files = ['a','b','c','d','e','f','g','h'];

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
let legalMoves = [];
let captured = { white: [], black: [] };
let moveHistory = [];

const pieceUnicode = {
  'K':'♔', 'Q':'♕', 'R':'♖', 'B':'♗', 'N':'♘', 'P':'♙',
  'k':'♚', 'q':'♛', 'r':'♜', 'b':'♝', 'n':'♞', 'p':'♟'
};

function isUpper(c) { return c === c.toUpperCase(); }
function isLower(c) { return c === c.toLowerCase(); }
function onBoard(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function opposite(color) { return color === 'white' ? 'black' : 'white'; }
function oppositeColor(p1, p2) {
  return (isUpper(p1) && isLower(p2)) || (isLower(p1) && isUpper(p2));
}

function generateMoves(r,c) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  const isWhite = isUpper(piece);

  if (piece.toLowerCase() === 'p') {
    const dir = isWhite ? -1 : 1;
    // Forward 1
    if (onBoard(r+dir,c) && board[r+dir][c]==='') moves.push([r+dir,c]);
    // Captures
    for(let dc of [-1,1]) {
      const nr = r+dir, nc = c+dc;
      if (onBoard(nr,nc) && board[nr][nc] !== '' && oppositeColor(piece, board[nr][nc])) {
        moves.push([nr,nc]);
      }
    }
  }
  else if (piece.toLowerCase() === 'n') {
    const knightMoves = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
    for(let [dr,dc] of knightMoves) {
      const nr = r+dr, nc = c+dc;
      if (!onBoard(nr,nc)) continue;
      if (board[nr][nc] === '' || oppositeColor(piece, board[nr][nc])) {
        moves.push([nr,nc]);
      }
    }
  } else {
    // For demo, no other moves
  }
  return moves;
}

function renderBoard() {
  boardElem.innerHTML = '';
  boardElem.style.display = 'grid';
  boardElem.style.gridTemplateColumns = 'repeat(8, 60px)';
  boardElem.style.gridTemplateRows = 'repeat(8, 60px)';
  boardElem.style.gap = '1px';
  boardElem.style.backgroundColor = '#333';

  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const square = document.createElement('div');
      square.className = 'square ' + ((r+c)%2 === 0 ? 'light' : 'dark');
      square.style.width = '60px';
      square.style.height = '60px';
      square.style.display = 'flex';
      square.style.alignItems = 'center';
      square.style.justifyContent = 'center';
      square.style.fontSize = '40px';
      square.style.cursor = 'pointer';
      square.dataset.r = r;
      square.dataset.c = c;

      const piece = board[r][c];
      if (piece) {
        square.textContent = pieceUnicode[piece];
        square.style.color = isUpper(piece) ? 'white' : 'black';
      }

      // Highlight legal moves squares
      if (legalMoves.some(m => m[0] === r && m[1] === c)) {
        square.style.boxShadow = 'inset 0 0 10px 5px yellow';
      } else {
        square.style.boxShadow = '';
      }

      square.onclick = () => {
        if (selected === null) {
          if (!piece) return;
          if ((turn === 'white' && isUpper(piece)) || (turn === 'black' && isLower(piece))) {
            selected = [r,c];
            legalMoves = generateMoves(r,c);
            renderBoard();
          }
        } else {
          const [sr, sc] = selected;
          if (legalMoves.some(m => m[0] === r && m[1] === c)) {
            movePiece(sr, sc, r, c);
            updateCaptured();
            updateMoveLog(sr, sc, r, c);
            selected = null;
            legalMoves = [];
            renderBoard();
          } else {
            selected = null;
            legalMoves = [];
            renderBoard();
          }
        }
      };

      boardElem.appendChild(square);
    }
  }
}

function movePiece(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  const target = board[tr][tc];

  if (target) {
    if (isUpper(target)) captured.black.push(target);
    else captured.white.push(target);
  }
  board[tr][tc] = piece;
  board[sr][sc] = '';

  turn = opposite(turn);
}

function updateCaptured() {
  whiteCapturedElem.textContent = captured.white.map(p => pieceUnicode[p]).join(' ');
  blackCapturedElem.textContent = captured.black.map(p => pieceUnicode[p]).join(' ');
}

function updateMoveLog(sr, sc, tr, tc) {
  const piece = board[tr][tc];
  const from = files[sc] + (8 - sr);
  const to = files[tc] + (8 - tr);
  const pieceSymbol = pieceUnicode[piece] || '';
  const capture = (captured.white.includes(piece) || captured.black.includes(piece)) ? 'x' : '';
  const moveText = `${pieceSymbol} ${from}${capture}${to}`;

  const li = document.createElement('li');
  li.textContent = moveText;
  moveLogList.appendChild(li);
}

renderBoard();
updateCaptured();
