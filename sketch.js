// =============================================================
// TicTacToe – p5.js implementation
// 2026-03-02
// https://openprocessing.org/sketch/2883694
// =============================================================

// ---- Constants -----------------------------------------------
const CANVAS_WIDTH  = 600;
const CANVAS_HEIGHT = 700;

const GRID_SIZE   = 600;   // square grid area (top portion of canvas)
const STATUS_H    = 100;   // height of status / button area below grid
const CELL_SIZE   = 200;   // GRID_SIZE / 3
const MARK_SIZE   = 120;   // approximate height of X / O glyphs

// Colors
const COLOR_BACKGROUND  = '#ffffff';
const COLOR_GRID_LINE   = '#444444';
const COLOR_CELL_EMPTY  = '#e8e8e8';
const COLOR_CELL_HOVER  = '#00FFFF';  // cyan hover tint (desktop only)
const COLOR_CELL_BORDER = '#888888';
const COLOR_MARK_X      = '#1565c0';  // blue
const COLOR_MARK_O      = '#c62828';  // red
const COLOR_STATUS_BG   = '#f5f5f5';
const COLOR_STATUS_TEXT = '#111111';
const COLOR_BTN_BG      = '#4fc3f7';  // light blue
const COLOR_BTN_HOVER   = '#0288d1';  // darker blue on hover
const COLOR_BTN_TEXT    = '#ffffff';
const COLOR_WIN_TEXT    = '#2e7d32';  // green for winner announcement

// Grid-line thickness
const GRID_LINE_W = 3;
const MARK_STROKE = 8;

// Font sizes
const FONT_STATUS = 28;
const FONT_BTN    = 20;

// Button geometry (centered in the status area)
const BTN_W = 160;
const BTN_H = 44;
const BTN_X = (CANVAS_WIDTH - BTN_W) / 2;   // left edge
const BTN_Y = GRID_SIZE + (STATUS_H - BTN_H) / 2;  // top edge

// Win combinations (indices into flat board array)
const WIN_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// ---- Responsive Scaling --------------------------------------
let scaleFactor = 1;

function computeScale() {
  return Math.min(windowWidth / CANVAS_WIDTH, windowHeight / CANVAS_HEIGHT);
}

// ---- Game State ----------------------------------------------
let gameState;
let isTouchDevice = false;
let hoveredCell   = -1;   // index of cell currently under mouse (-1 = none)
let btnHovered    = false;

// =============================================================
// p5.js lifecycle
// =============================================================

function setup() {
  scaleFactor = computeScale();
  createCanvas(CANVAS_WIDTH * scaleFactor, CANVAS_HEIGHT * scaleFactor);
  textFont('monospace');
  isTouchDevice = detectTouch();
  initializeGame();
}

function draw() {
  background(COLOR_BACKGROUND);
  scale(scaleFactor);
  drawBoard();
  drawMarks();
  drawStatus();
  drawResetButton();
}

function windowResized() {
  scaleFactor = computeScale();
  resizeCanvas(CANVAS_WIDTH * scaleFactor, CANVAS_HEIGHT * scaleFactor);
}

// =============================================================
// Touch detection
// =============================================================

function detectTouch() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

// =============================================================
// Game Logic
// =============================================================

function initializeGame() {
  gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameOver: false,
    winner: null,
    moveCount: 0,
  };
}

function isValidMove(cellIndex) {
  return (
    cellIndex >= 0 &&
    cellIndex < 9 &&
    gameState.board[cellIndex] === '' &&
    !gameState.gameOver
  );
}

function makeMove(cellIndex) {
  if (!isValidMove(cellIndex)) return;

  gameState.board[cellIndex] = gameState.currentPlayer;
  gameState.moveCount++;

  const winner = checkWinner();
  if (winner) {
    gameState.gameOver = true;
    gameState.winner   = winner;
  } else if (isBoardFull()) {
    gameState.gameOver = true;
    gameState.winner   = 'draw';
  } else {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
  }
}

function checkWinner() {
  for (const [a, b, c] of WIN_COMBINATIONS) {
    const val = gameState.board[a];
    if (val !== '' && val === gameState.board[b] && val === gameState.board[c]) {
      return val;
    }
  }
  return null;
}

function isBoardFull() {
  return gameState.moveCount === 9;
}

function resetGame() {
  initializeGame();
  hoveredCell = -1;
  btnHovered  = false;
}

// =============================================================
// Coordinate helpers
// =============================================================

// Convert canvas pixel coords (from mouse/touch) to logical game coords
function toLogical(canvasCoord) {
  return canvasCoord / scaleFactor;
}

function cellIndexFromMouse(mx, my) {
  const lx = toLogical(mx);
  const ly = toLogical(my);
  if (lx < 0 || lx >= GRID_SIZE || ly < 0 || ly >= GRID_SIZE) return -1;
  const col = Math.floor(lx / CELL_SIZE);
  const row = Math.floor(ly / CELL_SIZE);
  return row * 3 + col;
}

function cellTopLeft(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: col * CELL_SIZE, y: row * CELL_SIZE };
}

function isOverButton(mx, my) {
  const lx = toLogical(mx);
  const ly = toLogical(my);
  return lx >= BTN_X && lx <= BTN_X + BTN_W && ly >= BTN_Y && ly <= BTN_Y + BTN_H;
}

// =============================================================
// Rendering
// =============================================================

function drawBoard() {
  // Draw cell backgrounds first
  noStroke();
  for (let i = 0; i < 9; i++) {
    const { x, y } = cellTopLeft(i);
    const isHovered = !isTouchDevice && hoveredCell === i && gameState.board[i] === '' && !gameState.gameOver;
    fill(isHovered ? COLOR_CELL_HOVER : COLOR_CELL_EMPTY);
    rect(x, y, CELL_SIZE, CELL_SIZE);
  }

  // Draw grid lines
  stroke(COLOR_GRID_LINE);
  strokeWeight(GRID_LINE_W);

  // Vertical lines (between columns)
  line(CELL_SIZE,     0, CELL_SIZE,     GRID_SIZE);
  line(CELL_SIZE * 2, 0, CELL_SIZE * 2, GRID_SIZE);

  // Horizontal lines (between rows)
  line(0, CELL_SIZE,     GRID_SIZE, CELL_SIZE);
  line(0, CELL_SIZE * 2, GRID_SIZE, CELL_SIZE * 2);

  // Cell borders (outer border of each cell)
  stroke(COLOR_CELL_BORDER);
  strokeWeight(1);
  noFill();
  rect(0, 0, GRID_SIZE, GRID_SIZE);
}

function drawMarks() {
  for (let i = 0; i < 9; i++) {
    const mark = gameState.board[i];
    if (mark === '') continue;

    const { x, y } = cellTopLeft(i);
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;
    const half = MARK_SIZE / 2;

    strokeWeight(MARK_STROKE);
    noFill();

    if (mark === 'X') {
      stroke(COLOR_MARK_X);
      line(cx - half, cy - half, cx + half, cy + half);
      line(cx + half, cy - half, cx - half, cy + half);
    } else {
      stroke(COLOR_MARK_O);
      ellipse(cx, cy, MARK_SIZE, MARK_SIZE);
    }
  }
}

function drawStatus() {
  // Status background
  fill(COLOR_STATUS_BG);
  noStroke();
  rect(0, GRID_SIZE, CANVAS_WIDTH, STATUS_H);

  // Status text (above the button, vertically centered in the top half of status area)
  let msg;
  let txtColor = COLOR_STATUS_TEXT;

  if (!gameState.gameOver) {
    msg = `${gameState.currentPlayer}'s Turn`;
  } else if (gameState.winner === 'draw') {
    msg = "It's a Draw!";
  } else {
    msg = `${gameState.winner} Wins!`;
    txtColor = COLOR_WIN_TEXT;
  }

  fill(txtColor);
  noStroke();
  textSize(FONT_STATUS);
  textAlign(CENTER, CENTER);
  // Place text in the vertical center of the top 55px of the status bar
  text(msg, CANVAS_WIDTH / 2, GRID_SIZE + 27);
}

function drawResetButton() {
  const hovered = !isTouchDevice && btnHovered;

  // Button background
  fill(hovered ? COLOR_BTN_HOVER : COLOR_BTN_BG);
  noStroke();
  rect(BTN_X, BTN_Y, BTN_W, BTN_H, 8);  // 8px corner radius

  // Button label
  fill(COLOR_BTN_TEXT);
  textSize(FONT_BTN);
  textAlign(CENTER, CENTER);
  text('New Game', BTN_X + BTN_W / 2, BTN_Y + BTN_H / 2);
}

// =============================================================
// Input Handling
// =============================================================

function mouseMoved() {
  if (isTouchDevice) return;
  hoveredCell = cellIndexFromMouse(mouseX, mouseY);
  btnHovered  = isOverButton(mouseX, mouseY);
}

function mouseDragged() {
  if (isTouchDevice) return;
  hoveredCell = cellIndexFromMouse(mouseX, mouseY);
  btnHovered  = isOverButton(mouseX, mouseY);
}

function mousePressed() {
  if (isOverButton(mouseX, mouseY)) {
    resetGame();
    return;
  }

  const idx = cellIndexFromMouse(mouseX, mouseY);
  if (idx !== -1) {
    makeMove(idx);
  }
}

// Touch events (p5.js touchStarted)
function touchStarted() {
  isTouchDevice = true;

  const tx = touches.length > 0 ? touches[0].x : mouseX;
  const ty = touches.length > 0 ? touches[0].y : mouseY;

  if (isOverButton(tx, ty)) {
    resetGame();
    return false;
  }

  const idx = cellIndexFromMouse(tx, ty);
  if (idx !== -1) {
    makeMove(idx);
  }

  return false;  // prevent default scroll / zoom
}
