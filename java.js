Array.prototype.last = function () { return this[this.length - 1]; };
Math.sinus = function (degree) { return Math.sin(degree * 0.01745329251); };

// ------------------------------------
// TELEGRAM & OYUNCU VERİLERİ
// ------------------------------------
let tg = window.Telegram?.WebApp;
let user = tg?.initDataUnsafe?.user;
let tgUserId = user ? user.id : 123456789;
let tgUserName = user ? user.first_name : "Test Oyuncusu";
let startParam = tg?.initDataUnsafe?.start_param;
let tgGroupId = startParam ? Number(startParam) : 0;

let playerCoins = 0; let playerGems = 0; 
let sessionEarnedGems = 0; let sessionEarnedCoins = 0; 

let currentSkin = "default"; let ownedSkins = ["default"]; 
let currentPet = "default"; let ownedPets = {}; 

const bgMusic = new Audio('bg.mp3'); bgMusic.loop = true; bgMusic.volume = 0.3; 
const comboSound = new Audio('combo.mp3'); comboSound.volume = 0.8;
const fallSound = new Audio('dusme.mp3'); fallSound.volume = 0.8;
let soundsUnlocked = false;

function unlockSounds() {
    if (!soundsUnlocked) {
        bgMusic.play().catch(()=>{}); comboSound.play().then(() => comboSound.pause()).catch(()=>{}); fallSound.play().then(() => fallSound.pause()).catch(()=>{});
        soundsUnlocked = true;
    }
}

// ------------------------------------
// GRAFİK MOTORU VE "OFF-SCREEN CACHE" 
// ------------------------------------
const canvas = document.getElementById("game"); 
const ctx = canvas.getContext("2d");

// 🔥 DONANIM HIZLANDIRMASI
canvas.style.transform = "translateZ(0)";
canvas.style.willChange = "transform";

let lowGraphics = false;

// Sabit Tema Renkleri
const themeTop = "#BBD691", themeBottom = "#FEF1E1";
const themeHill1 = "#95C629", themeHill2 = "#659F1C";
const themeTree = "#7D833C", themeLeaves = ["#6D8821", "#8FAC34", "#98B333"];

// 🔥 ARKA PLAN ÖNBELLEĞİ
const bgCacheCanvas = document.createElement("canvas");
const bgCacheCtx = bgCacheCanvas.getContext("2d");
let lastRenderedOffset = -999;
let lastRenderedWidth = 0;

window.toggleGraphics = function() {
    lowGraphics = !lowGraphics;
    const btn = document.getElementById("graphicsBtn");
    if (btn) {
        btn.innerText = lowGraphics ? "⚙️ Grafik: Düşük" : "⚙️ Grafik: Yüksek";
        btn.style.background = lowGraphics ? "#7f8c8d" : "#8e44ad";
    }
    applyCanvasSize();
}

function applyCanvasSize() {
    let scale = lowGraphics ? 0.6 : 1; 
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    ctx.scale(scale, scale);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    lastRenderedWidth = 0; 
    if (phase === "waiting" && platforms.length > 0) draw();
}
window.addEventListener("resize", applyCanvasSize);

// ------------------------------------
// REKLAM SİSTEMİ 
// ------------------------------------
let adController = null; let adRetryCount = 0; let adReviveUsedThisRun = false; 

function initAdsGram() {
    try { if (window.Adsgram) { adController = window.Adsgram.init({ blockId: "35103" }); } else if (adRetryCount < 10) { adRetryCount++; setTimeout(initAdsGram, 500); } } catch (err) {}
}

function checkAdStatus() {
    const watchAdBtn = document.getElementById("watchAdBtn"); if (!watchAdBtn) return; 
    fetch(`https://ninja-bridge-api.onrender.com/api/score/adstatus/${tgUserId}`).then(res => res.json()).then(data => {
        if (data.canWatch) { watchAdBtn.style.display = "block"; watchAdBtn.style.background = "#e74c3c"; watchAdBtn.style.pointerEvents = "auto"; watchAdBtn.innerText = `📺 +${data.nextRewardCoins} Jeton`; } 
        else { watchAdBtn.style.display = "block"; watchAdBtn.style.background = "#7f8c8d"; watchAdBtn.style.pointerEvents = "none"; watchAdBtn.innerText = "📺 Haklar Tükendi"; }
    }).catch(() => { watchAdBtn.style.display = "none"; });
}

const watchAdBtnElement = document.getElementById("watchAdBtn");
if (watchAdBtnElement) {
    watchAdBtnElement.addEventListener("click", () => {
        if (!adController) { if(tg && tg.showAlert) tg.showAlert("Reklam yüklenemedi. İnternetinizi kontrol edin."); return; }
        try { adController.show().then((result) => { if (result.done) {
            fetch('https://ninja-bridge-api.onrender.com/api/score/watchad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId }) }).then(res => res.json()).then(data => { playerCoins = data.totalCoins; playerGems = data.totalGems; updateCoinUI(); checkAdStatus(); });
        }}).catch(() => {}); } catch (e) {}
    });
}

document.getElementById("reviveAdBtn").addEventListener("click", () => {
    if (!adController) { if(tg && tg.showAlert) tg.showAlert("Şu an reklam bulunamadı."); return; }
    adController.show().then((result) => { if (result.done) { adReviveUsedThisRun = true; document.getElementById("reviveMenu").style.display = "none"; phase = "rescued"; heroY = 0; heroX = sticks.last().x - heroDistanceFromEdge; sticks.last().length = 0; sticks.last().rotation = 0; perfectElement.innerText = `📺 CANLANDIN!`; perfectElement.style.color = "#8e44ad"; perfectElement.style.opacity = 1; draw(); setTimeout(() => { perfectElement.style.opacity = 0; phase = "waiting"; }, 1500); } }).catch(() => {});
});
document.getElementById("skipReviveBtn").addEventListener("click", () => { document.getElementById("reviveMenu").style.display = "none"; showGameOver(); });

// ------------------------------------
// OYUN İÇİ DEĞİŞKENLER VE VERİLER
// ------------------------------------
let duelInterval = null; let opponentFinished = false;

const skinData = { "default": { name: "Varsayılan", price: 0, body: "black", bandana: "red", alpha: 1 }, "hayalet": { name: "Hayalet", price: 10, body: "#ffffff", bandana: "#cccccc", alpha: 0.4 }, "yesil": { name: "Yeşil Ninja", price: 20, body: "#228B22", bandana: "black", alpha: 1 }, "bronz": { name: "Bronz Ninja", price: 30, body: "#cd7f32", bandana: "#5c4033", alpha: 1 }, "demir": { name: "Demir Ninja", price: 40, body: "#a9a9a9", bandana: "#696969", alpha: 1 }, "altin": { name: "Altın Ninja", price: 50, body: "#ffd700", bandana: "#b8860b", alpha: 1 }, "hiper": { name: "Hiper Ninja", price: 65, body: "#800080", bandana: "#00ffff", alpha: 1 }, "golge": { name: "Gölge Katili", price: 80, body: "#1a1a1a", bandana: "#4a0000", alpha: 1 }, "buzul": { name: "Buzul Ninja", price: 100, body: "#add8e6", bandana: "#ffffff", alpha: 1 } };
const petData = { 
    "kopek": { name: "Altın Avcısı", price: 200, desc: "Sv'ye göre daha hızlı Jeton", emoji: "🐶" }, 
    "kedi": { name: "Gözcü Kedi", price: 250, desc: "Sv'ye göre devasa Kombo Alanı", emoji: "🐱" }, 
    "maymun": { name: "Kuyruklu Maymun", price: 400, desc: "Sv'ye göre ekstra Can & Jeton", emoji: "🐒" },
    "kurt": { name: "Gölge Kurdu", price: 750, desc: "Jeton Üretimi + Dev Kırmızı Alan", emoji: "🐺" } 
};

let phase = "waiting"; let lastTimestamp; let heroX = 0, heroY = 0, sceneOffset = 0; 
let platforms = [], sticks = [], trees = []; 
let score = 0, combo = 0; let currentMonkeyLives = 0; 

// 🔥 Sayaç artık adım değil, kazanılan "Skor Puanını" tutar
let stepCount = 0; 

const canvasWidth = 375, canvasHeight = 375, platformHeight = 100; const heroDistanceFromEdge = 10, paddingX = 100;
const backgroundSpeedMultiplier = 0.2; const hill1BaseHeight = 100, hill1Amplitude = 10, hill1Stretch = 1; const hill2BaseHeight = 70, hill2Amplitude = 20, hill2Stretch = 0.5;
const stretchingSpeed = 4, turningSpeed = 4, walkingSpeed = 4, transitioningSpeed = 2, fallingSpeed = 2; const heroWidth = 17, heroHeight = 30; 

const introductionElement = document.getElementById("introduction"); const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart"); const scoreElement = document.getElementById("score");
const coinCountElement = document.getElementById("coinCount"); const shopCoinCountElement = document.getElementById("shopCoinCount");

function loadPlayerData() {
    fetch(`https://ninja-bridge-api.onrender.com/api/score/player/${tgUserId}`).then(res => res.json()).then(data => {
            playerCoins = data.coins || 0; playerGems = data.gems || 0;
            currentSkin = data.currentSkin || "default"; ownedSkins = data.ownedSkins || ["default"]; 
            currentPet = data.currentPet || "default"; ownedPets = data.ownedPets || {}; 
            updateCoinUI(); checkAdStatus(); 
            if (phase === "waiting") { if (currentPet === "maymun") { currentMonkeyLives = getMonkeyStats().lives; } draw(); }
        }).catch(err => {});
}

function updateCoinUI() { 
    coinCountElement.innerHTML = `🪙 ${playerCoins} | 💎 ${playerGems}`; 
    shopCoinCountElement.innerHTML = `🪙 ${playerCoins} | 💎 ${playerGems}`; 
}

function getPerfectAreaSize(platformWidth) { 
    let baseArea = 10; 
    if (currentPet === "kedi") { let lvl = ownedPets["kedi"] || 1; baseArea = 20 + (lvl * 5); } 
    else if (currentPet === "kurt") { let lvl = ownedPets["kurt"] || 1; baseArea = 15 + (lvl * 6); }
    return Math.min(baseArea, platformWidth * 0.8); 
}

function getMonkeyStats() { let lvl = ownedPets["maymun"] || 1; let lives = Math.floor((lvl - 1) / 2) + 1; let bonus = (lvl % 2 === 0) ? lvl * 5 : 0; return { lives: lives, bonusCoins: bonus }; }

// 🔥 FİX: Artık Fiziksel Adımları Değil, Skoru (Puanı) Temel Alır!
function processCoinGeneration(earnedPoints) {
    stepCount += earnedPoints; // Oyuncu kombo ile 5 puan alırsa kasaya anında 5 puan işlenir
    let reqSteps = 8; 
    
    // Köpek veya Kurt varsa hedeflenen puanı aşağı çek
    if (currentPet === "kopek" || currentPet === "kurt") { 
        let lvl = ownedPets[currentPet] || 1; 
        reqSteps = Math.max(1, 8 - lvl); 
    } 
    
    // Eğer biriken puan hedefi aştıysa Jeton ver
    if (stepCount >= reqSteps) { 
        let coinsToAdd = Math.floor(stepCount / reqSteps); // Fazladan kaç jeton kazandığını hesaplar
        sessionEarnedCoins += coinsToAdd; 
        stepCount = stepCount % reqSteps; // Kalan küsurat puanı bir sonraki jeton için kasada tutar
    }
}

function showGameOver() {
    restartButton.style.display = "block"; if (duelInterval) clearInterval(duelInterval);
    
    if (sessionEarnedCoins > 0 || sessionEarnedGems > 0) {
        playerCoins += sessionEarnedCoins;
        playerGems += sessionEarnedGems;
        updateCoinUI();
    }
    
    fetch('https://ninja-bridge-api.onrender.com/api/score/save', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
        body: JSON.stringify({ userId: tgUserId, firstName: tgUserName, score: score, groupId: tgGroupId, earnedCoins: sessionEarnedCoins, earnedGems: sessionEarnedGems }) 
    }).catch(e => {});
}

function resetGame() {
  phase = "waiting"; lastTimestamp = undefined; sceneOffset = 0; score = 0; combo = 0; 
  sessionEarnedGems = 0; sessionEarnedCoins = 0; 
  adReviveUsedThisRun = false; stepCount = 0; 
  document.getElementById("reviveMenu").style.display = "none"; restartButton.style.display = "none";
  if (currentPet === "maymun") { currentMonkeyLives = getMonkeyStats().lives; } else { currentMonkeyLives = 0; }
  introductionElement.style.opacity = 1; perfectElement.style.opacity = 0; scoreElement.innerText = score;
  platforms = [{ x: 50, w: 50 }]; for(let i=0; i<4; i++) generatePlatform();
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }]; trees = []; for(let i=0; i<10; i++) generateTree();
  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge; heroY = 0; 
  draw();
}

function generateTree() { const minimumGap = 30, maximumGap = 150; let furthestX = trees.length > 0 ? trees.last().x : 0; const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap)); trees.push({ x, color: themeLeaves[Math.floor(Math.random() * 3)] }); }

function generatePlatform() {
  let minimumGap = 40, maximumGap = 90, minimumWidth = 45, maximumWidth = 85;
  if (score >= 5000) { minimumGap = 150; maximumGap = 200; minimumWidth = 10; maximumWidth = 20; } 
  else if (score >= 4000) { minimumGap = 130; maximumGap = 180; minimumWidth = 15; maximumWidth = 25; } 
  else if (score >= 3000) { minimumGap = 110; maximumGap = 160; minimumWidth = 20; maximumWidth = 30; } 
  else if (score >= 1500) { minimumGap = 85; maximumGap = 135; minimumWidth = 28; maximumWidth = 45; } 
  else if (score >= 500) { minimumGap = 65; maximumGap = 110; minimumWidth = 35; maximumWidth = 60; }
  let maxScreenGap = window.innerWidth - 130; if (maximumGap > maxScreenGap) { maximumGap = Math.max(minimumGap + 10, maxScreenGap); }
  
  const lastPlatform = platforms.last(); let furthestX = lastPlatform ? (lastPlatform.x + lastPlatform.w) : 0; 
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap)); 
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth)); 
  platforms.push({ x, w });
}

function isMenuOpen() { return document.getElementById("shopModal").style.display === "block" || document.getElementById("leaderboardModal").style.display === "block" || document.getElementById("reviveMenu").style.display === "flex"; }

window.addEventListener("mousedown", (e) => { if (!isMenuOpen() && phase == "waiting" && e.target.tagName === 'CANVAS') startStretching(); });
window.addEventListener("touchstart", (e) => { if (!isMenuOpen() && phase == "waiting" && e.target.tagName === 'CANVAS') startStretching(); }, {passive: false});
window.addEventListener("mouseup", () => { if (phase == "stretching") phase = "turning"; });
window.addEventListener("touchend", () => { if (phase == "stretching") phase = "turning"; });

function startStretching() { lastTimestamp = undefined; introductionElement.style.opacity = 0; phase = "stretching"; unlockSounds(); window.requestAnimationFrame(animate); }
window.requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) { lastTimestamp = timestamp; window.requestAnimationFrame(animate); return; }
  
  let dt = timestamp - lastTimestamp;
  if (dt >= 12 && dt <= 20) { dt = 16.66; } 
  else if (dt > 32) { dt = 16.66; } 

  switch (phase) {
    case "waiting": break; 
    case "dead_options": break; 
    case "stretching": sticks.last().length += dt / Math.max(stretchingSpeed - (score * 0.015), 2.8); break;
    case "turning":
      sticks.last().rotation += dt / turningSpeed;
      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90; const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          
          let earnedPts = 0; // Bu turda kazanılan net puan
          
          if (perfectHit) {
            combo++; 
            earnedPts = 1 + combo;
            score += earnedPts; 
            
            if (combo % 50 === 0) { sessionEarnedGems += 1; perfectElement.innerText = `💎 50x COMBO!\n+1 ELMAS KAZANDIN!`; perfectElement.style.color = "#00ffff"; } 
            else { perfectElement.innerText = `🔥 KUSURSUZ! +${earnedPts}\n${combo}x COMBO`; perfectElement.style.color = "#FFD700"; }
            comboSound.currentTime = 0; comboSound.play().catch(e => {});
          } else { 
            combo = 0; 
            earnedPts = 1;
            score += earnedPts; 
            perfectElement.innerText = ""; 
          }
          
          // 🔥 Skordan gelen puanı Jeton motoruna yolla!
          processCoinGeneration(earnedPts);
          
          scoreElement.innerText = score; if (perfectHit) { perfectElement.style.opacity = 1; setTimeout(() => (perfectElement.style.opacity = 0), 1200); }
          generatePlatform(); generateTree(); generateTree();
        }
        phase = "walking";
      }
      break;
    case "walking":
      heroX += dt / walkingSpeed; 
      
      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) { const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge; if (heroX > maxHeroX) { heroX = maxHeroX; phase = "transitioning"; } } 
      else { const maxHeroX = sticks.last().x + sticks.last().length + heroWidth; if (heroX > maxHeroX) { heroX = maxHeroX; phase = "falling"; fallSound.currentTime = 0; fallSound.play().catch(e => {}); } }
      break;
    case "transitioning":
      sceneOffset += dt / transitioningSpeed; const [nextPlatform2] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform2.x + nextPlatform2.w - paddingX) { 
          sticks.push({ x: nextPlatform2.x + nextPlatform2.w, length: 0, rotation: 0 }); 
          phase = "waiting"; 
          platforms = platforms.filter(p => p.x + p.w > sceneOffset - 300);
          sticks = sticks.filter(s => s.x > sceneOffset - 300);
          trees = trees.filter(t => t.x > sceneOffset - 1000);
      }
      break;
    case "falling":
      if (sticks.last().rotation < 180) sticks.last().rotation += dt / turningSpeed;
      heroY += dt / fallingSpeed;
      if (heroY > platformHeight + 100 + (window.innerHeight - canvasHeight) / 2) {
        if (currentMonkeyLives > 0) {
            currentMonkeyLives--; let mStats = getMonkeyStats(); 
            if (mStats.bonusCoins > 0) { sessionEarnedCoins += mStats.bonusCoins; }
            phase = "rescued"; heroY = 0; heroX = sticks.last().x - heroDistanceFromEdge; sticks.last().length = 0; sticks.last().rotation = 0; perfectElement.innerText = mStats.bonusCoins > 0 ? `🐒 KURTARILDI!\n+${mStats.bonusCoins} Jeton Bonus!` : `🐒 MAYMUN KURTARDI!`; perfectElement.style.color = "#FF8C00"; perfectElement.style.opacity = 1; draw(); setTimeout(() => { perfectElement.style.opacity = 0; phase = "waiting"; }, 1500); return;
        }
        if (!adReviveUsedThisRun) { phase = "dead_options"; document.getElementById("reviveMenu").style.display = "flex"; return; }
        showGameOver(); return;
      }
      break;
  }
  draw(); window.requestAnimationFrame(animate); lastTimestamp = timestamp;
}

function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90) throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length; const platformTheStickHits = platforms.find((platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w);
  if (platformTheStickHits) { let pArea = getPerfectAreaSize(platformTheStickHits.w); if (platformTheStickHits.x + platformTheStickHits.w / 2 - pArea / 2 < stickFarX && stickFarX < platformTheStickHits.x + platformTheStickHits.w / 2 + pArea / 2) { return [platformTheStickHits, true]; } } return [platformTheStickHits, false];
}

function draw() { 
    ctx.save(); 
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); 
    drawBackground(); 
    
    let transX = (window.innerWidth - canvasWidth) / 2 - sceneOffset;
    let transY = (window.innerHeight - canvasHeight) / 2;
    ctx.translate(transX, transY); 
    
    drawPlatforms(); drawPet(); drawHero(); drawSticks(); 
    ctx.restore(); 
}
restartButton.addEventListener("click", (e) => { e.preventDefault(); resetGame(); });

function drawBackground() { 
    if (Math.abs(lastRenderedOffset - sceneOffset) > 0.1 || lastRenderedWidth !== canvas.width) {
        bgCacheCanvas.width = canvas.width;
        bgCacheCanvas.height = canvas.height;
        let scale = lowGraphics ? 0.6 : 1; 
        bgCacheCtx.scale(scale, scale);

        let grad = bgCacheCtx.createLinearGradient(0, 0, 0, window.innerHeight);
        grad.addColorStop(0, themeTop); 
        grad.addColorStop(1, themeBottom);
        bgCacheCtx.fillStyle = grad;
        bgCacheCtx.fillRect(0, 0, window.innerWidth, window.innerHeight); 

        if(!lowGraphics) drawHill(bgCacheCtx, hill2BaseHeight, hill2Amplitude, hill2Stretch, themeHill2); 
        drawHill(bgCacheCtx, hill1BaseHeight, hill1Amplitude, hill1Stretch, themeHill1); 

        trees.forEach((tree, index) => { 
            if(lowGraphics && index % 2 === 0) return;
            drawTree(bgCacheCtx, tree.x, tree.color, themeTree); 
        }); 

        lastRenderedOffset = sceneOffset;
        lastRenderedWidth = canvas.width;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.drawImage(bgCacheCanvas, 0, 0);
    ctx.restore();
}

function drawHill(context, base, amp, stretch, color) { 
    context.beginPath(); context.moveTo(0, window.innerHeight); context.lineTo(0, getHillY(0, base, amp, stretch)); 
    for (let i = 0; i <= window.innerWidth + 25; i += 25) { context.lineTo(i, getHillY(i, base, amp, stretch)); } 
    context.lineTo(window.innerWidth, window.innerHeight); context.fillStyle = color; context.fill(); 
}

function drawTree(context, x, color, trunkColor) { 
    context.save(); context.translate(((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch), getTreeY(x, hill1BaseHeight, hill1Amplitude)); 
    context.fillStyle = trunkColor; context.fillRect(-1, -5, 2, 5); 
    context.beginPath(); context.moveTo(-5, -5); context.lineTo(0, -30); context.lineTo(5, -5); 
    context.fillStyle = color; context.fill(); context.restore(); 
}

function getHillY(windowX, base, amp, stretch) { return (Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amp + window.innerHeight - base); }
function getTreeY(x, base, amp) { return Math.sinus(x) * amp + window.innerHeight - base; }

function drawSticks() {
  sticks.forEach((stick) => { 
      ctx.save(); ctx.translate(stick.x, canvasHeight - platformHeight); ctx.rotate((Math.PI / 180) * stick.rotation); 
      ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = "black"; 
      ctx.moveTo(0, 0); ctx.lineTo(0, -stick.length); ctx.stroke(); ctx.restore(); 
  });
}
function drawPlatforms() {
  platforms.forEach(({ x, w }) => { 
      ctx.save(); ctx.fillStyle = "black"; 
      ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight + (window.innerHeight - canvasHeight) / 2); 
      ctx.restore(); 
      if (sticks.last() && sticks.last().x < x) { 
          ctx.fillStyle = "red"; 
          let pArea = getPerfectAreaSize(w); 
          ctx.fillRect(x + w / 2 - pArea / 2, canvasHeight - platformHeight, pArea, pArea); 
      } 
  });
}

function drawHero() {
  let skin = skinData[currentSkin] || skinData["default"]; ctx.save(); ctx.globalAlpha = skin.alpha; ctx.fillStyle = skin.body; ctx.translate(heroX - heroWidth / 2, heroY + canvasHeight - platformHeight - heroHeight / 2); drawRoundedRect(-heroWidth / 2, -heroHeight / 2, heroWidth, heroHeight - 4, 5); ctx.fillStyle = skin.body; if(skin.body === "#ffffff") ctx.fillStyle = "#cccccc"; const legDistance = 5; ctx.beginPath(); ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill(); ctx.beginPath(); ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill(); ctx.beginPath(); ctx.fillStyle = "white"; if(skin.body === "#ffffff") ctx.fillStyle = "black"; ctx.arc(5, -7, 3, 0, Math.PI * 2, false); ctx.fill(); ctx.fillStyle = skin.bandana; ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5); ctx.beginPath(); ctx.moveTo(-9, -14.5); ctx.lineTo(-17, -18.5); ctx.lineTo(-14, -8.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, -10.5); ctx.lineTo(-15, -3.5); ctx.lineTo(-5, -7); ctx.fill(); ctx.restore();
}
function drawPet() {
  if (currentPet === "default") return; let pet = petData[currentPet]; ctx.save(); let bounce = (phase === "walking" || phase === "transitioning") ? Math.abs(Math.sin(Date.now() / 100)) * 6 : 0; ctx.translate(heroX - 28, heroY + canvasHeight - platformHeight - 5 - bounce); ctx.font = "20px Arial"; ctx.fillText(pet.emoji, -10, 5); ctx.restore();
}

function drawRoundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y + h - r); ctx.arcTo(x, y + h, x + r, y + h, r); ctx.lineTo(x + w - r, y + h); ctx.arcTo(x + w, y + h, x + w, y + h - r, r); ctx.lineTo(x + w, y + r); ctx.arcTo(x + w, y, x + w - r, y, r); ctx.lineTo(x + r, y); ctx.arcTo(x, y, x, y + r, r); ctx.fill(); }

// ------------------------------------
// UI VE MARKET
// ------------------------------------
document.getElementById("shopBtn").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("shopModal").style.display = "block"; renderShop(); });
document.getElementById("closeShop").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("shopModal").style.display = "none"; });

function renderShop() {
    const list = document.getElementById("shopList");
    let html = `<li style="background:#ddd; justify-content:center; padding:4px; font-size:14px;">💎 <b>ELMAS BORSASI</b></li>`;
    html += `<li style="padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center;"><span>🪙 1000 Jeton Bozdur</span> <button class="buy-btn" style="background:#9b59b6; padding: 5px 10px; font-size:12px; margin:0;" onclick="convertGems()">💎 1 Al</button></li>`;
    
    html += `<li style="background:#ddd; justify-content:center; padding:4px; font-size:14px; margin-top:6px;">🥷 <b>KOSTÜMLER</b></li>`;
    Object.keys(skinData).forEach(key => { const skin = skinData[key]; let actionHTML = ""; if (currentSkin === key) actionHTML = `<span class="equipped-txt" style="font-size:13px;">✅</span>`; else if (ownedSkins.includes(key)) actionHTML = `<button class="equip-btn" style="padding: 5px 10px; font-size:12px; margin:0;" onclick="equipSkin('${key}')">Kuşan</button>`; else actionHTML = `<button class="buy-btn" style="padding: 5px 10px; font-size:12px; margin:0;" onclick="buySkin('${key}', ${skin.price})">🪙 ${skin.price}</button>`; html += `<li style="padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center;"><span><span style="color:${skin.body}; text-shadow: 1px 1px 1px black;">⬤</span> ${skin.name}</span> ${actionHTML}</li>`; });
    
    html += `<li style="background:#ddd; justify-content:center; padding:4px; font-size:14px; margin-top:6px;">🐾 <b>YOLDAŞLAR & GELİŞTİRME</b></li>`;
    Object.keys(petData).forEach(key => { 
        const pet = petData[key]; let isOwned = ownedPets.hasOwnProperty(key); let level = isOwned ? ownedPets[key] : 0; 
        if (!isOwned) { html += `<li style="padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center;"><span style="line-height:1.2;">${pet.emoji} ${pet.name} (Sv.1)<br><small style="color:gray; font-size:11px;">${pet.desc}</small></span> <button class="buy-btn" style="padding: 5px 10px; font-size:12px; margin:0;" onclick="buyPet('${key}', ${pet.price})">🪙 ${pet.price}</button></li>`; } 
        else { 
            let eqBtn = (currentPet === key) ? `<span class="equipped-txt" style="font-size:13px;">✅</span>` : `<button class="equip-btn" style="padding: 5px 10px; font-size:12px; margin:0;" onclick="equipPet('${key}')">Kuşan</button>`; 
            let upgBtn = ""; 
            if (level < 5 && key === "kurt") { let costVal = level * 2; upgBtn = `<button class="buy-btn" style="background:#e67e22; margin-top:4px; padding: 4px 8px; font-size:11px;" onclick="upgradePet('${key}', ${level+1}, 'gems', ${costVal})">⬆️ 💎 ${costVal}</button>`; }
            else if (level < 4 && key !== "kurt") { let costVal = (level === 1) ? 1 : (level === 2) ? 3 : 5; upgBtn = `<button class="buy-btn" style="background:#e67e22; margin-top:4px; padding: 4px 8px; font-size:11px;" onclick="upgradePet('${key}', ${level+1}, 'gems', ${costVal})">⬆️ 💎 ${costVal}</button>`; } 
            else { upgBtn = `<span style="font-size:11px; color:red; margin-top:4px; font-weight:bold;">MAX SV.</span>`; } 
            html += `<li style="padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center;"><span style="line-height:1.2;">${pet.emoji} ${pet.name} (Sv.${level})<br><small style="color:gray; font-size:11px;">${pet.desc}</small></span> <div style="display:flex; flex-direction:column; align-items:flex-end;">${eqBtn}${upgBtn}</div></li>`; 
        } 
    }); list.innerHTML = html;
}

let isConverting = false;
window.convertGems = function() { if(playerCoins < 1000) { if(tg && tg.showAlert) tg.showAlert("1000 Jetonun yok!"); return; } if (isConverting) return; isConverting = true; fetch('https://ninja-bridge-api.onrender.com/api/score/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId }) }).then(res => res.json()).then(data => { isConverting = false; if(data.success) { playerCoins -= 1000; playerGems += 1; updateCoinUI(); renderShop(); } }).catch(() => { isConverting = false; }); }

window.upgradePet = function(petKey, nextLevel, costType, costVal) { if (costType === "gems" && playerGems < costVal) { tg.showAlert("Yetersiz Elmas!"); return; } tg.showConfirm(`${petData[petKey].name} yoldaşını Seviye ${nextLevel} yapacaksın. Onaylıyor musun?`, function(agreed) { if(agreed) { fetch('https://ninja-bridge-api.onrender.com/api/score/upgradepet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, petName: petKey, coinCost: 0, gemCost: costVal, nextLevel: nextLevel }) }).then(res => res.json()).then(data => { if(data.success) { playerGems -= costVal; ownedPets[petKey] = nextLevel; updateCoinUI(); renderShop(); } }); } }); }
window.buySkin = function(skinKey, price) { if(playerCoins < price) { tg.showAlert("Yetersiz Jeton!"); return; } tg.showConfirm(`${skinData[skinKey].name} kostümünü alacaksın. Onaylıyor musun?`, function(agreed) { if(agreed) { fetch('https://ninja-bridge-api.onrender.com/api/score/buyskin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: skinKey, price: price }) }).then(res => res.json()).then(data => { if(data.success) { playerCoins -= price; ownedSkins.push(skinKey); updateCoinUI(); renderShop(); } }); } }); }
window.equipSkin = function(skinKey) { fetch('https://ninja-bridge-api.onrender.com/api/score/equipskin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: skinKey }) }).then(res => res.json()).then(data => { if(data.success) { currentSkin = skinKey; renderShop(); draw(); } }); }
window.buyPet = function(petKey, price) { if(playerCoins < price) { tg.showAlert("Yetersiz Jeton!"); return; } tg.showConfirm(`${petData[petKey].name} yoldaşını sahipleneceksin. Onaylıyor musun?`, function(agreed) { if(agreed) { fetch('https://ninja-bridge-api.onrender.com/api/score/buypet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: petKey, price: price }) }).then(res => res.json()).then(data => { if(data.success) { playerCoins -= price; ownedPets[petKey] = 1; updateCoinUI(); renderShop(); } }); } }); }
window.equipPet = function(petKey) { fetch('https://ninja-bridge-api.onrender.com/api/score/equippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: petKey }) }).then(res => res.json()).then(data => { if(data.success) { currentPet = petKey; renderShop(); draw(); } }); }

document.getElementById("leaderboardBtn").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("leaderboardModal").style.display = "block"; const list = document.getElementById("scoreList"); list.innerHTML = "<li style='text-align:center;'>Yükleniyor... ⏳</li>"; fetch(`https://ninja-bridge-api.onrender.com/api/score/global?t=${Date.now()}`).then(res => res.json()).then(data => { list.innerHTML = ""; if(data.length === 0) { list.innerHTML = "<li>Henüz kimse oynamadı!</li>"; return; } data.forEach((item, i) => { list.innerHTML += `<li><span>${i + 1}. ${item.name}</span> <span>${item.score} Puan</span></li>`; }); }).catch(() => list.innerHTML = "<li style='color:red;'>Hata oluştu!</li>"); }); 
document.getElementById("closeLeaderboard").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("leaderboardModal").style.display = "none"; });

try { initAdsGram(); } catch(e) {}
resetGame(); 
applyCanvasSize(); 
loadPlayerData();
