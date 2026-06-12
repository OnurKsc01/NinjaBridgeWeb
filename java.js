Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// ------------------------------------
// TELEGRAM & OYUNCU VERİLERİ
// ------------------------------------
let tg = window.Telegram?.WebApp;
let user = tg?.initDataUnsafe?.user;
let tgUserId = user ? user.id : 123456789;
let tgUserName = user ? user.first_name : "Test Oyuncusu";

let startParam = tg?.initDataUnsafe?.start_param;
let tgGroupId = startParam ? Number(startParam) : 0;

let playerCoins = 0;
let currentSkin = "default";
let ownedSkins = ["default"];
let currentBg = "default";
let ownedBgs = ["default"];

// ------------------------------------
// MARKET VERİTABANI
// ------------------------------------
const skinData = {
  "default": { name: "Varsayılan", price: 0, body: "black", bandana: "red", alpha: 1 },
  "hayalet": { name: "Hayalet Ninja", price: 10, body: "#ffffff", bandana: "#cccccc", alpha: 0.4 },
  "yesil": { name: "Yeşil Ninja", price: 20, body: "#228B22", bandana: "black", alpha: 1 },
  "bronz": { name: "Bronz Ninja", price: 30, body: "#cd7f32", bandana: "#5c4033", alpha: 1 },
  "demir": { name: "Demir Ninja", price: 40, body: "#a9a9a9", bandana: "#696969", alpha: 1 },
  "altin": { name: "Altın Ninja", price: 50, body: "#ffd700", bandana: "#b8860b", alpha: 1 },
  "hiper": { name: "Hiper Ninja", price: 65, body: "#800080", bandana: "#00ffff", alpha: 1 },
  "golge": { name: "Gölge Katili", price: 80, body: "#1a1a1a", bandana: "#4a0000", alpha: 1 },
  "buzul": { name: "Buzul Ninja", price: 100, body: "#add8e6", bandana: "#ffffff", alpha: 1 }
};

const bgData = {
  "default": { name: "Gündüz Vadisi", price: 0, top: "#BBD691", bottom: "#FEF1E1", hill1: "#95C629", hill2: "#659F1C", tree: "#7D833C", leaves: ["#6D8821", "#8FAC34", "#98B333"] },
  "gece": { name: "Gece Yarısı", price: 50, top: "#0B1D3A", bottom: "#1A0B2E", hill1: "#1A2A42", hill2: "#0D1B2A", tree: "#1E1E1E", leaves: ["#2B3A42", "#1A2A42", "#3B4A52"] },
  "kanli": { name: "Kanlı Ay", price: 100, top: "#4A0000", bottom: "#1A0000", hill1: "#590000", hill2: "#330000", tree: "#1A0000", leaves: ["#660000", "#800000", "#4D0000"] },
  "col": { name: "Çöl Sıcağı", price: 150, top: "#FF8C00", bottom: "#FFD700", hill1: "#CD853F", hill2: "#8B4513", tree: "#5C4033", leaves: ["#D2B48C", "#F4A460", "#DEB887"] }
};

// ------------------------------------
// OYUN DEĞİŞKENLERİ
// ------------------------------------
let phase = "waiting"; 
let lastTimestamp; 
let heroX, heroY, sceneOffset; 
let platforms = [], sticks = [], trees = [];
let score = 0;
let combo = 0; 

const canvasWidth = 375, canvasHeight = 375, platformHeight = 100;
const heroDistanceFromEdge = 10, paddingX = 100, perfectAreaSize = 10;
const backgroundSpeedMultiplier = 0.2;
const hill1BaseHeight = 100, hill1Amplitude = 10, hill1Stretch = 1;
const hill2BaseHeight = 70, hill2Amplitude = 20, hill2Stretch = 0.5;
const stretchingSpeed = 4, turningSpeed = 4, walkingSpeed = 4, transitioningSpeed = 2, fallingSpeed = 2;
const heroWidth = 17, heroHeight = 30; 

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const coinCountElement = document.getElementById("coinCount");
const shopCoinCountElement = document.getElementById("shopCoinCount");

loadPlayerData();

function loadPlayerData() {
    fetch(`https://ninja-bridge-api.onrender.com/api/score/player/${tgUserId}`)
        .then(res => res.json())
        .then(data => {
            playerCoins = data.coins || 0;
            currentSkin = data.currentSkin || "default";
            ownedSkins = data.ownedSkins || ["default"];
            currentBg = data.currentBackground || "default";
            ownedBgs = data.ownedBackgrounds || ["default"];
            updateCoinUI();
            resetGame(); // Veri yüklendikten sonra oyunu başlat
        }).catch(err => console.error("Veri çekilemedi:", err));
}

function updateCoinUI() {
    coinCountElement.innerText = playerCoins;
    shopCoinCountElement.innerText = playerCoins;
}

function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  combo = 0; 

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  for(let i=0; i<4; i++) generatePlatform();
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
  trees = [];
  for(let i=0; i<10; i++) generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;
  draw();
}

function generateTree() {
  let bg = bgData[currentBg] || bgData["default"];
  const minimumGap = 30, maximumGap = 150;
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  trees.push({ x, color: bg.leaves[Math.floor(Math.random() * 3)] });
}

function generatePlatform() {
  let difficultyMultiplier = Math.min(score / 50, 0.50); 
  const minimumGap = 40 + (difficultyMultiplier * 20);
  const maximumGap = 90 + (difficultyMultiplier * 40); 
  const minimumWidth = 40;
  const maximumWidth = Math.max(100 - (difficultyMultiplier * 40), 40);

  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

function isMenuOpen() {
    return document.getElementById("shopModal").style.display === "block" || 
           document.getElementById("leaderboardModal").style.display === "block";
}

window.addEventListener("mousedown", (e) => { if (!isMenuOpen() && phase == "waiting" && e.target.tagName === 'CANVAS') startStretching(); });
window.addEventListener("touchstart", (e) => { if (!isMenuOpen() && phase == "waiting" && e.target.tagName === 'CANVAS') startStretching(); });
window.addEventListener("mouseup", () => { if (phase == "stretching") phase = "turning"; });
window.addEventListener("touchend", () => { if (phase == "stretching") phase = "turning"; });

function startStretching() {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    window.requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

window.requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      return; 
    case "stretching":
      let currentSpeedFactor = Math.max(stretchingSpeed - (score * 0.015), 2.8);
      sticks.last().length += (timestamp - lastTimestamp) / currentSpeedFactor;
      break;
    case "turning":
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;
        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          if (perfectHit) {
            combo++;
            let earnedPoints = 1 + combo; 
            score += earnedPoints;
            perfectElement.innerText = `🔥 KUSURSUZ! +${earnedPoints}\n${combo}x COMBO`;
            perfectElement.style.color = "#FFD700"; 
          } else {
            combo = 0; 
            score += 1;
            perfectElement.innerText = "";
          }
          scoreElement.innerText = score;
          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1200);
          }
          generatePlatform(); generateTree(); generateTree();
        }
        phase = "walking";
      }
      break;
    case "walking":
      heroX += (timestamp - lastTimestamp) / walkingSpeed;
      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    case "transitioning":
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
      const [nextPlatform2] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform2.x + nextPlatform2.w - paddingX) {
        sticks.push({ x: nextPlatform2.x + nextPlatform2.w, length: 0, rotation: 0 });
        phase = "waiting";
      }
      break;
    case "falling":
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        
        fetch('https://ninja-bridge-api.onrender.com/api/score/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: tgUserId, firstName: tgUserName, score: score, groupId: tgGroupId })
        })
        .then(response => response.json())
        .then(data => {
            if(data.earnedCoins > 0) {
                playerCoins += data.earnedCoins;
                updateCoinUI();
            }
        }).catch(err => console.error(err));
        return;
      }
      break;
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

restartButton.addEventListener("click", (e) => {
  e.preventDefault();
  resetGame();
});

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
  let skin = skinData[currentSkin] || skinData["default"];

  ctx.save();
  ctx.globalAlpha = skin.alpha; 
  ctx.fillStyle = skin.body;
  ctx.translate(heroX - heroWidth / 2, heroY + canvasHeight - platformHeight - heroHeight / 2);

  drawRoundedRect(-heroWidth / 2, -heroHeight / 2, heroWidth, heroHeight - 4, 5);

  ctx.fillStyle = skin.body; 
  if(skin.body === "#ffffff") ctx.fillStyle = "#cccccc"; 
  const legDistance = 5;
  ctx.beginPath(); ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill();
  ctx.beginPath(); ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "white";
  if(skin.body === "#ffffff") ctx.fillStyle = "black"; // Hayalet gözü
  ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.fillStyle = skin.bandana;
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
  ctx.beginPath(); ctx.moveTo(-9, -14.5); ctx.lineTo(-17, -18.5); ctx.lineTo(-14, -8.5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -10.5); ctx.lineTo(-15, -3.5); ctx.lineTo(-5, -7); ctx.fill();

  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius); ctx.lineTo(x, y + height - radius); ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height); ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius); ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y); ctx.arcTo(x, y, x, y + radius, radius); ctx.fill();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);
    ctx.beginPath(); ctx.lineWidth = 2; ctx.moveTo(0, 0); ctx.lineTo(0, -stick.length); ctx.stroke();
    ctx.restore();
  });
}

function drawBackground() {
  let bg = bgData[currentBg] || bgData["default"];

  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, bg.top); 
  gradient.addColorStop(1, bg.bottom);
  ctx.fillStyle = gradient; 
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, bg.hill1);
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, bg.hill2);
  
  trees.forEach((tree) => drawTree(tree.x, tree.color, bg.tree));
}

function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath(); ctx.moveTo(0, window.innerHeight); ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) { ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch)); }
  ctx.lineTo(window.innerWidth, window.innerHeight); ctx.fillStyle = color; ctx.fill();
}

function drawTree(x, color, trunkColor) {
  ctx.save();
  ctx.translate((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, getTreeY(x, hill1BaseHeight, hill1Amplitude));
  ctx.fillStyle = trunkColor; ctx.fillRect(-1, -5, 2, 5);
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(0, -30); ctx.lineTo(5, -5); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) { return (Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + window.innerHeight - baseHeight); }
function getTreeY(x, baseHeight, amplitude) { return Math.sinus(x) * amplitude + window.innerHeight - baseHeight; }

// ------------------------------------
// MARKET SİSTEMİ VE MODALI
// ------------------------------------
document.getElementById("shopBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("shopModal").style.display = "block";
    renderShop();
});

document.getElementById("closeShop").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("shopModal").style.display = "none"; });

function renderShop() {
    const list = document.getElementById("shopList");
    
    // Kostümler Başlığı
    let html = `<li style="background:#ddd; justify-content:center; padding:5px; font-size:1.1em;">🥷 <b>KOSTÜMLER</b></li>`;
    
    Object.keys(skinData).forEach(key => {
        const skin = skinData[key];
        let actionHTML = "";
        if (currentSkin === key) actionHTML = `<span class="equipped-txt">✅</span>`;
        else if (ownedSkins.includes(key)) actionHTML = `<button class="equip-btn" onclick="equipSkin('${key}')">Kuşan</button>`;
        else actionHTML = `<button class="buy-btn" onclick="buySkin('${key}', ${skin.price})">🪙 ${skin.price}</button>`;

        html += `<li><span><span style="color:${skin.body}; text-shadow: 1px 1px 1px black;">⬤</span> ${skin.name}</span> ${actionHTML}</li>`;
    });

    // Arka Planlar Başlığı
    html += `<li style="background:#ddd; justify-content:center; padding:5px; font-size:1.1em; margin-top:10px;">🌌 <b>ARKA PLANLAR</b></li>`;

    Object.keys(bgData).forEach(key => {
        const bg = bgData[key];
        let actionHTML = "";
        if (currentBg === key) actionHTML = `<span class="equipped-txt">✅</span>`;
        else if (ownedBgs.includes(key)) actionHTML = `<button class="equip-btn" onclick="equipBg('${key}')">Kuşan</button>`;
        else actionHTML = `<button class="buy-btn" onclick="buyBg('${key}', ${bg.price})">🪙 ${bg.price}</button>`;

        html += `<li><span><span style="color:${bg.top}; text-shadow: 1px 1px 1px black;">🟩</span> ${bg.name}</span> ${actionHTML}</li>`;
    });

    list.innerHTML = html;
}

window.buySkin = function(skinKey, price) {
    if(playerCoins < price) { alert("Yetersiz Jeton!"); return; }
    if(confirm(`${skinData[skinKey].name} kostümünü alacaksın. Onaylıyor musun?`)) {
        fetch('https://ninja-bridge-api.onrender.com/api/score/buyskin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: skinKey, price: price })
        }).then(res => res.json()).then(data => {
            if(data.success) { playerCoins -= price; ownedSkins.push(skinKey); updateCoinUI(); renderShop(); }
        });
    }
}

window.equipSkin = function(skinKey) {
    fetch('https://ninja-bridge-api.onrender.com/api/score/equipskin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: skinKey })
    }).then(res => res.json()).then(data => {
        if(data.success) { currentSkin = skinKey; renderShop(); draw(); }
    });
}

window.buyBg = function(bgKey, price) {
    if(playerCoins < price) { alert("Yetersiz Jeton!"); return; }
    if(confirm(`${bgData[bgKey].name} arka planını alacaksın. Onaylıyor musun?`)) {
        fetch('https://ninja-bridge-api.onrender.com/api/score/buybg', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: bgKey, price: price })
        }).then(res => res.json()).then(data => {
            if(data.success) { playerCoins -= price; ownedBgs.push(bgKey); updateCoinUI(); renderShop(); }
        });
    }
}

window.equipBg = function(bgKey) {
    fetch('https://ninja-bridge-api.onrender.com/api/score/equipbg', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: bgKey })
    }).then(res => res.json()).then(data => {
        if(data.success) { currentBg = bgKey; renderShop(); draw(); }
    });
}
