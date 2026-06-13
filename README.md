# 🛫 AeroAI — Akıllı Havalimanı Seyahat ve Canlı Takip Koridoru

AeroAI; mobilize edilmeye elverişli, **DHMİ, İGA, TAV ve HEAŞ** canlı veri simülasyonları ile donatılmış, KVKK uyumlu kamera tabanlı biniş kartı tarayıcısı ve **Gemini AI** tabanlı kişiselleştirilmiş seyahat asistanına sahip, yeni nesil bir akıllı uçuş ve güvenlik yönetim platformudur.

---

## 📸 Ekran Görüntüleri ve Arayüz Tasarımı

AeroAI, minimalist ve yüksek kontrastlı bir **Kozmik Gece (Cosmic Slate)** tasarım diline sahiptir. Arayüz elemanları hiyerarşik ve gözü yormayan asimetrik bento düzeninde (`bento-grid`) kurgulanmıştır.

| 🎛️ Akıllı Bento Takip Paneli | 🤳 Kamera ile Biniş Kartı Tarayıcı |
| :---: | :---: |
| <img src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=600&auto=format&fit=crop" width="100%" alt="AeroAI Canlı Bento Takip Paneli" style="border-radius: 8px;" /> | <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop" width="100%" alt="Kamera ile Biniş Kartı Tarayıcı" style="border-radius: 8px;" /> |
| *Canlı bento hücreleri, uçuş bilgileri, havalimanı transfer rotaları ve gerçek zamanlı kur çevirici verileri.* | *KVKK uyumlu yerleşik kamera / Capacitor kamera modülü yardımıyla saniyeler içinde seyahat kartı tespiti.* |

| 🤖 Gemini AI Seyahat Asistanı | 📱 Standalone Mobil ve PWA Kurulumu |
| :---: | :---: |
| <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop" width="100%" alt="Yapay Zeka Destekli Seyahat Asistanı" style="border-radius: 8px;" /> | <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop" width="100%" alt="Mobil stand-alone PWA uygulaması" style="border-radius: 8px;" /> |
| *Duty-Free teklifleri, engelsiz havalimanı koridoru yönlendirmesi ve bütçeye göre dinamik finansal tavsiyeler.* | *Mobil ana ekrana kurulabilir (Add to Home Screen), servis çalışanıyla çevrimdışı (offline-first) çalışabilen yapı.* |

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

### 📊 Sistem Mimarisi ve Veri Akış Şeması

AeroAI sistem bileşenleri ve katmanlar arası veri etkileşimi aşağıdaki şemada modellenmiştir:

```
                            ┌──────────────────────────────────┐
                            │      React Frontend / PWA        │
                            │  [Tailwind, Zustand, Serv.Work.] │
                            └────────────────┬─────────────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      ▼ (Görsel Analiz)      ▼ (Real-time Sync)     ▼ (API Proxy & RAG)
            ┌───────────────────┐  ┌──────────────────┐  ┌────────────────────────┐
            │ Capacitor Native  │  │  Firebase Cloud  │  │   Express.js Server    │
            │  (Camera / Push)  │  │    Firestore     │  │   (Güvenli Ağ Köprüsü) │
            └───────────────────┘  └──────────────────┘  └───────────┬────────────┘
                                                                     │
                                                         ┌───────────┴───────────┐
                                                         ▼                       ▼
                                               ┌──────────────────┐    ┌─────────────────────┐
                                               │  Gemini AI API   │    │  Canlı Döviz / Kur  │
                                               │ (Smart Assistant)│    │   (open.er-api.com) │
                                               └──────────────────┘    └─────────────────────┘
```

#### Bileşenlerin Görev Dağılımı ve Çalışma Prensibi:
1. **React Frontend (İstemci Katmanı):** Bento asimetrik ızgara takip kartlarını ve biniş kartı tarama arayüzünü çizer. İnternet kesintilerinde veya zayıf terminal sinyallerinde `Service Worker` önbelleğinden kesintisiz olarak beslenerek offline-first çalışır.
2. **Capacitor Native Modülleri:** Mobil derlemelerde doğrudan cihazın yerel kamera ve bildirim bileşenleriyle iletişime geçerek üstün performanslı fiziksel biniş kartı tarama ve rötarlarda native push uyarısı gönderir.
3. **Express.js API Sunucusu:** Gizli `GEMINI_API_KEY` veya harici sunucu şifrelerini istemciye sızdırmadan proxy yapar. Böylece API güvenliğini en üst düzeye çıkarır.
4. **Firebase Cloud Firestore:** Gerçek zamanlı uçuş gecikme durumlarını, kapı numarası revizyonlarını veya acil SOS mesaj akışlarını (`onSnapshot`) doğrudan istemci arayüzlerine anlık senkronizasyon ile pompalar.
5. **Gemini AI & Harici Kurlar:** Express sunucu arka planında çalışan `@google/genai` motoru, canlı bütçe analizleri ve akıllı rota asistanlığı gerçekleştirir. Harici kur API'leri ile transfer taksit bütçelerini gerçekçi kurgular.

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

### 🧪 5. Test Senaryolarını Çalıştırma
AeroAI, Express sunucu uç noktalarını ve veri bütünlüğünü doğrulamak amacıyla bir test paketi ile birlikte gelir. Yerleşik Node.js test koşucusunu kullanarak testleri koşturmak için aşağıdaki komutu çalıştırabilirsiniz:
```bash
npm run test
```
Bu komut, `/tests` klasöründe yer alan tüm entegrasyon ve birim test dosyalarını test ortamı (`NODE_ENV=test`) değişkenleriyle tetikler.

### 🐳 6. Docker ile Çalıştırma (Konteyner Desteği)
AeroAI, ortam bağımsızlığı sağlamak amacıyla çok aşamalı (multi-stage) Docker yapısı ve Docker Compose entegrasyonu ile donatılmıştır. Saniyeler içinde yerelinizde veya sunucunuzda ayağa kaldırmak için aşağıdaki talimatları uygulayabilirsiniz:

#### Docker Command Line (CLI) ile Doğrudan Yürütüm:
1. Docker imajını inşa edin:
   ```bash
   docker build -t aeroai-app .
   ```
2. İmajı 3000 portunu dışa açacak ve ortam değişkenlerini enjekte edecek şekilde çalıştırın:
   ```bash
   docker run -d -p 3000:3000 --env GEMINI_API_KEY="your_api_key" --name aeroai-container aeroai-app
   ```

#### Docker Compose ile Tek Tuşla Çalıştırma (Önerilen):
Uygulamayı tüm bağımlılıkları, ağ (bridge network) kuralları ve `.env` şablon yapılandırmalarıyla ortak bir orkestrasyonda çalıştırmak için:
1. `.env` dosyanızı doldurun (veya parametreleri doğrudan terminalden besleyin).
2. Servisi arka planda (detached) ayağa kaldırın:
   ```bash
   docker compose up -d
   ```
3. Konteyner durumunu ve günlük akışını (logs) izleyin:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

Uygulamanın web arayüzüne yerel makineniz üzerinden **http://localhost:3000** adresinden anında erişebilirsiniz!

### ☁️ 7. Bulut Dağıtım Rehberi (Production Deployment)
AeroAI, birleşik Express + React (Full-stack) mimarisi kullandığından canlı ortamlara tek bir web servisi veya Docker konteyneri olarak mükemmel şekilde kurulabilir. En popüler bulut platformları için dağıtım adımları aşağıdadır:

#### A) Google Cloud Run veya Render (Önerilen - Docker Tabanlı)
Projede hazır bulunan çok aşamalı `Dockerfile` sayesinde Docker destekleyen bulut platformlarında sıfır konfigürasyonla yayına alabilirsiniz:
1. **Google Cloud CLI** veya **Render/Railway** paneli üzerinden yeni bir "Web Service" oluşturun.
2. GitHub deponuzu bağlayın.
3. Derleme ayarlarında otomatik olarak tanınan **Docker** seçeneğini tercih edin.
4. Çevre Değişkenleri (Environment Variables) sekmesinde `GEMINI_API_KEY` ve diğer gerekli kimlik anahtarlarınızı şifreli olarak tanımlayın.
5. Port değerini `3000` olarak bırakın ve yayına alma (Deploy) butonuna basın.

#### B) Heroku veya Dokku (Geleneksel Node.js Sürücüsü)
Docker kullanmadan doğrudan Node.js ortamlarında çalıştırmak için:
1. Platform yönetim panelinizden `Node.js` yapılandırmasını (buildpack) seçin.
2. Çevre değişkenlerine (`Config Vars`) `GEMINI_API_KEY` ve `NODE_ENV=production` değerlerini girin.
3. Sistem `package.json` içindeki `build` scripti yardımıyla istemci statiklerini derleyecek ve `npm start` ile Express ana sunucusunu otomatik olarak tetikleyecektir.

#### C) Firebase / Firestore Kurallarının Dağıtımı
Projedeki veritabanı kurgularını ve `firestore.rules` güvenlik politikalarını tek tıkla Firebase sunucularına aktarmak için:
1. Firebase CLI üzerinde oturum açın:
   ```bash
   npx firebase login
   ```
2. İlgili bulut projenizi çalışma ortamı olarak seçin:
   ```bash
   npx firebase use --add
   ```
3. Yerel güvenlik kurallarını buluttaki Firestore veritabanınızla eşitleyin:
   ```bash
   npx firebase deploy --only firestore:rules
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

