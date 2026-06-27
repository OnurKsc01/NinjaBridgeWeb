// ==========================================
// 🔥 CS:GO TARZI KASA AÇMA ANİMASYONU VE KORUMA 🔥
// ==========================================

// 1. Kasa Arayüzünü Oyuna Gizlice Enjekte Et
const caseModal = document.createElement("div");
caseModal.id = "csgoCaseModal";
caseModal.style = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:99999; flex-direction:column; justify-content:center; align-items:center; font-family:Arial, sans-serif;";
caseModal.innerHTML = `
    <h2 style="color:#f1c40f; margin-bottom:20px; text-shadow: 2px 2px 4px #000;">🎁 PREMIUM KASA</h2>
    <div style="width:320px; height:100px; overflow:hidden; border:4px solid #34495e; border-radius:10px; position:relative; background:#1a1a1a; box-shadow: 0 0 20px rgba(0,0,0,0.8);">
        <div style="position:absolute; left:50%; top:0; bottom:0; width:4px; background:#e74c3c; transform:translateX(-50%); z-index:10; box-shadow: 0 0 10px red;"></div>
        <div id="csgoCaseStrip" style="display:flex; height:100%; transition: transform 5s cubic-bezier(0.15, 0.9, 0.25, 1);"></div>
    </div>
    <div id="caseResultText" style="margin-top:20px; font-size:22px; font-weight:bold; color:white; opacity:0; transition: opacity 0.5s; text-align:center;"></div>
    <button id="csgoCaseCloseBtn" style="display:none; margin-top:20px; padding:10px 30px; background:#2ecc71; color:white; font-size:16px; font-weight:bold; border:none; border-radius:8px; cursor:pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">KAPAT VE AL</button>
`;
document.body.appendChild(caseModal);

// 2. Telegram'ı Dondurmayan Özel Ninja Uyarı Sistemi
function showNinjaAlert(msg, isError = false) {
    let alertBox = document.getElementById("ninjaCustomAlert");
    if (!alertBox) {
        alertBox = document.createElement("div");
        alertBox.id = "ninjaCustomAlert";
        alertBox.style = "position:fixed; top:30px; left:50%; transform:translateX(-50%); color:white; padding:15px 25px; border-radius:10px; z-index:99999; font-weight:bold; text-align:center; transition:opacity 0.3s; opacity:0; box-shadow: 0 4px 10px rgba(0,0,0,0.5);";
        document.body.appendChild(alertBox);
    }
    alertBox.style.background = isError ? "rgba(231, 76, 60, 0.95)" : "rgba(46, 204, 113, 0.95)";
    alertBox.innerHTML = msg;
    alertBox.style.display = "block";
    setTimeout(() => alertBox.style.opacity = "1", 10);
    setTimeout(() => { alertBox.style.opacity = "0"; setTimeout(() => alertBox.style.display = "none", 300); }, 3000);
}

let isBoxOpening = false;

// 3. Kasa Açma Motoru (Telegram Bug'larından %100 Arındırılmış)
window.openPremiumBox = function() {
    if (phase !== "waiting" || isBoxOpening) return;
    if (playerGems < 30) { 
        showNinjaAlert("❌ Yetersiz Elmas! Kasa için 30 💎 gerekiyor.", true);
        return; 
    }
    
    // Güvenli JS Onay Kutusu
    if (window.confirm("30 Elmas ile Premium Kasa açıyorsun. Çark dönecek! Onaylıyor musun?")) {
        isBoxOpening = true;
        
        fetch('https://ninjabridgeapi.duckdns.org/api/score/openbox', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ userId: tgUserId }) 
        })
        .then(res => res.json())
        .then(data => { 
            if (data.success) { 
                playerGems -= 30; // Kasa ücretini anında düş ki UI güncellensin
                updateCoinUI();
                playCsgoAnimation(data.rewardGems, data.message); // CS:GO ANİMASYONUNU BAŞLAT!
            } else { 
                isBoxOpening = false;
                showNinjaAlert(`❌ ${data.message}`, true); 
            } 
        })
        .catch(err => { 
            isBoxOpening = false; 
            showNinjaAlert(`❌ KASA HATASI: ${err.message}`, true); 
        });
    }
};

// 4. CS:GO Kasa Çarkı Animasyonu
function playCsgoAnimation(wonGem, messageText) {
    const modal = document.getElementById("csgoCaseModal");
    const strip = document.getElementById("csgoCaseStrip");
    const closeBtn = document.getElementById("csgoCaseCloseBtn");
    const resultText = document.getElementById("caseResultText");

    // UI'ı Sıfırla ve Göster
    modal.style.display = "flex";
    closeBtn.style.display = "none";
    resultText.style.opacity = "0";
    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";
    
    const possibleRewards = [5, 25, 40, 50, 100];
    const itemWidth = 100; 
    const totalItems = 45; // Çarkta toplam 45 kutu kayacak
    const winningIndex = 38; // Kırmızı çizgi tam 38. kutuda duracak

    let html = "";
    for(let i=0; i<totalItems; i++) {
        let gemAmount = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        
        // Kazandığı elması tam durma noktasına hileyle yerleştiriyoruz :)
        if (i === winningIndex) { gemAmount = wonGem; } 
        
        let bgColors = "";
        let textShadow = "";
        
        // Elmas değerine göre CS:GO Eşya Kalitesi (Nadirliği) Renkleri
        if (gemAmount === 100) { bgColors = "linear-gradient(135deg, #ff00cc, #333399)"; textShadow = "0 0 10px white"; } // Çok Gizli (Kırmızı/Pembe)
        else if (gemAmount === 50) { bgColors = "linear-gradient(135deg, #f1c40f, #e67e22)"; } // Efsanevi (Turuncu)
        else if (gemAmount === 40) { bgColors = "linear-gradient(135deg, #9b59b6, #8e44ad)"; } // Gizli (Mor)
        else if (gemAmount === 25) { bgColors = "linear-gradient(135deg, #3498db, #2980b9)"; } // Sınırlı (Mavi)
        else { bgColors = "linear-gradient(135deg, #7f8c8d, #34495e)"; } // Yaygın (Gri)

        html += `<div style="min-width:${itemWidth}px; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:${bgColors}; border-right:2px solid #2c3e50; color:white; font-weight:bold; font-size:20px; text-shadow:${textShadow};">💎<br>${gemAmount}</div>`;
    }
    strip.innerHTML = html;
    
    // DOM'un yüklenmesi için ufak bir bekleme, sonra kaydırmaya başla
    setTimeout(() => {
        // Çark 5 saniyede yavaşlayarak CS:GO gibi kayar (cubic-bezier)
        strip.style.transition = "transform 5s cubic-bezier(0.15, 0.9, 0.2, 1)"; 
        
        // Kırmızı çizgiyi kazanan kutuya denk getirmek için pikselleri hesapla
        // Kutu ortalaması -110 piksele denk gelir. Az sağda/solda durması için -40 ile +40 arası rastgele sapma ekledik.
        let randomOffset = Math.floor(Math.random() * 80) - 40; 
        let stopPos = (winningIndex * itemWidth) - 110 + randomOffset; 

        strip.style.transform = `translateX(-${stopPos}px)`;

        // 5 Saniyelik çark dönüşü bittiğinde:
        setTimeout(() => {
            playerGems += wonGem; // Ödülü hesabına gerçekte şimdi yansıt
            updateCoinUI();
            renderShop();
            
            resultText.innerHTML = messageText;
            resultText.style.opacity = "1";
            closeBtn.style.display = "block";
            
            // Başarı sesi
            if (comboSound) { comboSound.currentTime = 0; comboSound.play().catch(()=>{}); }
            
        }, 5200);
    }, 100);

    // Kapat ve Al butonuna basıldığında
    closeBtn.onclick = () => {
        modal.style.display = "none";
        isBoxOpening = false;
    };
}
