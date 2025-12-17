let myFont;
let bgImg;

function preload() {
  myFont = loadFont("assets/PPEditorialNew-Ultralight.otf");
  bgImg = loadImage("assets/stomach2.jpeg"); // 👈 your image
}

let butterflies = [];
let N = 108;

let flySlider, flyLabel;

// Circle habitat
let cx, cy, R;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  cx = width / 2;
  cy = height / 2 + 20;
  R = min(width, height) * 0.38;

  // UI: flyingness 0..10
  flySlider = createSlider(0, 10, 0, 0.01);
  flySlider.position(20, 20);
  flySlider.style("width", "220px");

  flyLabel = createDiv("");
  flyLabel.position(250, 12);
  flyLabel.style("font-family", "system-ui, sans-serif");
  flyLabel.style("font-size", "14px");

  for (let i = 0; i < N; i++) {
    butterflies.push(new TextButterfly(randomInCircle(cx, cy, R * 0.85)));
  }
}

function draw() {
  image(bgImg, 0, 0, width, height);

  // habitat circle
  fill(255, 60, 0);
  stroke("black");
  strokeWeight(0);
  circle(cx, cy, R * 2);

  let fly = flySlider.value();
  let f = fly / 10.0;
  flyLabel.html("Flyingness: " + nf(fly, 1, 2));

  for (let b of butterflies) {
    b.update(f);
    b.constrainToCircle();
    b.draw(f);
  }
}

class TextButterfly {
  constructor(pos) {
    this.x = pos.x;
    this.y = pos.y;

    this.size = random(32, 58);
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);

    this.t = random(1000);
    this.flapT = random(1000);
    this.heading = random(TWO_PI);

    this.gap = this.size * 0.22;
    this.bodyOffset = this.size * 0.02;

    this.restAngle = random(PI * 0.15, PI * 0.85);
  }

  restSpot() {
    let inner = R - this.size * 0.9;
    let a = HALF_PI + map(this.restAngle, 0, PI, -0.9, 0.9);
    return {
      x: cx + cos(a) * inner,
      y: cy + sin(a) * inner,
    };
  }

  update(f) {
    let ease = smoothstep(f);

    if (ease < 0.02) {
      let rs = this.restSpot();
      this.x = lerp(this.x, rs.x, 0.08);
      this.y = lerp(this.y, rs.y, 0.1);
      this.vx *= 0.85;
      this.vy *= 0.85;

      this.flapT += 0.01;
      this.heading = lerpAngle(this.heading, -HALF_PI, 0.05);
      return;
    }

    this.t += 0.006 * (0.3 + 1.7 * ease);

    let ax = map(noise(this.t), 0, 1, -0.25, 0.25) * (0.4 + 1.6 * ease);
    let ay = map(noise(this.t + 1000), 0, 1, -0.25, 0.25) * (0.4 + 1.6 * ease);

    this.vx += ax;
    this.vy += ay;

    let maxSpeed = lerp(0.3, 3.8, ease);
    let sp = sqrt(this.vx * this.vx + this.vy * this.vy);
    if (sp > maxSpeed) {
      this.vx = (this.vx / sp) * maxSpeed;
      this.vy = (this.vy / sp) * maxSpeed;
    }

    this.x += this.vx * lerp(0.4, 1.0, ease);
    this.y += this.vy * lerp(0.4, 1.0, ease);

    this.heading = atan2(this.vy, this.vx);
    this.flapT += 0.05 + 0.28 * ease;
  }

  constrainToCircle() {
    let margin = this.size * 0.85;
    let allowed = R - margin;

    let dx = this.x - cx;
    let dy = this.y - cy;
    let d = sqrt(dx * dx + dy * dy);

    if (d > allowed) {
      let nx = dx / d;
      let ny = dy / d;

      this.x = cx + nx * allowed;
      this.y = cy + ny * allowed;

      let dot = this.vx * nx + this.vy * ny;
      this.vx -= 2 * dot * nx;
      this.vy -= 2 * dot * ny;

      this.vx *= 0.85;
      this.vy *= 0.85;
    }
  }

  draw(f) {
    let ease = smoothstep(f);

    push();
    translate(this.x, this.y);

    let ang = lerpAngle(-HALF_PI, this.heading, ease);
    rotate(ang);

    let baseFlap = sin(this.flapT) * 0.55 + sin(this.flapT * 0.33) * 0.12;
    let flap = baseFlap * lerp(0.08, 1.0, ease);

    noStroke();
    fill(20);

    textFont(myFont);
    textAlign(CENTER, CENTER);

    textSize(this.size);

    // left wing (mirrored B)
    push();
    translate(-this.gap, 0);
    rotate(-flap);
    scale(-1, 1);
    text("B", 0, 0);
    pop();

    // body (i)
    push();
    translate(0, this.bodyOffset - this.size * 0.2);
    textSize(this.size * 1.2);
    text("i", 0, 0);
    pop();

    // right wing
    push();
    translate(this.gap, 0);
    rotate(flap);
    textSize(this.size);
    text("B", 0, 0);
    pop();

    pop();
  }
}

// helpers
function smoothstep(x) {
  x = constrain(x, 0, 1);
  return x * x * (3 - 2 * x);
}

function lerpAngle(a, b, t) {
  let d = atan2(sin(b - a), cos(b - a));
  return a + d * t;
}

function randomInCircle(x, y, r) {
  let a = random(TWO_PI);
  let m = sqrt(random(1)) * r;
  return {
    x: x + cos(a) * m,
    y: y + sin(a) * m,
  };
}
