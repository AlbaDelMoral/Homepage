let fontA, fontB;
let A = [],
  B = [],
  F = [];
let pA = [],
  pB = [];
let N = 20000;

let slider, labelP;
let ch = "R";

// noise mapping (calm → strong → chaotic)
let minNoise = 10.5;
let midNoise = 30;
let maxNoise = 68;
let noiseSpeed = 1.4;

function preload() {
  fontA = loadFont("assets/ABCAsfalt-ExtendedMedium-Trial.otf");
  fontB = loadFont("assets/OTNeueMontreal-BoldExtraSqueezed.otf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textAlign(CENTER, CENTER);

  // label
  labelP = createP("opposites attract");
  labelP.style("font-family", "sans-serif");
  labelP.style("font-size", "14px");
  labelP.style("color", "#111");

  // slider
  slider = createSlider(0, 1, 0, 0.001);
  slider.style("width", "260px");
  slider.addClass("heart-slider");

  positionUI();
  build();
}

function draw() {
  let m = slider.value();
  let mm = easeInOutCubic(m);

  let leftC = { x: width * 0.25, y: height * 0.58 };
  let rightC = { x: width * 0.75, y: height * 0.58 };
  let midC = { x: width * 0.5, y: height * 0.58 };

  // noise intensity logic
  let noiseAmp;
  if (m < 0.98) {
    noiseAmp = lerp(minNoise, midNoise, mm);
  } else {
    noiseAmp = lerp(midNoise, maxNoise, map(m, 0.98, 1.0, 0, 1, true));
  }

  // ---- FINAL FUSED STATE ----
  if (m > 0.985) {
    background(255, 105, 180); // pink fusion background

    fill(20);
    let t = frameCount * 0.02 * noiseSpeed;

    for (let i = 0; i < F.length; i++) {
      let ox = (noise(i * 0.1 + t) - 0.5) * 2 * maxNoise;
      let oy = (noise(i * 0.1 + 1000 + t) - 0.5) * 2 * maxNoise;
      circle(midC.x + F[i].x + ox, midC.y + F[i].y + oy, 2.7);
    }
    return;
  }

  // ---- NORMAL STATE ----
  background(255);
  fill(20);
  rect(0, 0, width / 2, height);
  fill(255);
  rect(width / 2, 0, width / 2, height);

  let k = lerp(0.02, 0.14, mm);
  let damp = 0.78;

  updateSwarm(pA, A, F, leftC, midC, k, damp, mm);
  updateSwarm(pB, B, F, rightC, midC, k, damp, mm);

  drawSwarm(pA, 255, 2.3, noiseAmp);
  drawSwarm(pB, 20, 2.3, noiseAmp);
}

function build() {
  let size = min(width, height) * 0.68;

  let rawA = fontA.textToPoints(ch, 0, 0, size, {
    sampleFactor: 0.12,
    simplifyThreshold: 0,
  });
  let rawB = fontB.textToPoints(ch, 0, 0, size, {
    sampleFactor: 0.12,
    simplifyThreshold: 0,
  });

  A = normalizeCount(centerPoints(rawA), N);
  B = normalizeCount(centerPoints(rawB), N);

  // fused target shape (50/50 blend)
  F = [];
  for (let i = 0; i < N; i++) {
    F.push({
      x: (A[i].x + B[i].x) * 0.5,
      y: (A[i].y + B[i].y) * 0.5,
    });
  }

  let leftC = { x: width * 0.25, y: height * 0.58 };
  let rightC = { x: width * 0.75, y: height * 0.58 };

  pA = makeParticlesFrom(A, leftC);
  pB = makeParticlesFrom(B, rightC);
}

function makeParticlesFrom(pts, center) {
  return pts.map((p) => ({
    x: center.x + p.x,
    y: center.y + p.y,
    vx: 0,
    vy: 0,
    n1: random(1000),
    n2: random(1000),
  }));
}

function updateSwarm(
  particles,
  basePts,
  fusedPts,
  baseCenter,
  fusedCenter,
  k,
  damp,
  amt
) {
  for (let i = 0; i < particles.length; i++) {
    let P = particles[i];

    let sx = baseCenter.x + basePts[i].x;
    let sy = baseCenter.y + basePts[i].y;

    let tx = fusedCenter.x + fusedPts[i].x;
    let ty = fusedCenter.y + fusedPts[i].y;

    let gx = lerp(sx, tx, amt);
    let gy = lerp(sy, ty, amt);

    P.vx = (P.vx + (gx - P.x) * k) * damp;
    P.vy = (P.vy + (gy - P.y) * k) * damp;

    P.x += P.vx;
    P.y += P.vy;
  }
}

function drawSwarm(particles, col, r, noiseAmp) {
  fill(col);
  let t = frameCount * 0.02 * noiseSpeed;

  for (let P of particles) {
    let ox = (noise(P.n1 + t) - 0.5) * 2 * noiseAmp;
    let oy = (noise(P.n2 + t) - 0.5) * 2 * noiseAmp;
    circle(P.x + ox, P.y + oy, r);
  }
}

function normalizeCount(arr, count) {
  let out = [];
  for (let i = 0; i < count; i++) out.push(arr[i % arr.length]);
  return out;
}

function centerPoints(arr) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let p of arr) {
    minX = min(minX, p.x);
    maxX = max(maxX, p.x);
    minY = min(minY, p.y);
    maxY = max(maxY, p.y);
  }
  let cx = (minX + maxX) / 2;
  let cy = (minY + maxY) / 2;
  return arr.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function positionUI() {
  // slider stays top-right
  slider.position(width - 300, 32);

  // label goes top-left
  labelP.position(32, 12);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionUI();
  build();
}
