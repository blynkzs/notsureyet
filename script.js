const chessboard = document.getElementById('chessboard');

for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement('div');
    square.classList.add('square');

    // Determine if square is light or dark
    if ((row + col) % 2 === 0) {
      square.classList.add('light');
    } else {
      square.classList.add('dark');
    }

    // Optional: Add data attributes to identify squares (e.g., a1, b1, etc.)
    const file = String.fromCharCode(97 + col); // a-h
    const rank = 8 - row; // 8-1
    square.dataset.position = file + rank;

    chessboard.appendChild(square);
  }
}
