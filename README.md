# 🛫 Smart Boarding — Akıllı Havalimanı Seyahat ve Canlı Takip Koridoru

Smart Boarding; mobilize edilmeye elverişli, **DHMİ, İGA, TAV ve HEAŞ** canlı veri simülasyonları ile donatılmış, KVKK uyumlu kamera tabanlı biniş kartı tarayıcısı ve **Gemini AI** tabanlı kişiselleştirilmiş seyahat asistanına sahip yeni nesil bir akıllı uçuş ve güvenlik yönetim platformudur.

---

## ✨ Öne Çıkan Özellikler

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

---

## 🛠️ Teknik Mimari ve Teknolojiler

Platform, modern bir full-stack (istemci + sunucu) yapısına dayanır:

* **Frontend**: React 18+, Vite, Tailwind CSS (Modern ve zengin tipografi uyumu).
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
```bash
npm run build
npm start
```

---

## 📂 Dosya Yapısı

* `server.ts` — İstemci ile Firestore (DHMİ canlandırma) arasındaki veri akışını yöneten Express sunucu katmanı.
* `/src/App.tsx` — Firestore dynamic snapshot kurgusunu ve durum yönetimini üstlenen ana React modülü.
* `/src/components/DashboardScreen.tsx` — Göz alıcı seyahat kartları, biniş kartı QR barkodu ve Bento-stili "Aile Koruma SMS Logları"nı barındıran temel görsel katman.
* `/firestore.rules` — Canlı uçuş verileri ve ziyaretçi profilleri için kurgulanmış güvenlik onay seti.
* `/metadata.json` — İzin tanımları ve genel platform öznitelikleri.

---
*Akıllı Seyahat Asistanınız ile her uçuşta sıfır stres, maksimum konfor! Cihaz kameranızı açarak biniş kartınızı hemen taratabilirsiniz.*
