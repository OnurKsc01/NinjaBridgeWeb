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

// 🔥 YENİ: Botun URL sonuna eklediği startapp (Grup ID) bilgisini yakalıyoruz
let startParam = tg?.initDataUnsafe?.start_param;
let tgGroupId = startParam ? Number(startParam) : 0;

let playerCoins = 0;
let currentSkin = "default";
let ownedSkins = ["default"];

// ------------------------------------
// KOSTÜM (SKIN) VERİTABANI
// ------------------------------------
const skinData = {
  "default": { name: "Varsayılan", price: 0, body: "black", bandana: "red", alpha: 1 },
  "hayalet": { name: "Hayalet Ninja", price: 10, body: "#ffffff", bandana: "#cccccc", alpha: 0.4 },
  "yesil": { name: "Yeşil Ninja", price: 20, body: "#228B22", bandana: "black", alpha: 1 },
  "bronz": { name: "Bronz Ninja", price: 30, body: "#cd7f32", bandana: "#5c4033", alpha: 1 },
  "demir": { name: "Demir Ninja", price: 40, body: "#a9a9a9", bandana: "#696969", alpha: 1 },
  "altin": { name: "Altın Ninja", price: 50, body: "#ffd700", bandana: "#b8860b", alpha: 1 },
  "hiper": { name: "Hiper Ninja", price: 65, body: "#800080", bandana: "#00ffff", alpha: 1 }
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

// Oyuncu verilerini çek
loadPlayerData();

function loadPlayerData() {
    fetch(`https://ninja-bridge-api.onrender.com/api/score/player/${tgUserId}`)
        .then(res => res.json())
        .then(data => {
            playerCoins = data.coins || 0;
            currentSkin = data.currentSkin || "default";
            ownedSkins = data.ownedSkins || ["default"];
            updateCoinUI();
            draw(); 
        }).catch(err => console.error("Veri çekilemedi:", err));
}

function updateCoinUI() {
    coinCountElement.innerText = playerCoins;
    shopCoinCountElement.innerText = playerCoins;
}

resetGame();

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
  const minimumGap = 30, maximumGap = 150;
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  trees.push({ x, color: treeColors[Math.floor(Math.random() * 3)] });
}

// 🔥 ÇÖZÜM 3: PLATFORM ÖLÇEKLENDİRME VE GÖRÜNÜRLÜK
function generatePlatform() {
  // Zorluk artış hızı yarı yarıya düşürüldü (Max %50 zorlaşır)
  let difficultyMultiplier = Math.min(score / 50, 0.50); 

  // Platformlar arası maksimum mesafe ekran dışına taşmayacak şekilde limitlendi
  const minimumGap = 40 + (difficultyMultiplier * 20);
  const maximumGap = 90 + (difficultyMultiplier * 40); 
  
  // Platform genişlikleri aşırı incelmesin (Minimum 40 piksel kalsın)
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
      // 🔥 ÇÖZÜM 4: ÇUBUK UZAMA HIZI (ZORLUK) DENGELENDİ
      // Hızlanma çok daha yumuşak olacak ve belli bir seviyede sabitlenecek.
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
            // 🔥 YENİ: 0 yerine tgGroupId gönderiyoruz
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
  ctx.save();
  ctx.translate((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, getTreeY(x, hill1BaseHeight, hill1Amplitude));
  ctx.fillStyle = "#7D833C"; ctx.fillRect(-1, -5, 2, 5);
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(0, -30); ctx.lineTo(5, -5); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) { return (Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + window.innerHeight - baseHeight); }
function getTreeY(x, baseHeight, amplitude) { return Math.sinus(x) * amplitude + window.innerHeight - baseHeight; }

// ------------------------------------
// LİDERLİK TABLOSU MODALI
// ------------------------------------
document.getElementById("leaderboardBtn").addEventListener("click", (e) => {
    e.stopPropagation(); 
    document.getElementById("leaderboardModal").style.display = "block";
    const list = document.getElementById("scoreList");
    list.innerHTML = "<li style='text-align:center;'>Yükleniyor... ⏳</li>";
    fetch(`https://ninja-bridge-api.onrender.com/api/score/global?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            list.innerHTML = ""; 
            if(data.length === 0) { list.innerHTML = "<li>Henüz kimse oynamadı!</li>"; return; }
            data.forEach((item, i) => {
                list.innerHTML += `<li><span>${i + 1}. ${item.name}</span> <span>${item.score} Puan</span></li>`;
            });
        }).catch(err => list.innerHTML = "<li style='color:red;'>Hata oluştu!</li>");
});
document.getElementById("closeLeaderboard").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("leaderboardModal").style.display = "none"; });

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
    list.innerHTML = "";
    
    Object.keys(skinData).forEach(key => {
        const skin = skinData[key];
        let actionHTML = "";

        if (currentSkin === key) {
            actionHTML = `<span class="equipped-txt">✅ Kuşanıltı</span>`;
        } else if (ownedSkins.includes(key)) {
            actionHTML = `<button class="equip-btn" onclick="equipSkin('${key}')">Kuşan</button>`;
        } else {
            actionHTML = `<button class="buy-btn" onclick="buySkin('${key}', ${skin.price})">Satın Al (🪙 ${skin.price})</button>`;
        }

        list.innerHTML += `
            <li>
                <span><span style="color:${skin.body}; text-shadow: 1px 1px 1px black;">⬤</span> ${skin.name}</span>
                ${actionHTML}
            </li>
        `;
    });
}

window.buySkin = function(skinKey, price) {
    if(playerCoins < price) {
        alert("Yetersiz Jeton! Daha fazla oynamalısın.");
        return;
    }
    
    if(confirm(`${skinData[skinKey].name} kostümünü ${price} jetona almak istiyor musun?`)) {
        fetch('https://ninja-bridge-api.onrender.com/api/score/buyskin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: tgUserId, skinName: skinKey, price: price })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                playerCoins -= price;
                ownedSkins.push(skinKey);
                updateCoinUI();
                renderShop();
                alert("Satın alma başarılı! Şimdi kuşanabilirsin.");
            } else {
                alert("İşlem başarısız oldu.");
            }
        });
    }
}

window.equipSkin = function(skinKey) {
    fetch('https://ninja-bridge-api.onrender.com/api/score/equipskin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tgUserId, skinName: skinKey })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            currentSkin = skinKey;
            renderShop();
            draw(); 
        }
    });
}
