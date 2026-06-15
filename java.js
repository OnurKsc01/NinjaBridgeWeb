Array.prototype.last = function () { return this[this.length - 1]; };
Math.sinus = function (degree) { return Math.sin((degree / 180) * Math.PI); };

// ------------------------------------
// TELEGRAM & OYUNCU VERİLERİ
// ------------------------------------
let tg = window.Telegram?.WebApp;
let user = tg?.initDataUnsafe?.user;
let tgUserId = user ? user.id : 123456789;
let tgUserName = user ? user.first_name : "Test Oyuncusu";

let startParam = tg?.initDataUnsafe?.start_param;
const urlParams = new URLSearchParams(window.location.search);
let urlGroupId = urlParams.get('groupid') || urlParams.get('startapp');
let tgGroupId = startParam ? Number(startParam) : (urlGroupId ? Number(urlGroupId) : 0);

// API'den Gelecek Veriler
let playerCoins = 0; 
let playerGems = 0; 
let sessionEarnedCoins = 0; 
let stepCount = 0; 
// Şimdilik sadece logic olarak var, ekrana çizdirilmiyor (kasma yapmasın diye)
let currentSkin = "default"; 
let currentPet = "default"; 
let ownedPets = {}; 

// HTML Elementleri
const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const coinCountElement = document.getElementById("coinCount");
const shopCoinCountElement = document.getElementById("shopCoinCount");

// ------------------------------------
// OYUN İÇİ DEĞİŞKENLER (SAF MOTOR)
// ------------------------------------
let phase = "waiting"; 
let lastTimestamp; 
let heroX; 
let heroY; 
let sceneOffset; 
let platforms = [];
let sticks = [];
let trees = [];
let score = 0;
let combo = 0;

const canvasWidth = 375, canvasHeight = 375, platformHeight = 100; 
const heroDistanceFromEdge = 10, paddingX = 100, perfectAreaSize = 10;
const backgroundSpeedMultiplier = 0.2; 
const hill1BaseHeight = 100, hill1Amplitude = 10, hill1Stretch = 1; 
const hill2BaseHeight = 70, hill2Amplitude = 20, hill2Stretch = 0.5;
const stretchingSpeed = 4, turningSpeed = 4, walkingSpeed = 4;
const transitioningSpeed = 2, fallingSpeed = 2; 
const heroWidth = 17, heroHeight = 30; 

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// ------------------------------------
// API BAĞLANTILARI
// ------------------------------------
function loadPlayerData() {
    fetch(`https://ninja-bridge-api.onrender.com/api/score/player/${tgUserId}`)
        .then(res => res.json())
        .then(data => {
            playerCoins = data.coins || 0; 
            playerGems = data.gems || 0;
            currentSkin = data.currentSkin || "default"; 
            currentPet = data.currentPet || "default"; 
            ownedPets = data.ownedPets || {}; 
            updateCoinUI(); 
        }).catch(err => console.error("Veri çekilemedi", err));
}

function updateCoinUI() { 
    coinCountElement.innerHTML = `🪙 ${playerCoins} | 💎 ${playerGems}`; 
    shopCoinCountElement.innerHTML = `🪙 ${playerCoins} | 💎 ${playerGems}`; 
}

function saveScoreToAPI() {
    // Ekranda cüzdanı güncelle
    if (sessionEarnedCoins > 0) {
        playerCoins += sessionEarnedCoins;
        updateCoinUI();
    }
    fetch('https://ninja-bridge-api.onrender.com/api/score/save', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
        body: JSON.stringify({ userId: tgUserId, firstName: tgUserName, score: score, groupId: tgGroupId, earnedCoins: sessionEarnedCoins, earnedGems: 0 }) 
    }).catch(e => console.error("Kayıt hatası:", e));
}

function processCoinGeneration(earnedPts) {
    stepCount += earnedPts; 
    let reqSteps = 8; 
    // Logic olarak kurt/köpek hesabı (Çizim yok, sadece matematik)
    if (currentPet === "kopek" || currentPet === "kurt") { 
        let lvl = ownedPets[currentPet] || 1; 
        reqSteps = Math.max(1, 8 - lvl); 
    } 
    if (stepCount >= reqSteps) { 
        let coinsToAdd = Math.floor(stepCount / reqSteps);
        sessionEarnedCoins += coinsToAdd; 
        stepCount = stepCount % reqSteps; 
    }
}

// Menüler açıkken Canvas'a tıklamayı engelle
function isMenuOpen() { 
    return document.getElementById("shopModal").style.display === "block" || 
           document.getElementById("leaderboardModal").style.display === "block"; 
}

loadPlayerData();
resetGame();

function resetGame() {
  phase = "waiting"; lastTimestamp = undefined; sceneOffset = 0; score = 0; combo = 0; 
  sessionEarnedCoins = 0; stepCount = 0; 

  introductionElement.style.opacity = 1; perfectElement.style.opacity = 0;
  restartButton.style.display = "none"; scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  generatePlatform(); generatePlatform(); generatePlatform(); generatePlatform();
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = []; for(let i=0; i<10; i++) generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge; heroY = 0;
  draw();
}

function generateTree() {
  const minimumGap = 30, maximumGap = 150;
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  trees.push({ x, color: treeColors[Math.floor(Math.random() * 3)] });
}

function generatePlatform() {
  const minimumGap = 40, maximumGap = 200, minimumWidth = 20, maximumWidth = 100;
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  platforms.push({ x, w });
}

window.addEventListener("mousedown", function (event) { if (!isMenuOpen() && phase == "waiting") { lastTimestamp = undefined; introductionElement.style.opacity = 0; phase = "stretching"; window.requestAnimationFrame(animate); }});
window.addEventListener("touchstart", function (event) { if (!isMenuOpen() && phase == "waiting") { lastTimestamp = undefined; introductionElement.style.opacity = 0; phase = "stretching"; window.requestAnimationFrame(animate); }});
window.addEventListener("mouseup", function (event) { if (phase == "stretching") phase = "turning"; });
window.addEventListener("touchend", function (event) { if (phase == "stretching") phase = "turning"; });
window.addEventListener("resize", function (event) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; draw(); });

window.requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) { lastTimestamp = timestamp; window.requestAnimationFrame(animate); return; }
  
  let dt = timestamp - lastTimestamp;
  if (dt >= 12 && dt <= 20) { dt = 16.66; } 
  else if (dt > 32) { dt = 16.66; } 

  switch (phase) {
    case "waiting": return; 
    case "stretching": { sticks.last().length += dt / stretchingSpeed; break; }
    case "turning": {
      sticks.last().rotation += dt / turningSpeed;
      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;
        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          let earnedPts = 0;
          if (perfectHit) {
             combo++; earnedPts = 1 + combo; score += earnedPts;
             perfectElement.innerText = `🔥 KUSURSUZ! +${earnedPts}`;
             perfectElement.style.opacity = 1; setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          } else {
             combo = 0; earnedPts = 1; score += earnedPts; perfectElement.innerText = "";
          }
          
          processCoinGeneration(earnedPts); // Jeton hesaplaması
          scoreElement.innerText = score; 
          
          generatePlatform(); generateTree(); generateTree();
        }
        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += dt / walkingSpeed;
      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) { heroX = maxHeroX; phase = "transitioning"; }
      } else {
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) { heroX = maxHeroX; phase = "falling"; }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += dt / transitioningSpeed;
      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        sticks.push({ x: nextPlatform.x + nextPlatform.w, length: 0, rotation: 0 });
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180) sticks.last().rotation += dt / turningSpeed;
      heroY += dt / fallingSpeed;
      const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        saveScoreToAPI(); // Kaydet ve Bitir
        return;
      }
      break;
    }
  }

  draw();
  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90) throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;
  const platformTheStickHits = platforms.find((platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w);
  if (platformTheStickHits && platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 < stickFarX && stickFarX < platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2)
    return [platformTheStickHits, true];
  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();
  ctx.translate((window.innerWidth - canvasWidth) / 2 - sceneOffset, (window.innerHeight - canvasHeight) / 2);
  drawPlatforms();
  drawHero();
  drawSticks();
  ctx.restore();
}

restartButton.addEventListener("click", function (event) { event.preventDefault(); resetGame(); });

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "black";
    ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight + (window.innerHeight - canvasHeight) / 2);
    if (sticks.last().x < x) {
      ctx.fillStyle = "red";
      ctx.fillRect(x + w / 2 - perfectAreaSize / 2, canvasHeight - platformHeight, perfectAreaSize, perfectAreaSize);
    }
  });
}

function drawHero() {
  ctx.save();
  // Renk mantığı
  let bodyColor = "black"; let bandanaColor = "red";
  if(currentSkin === "yesil") { bodyColor = "#228B22"; bandanaColor = "black"; }
  else if(currentSkin === "altin") { bodyColor = "#ffd700"; bandanaColor = "#b8860b"; }
  
  ctx.fillStyle = bodyColor;
  ctx.translate(heroX - heroWidth / 2, heroY + canvasHeight - platformHeight - heroHeight / 2);
  drawRoundedRect(-heroWidth / 2, -heroHeight / 2, heroWidth, heroHeight - 4, 5);
  
  const legDistance = 5;
  ctx.beginPath(); ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill();
  ctx.beginPath(); ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill();
  
  ctx.beginPath(); ctx.fillStyle = "white"; ctx.arc(5, -7, 3, 0, Math.PI * 2, false); ctx.fill();
  
  ctx.fillStyle = bandanaColor;
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
  ctx.beginPath(); ctx.moveTo(-9, -14.5); ctx.lineTo(-17, -18.5); ctx.lineTo(-14, -8.5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -10.5); ctx.lineTo(-15, -3.5); ctx.lineTo(-5, -7); ctx.fill();
  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath(); ctx.moveTo(x, y + radius); ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius); ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius); ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius); ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius); ctx.fill();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save(); ctx.translate(stick.x, canvasHeight - platformHeight); ctx.rotate((Math.PI / 180) * stick.rotation);
    ctx.beginPath(); ctx.lineWidth = 2; ctx.moveTo(0, 0); ctx.lineTo(0, -stick.length); ctx.stroke(); ctx.restore();
  });
}

function drawBackground() {
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#BBD691"); gradient.addColorStop(1, "#FEF1E1");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");
  trees.forEach((tree) => drawTree(tree.x, tree.color));
}

function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath(); ctx.moveTo(0, window.innerHeight); ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) { ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch)); }
  ctx.lineTo(window.innerWidth, window.innerHeight); ctx.fillStyle = color; ctx.fill();
}

function drawTree(x, color) {
  ctx.save(); ctx.translate((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, getTreeY(x, hill1BaseHeight, hill1Amplitude));
  const treeTrunkHeight = 5, treeTrunkWidth = 2, treeCrownHeight = 25, treeCrownWidth = 10;
  ctx.fillStyle = "#7D833C"; ctx.fillRect(-treeTrunkWidth / 2, -treeTrunkHeight, treeTrunkWidth, treeTrunkHeight);
  ctx.beginPath(); ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight); ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight)); ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + sineBaseY;
}
function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

// ------------------------------------
// UI BUTON İŞLEMLERİ (Menü Aç/Kapat)
// ------------------------------------
document.getElementById("leaderboardBtn").addEventListener("click", () => { 
    document.getElementById("leaderboardModal").style.display = "block"; 
    const list = document.getElementById("scoreList"); list.innerHTML = "<li style='text-align:center;'>Yükleniyor... ⏳</li>"; 
    fetch(`https://ninja-bridge-api.onrender.com/api/score/global?t=${Date.now()}`).then(res => res.json()).then(data => { 
        list.innerHTML = ""; 
        if(data.length === 0) { list.innerHTML = "<li>Henüz kimse oynamadı!</li>"; return; } 
        data.forEach((item, i) => { list.innerHTML += `<li style="padding:4px; border-bottom:1px solid #ddd;"><b>${i + 1}.</b> ${item.name} <span style="float:right;">${item.score} Puan</span></li>`; }); 
    }).catch(() => list.innerHTML = "<li style='color:red;'>Hata oluştu!</li>"); 
}); 
document.getElementById("closeLeaderboard").addEventListener("click", () => { document.getElementById("leaderboardModal").style.display = "none"; });

document.getElementById("shopBtn").addEventListener("click", () => { 
    document.getElementById("shopModal").style.display = "block"; 
    const list = document.getElementById("shopList");
    list.innerHTML = `<li style="padding: 10px; text-align:center; color:gray;">(Market yapısı eklenmeye hazır. Şimdilik sadece cüzdan entegre edildi.)</li>`;
});
document.getElementById("closeShop").addEventListener("click", () => { document.getElementById("shopModal").style.display = "none"; });
