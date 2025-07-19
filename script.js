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

let turn = 'white', selected = null, legalMoves = [], captured = { white: [], black: [] };

const pieceUnicode = {
  'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙',
  'k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'
};

function isUpper(c){return c===c.toUpperCase();}
function isLower(c){return c===c.toLowerCase();}
function opposite(color){ return color==='white'?'black':'white'; }
function oppositeColor(p1,p2){return isUpper(p1)&&isLower(p2)||isLower(p1)&&isUpper(p2);}
function onBoard(r,c){ return r>=0&&r<8&&c>=0&&c<8; }

let kingPos={white:[7,4], black:[0,4]};
let castling={white:{kingside:true,queenside:true},black:{kingside:true,queenside:true}};
const rookDirs=[[1,0],[-1,0],[0,1],[0,-1]];
const bishopDirs=[[1,1],[1,-1],[-1,1],[-1,-1]];
const knightMoves=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];

function generateMoves(r,c){
  const p = board[r][c]; if(!p) return [];
  const moves = [], isW = isUpper(p);
  function tryMove(tr,tc,canCapture=true){
    if(!onBoard(tr,tc))return;
    const tgt=board[tr][tc];
    if(tgt==='') moves.push([tr,tc]);
    else if(canCapture && oppositeColor(p,tgt)) moves.push([tr,tc]);
  }
  switch(p.toLowerCase()){
    case 'p':{
      const dir = isW?-1:1, sr=isW?6:1;
      if(onBoard(r+dir,c)&&board[r+dir][c]==='') moves.push([r+dir,c]);
      if(r===sr && board[r+2*dir][c]==='') moves.push([r+2*dir,c]);
      for(let dc of[-1,1]){
        const tr=r+dir,tc=c+dc;
        if(onBoard(tr,tc)&&board[tr][tc]!==''
           && oppositeColor(p,board[tr][tc])){
          moves.push([tr,tc]);
        }
      }
      break;
    }
    case 'n': for(let [dr,dc] of knightMoves)tryMove(r+dr,c+dc);break;
    case 'b': for(let [dr,dc] of bishopDirs){
      let tr=r+dr,tc=c+dc;
      while(onBoard(tr,tc)){
        if(board[tr][tc]==='') moves.push([tr,tc]);
        else{ if(oppositeColor(p,board[tr][tc])) moves.push([tr,tc]); break;}
        tr+=dr;tc+=dc;
      }
    } break;
    case 'r': for(let [dr,dc] of rookDirs){
      let tr=r+dr,tc=c+dc;
      while(onBoard(tr,tc)){
        if(board[tr][tc]==='') moves.push([tr,tc]);
        else{ if(oppositeColor(p,board[tr][tc])) moves.push([tr,tc]); break;}
        tr+=dr;tc+=dc;
      }
    } break;
    case 'q': for(let [dr,dc] of [...rookDirs,...bishopDirs]){
      let tr=r+dr,tc=c+dc;
      while(onBoard(tr,tc)){
        if(board[tr][tc]==='') moves.push([tr,tc]);
        else{ if(oppositeColor(p,board[tr][tc])) moves.push([tr,tc]); break;}
        tr+=dr;tc+=dc;
      }
    } break;
    case 'k': for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
        if(dr||dc)tryMove(r+dr,c+dc);
      }
      if(!inCheck(turn)){
        if(castling[turn].kingside&&canCastle(turn,true))
          moves.push([turn==='white'?7:0,6]);
        if(castling[turn].queenside&&canCastle(turn,false))
          moves.push([turn==='white'?7:0,2]);
      }
      break;
  }
  return moves.filter(m=>!wouldCheck(r,c,m[0],m[1]));
}

function canCastle(color,ks){
  const r=color==='white'?7:0;
  if(ks){
    if(board[r][5]|board[r][6])return false;
    if(attacked(r,4,opposite(color))||attacked(r,5,opposite(color))||attacked(r,6,opposite(color)))return false;
  } else {
    if(board[r][1]||board[r][2]||board[r][3])return false;
    if(attacked(r,4,opposite(color))||attacked(r,3,opposite(color))||attacked(r,2,opposite(color)))return false;
  }
  return true;
}

function attacked(r,c,by){
  return board.some((row,rr)=>row.some((pi,cc)=>{
    if(!pi) return false;
    if((by==='white'?isUpper(pi):isLower(pi))){
      const moves = genPseudo(rr,cc);
      return moves.some(m=>m[0]===r&&m[1]===c);
    }
    return false;
  }));
}

function genPseudo(r,c){
  const p=board[r][c]; if(!p)return[];
  const moves=[]; const isW=isUpper(p);
  function tri(tr,tc){if(onBoard(tr,tc)){
    const t=board[tr][tc];
    if(t===''||oppositeColor(p,t)) moves.push([tr,tc]);}};
  switch(p.toLowerCase()){
    case 'p':{const dir=isW?-1:1;
      for(let dc of[-1,1])tri(r+dir,c+dc);break;}
    case 'n': knightMoves.forEach(([dr,dc])=>tri(r+dr,c+dc));break;
    case 'b': bishopDirs.forEach(([dr,dc])=>{
      let tr=r+dr,tc=c+dc;
      while(onBoard(tr,tc)){
        tri(tr,tc); if(board[tr][tc]!=='')break; tr+=dr;tc+=dc;
      }});break;
    case 'r': rookDirs.forEach(([dr,dc])=>{
      let tr=r+dr,tc=c+dc;
      while(onBoard(tr,tc)){
        tri(tr,tc); if(board[tr][tc]!=='')break; tr+=dr;tc+=dc;
      }});break;
    case 'q': [...rookDirs,...bishopDirs].forEach(([dr,dc])=>{
      let tr=r+dr,tc=c+dc;
      while(onBoard(tr,tc)){
        tri(tr,tc); if(board[tr][tc]!=='')break; tr+=dr;tc+=dc;
      }});break;
    case 'k': for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)tri(r+dr,c+dc); break;
  }
  return moves;
}

function wouldCheck(sr,sc,tr,tc){
  const p=board[sr][sc], tgt=board[tr][tc];
  board[tr][tc]=p; board[sr][sc]='';
  const origK=kingPos[turn].slice();
  if(p.toLowerCase()==='k') kingPos[turn]=[tr,tc];
  const chk=inCheck(turn);
  board[sr][sc]=p; board[tr][tc]=tgt;
  kingPos[turn]=origK;
  return chk;
}

function inCheck(color){const [kr,kc]=kingPos[color];return attacked(kr,kc,opposite(color));}

function canMove(sr,sc,tr,tc){
  const p=board[sr][sc]; if(!p)return false;
  const tgt=board[tr][tc];
  if(tgt&&(isUpper(p)&&isUpper(tgt)||isLower(p)&&isLower(tgt)))return false;
  return generateMoves(sr,sc).some(m=>m[0]===tr&&m[1]===tc);
}

function movePiece(sr,sc,tr,tc){
  const p=board[sr][sc], tgt=board[tr][tc];
  if(tgt) captured[turn==='white'?'white':'black'].push(tgt);
  board[tr][tc]=p; board[sr][sc]='';
  if(p.toLowerCase()==='k'&&Math.abs(tc-sc)===2){
    const r=(turn==='white'?7:0);
    if(tc===6){board[r][5]=board[r][7]; board[r][7]='';}
    else{board[r][3]=board[r][0]; board[r][0]='';}
  }
  if(p.toLowerCase()==='k'){
    kingPos[turn]=[tr,tc];
    castling[turn]={kingside:false,queenside:false};
  }
  if(p.toLowerCase()==='r'){
    if(sr===7&&sc===0)castling.white.queenside=false;
    if(sr===7&&sc===7)castling.white.kingside=false;
    if(sr===0&&sc===0)castling.black.queenside=false;
    if(sr===0&&sc===7)castling.black.kingside=false;
  }
  selected=null; legalMoves=[];
  addMoveLog(sr,sc,tr,tc,p,!!tgt);
  updateCaptured();
  turn=opposite(turn);
}

function addMoveLog(sr,sc,tr,tc,p,capture){
  const from=files[sc]+(8-sr), to=files[tc]+(8-tr);
  const sym=pieceUnicode[p]||''; const cap=capture?'x':''; const txt=`${sym}${from}${cap}${to}`;
  const li=document.createElement('li'); li.textContent=txt;
  moveLogList.appendChild(li);
}

function updateCaptured(){
  whiteCapturedElem.textContent=captured.white.map(p=>pieceUnicode[p]).join(' ');
  blackCapturedElem.textContent=captured.black.map(p=>pieceUnicode[p]).join(' ');
}

function renderBoard(){
  boardElem.innerHTML=''; boardElem.style.display='grid';
  boardElem.style.gridTemplate='repeat(8,60px)/repeat(8,60px)'; boardElem.style.gap='1px';
  boardElem.style.background='#333';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const sq=document.createElement('div');
    sq.className='square '+((r+c)%2?'dark':'light');
    sq.style.display='flex'; sq.style.alignItems='center'; sq.style.justifyContent='center';
    sq.style.fontSize='40px'; sq.style.cursor='pointer';
    sq.dataset.r=r; sq.dataset.c=c;
    const p=board[r][c]; if(p){sq.textContent=pieceUnicode[p]; sq.style.color=isUpper(p)?'white':'black';}
    if(legalMoves.some(m=>m[0]===r&&m[1]===c))sq.style.boxShadow='inset 0 0 8px 4px yellow';
    sq.onclick=()=>onClick(r,c);
    boardElem.appendChild(sq);
  }
}

function onClick(r,c){
  const p=board[r][c];
  if(!selected){
    if(p&&(turn==='white'?isUpper(p):isLower(p))){
      selected=[r,c]; legalMoves=generateMoves(r,c); renderBoard();
    }
  } else {
    const [sr,sc]=selected;
    if(legalMoves.some(m=>m[0]===r&&m[1]===c)){
      movePiece(sr,sc,r,c);
    } else { selected=null; legalMoves=[];}
    renderBoard();
  }
}

renderBoard();
updateCaptured();
