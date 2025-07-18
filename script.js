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
function isEmpty(r, c) { return board[r][c] === ''; }
function oppositeColor(piece1, piece2) {
  return (isUpper(piece1) && isLower(piece2)) || (isLower(piece1) && isUpper(piece2));
}

function onBoard(r, c) {
  return r >=0 && r < 8 && c >=0 && c < 8;
}

const rookDirs = [[1,0],[-1,0],[0,1],[0,-1]];
const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
const knightMoves = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];

let kingPositions = { white: [7,4], black: [0,4] };
let castlingRights = {
  white: { kingside: true, queenside: true },
  black: { kingside: true, queenside: true }
};
let halfMoveClock = 0;
let fullMoveNumber = 1;

// Generate legal moves for piece at (r,c)
function generateMoves(r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const moves = [];
  const isWhite = isUpper(piece);

  function tryMove(tr, tc, canCapture = true) {
    if (!onBoard(tr, tc)) return;
    const target = board[tr][tc];
    if (target === '') {
      moves.push([tr, tc]);
    } else if (canCapture && oppositeColor(piece, target)) {
      moves.push([tr, tc]);
    }
  }

  switch (piece.toLowerCase()) {
    case 'p': {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Forward one
      if (onBoard(r+dir, c) && board[r+dir][c] === '') {
        moves.push([r+dir, c]);
        // Forward two from start
        if (r === startRow && board[r+2*dir][c] === '') {
          moves.push([r+2*dir, c]);
        }
      }
      // Captures
      for (const dc of [-1,1]) {
        const tr = r+dir, tc = c+dc;
        if (onBoard(tr, tc)) {
          if (board[tr][tc] !== '' && oppositeColor(piece, board[tr][tc])) {
            moves.push([tr, tc]);
          }
          // EN PASSANT REMOVED
        }
      }
      break;
    }
    case 'n': {
      for (const [dr, dc] of knightMoves) {
        const tr = r+dr, tc = c+dc;
        if (!onBoard(tr, tc)) continue;
        const target = board[tr][tc];
        if (target === '' || oppositeColor(piece, target)) {
          moves.push([tr, tc]);
        }
      }
      break;
    }
    case 'b': {
      for (const [dr, dc] of bishopDirs) {
        let tr = r+dr, tc = c+dc;
        while (onBoard(tr, tc)) {
          if (board[tr][tc] === '') {
            moves.push([tr, tc]);
          } else {
            if (oppositeColor(piece, board[tr][tc])) moves.push([tr, tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    }
    case 'r': {
      for (const [dr, dc] of rookDirs) {
        let tr = r+dr, tc = c+dc;
        while (onBoard(tr, tc)) {
          if (board[tr][tc] === '') {
            moves.push([tr, tc]);
          } else {
            if (oppositeColor(piece, board[tr][tc])) moves.push([tr, tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    }
    case 'q': {
      for (const [dr, dc] of [...rookDirs, ...bishopDirs]) {
        let tr = r+dr, tc = c+dc;
        while (onBoard(tr, tc)) {
          if (board[tr][tc] === '') {
            moves.push([tr, tc]);
          } else {
            if (oppositeColor(piece, board[tr][tc])) moves.push([tr, tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    }
    case 'k': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const tr = r+dr, tc = c+dc;
          if (!onBoard(tr, tc)) continue;
          const target = board[tr][tc];
          if (target === '' || oppositeColor(piece, target)) {
            moves.push([tr, tc]);
          }
        }
      }
      // Castling check remains
      if (!isInCheck(turn)) {
        if (castlingRights[turn].kingside && canCastleKingside(turn)) {
          moves.push([turn === 'white' ? 7 : 0, 6]);
        }
        if (castlingRights[turn].queenside && canCastleQueenside(turn)) {
          moves.push([turn === 'white' ? 7 : 0, 2]);
        }
      }
      break;
    }
  }
  // Filter out moves that put own king in check
  return moves.filter(m => !wouldBeCheck(r, c, m[0], m[1]));
}
