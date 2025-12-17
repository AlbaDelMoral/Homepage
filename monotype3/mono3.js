// p5.js — 2-column grid + indents + falling letters + circle cursor
// + figure image at top of poem column
//
// Assets:
//  - Font (optional): assets/NeueMontreal-Bold.otf
//  - Figure image: assets/figure.png

let neueBold;
let figureImg;

const leftText = `Love Letters
Vol.1

A series of Love’s terminology
represented through type`;

const poem = `(for A)
What sound was that?
I turn away, into the shaking room.
What was that sound that came in on the dark?
What is this maze of light it leaves us in?
What is this stance we take, To turn away and then turn back?
What did we hear?
It was the breath we took when we first met.

Listen. It is here.`;

// --- typography ---
const POEM_SIZE = 20;
const POEM_LEADING = 28;

// indent lines
const INDENT_LINES = new Set([
  "I turn away, into the shaking room.",
  "It was the breath we took when we first met.",
]);

// --- timing / motion ---
const START_WINDOW_FRAMES = 720;
const GRAVITY = 0.0045;
const MIN_VY = 0.03;
const MAX_VY = 0.12;

// --- circle cursor ---
const NAPKIN_R = 26;
const PICKUP_PAD = 6;

// --- restart fade ---
const FADE_SPEED = 10;
let poemAlpha = 255;
let fadeMode = "none";

let layout = null;
let cycleStartFrame = 0;

// --- figure layout ---
const FIGURE_HEIGHT = 305; // visual height of figure (px) inside the poem column
const FIGURE_GAP = -90; // gap between figure and poem start

function preload() {
  neueBold = loadFont("assets/NeueMontreal-Bold.otf");
  figureImg = loadImage("assets/eye1.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  if (neueBold) textFont(neueBold);
  cursor("none");
  restartCycle();
}

function draw() {
  background("#d9ffb3ff");

  // --- 2 column layout ---
  const margin = 20;
  const gutter = 20;
  const colW = (width - margin * 2 - gutter) / 2;

  const col1X = margin;
  const col2X = margin + colW + gutter;
  const topY = margin;

  // Column 1 text
  push();
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  textLeading(11);
  text(leftText, col1X, topY, colW);
  pop();

  // --- Column 2: figure on top ---
  const figX = col2X;
  const figY = topY;
  const figW = colW;

  drawFigure(figX, figY, figW, FIGURE_HEIGHT);

  // poem starts lower now
  const poemY = topY + FIGURE_HEIGHT + FIGURE_GAP;
  drawPoem(col2X, poemY, colW);

  // Cursor circle
  drawNapkinCircle(mouseX, mouseY);

  // Restart logic
  handleRestart();
}

function drawFigure(x, y, w, h) {
  if (!figureImg) return;

  // scale image to fit height, keep aspect, align left (like your reference)
  const ar = figureImg.width / figureImg.height;
  const dw = h * ar;
  const dh = h;

  image(figureImg, x, y, dw, dh);
}

function drawPoem(x, y, w) {
  if (!layout) return;

  const localFrame = frameCount - cycleStartFrame;

  push();
  if (neueBold) textFont(neueBold);
  textAlign(LEFT, TOP);
  textSize(POEM_SIZE);
  textLeading(POEM_LEADING);
  fill(0, poemAlpha);
  noStroke();

  // Pickup check (static + falling)
  for (const ch of layout.chars) {
    if (!ch.eligible || ch.state === "done" || ch.state === "stuck") continue;

    if (ch.state === "static" && localFrame >= ch.startFrame)
      ch.state = "falling";

    const cx = ch.x;
    const cy = ch.y + ch.offY;

    if (
      circleHitsLetter(
        cx,
        cy,
        ch.w,
        ch.h,
        mouseX,
        mouseY,
        NAPKIN_R + PICKUP_PAD
      )
    ) {
      ch.state = "stuck";
      ch.stickOffX = cx - mouseX;
      ch.stickOffY = cy - mouseY;
    }
  }

  // Draw + update static/falling
  for (const ch of layout.chars) {
    if (!ch.eligible) continue;
    if (ch.state === "done" || ch.state === "stuck") continue;

    if (ch.state === "static") {
      text(ch.char, ch.x, ch.y);
    } else if (ch.state === "falling") {
      ch.vy += GRAVITY;
      ch.offY += ch.vy;

      text(ch.char, ch.x, ch.y + ch.offY);

      if (ch.y + ch.offY > height + 80) ch.state = "done";
    }
  }

  // Draw stuck letters riding the cursor
  for (const ch of layout.chars) {
    if (ch.state !== "stuck") continue;
    text(ch.char, mouseX + ch.stickOffX, mouseY + ch.stickOffY);
  }

  pop();
}

function restartCycle() {
  cycleStartFrame = frameCount;
  buildLayout();
  poemAlpha = 255;
}

function buildLayout() {
  const margin = 20;
  const gutter = 20;
  const colW = (width - margin * 2 - gutter) / 2;
  const col2X = margin + colW + gutter;

  // IMPORTANT: poem starts below the figure
  const startY = margin + FIGURE_HEIGHT + FIGURE_GAP;

  push();
  if (neueBold) textFont(neueBold);
  textSize(POEM_SIZE);
  textAlign(LEFT, TOP);

  const baseIndent = 0;
  const specialIndent = 110;

  const lines = poem.split("\n");
  let chars = [];
  let lineY = startY;

  const chH = textAscent() + textDescent();

  for (const line of lines) {
    if (line.trim() === "") {
      lineY += POEM_LEADING;
      continue;
    }

    const indent = INDENT_LINES.has(line) ? specialIndent : baseIndent;
    const lineX = col2X + indent;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const cx = lineX + textWidth(line.substring(0, i));
      const eligible = c !== " " && c !== "\t";

      chars.push({
        char: c,
        x: cx,
        y: lineY,
        w: max(4, textWidth(c)),
        h: chH,

        eligible,
        startFrame: eligible ? floor(random(0, START_WINDOW_FRAMES)) : Infinity,

        state: "static",
        offY: 0,
        vy: eligible ? random(MIN_VY, MAX_VY) : 0,

        stickOffX: 0,
        stickOffY: 0,
      });
    }

    lineY += 30; // your spacing
  }

  pop();
  layout = { chars };
}

function handleRestart() {
  if (!layout) return;

  const allResolved = layout.chars.every(
    (ch) => !ch.eligible || ch.state === "done" || ch.state === "stuck"
  );

  if (fadeMode === "none" && allResolved) fadeMode = "out";

  if (fadeMode === "out") {
    poemAlpha = max(0, poemAlpha - FADE_SPEED);
    if (poemAlpha === 0) {
      restartCycle();
      fadeMode = "in";
    }
  } else if (fadeMode === "in") {
    poemAlpha = min(255, poemAlpha + FADE_SPEED);
    if (poemAlpha === 255) fadeMode = "none";
  }
}

function drawNapkinCircle(mx, my) {
  push();
  noStroke();
  fill(255, 220);
  circle(mx, my, NAPKIN_R * 2);
  stroke(0, 35);
  strokeWeight(1);
  noFill();
  circle(mx, my, NAPKIN_R * 2);
  pop();
}

function circleHitsLetter(lx, ly, lw, lh, cx, cy, r) {
  const rx1 = lx,
    ry1 = ly,
    rx2 = lx + lw,
    ry2 = ly + lh;
  const closestX = constrain(cx, rx1, rx2);
  const closestY = constrain(cy, ry1, ry2);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restartCycle();
}
