// ======================================================
// SCENE & GLOBAL STATES
// ======================================================
let scene = 0;
let startTime;
let hover = false;
let progress = 0;
let introAlpha = 255;
let showIntro = true;
let cracks = [];
let arrowStartTime = 0;
let particles = []; 
let experienceStarted = false;
let btnHoverAlpha = 0;

let showInstructions = false;
let cursorX = 0;
let cursorY = 0;

let sliderGlitch, sliderVolume;

// --- DỮ LIỆU BUBBLE ---
let revealedDiseases = [];
let diseaseList = [
  { t: "Chronic Stress & Anxiety", s: "Constant monitoring of danger signs" },
  { t: "Mood Disorders", s: "Irritability, frustration, and anger" },
  { t: "Sleep Disturbance", s: "Difficulty falling asleep and reduced REM" },
  { t: "Cognitive Fatigue", s: "Decreased concentration and focus" },
  { t: "Hearing Impairment", s: "Tinnitus, distorted hearing, and loss" },
  { t: "Cardiovascular Issues", s: "High blood pressure and viscosity" },
  { t: "Heart Disease", s: "Linked to long-term stress hormones" },
  { t: "Pregnancy Risks", s: "Increased risk of preeclampsia" },
  { t: "Developmental Delays", s: "Impaired speech and communication" },
  { t: "Learning Difficulties", s: "Poor concentration and performance" },
  { t: "Permanent Damage", s: "Inability to hear specific frequencies" },
  { t: "Behavioral Issues", s: "Loss of confidence and social difficulty" },
];
let clickCount = 0;
let scene2StartTime = 0;

// --- DỮ LIỆU CÁT BỤI (SAND EFFECT) ---
let sandParticles = [];
let showFinalQuestion = true;
let questionDissolved = false;

// ======================================================
// SOUND & MEDIA
// ======================================================
let soundCho, soundCoiXe, soundMayKhoan;
let videoMorning, videoNight;
let videoCam, handposeModel;
let predictions = [];
let alphaMorning = 0;
let alphaNight = 255;
const FADE_SPEED = 0.25;
let scene1StartTime = 0;

function preload() {
  soundCho = loadSound("chợ.wav");
  soundCoiXe = loadSound("coi xe.wav");
  soundMayKhoan = loadSound("máy_khoan.wav");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  textAlign(CENTER, CENTER);

  for (let i = 0; i < 150; i++) {
    particles.push(new DustParticle());
  }

  const sliderStyle = `
    appearance: none;
    background: rgba(255, 255, 255, 0.1);
    height: 12px;
    border-radius: 10px;
    outline: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    &::-webkit-slider-thumb {
      appearance: none;
      width: 150px; 
      height: 12px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(255,255,255,0.6);
    }
  `;

  sliderGlitch = createSlider(0, 50, 20);
  sliderGlitch.position(width - 210, height - 110);
  sliderGlitch.style("width", "180px");
  sliderGlitch.style(sliderStyle);
  sliderGlitch.hide();

  sliderVolume = createSlider(0, 100, 50);
  sliderVolume.position(width - 210, height - 60);
  sliderVolume.style("width", "180px");
  sliderVolume.style(sliderStyle);
  sliderVolume.hide();

  initCracks();

  videoMorning = createVideo(["morning.mov"]);
  videoNight = createVideo(["night.mov"]);
  videoMorning.hide();
  videoNight.hide();
  videoMorning.volume(0);
  videoNight.volume(0);

  videoCam = createCapture(VIDEO);
  videoCam.size(640, 480);
  videoCam.hide();
  handposeModel = ml5.handpose(videoCam, { flipHorizontal: false }, () => {
    console.log("Handpose Ready");
  });
  handposeModel.on("predict", (r) => (predictions = r));
}

function draw() {
  background(10);
  cursorX = mouseX;
  cursorY = mouseY;

  if (scene === 0) {
    drawQuietScene();
  } else if (scene === 1) {
    drawVideoScene();
    drawUI();
    drawInfoBtn();
    if (millis() - scene1StartTime > 15000) {
      drawNavigationText(200); 
    }
    if (showInstructions) drawInstructionModal();
  } else if (scene === 2) {
    drawDiagnosticScene();
    drawRestartUI();
    drawFinalQuestionEffect();
  }
  drawCustomCursor();
}

// ======================================================
// CLASSES
// ======================================================

class DustParticle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
    this.size = random(1, 4);
    this.color = random([
      color(186, 210, 91), 
      color(140, 80, 255), 
      color(255, 120, 50), 
      color(50, 200, 255), 
      color(255, 255, 255)
    ]);
    this.noiseOffset = random(1000);
  }

  update() {
    let n = noise(this.noiseOffset + frameCount * 0.01);
    this.pos.add(this.vel);
    this.pos.x += map(n, 0, 1, -1, 1);
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }

  display(a) {
    push();
    noStroke();
    let finalColor = color(red(this.color), green(this.color), blue(this.color), a * 0.6);
    fill(finalColor);
    if (a > 50) {
      drawingContext.shadowBlur = this.size * 2;
      drawingContext.shadowColor = finalColor;
    }
    ellipse(this.pos.x, this.pos.y, this.size);
    pop();
  }
}

class SandParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-2, 0));
    this.acc = createVector(0, -0.05);
    this.alpha = 255;
    this.size = random(1, 3);
  }
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.alpha -= 3;
  }
  display() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

// ======================================================
// SCENE DRAWING FUNCTIONS
// ======================================================

function drawQuietScene() {
  for (let p of particles) {
    p.update();
    p.display(introAlpha);
  }

  if (!experienceStarted) {
    fill(240);
    noStroke();
    textFont("Zalando Sans Expanded");
    textSize(35);
    text("Wear headphone for a better experience", width / 2, height / 2 - 20);
    
    let btnY = height / 2 + 50;
    let isMouseOverBtn = dist(mouseX, mouseY, width / 2, btnY) < 60;
    btnHoverAlpha = lerp(btnHoverAlpha, isMouseOverBtn ? 255 : 100, 0.1);
    let breathe = map(sin(frameCount * 0.05), -1, 1, 150, 255);
    
    push();
    rectMode(CENTER);
    fill(255, map(btnHoverAlpha, 100, 255, 0, 40));
    stroke(255, btnHoverAlpha);
    strokeWeight(1.5);
    rect(width / 2, btnY, 200, 45, 20);
    noStroke();
    fill(255, max(breathe, btnHoverAlpha));
    textSize(14);
    text("CLICK TO START", width / 2, btnY + 2);
    pop();
    
    if (mouseIsPressed && isMouseOverBtn) startExperience();
    return;
  }
  
  if (showIntro) {
    introAlpha = lerp(introAlpha, 0, 0.05);
    if (introAlpha < 1) {
      showIntro = false;
      arrowStartTime = millis();
    }
  }
  
  if (hover) progress = min(progress + 0.003, 1);
  else progress = lerp(progress, 0, 0.05);
  
  soundCho.setVolume(progress * 0.7);
  soundCoiXe.setVolume(progress * 0.6);
  soundMayKhoan.setVolume(progress * 0.8);
  
  for (let c of cracks) c.draw(progress);
  
  textFont("Zalando Sans Expanded");
  textSize(32);
  fill(245);
  text("This is a quiet space.", width / 2, height * 0.48);
  
  textSize(18);
  let subW = textWidth("How long can it remain quiet?");
  let isOverSub = mouseX > width / 2 - subW / 2 && mouseX < width / 2 + subW / 2 &&
                  mouseY > height * 0.48 + 40 && mouseY < height * 0.48 + 60;
  fill(isOverSub ? color(186, 210, 91) : 245);
  text("How long can it remain quiet?", width / 2, height * 0.48 + 50);
  detectHover(width / 2, height * 0.48 + 50);
  
  if (!showIntro && millis() - arrowStartTime > 5000) {
    drawNavigationText(200);
  }
}

function drawFinalQuestionEffect() {
  if (showFinalQuestion) {
    push();
    textFont("Zalando Sans Expanded");
    textSize(20);
    let q = "Have you ever wondered how noise pollution affects humans?";
    let tw = textWidth(q);
    let qY = height - 120;
    
    let isHoverQ = mouseX > width/2 - tw/2 && mouseX < width/2 + tw/2 && mouseY > qY - 20 && mouseY < qY + 20;
    
    if (questionDissolved) {
      for (let i = sandParticles.length - 1; i >= 0; i--) {
        sandParticles[i].update();
        sandParticles[i].display();
        if (sandParticles[i].alpha <= 0) sandParticles.splice(i, 1);
      }
      if (sandParticles.length === 0) showFinalQuestion = false;
    } else {
      fill(isHoverQ ? color(186, 210, 91) : 200);
      text(q, width/2, qY);
    }
    pop();
  }
}

function dissolveQuestion() {
  if (!questionDissolved) {
    questionDissolved = true;
    let q = "Have you ever wondered how noise pollution affects humans?";
    textFont("Zalando Sans Expanded");
    textSize(20);
    let tw = textWidth(q);
    let qY = height - 120;
    
    // Create particles along the text line
    for (let i = 0; i < 400; i++) {
      sandParticles.push(new SandParticle(width/2 + random(-tw/2, tw/2), qY + random(-10, 10)));
    }
  }
}

function drawRestartUI() {
  push();
  let x = 60, y = 50;
  let txt = "RESTART THE JOURNEY";
  textFont("Zalando Sans Expanded");
  textSize(11);
  textStyle(BOLD);
  let tw = textWidth(txt);
  let isHover = mouseX > x - 20 && mouseX < x + tw + 40 && mouseY > y - 20 && mouseY < y + 20;
  translate(x, y);
  stroke(255, isHover ? 255 : 150);
  strokeWeight(1.5);
  noFill();
  push();
  if (isHover) rotate(sin(frameCount * 0.1) * 0.2); 
  arc(0, 0, 18, 18, -PI, HALF_PI);
  line(9, 0, 12, -3);
  line(9, 0, 6, -3);
  pop();
  noStroke();
  fill(255, isHover ? 255 : 150);
  textAlign(LEFT, CENTER);
  text(txt, 20, 1);
  if (isHover) {
    stroke(186, 210, 91);
    strokeWeight(1);
    line(20, 10, 20 + tw, 10);
  }
  pop();
}

function resetExperience() {
  scene = 0;
  progress = 0;
  experienceStarted = false;
  revealedDiseases = [];
  clickCount = 0;
  introAlpha = 255;
  showIntro = true;
  showFinalQuestion = true;
  questionDissolved = false;
  sandParticles = [];
  initCracks();
  soundCho.stop();
  soundCoiXe.stop();
  soundMayKhoan.stop();
  videoMorning.stop();
  videoNight.stop();
}

function drawNavigationText(fixedAlpha) {
  let posX = width / 2;
  let posY = height - 60;
  push();
  textAlign(CENTER, CENTER);
  textFont("Zalando Sans Expanded");
  noStroke();
  let txt = "click here to continue";
  textSize(12);
  let isOverCont = mouseX > posX - 100 && mouseX < posX + 100 &&
                   mouseY > posY - 20 && mouseY < posY + 20;
  let flicker = map(sin(frameCount * 0.08), -1, 1, 120, 255);
  if (isOverCont) {
    fill(186, 210, 91);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(186, 210, 91, 0.5)';
  } else {
    fill(255, min(fixedAlpha, flicker));
  }
  text(txt, posX, posY);
  stroke(isOverCont ? color(186, 210, 91) : color(255, 50));
  strokeWeight(1);
  line(posX - 20, posY + 12, posX + 20, posY + 12);
  pop();
}

function drawInfoBtn() {
  push();
  let x = 50, y = height - 50, r = 40;
  let isHover = dist(mouseX, mouseY, x, y) < r / 2;
  if (isHover) {
    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = "rgba(0, 255, 255, 0.6)";
    fill(255, 60);
  } else {
    fill(255, 20);
  }
  stroke(255, 180);
  strokeWeight(1.5);
  ellipse(x, y, r);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textFont("Zalando Sans Expanded");
  textStyle(BOLD);
  textSize(18);
  text("i", x, y - 2);
  pop();
}

function drawInstructionModal() {
  push();
  fill(0, 180);
  rect(0, 0, width, height);
  rectMode(CENTER);
  fill(255, 30);
  stroke(255, 100);
  strokeWeight(1.5);
  rect(width / 2, height / 2, 400, 220, 30);
  noStroke();
  fill(255);
  textFont("Zalando Sans Expanded");
  textSize(20);
  textStyle(BOLD);
  text("HOW TO INTERACT", width / 2, height / 2 - 60);
  textStyle(NORMAL);
  textSize(15);
  text("🖐 Open palm", width / 2, height / 2 - 10);
  text("✊ Clenched fist", width / 2, height / 2 + 30);
  fill(186, 210, 91);
  textSize(12);
  text("Click anywhere to close", width / 2, height / 2 + 80);
  pop();
}

function drawUI() {
  sliderGlitch.show();
  sliderVolume.show();
  push();
  rectMode(CORNER);
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.4)";
  fill(255, 25);
  stroke(255, 150);
  strokeWeight(1.5);
  rect(width - 230, height - 150, 215, 120, 30);
  noStroke();
  drawingContext.shadowBlur = 0;
  fill(255);
  textAlign(LEFT);
  textFont("Zalando Sans Expanded");
  textStyle(BOLD);
  textSize(10);
  text("FILTER INTENSITY", width - 210, height - 125);
  text("AUDIO VOLUME", width - 210, height - 75);
  pop();
}

// ======================================================
// UPDATED INTERACTION LOGIC
// ======================================================
function drawVideoScene() {
  // Logic đảo ngược: 
  // Mở tay -> Urban Night (City)
  // Nắm tay -> Morning (Quiet)
  let targetMorning = 255, targetNight = 0; 
  
  if (predictions.length > 0) {
    let landmarks = predictions[0].landmarks;
    let handSize = dist(landmarks[0][0], landmarks[0][1], landmarks[12][0], landmarks[12][1]);
    let d1 = dist(landmarks[8][0], landmarks[8][1], landmarks[0][0], landmarks[0][1]);
    let d2 = dist(landmarks[12][0], landmarks[12][1], landmarks[0][0], landmarks[0][1]);
    
    // Nếu khoảng cách ngón tay xa cổ tay (Mở lòng bàn tay)
    if ((d1 + d2) / 2 > handSize * 1.1) {
      targetMorning = 0;   // Ẩn buổi sáng
      targetNight = 255;   // Hiện thành phố
    } else {
      // Ngược lại (Nắm tay)
      targetMorning = 255; // Hiện buổi sáng
      targetNight = 0;     // Ẩn thành phố
    }
  }

  alphaMorning = lerp(alphaMorning, targetMorning, FADE_SPEED);
  alphaNight = lerp(alphaNight, targetNight, FADE_SPEED);
  
  let intensity = sliderGlitch.value();
  let masterVol = sliderVolume.value() / 100;

  push();
  if (intensity === 0) {
    if (alphaMorning > 1) { tint(255, alphaMorning); image(videoMorning, 0, 0, width, height); }
    if (alphaNight > 1) { tint(255, alphaNight); image(videoNight, 0, 0, width, height); }
  } else {
    applyPixelatedGlitch(intensity);
  }
  pop();
  
  videoMorning.volume((alphaMorning / 255) * masterVol);
  videoNight.volume((alphaNight / 255) * masterVol);
}

function applyPixelatedGlitch(intensity) {
  let activeVid = alphaMorning > alphaNight ? videoMorning : videoNight;
  let activeAlpha = alphaMorning > alphaNight ? alphaMorning : alphaNight;
  activeVid.loadPixels();
  if (activeVid.pixels.length > 0) {
    let stepSize = floor(map(intensity, 1, 50, 4, 40));
    for (let y = 0; y < height; y += stepSize) {
      for (let x = 0; x < width; x += stepSize) {
        let vidX = floor(map(x, 0, width, 0, activeVid.width));
        let vidY = floor(map(y, 0, height, 0, activeVid.height));
        let index = (vidX + vidY * activeVid.width) * 4;
        let r = activeVid.pixels[index];
        let g = activeVid.pixels[index + 1];
        let b = activeVid.pixels[index + 2];
        let xOffset = random(-intensity, intensity) * 1.5;
        let yOffset = random(-intensity, intensity) * 0.3;
        fill(r, g, b, activeAlpha);
        noStroke();
        rect(x + xOffset, y + yOffset, stepSize + random(intensity * 2), stepSize);
      }
    }
  }
}

function drawDiagnosticScene() {
  background(5);
  sliderGlitch.hide();
  sliderVolume.hide();
  for (let b of revealedDiseases) {
    b.scale = lerp(b.scale, 1, 0.15);
    b.alpha = lerp(b.alpha, 255, 0.1);
    let fy = sin(frameCount * 0.05 + b.seed) * 5;
    drawFixedBubble(b.x, b.y + fy, b.info.t, b.info.s, b.alpha, b.scale);
  }
}

function drawFixedBubble(x, y, title, status, a, s) {
  push();
  translate(x, y);
  scale(s);
  let w = 340;
  let h = 100;
  fill(186, 210, 91, a);
  noStroke();
  beginShape();
  vertex(0, 0);
  vertex(15, -15);
  vertex(30, -15);
  endShape(CLOSE);
  push();
  translate(0, -h - 13);
  let grad = drawingContext.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, `rgba(186, 210, 91, ${a / 255})`);
  grad.addColorStop(1, `rgba(180, 150, 230, ${a / 255})`);
  drawingContext.fillStyle = grad;
  rect(0, 0, w, h, 20);
  textAlign(LEFT, TOP);
  textFont("Zalando Sans Expanded");
  fill(30, a * 0.9);
  textSize(16);
  textStyle(BOLD);
  text(title, 22, 18);
  textSize(12);
  textStyle(NORMAL);
  fill(50, a * 0.8);
  text(status, 22, 45, w - 44);
  pop();
  pop();
}

function mousePressed() {
  if (showInstructions) {
    showInstructions = false;
    return;
  }

  let posX = width / 2;
  let posY = height - 60;
  
  if (scene === 2) {
    let restartX = 60, restartY = 50;
    let twRestart = textWidth("RESTART THE JOURNEY");
    if (mouseX > restartX - 20 && mouseX < restartX + twRestart + 40 && mouseY > restartY - 20 && mouseY < restartY + 20) {
      resetExperience();
      return;
    }

    if (showFinalQuestion && !questionDissolved) {
      let qText = "Have you ever wondered how noise pollution affects humans?";
      textFont("Zalando Sans Expanded");
      textSize(20);
      let tw = textWidth(qText);
      let qY = height - 120;
      if (mouseX > width/2 - tw/2 && mouseX < width/2 + tw/2 && mouseY > qY - 20 && mouseY < qY + 20) {
        dissolveQuestion();
        return;
      }
    }
  }
  
  if (scene === 0 && !showIntro && millis() - arrowStartTime > 5000) {
    if (mouseX > posX - 100 && mouseX < posX + 100 && mouseY > posY - 20 && mouseY < posY + 20) {
      scene = 1;
      scene1StartTime = millis();
      soundCho.stop(); soundCoiXe.stop(); soundMayKhoan.stop();
      videoMorning.loop(); videoNight.loop();
      return;
    }
  }
  
  if (scene === 1 && millis() - scene1StartTime > 1000) {
    if (dist(mouseX, mouseY, 50, height - 50) < 25) {
      showInstructions = true;
      return;
    }

    if (millis() - scene1StartTime > 15000) {
       if (mouseX > posX - 100 && mouseX < posX + 100 && mouseY > posY - 20 && mouseY < posY + 20) {
          scene = 2;
          scene2StartTime = millis();
          videoMorning.stop(); videoNight.stop();
          return;
       }
    }
  }
  
  if (scene === 2) {
    let index = clickCount % diseaseList.length;
    revealedDiseases.push({
      x: mouseX, y: mouseY,
      info: diseaseList[index],
      alpha: 0, scale: 0.2, seed: random(1000),
    });
    clickCount++;
  }
}

function drawCustomCursor() {
  push();
  let gradSize = 35;
  let grad = drawingContext.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, gradSize);
  grad.addColorStop(0, "rgba(186, 210, 91, 0.9)");
  grad.addColorStop(0.3, "rgba(255, 240, 150, 0.7)");
  grad.addColorStop(0.6, "rgba(230, 160, 230, 0.4)");
  grad.addColorStop(1, "rgba(180, 200, 255, 0)");
  drawingContext.fillStyle = grad;
  noStroke();
  ellipse(cursorX, cursorY, gradSize * 2, gradSize * 2);
  fill(255, 200);
  ellipse(cursorX, cursorY, 4, 4);
  pop();
}

function startExperience() {
  userStartAudio();
  soundCho.loop(); soundCoiXe.loop(); soundMayKhoan.loop();
  soundCho.setVolume(0); soundCoiXe.setVolume(0); soundMayKhoan.setVolume(0);
  startTime = millis();
  experienceStarted = true;
}

function detectHover(x, y) {
  textFont("Zalando Sans Expanded");
  textSize(18);
  let w = textWidth("How long can it remain quiet?");
  hover = mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - 20 && mouseY < y + 20;
}

class Crack {
  constructor(x, y, a) {
    this.pts = [];
    let px = x, py = y;
    for (let i = 0; i < 1000; i += 5) {
      px += cos(a) * 5 + random(-1, 1);
      py += sin(a) * 5 + random(-1, 1);
      this.pts.push(createVector(px, py));
    }
    this.col = color(random(150, 255), random(150, 255), random(200, 255));
  }
  draw(p) {
    if (p < 0.01) return;
    let n = floor(this.pts.length * p);
    push(); noFill();
    stroke(red(this.col), green(this.col), blue(this.col), 40);
    strokeWeight(3);
    beginShape();
    for (let j = 0; j < n; j++) vertex(this.pts[j].x, this.pts[j].y);
    endShape();
    stroke(this.col); strokeWeight(1);
    beginShape();
    for (let j = 0; j < n; j++) vertex(this.pts[j].x, this.pts[j].y);
    endShape();
    pop();
  }
}

function initCracks() {
  cracks = [];
  for (let i = 0; i < 50; i++) cracks.push(new Crack(width / 2, height * 0.48, random(TWO_PI)));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  sliderGlitch.position(width - 210, height - 110);
  sliderVolume.position(width - 210, height - 60);
}