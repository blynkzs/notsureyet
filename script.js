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

// Track kings' positions and castling rights
let kingPositions = { white: [7,4], black: [0,4] };
let castlingRights = {
  white: { kingside: true, queenside: true },
  black: { kingside: true, queenside: true }
};

const rookDirs = [[1,0],[-1,0],[0,1],[0,-1]];
const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
const knightMoves = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];

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

  switch(piece.toLowerCase()) {
    case 'p': {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Forward moves
      if (onBoard(r+dir, c) && board[r+dir][c] === '') {
        moves.push([r+dir, c]);
        if (r === startRow && board[r+2*dir][c] === '') {
          moves.push([r+2*dir, c]);
        }
      }

      // Captures
      for (const dc of [-1,1]) {
        const tr = r+dir, tc = c+dc;
        if (onBoard(tr, tc) && board[tr][tc] !== '' && oppositeColor(piece, board[tr][tc])) {
          moves.push([tr, tc]);
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
        while(onBoard(tr, tc)) {
          if (board[tr][tc] === '') moves.push([tr, tc]);
          else {
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
        while(onBoard(tr, tc)) {
          if (board[tr][tc] === '') moves.push([tr, tc]);
          else {
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
        while(onBoard(tr, tc)) {
          if (board[tr][tc] === '') moves.push([tr, tc]);
          else {
            if (oppositeColor(piece, board[tr][tc])) moves.push([tr, tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    }
    case 'k': {
      for (let dr = -1; dr <=1; dr++) {
        for (let dc = -1; dc <=1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const tr = r+dr, tc = c+dc;
          if (!onBoard(tr, tc)) continue;
          const target = board[tr][tc];
          if (target === '' || oppositeColor(piece, target)) moves.push([tr, tc]);
        }
      }
      if (!isInCheck(turn)) {
        if (castlingRights[turn].kingside && canCastleKingside(turn)) {
          moves.push([turn==='white'?7:0, 6]);
        }
        if (castlingRights[turn].queenside && canCastleQueenside(turn)) {
          moves.push([turn==='white'?7:0, 2]);
        }
      }
      break;
    }
  }

  // Filter out moves that leave king in check
  return moves.filter(m => !wouldBeCheck(r, c, m[0], m[1]));
}

function canCastleKingside(color) {
  const r = color==='white'?7:0;
  if (board[r][5] !== '' || board[r][6] !== '') return false;
  if (isSquareAttacked(r, 4, opposite(color))) return false;
  if (isSquareAttacked(r, 5, opposite(color))) return false;
  if (isSquareAttacked(r, 6, opposite(color))) return false;
  return true;
}

function canCastleQueenside(color) {
  const r = color==='white'?7:0;
  if (board[r][1] !== '' || board[r][2] !== '' || board[r][3] !== '') return false;
  if (isSquareAttacked(r, 4, opposite(color))) return false;
  if (isSquareAttacked(r, 3, opposite(color))) return false;
  if (isSquareAttacked(r, 2, opposite(color))) return false;
  return true;
}

function isSquareAttacked(r, c, byColor) {
  for (let rr=0; rr<8; rr++) {
    for (let cc=0; cc<8; cc++) {
      const piece = board[rr][cc];
      if (!piece) continue;
      if ((byColor==='white' && isUpper(piece)) || (byColor==='black' && isLower(piece))) {
        const moves = generatePseudoMoves(rr, cc);
        if (moves.some(m => m[0]===r && m[1]===c)) return true;
      }
    }
  }
  return false;
}

function generatePseudoMoves(r, c) {
  // Like generateMoves but ignores checks to avoid recursion
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  const isWhite = isUpper(piece);

  function tryMove(tr, tc, canCapture=true) {
    if (!onBoard(tr, tc)) return;
    const target = board[tr][tc];
    if (target === '') moves.push([tr, tc]);
    else if (canCapture && oppositeColor(piece, target)) moves.push([tr, tc]);
  }

  switch(piece.toLowerCase()) {
    case 'p': {
      const dir = isWhite ? -1 : 1;
      if (onBoard(r+dir, c) && board[r+dir][c] === '') moves.push([r+dir, c]);
      for (const dc of [-1,1]) {
        const tr = r+dir, tc = c+dc;
        if (onBoard(tr, tc) && board[tr][tc] !== '' && oppositeColor(piece, board[tr][tc])) {
          moves.push([tr, tc]);
        }
      }
      break;
    }
    case 'n': {
      for (const [dr, dc] of knightMoves) {
        const tr = r+dr, tc = c+dc;
        if (!onBoard(tr, tc)) continue;
        const target = board[tr][tc];
        if (target === '' || oppositeColor(piece, target)) moves.push([tr, tc]);
      }
      break;
    }
    case 'b': {
      for (const [dr, dc] of bishopDirs) {
        let tr = r+dr, tc = c+dc;
        while(onBoard(tr, tc)) {
          if (board[tr][tc] === '') moves.push([tr, tc]);
          else {
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
        while(onBoard(tr, tc)) {
          if (board[tr][tc] === '') moves.push([tr, tc]);
          else {
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
        while(onBoard(tr, tc)) {
          if (board[tr][tc] === '') moves.push([tr, tc]);
          else {
            if (oppositeColor(piece, board[tr][tc])) moves.push([tr, tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      }
      break;
    }
    case 'k': {
      for (let dr=-1; dr<=1; dr++) {
        for (let dc=-1; dc<=1; dc++) {
          if (dr===0 && dc===0) continue;
          const tr = r+dr, tc = c+dc;
          if (!onBoard(tr, tc)) continue;
          const target = board[tr][tc];
          if (target === '' || oppositeColor(piece, target)) moves.push([tr, tc]);
        }
      }
      break;
    }
  }
  return moves;
}

function wouldBeCheck(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  const target = board[tr][tc];

  board[tr][tc] = piece;
  board[sr][sc] = '';

  // Update king pos if moving king
  let origKingPos = null;
  if (piece.toLowerCase() === 'k') {
    origKingPos = kingPositions[turn];
    kingPositions[turn] = [tr, tc];
  }

  const inCheck = isInCheck(turn);

  board[sr][sc] = piece;
  board[tr][tc] = target;

  if (piece.toLowerCase() === 'k' && origKingPos) {
    kingPositions[turn] = origKingPos;
  }

  return inCheck;
}

function isInCheck(color) {
  const [kr, kc] = kingPositions[color];
  return isSquareAttacked(kr, kc, opposite(color));
}

function canMove(sr, sc, tr, tc) {
  const piece = board[sr][sc];
  if (!piece) return false;
  const target = board[tr][tc];
  if (target && ((isUpper(piece) && isUpper(target)) || (isLower(piece) && isLower(target)))) return false;

  return generateMoves(sr, sc).some(m => m[0] === tr && m[1] === tc);
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

  // Castling
  if (piece.toLowerCase() === 'k' && Math.abs(tc - sc) === 2) {
    const r = sr;
    if (tc === 6) { // kingside
      board[r][5] = board[r][7];
      board[r][7] = '';
    } else if (tc === 2) { // queenside
      board[r][3] = board[r][0];
      board[r][0] = '';
    }
  }

  board[tr][tc] = piece;
  board[sr][sc] = '';

  if (piece.toLowerCase() === 'k') {
    kingPositions[turn] = [tr, tc];
    castlingRights[turn].kingside = false;
    castlingRights[turn].queenside = false;
  }

  if (piece.toLowerCase() === 'r') {
    if (sr === 7 && sc === 0) castlingRights.white.queenside = false;
    if (sr === 7 && sc === 7) castlingRights.white.kingside = false;
    if (sr === 0 && sc === 0) castlingRights.black.queenside = false;
    if (sr === 0 && sc === 7) castlingRights.black.kingside = false;
  }

  // Pawn promotion auto to queen
  if (piece.toLowerCase() === 'p' && (tr === 0 || tr === 7)) {
    board[tr][tc] = isUpper(piece) ? 'Q' : 'q';
  }

  selected = null;
  legalMoves = [];
  turn = opposite(turn);
}

function updateCaptured() {
  whiteCapturedElem.textContent = captured.white.map(p => pieceUnicode[p]).join(' ');
  blackCapturedElem.textContent = captured.black.map(p => pieceUnicode[p]).join(' ');
}

function updateMoveLog() {
  moveLogList.innerHTML = '';
  for(let i = 0; i < moveHistory.length; i++) {
    const m = moveHistory[i].move;
    const from = files[m.from.c] + (8 - m.from.r);
    const to = files[m.to.c] + (8 - m.to.r);
    const pieceSymbol = pieceUnicode[m.piece];
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
    moveLogList.parentElement.appendChild(undoBtn);
  }
}

function undoMove() {
  if(moveHistory.length === 0) return;
  const last = moveHistory.pop();
  board = JSON.parse(JSON.stringify(last.board));
  captured = JSON.parse(JSON.stringify(last.captured));
  turn = last.turn;
  selected = null;
  legalMoves = [];
  kingPositions = { white: [7,4], black: [0,4] };
  castlingRights = {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  };
  updateCaptured();
  updateMoveLog();
  renderBoard();
}

function renderBoard() {
  boardElem.innerHTML = '';
  boardElem.style.gridTemplateColumns = 'repeat(8, 60px)';
  boardElem.style.gridTemplateRows = 'repeat(8, 60px)';
  boardElem.style.display = 'grid';
  boardElem.style.gap = '1px';
  boardElem.style.backgroundColor = '#333';

  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const square = document.createElement('div');
      const isLight = (r + c) % 2 === 0;
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.style.width = '60px';
      square.style.height = '60px
