# 🛫 AeroAI — Akıllı Havalimanı Seyahat ve Canlı Takip Koridoru

AeroAI; mobilize edilmeye elverişli, **DHMİ, İGA, TAV ve HEAŞ** canlı veri simülasyonları ile donatılmış, KVKK uyumlu kamera tabanlı biniş kartı tarayıcısı ve **Gemini AI** tabanlı kişiselleştirilmiş seyahat asistanına sahip, yeni nesil bir akıllı uçuş ve güvenlik yönetim platformudur.

---

## 📱 Mobil & PWA (Progressive Web App) Özellikleri

Uygulama, havalimanlarındaki zayıf internet bağlantısı durumlarında bile kesintisiz seyahat deneyimi sunması için kapsamlı bir mobil dönüşüm sürecinden geçirilmiştir:

### 📶 Çevrimdışı Biniş Kartı & API Önbelleği (Service Worker)
* **Offline Caching (Service Worker)**: `/public/service-worker.js` üzerinde özel bir akıllı önbellek mimarisi kurgulanmıştır. Uygulama kabuğu (app shell), yazı tipleri ve statik varlıklar **Cache-First** politikasıyla yüklenir.
* **Canlı Veri Önbelleği**: Havalimanı otoritelerinden çekilen canlı biniş kartı, uçuş verileri ve simülatör durumları **Network-First, Cache-Fallback** algoritmasıyla önbelleğe alınır. İnternet kopsa dahi biniş kartınız ve son uçuş durumunuz ekranda kalmaya devam eder!

### 🎨 Gerçek PNG İkonlar & `manifest.json` Entegrasyonu
* **PWA Manifestosu**: `/public/manifest.json` dosyası eklenerek uygulamanın mobil tarayıcılarda "Ana Ekrana Ekle" (Add to Home Screen) özelliğiyle standalone bir mobil uygulama gibi çalışması sağlanmıştır.
* **Mobil Çözünürlük İkonları**: `192x192` ve `512x512` boyutlarında havacılık temalı, göze hitap eden gerçek yüksek çözünürlüklü PNG ikon seti `scripts/generate-icons.js` yardımıyla inşaat aşamasında derlenmektedir.
* **Safe-Area Insets (çentik uyumu)** ve `apple-mobile-web-app` meta etiketleri eklenerek iOS ve Android cihazlardaki yerleşik tarayıcılarda tam ekran (fullscreen) kusursuz çentik uyumu sağlanmıştır.

### 🔋 Capacitor ile Native Push Bildirimleri & Kamera Entegrasyonu
* **Native Kamera Tetikleyici (`@capacitor/camera`)**: Mobil tarayıcılarda veya doğrudan native sarmalayıcı (wrapper) içerisinde çalıştırıldığında, geleneksel WebRTC kameralarına ek olarak stabil native kamera API'lerini çağırarak biniş kartlarını kusursuz şekilde yakalar.
* **Native Push Bildirimleri (`@capacitor/push-notifications`)**: Native mobil derlemelerde uçuş rötarları, kapı değişiklikleri ve acil durum kriz anlarında arka planda olsanız dahi cihaza anlık push gönderilir. Web görünümünde ise uyarısız ve sessiz bir şekilde hata fırlatmadan web standartlarına sorunsuz downgrade olur.

---

## ✨ Öne Çıkan Diğer Özellikler

### 🗺️ Gelişmiş Bento Grid Canlı Takip Paneli
* **Dinamik Hücre Yapısı (Bento Grid)**: Uçuş bilgilerini, kapı durumunu, güvenlik kuyruğu sürelerini ve asistan mesajlarını hiyerarşik ve minimalist bir grid yapısında sunar.
* **Canlı Zaman Damgaları & Renk Kodları**: Gecikmeli veya iptal edilen seferler için anlık görsel uyarılar ve dinamik durum göstergeleri sunar.

### 🔌 DHMİ Otorite Bağlantısı & Firestore Real-time Uçuş Takibi
* **Yarıda Kalmayan Akış**: Bulut veritabanındaki `flights` koleksiyonunu anlık dinleyen `onSnapshot` mimarisi sayesinde, simülatörden yapılan her kapı veya gecikme değişikliği kullanıcı ekranına sıfır gecikme (**real-time**) ile yansır.
* **Dinamik Yapılandırma**: `firebase-applet-config.json` üzerinden veritabanı kimliğini dinamik çekerek bütüncül bir senkronizasyon yürütür.

### 🛡️ Aile Koruma & Acil Durum Kontrol Paneli
* **Uydudan SMS İleticisi**: Tek tıkla tetiklenebilen uydu tabanlı SOS sinyali simülasyonu.
* **Bento Log Tasarımı**: Acil durum bildirimlerinin durum akışını (**BEKLEMEDE / BAŞARILI**) şeffaf, hafif buzlu cam görünümlü (`backdrop-blur-xs`) ve 2xl köşeleri yumuşatılmış minimalist satırlar halinde asimetrik şekilde listeler.

### 📷 Yapay Zeka Seyahat Asistanı (Gemini) & Biniş Kartı Tarayıcı
* **KVKK Uyumlu Kamera**: Tarayıcı aracılığıyla biniş kartlarındaki raw barkod verilerini gerçek zamanlı parselleyerek uçuş ekranına anında bağlar.
* **Fayda Odaklı Gemini Entegrasyonu**: Yolcunun diline, uçuş hattına (örneğin Londra seferlerine özel Duty-Free teklifleri) ve engelsiz koridor isteklerine uygun mikro-çözümler üreten empati yeteneği yüksek seyahat can yoldaşı.
* **Akıllı Finansal Rehberlik**: Gemini asistana entegre edilen canlı kur verileri ve terminal USD referans kurguları sayesinde, yolcu seyahat bütçesi, yerel harcamalar veya kur dönüşümleri hakkında sorduğunda asistandan güncel tam değerlerle proaktif bütçeleme ve harcama tavsiyeleri alır.

### 🪙 Dinamik Döviz Kuru Takibi & Çok Bölgeli Transfer Planlaması
* **Canlı Kur Mini Kartı**: Uçuşun varış konumuna göre o ülkenin yerel para birimini (GBP, USD, EUR, RUB) otomatik tespit eder, canlı döviz kurları API'si (`open.er-api.com`) ile entegre çalışarak Türk Lirası (TRY) karşısındaki güncel değerini bento tarzında tasarlanmış şık bir mini kartta listeler.
* **Türkiye Ulusal Transfer Entegrasyonu**: Aktif havalimanı bölgesine göre; İstanbul (Yeni Havalimanı & Sabiha Gökçen), İzmir (ADB), Ankara (ESB), Antalya (AYT) ve Muğla (BJV/DLM) genelinde HAVAİST, HAVAŞ, Muttaş, Belko Air, metro ve entegre tramvay hat önerilerini, saatlik tarife detaylarını ve peron konumlarını dinamik olarak yönetip listeler.

---

## 🛠️ Teknik Mimari ve Teknolojiler

Platform, modern bir full-stack (istemci + sunucu) yapısına dayanır:

* **Frontend**: React 18+, Vite, Tailwind CSS, Zustand (Durum Yönetimi).
* **PWA & Native**: HTML5 Service Worker API, W3C Web Manifest Standard, Web Storage, `@capacitor/core`, `@capacitor/camera`, `@capacitor/push-notifications`.
* **Backend**: Express.js ile entegre TypeScript çalışma ortamı (`tsx` ile direkt dev server yürütümü, `esbuild` ile CJS formatında optimize edilmiş üretim derlemesi).
* **Veritabanı & Güvenlik**: Firebase Firestore veritabanı ilişkileri ve canlı durumları doğrulayan `firestore.rules` kuralları.
* **Yapay Zeka**: `@google/genai` TypeScript SDK'sı üzerinde çalışan gelişmiş dil modelleri.

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkların Kurulması
Geliştirme paketlerini ve kütüphaneleri yüklemek için aşağıdaki komutu çalıştırın:
```bash
npm install
```

### 2. Ortam Değişkenleri
Bir adet `.env` dosyası oluşturup aşağıdaki anahtarı tanımlayın:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Geliştirme Sunucusunu Başlatma
Express backend sunucusunu ve Vite'ı aynı port üzerinden (3000) ayağa kaldırmak için:
```bash
npm run dev
```

### 4. Üretim Derlemesi (Build & Start)
Üretim derlemesi tetiklendiğinde otomatik olarak yüksek çözünürlüklü ikon üreteci çalışır, ardından Vite assets ve CJS sunucu katmanı derlenir:
```bash
npm run build
npm start
```

---

## 📂 Dosya Yapısı

* `server.ts` — İstemci ile Firestore (DHMİ canlandırma) arasındaki veri akışını yöneten Express sunucu katmanı.
* `/scripts/generate-icons.js` — Üretim öncesinde mobil uygulama ikonlarını yaratan otomatik tasarım scripti.
* `/public/service-worker.js` — Offline depolama, biniş kartı ve canlı API entegrasyonu yönetiminden sorumlu servis işçisi.
* `/public/manifest.json` — Mobil cihaza yükleme standartları ve ekran yönelim izinleri.
* `/src/App.tsx` — Firestore dynamic snapshot kurgusunu ve durum yönetimini üstlenen ana React modülü.
* `/src/components/DashboardScreen.tsx` — Göz alıcı seyahat kartları, biniş kartı QR barkodu ve Bento-stili "Aile Koruma SMS Logları"nı barındıran temel görsel katman.
* `/firestore.rules` — Canlı uçuş verileri ve ziyaretçi profilleri için kurgulanmış güvenlik onay seti.
* `/metadata.json` — İzin tanımları ve genel platform öznitelikleri.

---
*AeroAI Akıllı Seyahat Asistanınız ile her uçuşta sıfır stres, maksimum konfor! Cihaz kameranızı açarak biniş kartınızı hemen taratabilirsiniz veya mobil ana ekrana ekleyerek çevrimdışı uçuş takibinizin keyfini çıkarabilirsiniz.*

