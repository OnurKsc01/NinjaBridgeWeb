Math.sinus = function (degree) { return Math.sin((degree / 180) * Math.PI); };

// ------------------------------------
// 1. DİL MOTORU & ÇEVİRİ SÖZLÜĞÜ
// ------------------------------------
let currentLang = localStorage.getItem("ninjaLang") || "tr";

const texts = {
    tr: {
        btnScore: "🏆 Skor", btnShop: "🛒 Market", btnAd: "📺 +Jeton",
        intro: "Köprü Oluşturmak İçin Basılı Tut!", restart: "TEKRAR OYNA",
        reviveAd: "📺 İzle & Canlan", reviveSkip: "❌ Hayır, Bitir",
        leaderboardTitle: "Global Top 25", close: "Kapat",
        shopTitle: "🛒 Market", balance: "Bakiye:",
        shopGemExchange: "💎 ELMAS BORSASI", shopExchangeBtn: "🪙 1000 Jeton Bozdur", shopGetGem: "💎 1 Al",
        shopSkins: "🥷 KOSTÜMLER", shopPets: "🐾 YOLDAŞLAR",
        equip: "Kuşan", equipped: "✅", max: "MAX",
        loading: "Yükleniyor... ⏳", noOne: "Henüz kimse oynamadı!", error: "Hata!",
        perfect: "🔥 KUSURSUZ!", revived: "📺 CANLANDIN!", monkey: "🐒 MAYMUN KURTARDI!", duelEnded: "⚔️ DÜELLO BİTTİ!",
        msgPlaying: "Oyun devam ederken işlem yapılamaz!", msgAdFail: "Reklam yüklenemedi.", msgEarned: "Jeton kazandın!",
        msgNoCoin1000: "1000 Jetonun yok!", msgNoGem: "Yetersiz Elmas!", msgNoCoin: "Yetersiz Jeton!",
        msgNoEquipSkin: "Oyun esnasında kostüm değiştirilemez!", msgNoEquipPet: "Oyun esnasında yoldaş değiştirilemez!",
        askPet: "{name} yoldaşını Seviye {lvl} yapacaksın. Onaylıyor musun?", askSkin: "{name} kostümünü alacaksın. Onaylıyor musun?", askAdopt: "{name} yoldaşını sahipleneceksin. Onaylıyor musun?",
        duelP1: "düştü!", duelP2: "Skoru:", duelP3: "Kazanmak için onu geç!"
    },
    en: {
        btnScore: "🏆 Score", btnShop: "🛒 Shop", btnAd: "📺 +Coins",
        intro: "Hold to Build Bridge!", restart: "RESTART",
        reviveAd: "📺 Watch & Revive", reviveSkip: "❌ No, End Game",
        leaderboardTitle: "Global Top 25", close: "Close",
        shopTitle: "🛒 Shop", balance: "Balance:",
        shopGemExchange: "💎 GEM EXCHANGE", shopExchangeBtn: "🪙 Trade 1000 Coins", shopGetGem: "💎 Get 1",
        shopSkins: "🥷 SKINS", shopPets: "🐾 PETS",
        equip: "Equip", equipped: "✅", max: "MAX",
        loading: "Loading... ⏳", noOne: "No one played yet!", error: "Error!",
        perfect: "🔥 PERFECT!", revived: "📺 REVIVED!", monkey: "🐒 MONKEY SAVED!", duelEnded: "⚔️ DUEL ENDED!",
        msgPlaying: "Action not allowed while playing!", msgAdFail: "Ad failed to load.", msgEarned: "Coins earned!",
        msgNoCoin1000: "Not enough Coins (1000)!", msgNoGem: "Not enough Gems!", msgNoCoin: "Not enough Coins!",
        msgNoEquipSkin: "Cannot equip skin while playing!", msgNoEquipPet: "Cannot equip pet while playing!",
        askPet: "Upgrade {name} to Level {lvl}. Confirm?", askSkin: "Buy {name}. Confirm?", askAdopt: "Adopt {name}. Confirm?",
        duelP1: "fell!", duelP2: "Score:", duelP3: "Beat it to win!"
    }
};

function updateUITexts() {
    const t = texts[currentLang];
    document.getElementById("leaderboardBtn").innerText = t.btnScore;
    document.getElementById("shopBtn").innerText = t.btnShop;
    document.getElementById("watchEarnBtn").innerText = t.btnAd;
    
    const langBtn = document.getElementById("langBtn");
    if(langBtn) langBtn.innerText = currentLang === "tr" ? "🌍 EN" : "🌍 TR";

    if(phase === "waiting" && score === 0) document.getElementById("introduction").innerText = t.intro;
    document.getElementById("restart").innerText = t.restart;
    document.getElementById("reviveAdBtn").innerText = t.reviveAd;
    document.getElementById("skipReviveBtn").innerText = t.reviveSkip;

    const lbTitle = document.querySelector('#leaderboardModal h2');
    if(lbTitle) lbTitle.innerText = t.leaderboardTitle;
    document.getElementById("closeLeaderboard").innerText = t.close;

    const spTitle = document.querySelector('#shopModal h2');
    if(spTitle) spTitle.innerText = t.shopTitle;
    document.getElementById("closeShop").innerText = t.close;
    
    const shopBal = document.getElementById("shopBalanceText");
    if(shopBal) shopBal.innerText = t.balance;

    const dp1 = document.getElementById("duelDeathP1"); if(dp1) dp1.innerText = t.duelP1;
    const dp2 = document.getElementById("duelDeathP2"); if(dp2) dp2.innerText = t.duelP2;
    const dp3 = document.getElementById("duelDeathP3"); if(dp3) dp3.innerText = t.duelP3;
    
    if(document.getElementById("shopModal").style.display === "block") renderShop();
}

document.getElementById("langBtn").addEventListener("click", () => {
    currentLang = currentLang === "tr" ? "en" : "tr";
    localStorage.setItem("ninjaLang", currentLang);
    updateUITexts();
});

// ------------------------------------
// 2. TELEGRAM & OYUNCU VERİLERİ
// ------------------------------------
let tg = window.Telegram?.WebApp;
let user = tg?.initDataUnsafe?.user;
let tgUserId = user ? user.id : 123456789;
let tgUserName = user ? user.first_name : "Test Oyuncusu";

let startParam = tg?.initDataUnsafe?.start_param;
const urlParams = new URLSearchParams(window.location.search);
let urlGroupId = urlParams.get('groupid') || urlParams.get('startapp');
let tgGroupId = startParam ? Number(startParam) : (urlGroupId ? Number(urlGroupId) : 0);

let playerCoins = 0; let playerGems = 0; 
let sessionEarnedCoins = 0; let stepCount = 0; 
let currentSkin = "default"; let ownedSkins = ["default"]; 
let currentPet = "default"; let ownedPets = {}; 

let isDuelMode = false;
let opponentName = "";
let opponentTargetScore = -1;
let duelCheckInterval = null; 

// 🔥 Eşyaların İsimleri Artık Çift Dilli
const skinData = { 
    "default": { nameTr: "Varsayılan", nameEn: "Default", price: 0, body: "black", bandana: "red" }, 
    "yesil": { nameTr: "Yeşil Ninja", nameEn: "Green Ninja", price: 20, body: "#228B22", bandana: "black" }, 
    "bronz": { nameTr: "Bronz Ninja", nameEn: "Bronze Ninja", price: 30, body: "#cd7f32", bandana: "#5c4033" }, 
    "demir": { nameTr: "Demir Ninja", nameEn: "Iron Ninja", price: 40, body: "#a9a9a9", bandana: "#696969" }, 
    "altin": { nameTr: "Altın Ninja", nameEn: "Gold Ninja", price: 50, body: "#ffd700", bandana: "#b8860b" }, 
    "hiper": { nameTr: "Hiper Ninja", nameEn: "Hyper Ninja", price: 65, body: "#800080", bandana: "#00ffff" }, 
    "golge": { nameTr: "Gölge Katili", nameEn: "Shadow Killer", price: 80, body: "#1a1a1a", bandana: "#4a0000" }, 
    "buzul": { nameTr: "Buzul Ninja", nameEn: "Ice Ninja", price: 100, body: "#add8e6", bandana: "#ffffff" } 
};
const petData = { 
    "kopek": { nameTr: "Altın Avcısı", nameEn: "Gold Hunter", descTr: "Daha hızlı Jeton", descEn: "Faster Coins", price: 200, emoji: "🐶" }, 
    "kedi": { nameTr: "Gözcü Kedi", nameEn: "Scout Cat", descTr: "Büyük Kombo Alanı", descEn: "Bigger Combo Zone", price: 250, emoji: "🐱" }, 
    "maymun": { nameTr: "Kuyruklu Maymun", nameEn: "Tailed Monkey", descTr: "Ekstra Can & Jeton", descEn: "Extra Life & Coins", price: 400, emoji: "🐒" }, 
    "kurt": { nameTr: "Gölge Kurdu", nameEn: "Shadow Wolf", descTr: "Jeton + Dev Kırmızı Alan", descEn: "Coins + Huge Perfect Zone", price: 750, emoji: "🐺" } 
};

const preRenderedPets = {};
try { Object.keys(petData).forEach(key => { let c = document.createElement('canvas'); c.width = 32; c.height = 32; let cCtx = c.getContext('2d'); cCtx.font = "22px Arial"; cCtx.fillText(petData[key].emoji, 2, 24); preRenderedPets[key] = c; let img = new Image(); img.src = key + '.png'; img.onload = () => { cCtx.clearRect(0, 0, 32, 32); cCtx.drawImage(img, 0, 0, 26, 26); }; }); } catch(e) {}

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const coinCountElement = document.getElementById("coinCount");
const shopCoinCountElement = document.getElementById("shopCoinCount");

// ------------------------------------
// 3. SES VE REKLAM MOTORU
// ------------------------------------
const bgMusic = new Audio('bg.mp3'); bgMusic.loop = true; bgMusic.volume = 0.3; 
const comboSound = new Audio('combo.mp3'); comboSound.volume = 0.8;
const fallSound = new Audio('dusme.mp3'); fallSound.volume = 0.8;
let soundsUnlocked = false;

function unlockSounds() { if (!soundsUnlocked) { bgMusic.play().catch(()=>{}); comboSound.play().then(() => comboSound.pause()).catch(()=>{}); fallSound.play().then(() => fallSound.pause()).catch(()=>{}); soundsUnlocked = true; } }

let adController = null; let adReviveUsedThisRun = false; 

function initAdsGram() { try { if (window.Adsgram) { adController = window.Adsgram.init({ blockId: "35103" }); } else { setTimeout(initAdsGram, 500); } } catch (err) {} }

document.getElementById("reviveAdBtn").addEventListener("click", () => {
    if (!adController) { if(tg && tg.showAlert) tg.showAlert(texts[currentLang].msgAdFail); return; }
    adController.show().then((result) => { 
        if (result.done) { 
            adReviveUsedThisRun = true; document.getElementById("reviveMenu").style.display = "none"; 
            phase = "waiting"; heroY = 0; heroX = sticks[sticks.length - 1].x - heroDistanceFromEdge; 
            sticks[sticks.length - 1].length = 0; sticks[sticks.length - 1].rotation = 0; 
            perfectElement.innerText = texts[currentLang].revived; perfectElement.style.color = "#8e44ad"; perfectElement.style.opacity = 1; 
            draw(); setTimeout(() => { perfectElement.style.opacity = 0; perfectElement.style.color = "#FFD700"; }, 1500); 
        } 
    }).catch(() => { });
});

document.getElementById("skipReviveBtn").addEventListener("click", () => { document.getElementById("reviveMenu").style.display = "none"; restartButton.style.display = "block"; saveScoreToAPI(); });

document.getElementById("watchEarnBtn").addEventListener("click", () => {
    if (phase !== "waiting") return;
    if (!adController) { if(tg && tg.showAlert) tg.showAlert(texts[currentLang].msgAdFail); return; }
    adController.show().then((result) => { 
        if (result.done) { 
            const rewards = [35, 50, 65]; const earned = rewards[Math.floor(Math.random() * rewards.length)];
            playerCoins += earned; updateCoinUI();
            fetch('https://ninja-bridge-api.onrender.com/api/score/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, firstName: tgUserName, score: score, groupId: tgGroupId, earnedCoins: earned, earnedGems: 0 }) }).catch(e => {});
            if(tg && tg.showAlert) { tg.showAlert(`📺 ${earned} ${texts[currentLang].msgEarned}`); }
        } 
    }).catch(() => { });
});

// ------------------------------------
// 4. OYUN İÇİ DEĞİŞKENLER VE MOTOR
// ------------------------------------
let phase = "waiting"; let lastTimestamp; let heroX, heroY, sceneOffset; 
let platforms = [], sticks = [], trees = [];
let score = 0, combo = 0; let currentMonkeyLives = 0;

const canvasWidth = 375, canvasHeight = 375, platformHeight = 100; 
const heroDistanceFromEdge = 10, paddingX = 100;
const backgroundSpeedMultiplier = 0.2; 
const hill1BaseHeight = 100, hill1Amplitude = 10, hill1Stretch = 1; 
const hill2BaseHeight = 70, hill2Amplitude = 20, hill2Stretch = 0.5;
const stretchingSpeed = 4, turningSpeed = 4, walkingSpeed = 4, transitioningSpeed = 2, fallingSpeed = 2; 
const heroWidth = 17, heroHeight = 30; 

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

window.addEventListener('load', () => {
    if (tg && tg.ready) tg.ready(); if (tg && tg.expand) tg.expand();
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    updateUITexts(); initAdsGram(); loadPlayerData(); checkDuelStatus(); resetGame();
});

function loadPlayerData() {
    fetch(`https://ninja-bridge-api.onrender.com/api/score/player/${tgUserId}?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            playerCoins = data.coins || 0; playerGems = data.gems || 0;
            currentSkin = data.currentSkin || "default"; ownedSkins = data.ownedSkins || ["default"];
            currentPet = data.currentPet || "default"; ownedPets = data.ownedPets || {};
            updateCoinUI();
            if (phase === "waiting") { if (currentPet === "maymun") { currentMonkeyLives = getMonkeyStats().lives; } draw(); }
        }).catch(err => console.error(err));
}

function checkDuelStatus() {
    fetch(`https://ninja-bridge-api.onrender.com/api/score/duel-status/${tgUserId}?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.active) {
                isDuelMode = true; opponentName = data.opponentName; opponentTargetScore = data.opponentScore;
                if (opponentTargetScore !== -1) {
                    const banner = document.getElementById("duelDeathBanner");
                    if (banner && banner.style.display === "none") {
                        document.getElementById("duelDeathName").innerText = opponentName;
                        document.getElementById("duelDeathScore").innerText = opponentTargetScore;
                        banner.style.display = "block"; banner.style.opacity = "1";
                        setTimeout(() => { banner.style.opacity = "0"; setTimeout(() => { banner.style.display = "none"; }, 1000); }, 4000);
                    }
                    if (duelCheckInterval) { clearInterval(duelCheckInterval); duelCheckInterval = null; }
                } else { if (!duelCheckInterval) duelCheckInterval = setInterval(checkDuelStatus, 3000); }
            } else { isDuelMode = false; if (duelCheckInterval) { clearInterval(duelCheckInterval); duelCheckInterval = null; } }
        }).catch(() => {});
}

function updateCoinUI() { 
    if(coinCountElement) coinCountElement.innerHTML = `🪙 ${playerCoins} | 💎 ${playerGems}`; 
    if(shopCoinCountElement) shopCoinCountElement.innerHTML = `🪙 ${playerCoins} | 💎 ${playerGems}`; 
}

function saveScoreToAPI() {
    if (sessionEarnedCoins > 0) { playerCoins += sessionEarnedCoins; updateCoinUI(); }
    fetch('https://ninja-bridge-api.onrender.com/api/score/save', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, firstName: tgUserName, score: score, groupId: tgGroupId, earnedCoins: sessionEarnedCoins, earnedGems: 0 }) 
    }).then(() => { sessionEarnedCoins = 0; }).catch(e => {});
}

function getPerfectAreaSize(platformWidth) { let baseArea = 10; if (currentPet === "kedi") { let lvl = ownedPets["kedi"] || 1; baseArea = 20 + (lvl * 5); } else if (currentPet === "kurt") { let lvl = ownedPets["kurt"] || 1; baseArea = 15 + (lvl * 6); } return Math.min(baseArea, platformWidth * 0.8); }
function getMonkeyStats() { let lvl = ownedPets["maymun"] || 1; return { lives: Math.floor((lvl - 1) / 2) + 1, bonusCoins: (lvl % 2 === 0) ? lvl * 5 : 0 }; }
function processCoinGeneration(earnedPts) { stepCount += earnedPts; let reqSteps = 8; if (currentPet === "kopek" || currentPet === "kurt") { let lvl = ownedPets[currentPet] || 1; reqSteps = Math.max(1, 8 - lvl); } if (stepCount >= reqSteps) { let coinsToAdd = Math.floor(stepCount / reqSteps); playerCoins += coinsToAdd; sessionEarnedCoins += coinsToAdd; updateCoinUI(); stepCount = stepCount % reqSteps; } }
function isMenuOpen() { return (document.getElementById("shopModal") && document.getElementById("shopModal").style.display === "block") || (document.getElementById("leaderboardModal") && document.getElementById("leaderboardModal").style.display === "block") || (document.getElementById("reviveMenu") && document.getElementById("reviveMenu").style.display === "flex"); }

function resetGame() {
  phase = "waiting"; lastTimestamp = undefined; sceneOffset = 0; score = 0; combo = 0; sessionEarnedCoins = 0; stepCount = 0; adReviveUsedThisRun = false;
  if (currentPet === "maymun") { currentMonkeyLives = getMonkeyStats().lives; } else { currentMonkeyLives = 0; }
  introductionElement.style.opacity = 1; perfectElement.style.opacity = 0; restartButton.style.display = "none"; 
  if(document.getElementById("reviveMenu")) document.getElementById("reviveMenu").style.display = "none";
  
  const banner = document.getElementById("duelDeathBanner"); if (banner) { banner.style.display = "none"; banner.style.opacity = "0"; }
  isDuelMode = false; opponentTargetScore = -1; checkDuelStatus(); 

  scoreElement.innerText = score; platforms = [{ x: 50, w: 50 }];
  generatePlatform(); generatePlatform(); generatePlatform(); generatePlatform();
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
  trees = []; for(let i=0; i<10; i++) generateTree();
  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge; heroY = 0; draw();
}

function generateTree() { const minimumGap = 30, maximumGap = 150; const lastTree = trees[trees.length - 1]; let furthestX = lastTree ? lastTree.x : 0; const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap)); const treeColors = ["#6D8821", "#8FAC34", "#98B333"]; trees.push({ x, color: treeColors[Math.floor(Math.random() * 3)] }); }

function generatePlatform() {
  let minimumGap, maximumGap, minimumWidth, maximumWidth;
  if (score >= 5000) { minimumGap = 120; maximumGap = 250; minimumWidth = 10; maximumWidth = 25; } else if (score >= 4000) { minimumGap = 100; maximumGap = 230; minimumWidth = 15; maximumWidth = 35; } else if (score >= 3000) { minimumGap = 90; maximumGap = 210; minimumWidth = 20; maximumWidth = 45; } else if (score >= 2000) { minimumGap = 80; maximumGap = 190; minimumWidth = 25; maximumWidth = 55; } else if (score >= 1000) { minimumGap = 70; maximumGap = 170; minimumWidth = 30; maximumWidth = 65; } else if (score >= 750) { minimumGap = 60; maximumGap = 150; minimumWidth = 35; maximumWidth = 75; } else if (score >= 500) { minimumGap = 50; maximumGap = 130; minimumWidth = 40; maximumWidth = 85; } else if (score >= 250) { minimumGap = 45; maximumGap = 110; minimumWidth = 45; maximumWidth = 95; } else { minimumGap = 40; maximumGap = 90; minimumWidth = 50; maximumWidth = 100; } 
  let maxScreenGap = window.innerWidth - 130; if (maximumGap > maxScreenGap) { maximumGap = Math.max(minimumGap + 10, maxScreenGap); }
  const lastPlatform = platforms[platforms.length - 1]; let furthestX = lastPlatform.x + lastPlatform.w; const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap)); const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth)); platforms.push({ x, w });
}

window.addEventListener("mousedown", function (event) { if (event.target.tagName === 'CANVAS' && !isMenuOpen() && phase == "waiting") { lastTimestamp = undefined; introductionElement.style.opacity = 0; phase = "stretching"; unlockSounds(); } });
window.addEventListener("touchstart", function (event) { if (event.target.tagName === 'CANVAS' && !isMenuOpen() && phase == "waiting") { lastTimestamp = undefined; introductionElement.style.opacity = 0; phase = "stretching"; unlockSounds(); } });
window.addEventListener("mouseup", function () { if (phase == "stretching") phase = "turning"; });
window.addEventListener("touchend", function () { if (phase == "stretching") phase = "turning"; });
window.addEventListener("resize", function () { canvas.width = window.innerWidth; canvas.height = window.innerHeight; draw(); });

window.requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) { lastTimestamp = timestamp; window.requestAnimationFrame(animate); return; }
  let dt = timestamp - lastTimestamp; if (dt >= 12 && dt <= 20) { dt = 16.66; } else if (dt > 32) { dt = 16.66; } 

  switch (phase) {
    case "waiting": break; 
    case "dead_options": break; 
    case "stretching": { sticks[sticks.length - 1].length += dt / stretchingSpeed; break; }
    case "turning": {
      sticks[sticks.length - 1].rotation += dt / turningSpeed;
      if (sticks[sticks.length - 1].rotation > 90) {
        sticks[sticks.length - 1].rotation = 90; const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          let earnedPts = 0;
          if (perfectHit) { combo++; earnedPts = 1 + combo; score += earnedPts; perfectElement.innerText = `${texts[currentLang].perfect} +${earnedPts}`; perfectElement.style.opacity = 1; setTimeout(() => (perfectElement.style.opacity = 0), 1000); comboSound.currentTime = 0; comboSound.play().catch(e => {}); } 
          else { combo = 0; earnedPts = 1; score += earnedPts; perfectElement.innerText = ""; }
          processCoinGeneration(earnedPts); scoreElement.innerText = score; generatePlatform(); generateTree(); generateTree();
        }
        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += dt / walkingSpeed; const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) { const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge; if (heroX > maxHeroX) { heroX = maxHeroX; phase = "transitioning"; } } 
      else { const maxHeroX = sticks[sticks.length - 1].x + sticks[sticks.length - 1].length + heroWidth; if (heroX > maxHeroX) { heroX = maxHeroX; phase = "falling"; fallSound.currentTime = 0; fallSound.play().catch(e=>{}); } }
      break;
    }
    case "transitioning": { sceneOffset += dt / transitioningSpeed; const [nextPlatform] = thePlatformTheStickHits(); if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) { sticks.push({ x: nextPlatform.x + nextPlatform.w, length: 0, rotation: 0 }); phase = "waiting"; } break; }
    
    case "falling": {
      if (sticks[sticks.length - 1].rotation < 180) sticks[sticks.length - 1].rotation += dt / turningSpeed;
      heroY += dt / fallingSpeed; const maxHeroY = platformHeight + 100 + (window.innerHeight || 800) / 2;
      
      if (heroY > maxHeroY) {
        if (currentMonkeyLives > 0) { 
            currentMonkeyLives--; phase = "waiting"; heroY = 0; heroX = sticks[sticks.length - 1].x - heroDistanceFromEdge; sticks[sticks.length - 1].length = 0; sticks[sticks.length - 1].rotation = 0; 
            perfectElement.innerText = texts[currentLang].monkey; perfectElement.style.color = "#FF8C00"; perfectElement.style.opacity = 1; draw(); setTimeout(() => { perfectElement.style.opacity = 0; perfectElement.style.color = "#FFD700"; }, 1500); break; 
        }
        
        if (isDuelMode) {
            phase = "dead_options"; perfectElement.innerText = texts[currentLang].duelEnded; perfectElement.style.color = "#e74c3c"; perfectElement.style.opacity = 1; restartButton.style.display = "block"; saveScoreToAPI(); break;
        }

        let reviveMenuEl = document.getElementById("reviveMenu");
        if (!adReviveUsedThisRun && reviveMenuEl) { phase = "dead_options"; reviveMenuEl.style.display = "flex"; break; }
        
        phase = "dead_options"; restartButton.style.display = "block"; saveScoreToAPI(); break;
      }
      break;
    }
  }
  draw(); window.requestAnimationFrame(animate); lastTimestamp = timestamp;
}

function thePlatformTheStickHits() { 
  if (sticks[sticks.length - 1].rotation != 90) throw Error(`Stick is ${sticks[sticks.length - 1].rotation}°`); 
  const stickFarX = sticks[sticks.length - 1].x + sticks[sticks.length - 1].length; 
  const platformTheStickHits = platforms.find((platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w); 
  let pArea = getPerfectAreaSize(platformTheStickHits ? platformTheStickHits.w : 0); 
  if (platformTheStickHits && platformTheStickHits.x + platformTheStickHits.w / 2 - pArea / 2 < stickFarX && stickFarX < platformTheStickHits.x + platformTheStickHits.w / 2 + pArea / 2) return [platformTheStickHits, true]; return [platformTheStickHits, false]; 
}

function draw() { 
    let wWidth = window.innerWidth || 375; let wHeight = window.innerHeight || 800;
    ctx.save(); ctx.clearRect(0, 0, wWidth, wHeight); drawBackground(); 
    ctx.translate((wWidth - canvasWidth) / 2 - sceneOffset, (wHeight - canvasHeight) / 2); 
    drawPlatforms(); drawPet(); drawHero(); drawSticks(); ctx.restore(); 
}

restartButton.addEventListener("click", function (event) { event.preventDefault(); resetGame(); });

function drawPlatforms() { 
  let wHeight = window.innerHeight || 800;
  platforms.forEach(({ x, w }) => { 
      ctx.fillStyle = "black"; ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight + (wHeight - canvasHeight) / 2); 
      if (sticks[sticks.length - 1] && sticks[sticks.length - 1].x < x) { ctx.fillStyle = "red"; let pArea = getPerfectAreaSize(w); ctx.fillRect(x + w / 2 - pArea / 2, canvasHeight - platformHeight, pArea, pArea); } 
  }); 
}

function drawHero() { ctx.save(); let skin = skinData[currentSkin] || skinData["default"]; ctx.fillStyle = skin.body; ctx.translate(heroX - heroWidth / 2, heroY + canvasHeight - platformHeight - heroHeight / 2); drawRoundedRect(-heroWidth / 2, -heroHeight / 2, heroWidth, heroHeight - 4, 5); const legDistance = 5; ctx.beginPath(); ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill(); ctx.beginPath(); ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false); ctx.fill(); ctx.beginPath(); ctx.fillStyle = "white"; ctx.arc(5, -7, 3, 0, Math.PI * 2, false); ctx.fill(); ctx.fillStyle = skin.bandana; ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5); ctx.beginPath(); ctx.moveTo(-9, -14.5); ctx.lineTo(-17, -18.5); ctx.lineTo(-14, -8.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, -10.5); ctx.lineTo(-15, -3.5); ctx.lineTo(-5, -7); ctx.fill(); ctx.restore(); }

function drawPet() { if (currentPet === "default") return; let bounce = (phase === "walking" || phase === "transitioning") ? Math.abs(Math.sin(Date.now() / 100)) * 6 : 0; ctx.save(); ctx.translate(heroX - 32, heroY + canvasHeight - platformHeight - 20 - bounce); if (preRenderedPets[currentPet]) { ctx.drawImage(preRenderedPets[currentPet], 0, 0); } ctx.restore(); }

function drawRoundedRect(x, y, width, height, radius) { ctx.beginPath(); ctx.moveTo(x, y + radius); ctx.lineTo(x, y + height - radius); ctx.arcTo(x, y + height, x + radius, y + height, radius); ctx.lineTo(x + width - radius, y + height); ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius); ctx.lineTo(x + width, y + radius); ctx.arcTo(x + width, y, x + width - radius, y, radius); ctx.lineTo(x + radius, y); ctx.arcTo(x, y, x, y + radius, radius); ctx.fill(); }

function drawSticks() { sticks.forEach((stick) => { ctx.save(); ctx.translate(stick.x, canvasHeight - platformHeight); ctx.rotate((Math.PI / 180) * stick.rotation); ctx.beginPath(); ctx.lineWidth = 2; ctx.moveTo(0, 0); ctx.lineTo(0, -stick.length); ctx.stroke(); ctx.restore(); }); }

function drawBackground() { let wWidth = window.innerWidth || 375; let wHeight = window.innerHeight || 800; var gradient = ctx.createLinearGradient(0, 0, 0, wHeight); gradient.addColorStop(0, "#BBD691"); gradient.addColorStop(1, "#FEF1E1"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, wWidth, wHeight); drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629"); drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C"); trees.forEach((tree) => drawTree(tree.x, tree.color)); }

function drawHill(baseHeight, amplitude, stretch, color) { let wWidth = window.innerWidth || 375; let wHeight = window.innerHeight || 800; ctx.beginPath(); ctx.moveTo(0, wHeight); ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch)); for (let i = 0; i < wWidth; i++) { ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch)); } ctx.lineTo(wWidth, wHeight); ctx.fillStyle = color; ctx.fill(); }

function drawTree(x, color) { ctx.save(); ctx.translate((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, getTreeY(x, hill1BaseHeight, hill1Amplitude)); const treeTrunkHeight = 5, treeTrunkWidth = 2, treeCrownHeight = 25, treeCrownWidth = 10; ctx.fillStyle = "#7D833C"; ctx.fillRect(-treeTrunkWidth / 2, -treeTrunkHeight, treeTrunkWidth, treeTrunkHeight); ctx.beginPath(); ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight); ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight)); ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight); ctx.fillStyle = color; ctx.fill(); ctx.restore(); }

function getHillY(windowX, baseHeight, amplitude, stretch) { let wHeight = window.innerHeight || 800; return Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + wHeight - baseHeight; }
function getTreeY(x, baseHeight, amplitude) { let wHeight = window.innerHeight || 800; return Math.sinus(x) * amplitude + wHeight - baseHeight; }

// ------------------------------------
// 8. UI VE MARKET İŞLEMLERİ 
// ------------------------------------

document.getElementById("leaderboardBtn").addEventListener("click", () => { 
    const t = texts[currentLang];
    if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgPlaying); return; }
    document.getElementById("leaderboardModal").style.display = "block"; 
    const list = document.getElementById("scoreList"); list.innerHTML = `<li style='text-align:center;'>${t.loading}</li>`; 
    fetch(`https://ninja-bridge-api.onrender.com/api/score/global?t=${Date.now()}`).then(res => res.json()).then(data => { 
        list.innerHTML = ""; if(data.length === 0) { list.innerHTML = `<li>${t.noOne}</li>`; return; } 
        data.forEach((item, i) => { list.innerHTML += `<li style="padding:4px; border-bottom:1px solid #ddd;"><b>${i + 1}.</b> ${item.name} <span style="float:right;">${item.score}</span></li>`; }); 
    }).catch(() => list.innerHTML = `<li style='color:red;'>${t.error}</li>`); 
}); 
document.getElementById("closeLeaderboard").addEventListener("click", () => { document.getElementById("leaderboardModal").style.display = "none"; });

document.getElementById("shopBtn").addEventListener("click", () => { 
    if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(texts[currentLang].msgPlaying); return; }
    document.getElementById("shopModal").style.display = "block"; renderShop(); 
});
document.getElementById("closeShop").addEventListener("click", () => { document.getElementById("shopModal").style.display = "none"; });

function renderShop() {
    const t = texts[currentLang];
    const list = document.getElementById("shopList");
    let html = `<li style="background:#ddd; justify-content:center; padding:4px; font-size:14px; text-align:center;">💎 <b>${t.shopGemExchange}</b></li>`;
    html += `<li style="padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee;"><span>${t.shopExchangeBtn}</span> <button style="background:#9b59b6; padding: 5px 10px; font-size:12px; margin:0; border:none; color:white; border-radius:5px; cursor:pointer;" onclick="convertGems()">${t.shopGetGem}</button></li>`;
    
    html += `<li style="background:#ddd; justify-content:center; padding:4px; font-size:14px; margin-top:6px; text-align:center;">🥷 <b>${t.shopSkins}</b></li>`;
    Object.keys(skinData).forEach(key => { 
        const skin = skinData[key]; 
        let sName = currentLang === "tr" ? skin.nameTr : skin.nameEn;
        let actionHTML = ""; 
        if (currentSkin === key) actionHTML = `<span style=\"font-size:13px;\">${t.equipped}</span>`; 
        else if (ownedSkins.includes(key)) actionHTML = `<button style=\"padding: 5px 10px; font-size:12px; margin:0; border:none; background:#34495e; color:white; border-radius:5px; cursor:pointer;\" onclick=\"equipSkin('${key}')\">${t.equip}</button>`; 
        else actionHTML = `<button style=\"padding: 5px 10px; font-size:12px; margin:0; border:none; background:#2196F3; color:white; border-radius:5px; cursor:pointer;\" onclick=\"buySkin('${key}', ${skin.price})\">🪙 ${skin.price}</button>`; 
        html += `<li style=\"padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee;\"><span><span style=\"color:${skin.body}; text-shadow: 1px 1px 1px black;\">⬤</span> ${sName}</span> ${actionHTML}</li>`; 
    });
    
    html += `<li style="background:#ddd; justify-content:center; padding:4px; font-size:14px; margin-top:6px; text-align:center;">🐾 <b>${t.shopPets}</b></li>`;
    Object.keys(petData).forEach(key => { 
        const pet = petData[key]; 
        let pName = currentLang === "tr" ? pet.nameTr : pet.nameEn;
        let pDesc = currentLang === "tr" ? pet.descTr : pet.descEn;
        let isOwned = ownedPets.hasOwnProperty(key); let level = isOwned ? ownedPets[key] : 0; 
        if (!isOwned) { 
            html += `<li style=\"padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee;\"><span style=\"line-height:1.2;\">${pet.emoji} ${pName} (Sv.1)<br><small style=\"color:gray; font-size:11px;\">${pDesc}</small></span> <button style=\"padding: 5px 10px; font-size:12px; margin:0; border:none; background:#2196F3; color:white; border-radius:5px; cursor:pointer;\" onclick=\"buyPet('${key}', ${pet.price})\">🪙 ${pet.price}</button></li>`; 
        } else { 
            let eqBtn = (currentPet === key) ? `<span style=\"font-size:13px; margin-right:5px;\">${t.equipped}</span>` : `<button style=\"padding: 5px 10px; font-size:12px; margin-right:5px; border:none; background:#34495e; color:white; border-radius:5px; cursor:pointer;\" onclick=\"equipPet('${key}')\">${t.equip}</button>`; 
            let upgBtn = ""; 
            if (level < 5 && key === "kurt") { let costVal = level * 2; upgBtn = `<button style=\"background:#e67e22; padding: 4px 8px; font-size:11px; border:none; color:white; border-radius:5px; cursor:pointer;\" onclick=\"upgradePet('${key}', ${level+1}, ${costVal})\">⬆️ 💎 ${costVal}</button>`; }
            else if (level < 4 && key !== "kurt") { let costVal = (level === 1) ? 1 : (level === 2) ? 3 : 5; upgBtn = `<button style=\"background:#e67e22; padding: 4px 8px; font-size:11px; border:none; color:white; border-radius:5px; cursor:pointer;\" onclick=\"upgradePet('${key}', ${level+1}, ${costVal})\">⬆️ 💎 ${costVal}</button>`; } 
            else { upgBtn = `<span style=\"font-size:11px; color:red; font-weight:bold;\">${t.max}</span>`; } 
            html += `<li style=\"padding: 6px 8px; font-size:13px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee;\"><span style=\"line-height:1.2;\">${pet.emoji} ${pName} (Sv.${level})<br><small style=\"color:gray; font-size:11px;\">${pDesc}</small></span> <div style=\"display:flex; align-items:center;\">${eqBtn}${upgBtn}</div></li>`; 
        } 
    }); list.innerHTML = html;
}

window.convertGems = function() { const t = texts[currentLang]; if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgPlaying); return; } if(playerCoins < 1000) { if(tg && tg.showAlert) tg.showAlert(t.msgNoCoin1000); return; } if (isConverting) return; isConverting = true; fetch('https://ninja-bridge-api.onrender.com/api/score/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId }) }).then(res => res.json()).then(data => { isConverting = false; if(data.success) { playerCoins -= 1000; playerGems += 1; updateCoinUI(); renderShop(); } }).catch(() => { isConverting = false; }); }
window.upgradePet = function(petKey, nextLevel, costVal) { const t = texts[currentLang]; if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgPlaying); return; } if (playerGems < costVal) { if(tg && tg.showAlert) tg.showAlert(t.msgNoGem); return; } if(tg && tg.showConfirm) { let pName = currentLang==="tr"?petData[petKey].nameTr:petData[petKey].nameEn; tg.showConfirm(t.askPet.replace("{name}", pName).replace("{lvl}", nextLevel), function(agreed) { if(agreed) { fetch('https://ninja-bridge-api.onrender.com/api/score/upgradepet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, petName: petKey, coinCost: 0, gemCost: costVal, nextLevel: nextLevel }) }).then(res => res.json()).then(data => { if(data.success) { playerGems -= costVal; ownedPets[petKey] = nextLevel; updateCoinUI(); renderShop(); } }); } }); } }
window.buySkin = function(skinKey, price) { const t = texts[currentLang]; if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgPlaying); return; } if(playerCoins < price) { if(tg && tg.showAlert) tg.showAlert(t.msgNoCoin); return; } if(tg && tg.showConfirm) { let sName = currentLang==="tr"?skinData[skinKey].nameTr:skinData[skinKey].nameEn; tg.showConfirm(t.askSkin.replace("{name}", sName), function(agreed) { if(agreed) { fetch('https://ninja-bridge-api.onrender.com/api/score/buyskin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: skinKey, price: price }) }).then(res => res.json()).then(data => { if(data.success) { playerCoins -= price; ownedSkins.push(skinKey); updateCoinUI(); renderShop(); } }); } }); } }
window.equipSkin = function(skinKey) { const t = texts[currentLang]; if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgNoEquipSkin); return; } fetch('https://ninja-bridge-api.onrender.com/api/score/equipskin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: skinKey }) }).then(res => res.json()).then(data => { if(data.success) { currentSkin = skinKey; renderShop(); draw(); } }); }
window.buyPet = function(petKey, price) { const t = texts[currentLang]; if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgPlaying); return; } if(playerCoins < price) { if(tg && tg.showAlert) tg.showAlert(t.msgNoCoin); return; } if(tg && tg.showConfirm) { let pName = currentLang==="tr"?petData[petKey].nameTr:petData[petKey].nameEn; tg.showConfirm(t.askAdopt.replace("{name}", pName), function(agreed) { if(agreed) { fetch('https://ninja-bridge-api.onrender.com/api/score/buypet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: petKey, price: price }) }).then(res => res.json()).then(data => { if(data.success) { playerCoins -= price; ownedPets[petKey] = 1; updateCoinUI(); renderShop(); } }); } }); } }
window.equipPet = function(petKey) { const t = texts[currentLang]; if (phase !== "waiting") { if(tg && tg.showAlert) tg.showAlert(t.msgNoEquipPet); return; } fetch('https://ninja-bridge-api.onrender.com/api/score/equippet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: tgUserId, skinName: petKey }) }).then(res => res.json()).then(data => { if(data.success) { currentPet = petKey; renderShop(); draw(); } }); }
