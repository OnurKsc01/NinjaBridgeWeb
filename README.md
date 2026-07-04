🥷 Ninja Bridge - Telegram Mini App Game
/////  https://imgur.com/a/bFC0c8N  /////

🇹🇷 [Türkçe] | 🇬🇧 [English]
(Aşağı kaydırarak İngilizce versiyonuna ulaşabilirsiniz / Scroll down for the English version)

🇹🇷 TÜRKÇE
🎯 Oyunun Amacı
Ninja Bridge, beceri ve zamanlamaya dayalı, doğrudan Telegram üzerinden oynanan sürükleyici bir köprü kurma (Stick Hero tarzı) oyunudur. Oyuncular, uçurumları aşmak için ekrana basılı tutarak köprüyü tam doğru uzunlukta ayarlamalı, düşen ateş toplarından ve canavarlardan kaçınmalıdır. Oyuncular hayatta kaldıkça altın ve elmas toplar; bu sayede yepyeni kostümler (Skins), özel güçler veren yoldaşlar (Pets) ve VIP ayrıcalıklar satın alabilirler. Oyun ayrıca klan savaşları (Grup sıralaması), 1v1 düellolar ve global liderlik tablolarıyla kıyasıya bir rekabet ortamı sunar!

💻 Kullanılan Teknolojiler
Bu proje, modern web teknolojileri ve güçlü bir C# arkayüzü ile tam entegre bir Telegram Mini App olarak geliştirilmiştir:

Frontend (Önyüz): HTML5 Canvas API (Oyun motoru ve çizimler), Vanilla JavaScript (ES6+), CSS3

Backend (Arkayüz): C# (.NET Core Web API), Telegram.Bot Kütüphanesi

Veritabanı: Microsoft SQL Server (T-SQL, ADO.NET)

Entegrasyonlar ve API'ler: Telegram WebApp API, Adsgram API (Oyun içi reklam ve Jeton kazanma sistemi)

Diğer: Kasa (Lootbox) algoritmaları, Dinamik görev/sezon sistemi, Asenkron veritabanı işlemleri

🚀 Nasıl Çalıştırılır?
Projeyi kendi ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1. Backend (Arkayüz - C#) Kurulumu:

Proje klasörünü (.sln uzantılı dosya) Visual Studio üzerinde açın.

appsettings.json dosyasını açın ve kendi MS SQL Server bağlantı dizesini (DefaultConnection) ve BotFather'dan aldığınız Telegram Bot Token'ınızı girin.

Projeyi derleyip Start (F5) tuşuna basarak API'yi ayağa kaldırın. (Veritabanı tabloları ilk istekte otomatik oluşacak şekilde ayarlanmıştır veya SQL sorgularını manuel çalıştırın).

2. Frontend (Önyüz - JS/HTML) Kurulumu:

Web klasöründeki dosyaları (index.html, java.js vb.) bir web sunucusunda (Örn: GitHub Pages, Vercel, Netlify) barındırın.

java.js dosyasını açıp içindeki API istek atılan URL'leri (fetch metodları içindeki https://ninjabridgeapi... adreslerini) kendi ayağa kaldırdığınız API adresiyle değiştirin.

BotFather üzerinden botunuza giderek Web App (Mini App) URL'si olarak yayınladığınız oyunun linkini ayarlayın.

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\

🇬🇧 ENGLISH
🎯 Game Objective
Ninja Bridge is an engaging, skill and timing-based bridge-building game (similar to Stick Hero) played directly within Telegram as a Mini App. Players must hold the screen to stretch the bridge to the exact length needed to cross platforms while dodging falling fireballs and monsters. As players survive, they collect coins and gems to unlock new skins, special pets with unique abilities, and VIP privileges. The game also features a highly competitive environment with clan wars (group rankings), 1v1 duels, and global leaderboards!

💻 Technologies Used
This project is developed as a fully integrated Telegram Mini App using modern web technologies and a robust C# backend:

Frontend: HTML5 Canvas API (Game engine & rendering), Vanilla JavaScript (ES6+), CSS3

Backend: C# (.NET Core Web API), Telegram.Bot SDK

Database: Microsoft SQL Server (T-SQL, ADO.NET)

Integrations & APIs: Telegram WebApp API, Adsgram API (In-game ads & monetization)

Other: Lootbox algorithms, Dynamic daily/seasonal reward systems, Asynchronous database operations

🚀 How to Run
Follow these steps to run the project in your local environment:

1. Backend (C#) Setup:

Open the project solution (.sln file) in Visual Studio.

Navigate to the appsettings.json file and enter your MS SQL Server connection string (DefaultConnection) along with your Telegram Bot Token obtained from BotFather.

Build the project and click Start (F5) to launch the API. (Make sure your database is configured or run the necessary SQL scripts to create tables).

2. Frontend (JS/HTML) Setup:

Host the frontend files (index.html, java.js, etc.) on a static web server (e.g., GitHub Pages, Vercel, Netlify).

Open java.js and update all the API endpoints (the URLs inside the fetch methods) to point to your newly running C# API.

Go to BotFather on Telegram and configure your Web App (Mini App) URL to point to your hosted game link.
