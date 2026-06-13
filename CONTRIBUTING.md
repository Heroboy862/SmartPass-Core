# 🤝 AeroAI Katkı Rehberi (Contributing Guide)

AeroAI projesine katkıda bulunmak istediğiniz için teşekkür ederiz! AeroAI, havalimanı kriz yönetimi ve akıllı seyahat asistanlığı üzerine geliştirilmiş tam kapsamlı bir platformdur. 

Bu rehber, projeye nasıl katkıda bulunabileceğinizi, kodlama standartlarımızı, branch isimlendirmelerini ve Pull Request (PR) süreçlerimizi açıklamaktadır.

---

## 🚀 Başlamadan Önce

Katkıda bulunmadan önce lütfen aşağıdaki kurallara dikkat edin:
1. **İş Birliği**: Bir sorunu (issue) çözmeden önce, mükerrer çalışmayı önlemek adına ilgili issue üzerinde hak talebinde bulunun veya yeni bir tartışma başlatın.
2. **Kapsam Sınırı**: Kullanıcıların gizliliğine (KVKK) ve veri sınırlarına saygılı, temiz ve modüler bir mimariyi koruyoruz. Gereksiz veya izinsiz API çağrıları eklememeye özen gösterin.

---

## 🛠️ Nasıl Katkıda Bulunabilirsiniz?

### 1. Hata Bildirimi (Bug Report)
Bir hata tespit ettiyseniz lütfen şu bilgileri içeren bir issue açın:
* Hatanın kısa ve net bir açıklaması.
* Hatayı yeniden üretme adımları.
* Beklenen ve gerçekleşen davranış.
* Ekran görüntüleri veya konsol hata logları.

### 2. Yeni Özellik Önerisi (Feature Request)
Projeye yeni bir özellik eklemek istiyorsanız:
* Yeni özelliğin ne olduğunu ve kullanıcılara nasıl fayda sağlayacağını net bir şekilde açıklayan bir issue açın.
* Mümkünse tasarım eskizleri veya akış şemaları paylaşın.

### 3. Pull Request Gönderme
Doğrudan kod katkısında bulunmak istiyorsanız aşağıdaki adımları izleyin.

---

## 📝 Kodlama Standartları ve Kuralları

Yazılan kodun kalitesini ve sürdürülebilirliğini korumak için aşağıdaki standartlara uymamız gerekmektedir:

### ⚛️ React & TypeScript
* **Fonksiyonel Bileşenler**: Tüm React bileşenlerinde fonksiyonel bileşen (`functional components`) ve React Hook'ları kullanın. Sınıf tabanlı (`class`) bileşenler tercih etmeyin.
* **Katı Tip Tanımlamaları**: `any` tipini kullanmaktan olabildiğince kaçının. Tüm prop ve state verilerini TypeScript arayüzleri (`interface`) veya tipleri (`type`) ile açıkça belirtin.
* **Modüler Dosya Yapısı**: Tüm kodları tek bir global bileşene (örn: `App.tsx`) yığmak yerine bileşenleri mantıklı parçalara bölerek `/src/components` dizininde saklayın.

### 🎨 Tasarım ve Tailwind CSS
* **Tailwind CSS**: Projede tüm görsel stillendirilmeler Tailwind CSS sınıfları kullanılarak doğrudan HTML elementleri üzerinde çözülmektedir. Ayrı CSS veya CSS-in-JS modülleri oluşturmayın.
* **Erişilebilirlik (A11y)**: Metin ve arka plan renk kontrast oranlarına dikkat edin. Form elemanlarında uygun `aria-*` etiketleri ve yerleşik HTML `id` özniteliklerini tanımlamayı unutmayın.
* ** responsive/Mobil Uyumluluk**: Mobil-öncelikli (`mobile-first`) yaklaşımı sürdürün ve her ekran genişliği için responsive kırılımları (`sm:`, `md:`, `lg:`, `xl:`) etkin olarak kullanın.

### 🧹 Kod Biçimlendirme ve Statik Analiz (Formatting & Linting)
Kod kalitesi ve stillendirmelerinin takım genelinde kusursuz kalması için yerleşik yapılandırmalar mevcuttur:
* **ESLint (`eslint.config.js`)**: Flat Configuration formatında kodunuzdaki potansiyel mantık hatalarını ve tanımsız nesne kullanımlarını denetler.
* **Prettier (`.prettierrc`)**: Kod satır uzunluklarını, girintileri (tab width: 2) ve tırnak işaretlerini standart hale getirir.

### ⚓ Pre-commit Hooks (Commit Öncesi Otomatik Kontroller)
Hatalı derlemelerin ve standarda uymayan kod satırlarının sürüm kontrol merkezine girmesini önlemek adına **Husky** ve **lint-staged** kullanımı tavsiye edilir:
* Her `git commit` komutunda, sadece üzerinde değişiklik yaptığınız dosyaların otomatik linter ve biçimlendirici kontrolünden geçmesi için lokalinizde Husky kancalarını kurabilirsiniz:
  ```bash
  npx husky install
  ```
* Bu sayede linter'dan geçmeyen veya kırık derlemelere sahip hiçbir commit istem dışı olarak depoya sevk edilemez.

---

## 🌿 Git ve Branch İsimlendirme Kuralları

Branch isimleri projenin geçmişini düzenli tutmak adına belirli standartlara uygun olmalıdır:

* **Yeni Özellikler (`feature`)**: `feature/ozellik-adi` (Örn: `feature/boarding-pass-parser`)
* **Hata Düzeltmeleri (`bugfix`)**: `bugfix/hata-tanimi` (Örn: `bugfix/camera-permission-ios`)
* **Belgelendirme (`docs`)**: `docs/dokuman-adi` (Örn: `docs/contributing-guide`)
* **Performans ya da Refaktör (`refactor` / `perf`)**: `refactor/degisiklik` (Örn: `refactor/use-flight-store`)

### Commit Mesajı Formatı
Commit mesajlarınızın kısa, anlaşılır ve eylem odaklı olmasına özen gösterin:
* `feat: biniş kartı için capacitor kamera desteği eklendi`
* `fix: servis çalışanı (service worker) çevrimdışı önbellek hatası düzeltildi`
* `docs: CONTRIBUTING.md ve proje lisans bilgileri güncellendi`

---

## 🔄 Pull Request Süreci

1. Projeyi çatallayın (`Fork`) ve yerel bilgisayarınıza klonlayın.
2. `main` ana dalından yukarıdaki kurallara uygun yeni bir dal (`branch`) oluşturun.
3. Değişikliklerinizi yapın ve yerel olarak çalıştığından emin olun.
4. Kodunuzu göndermeden önce mutlaka linter ve build testlerini çalıştırın:
   ```bash
   npm run lint
   npm run build
   ```
5. Herhangi bir derleme (build) hatası kalmadığında branch'inizi GitHub'a itin (`push`).
6. Projenin asıl deposuna yönelik bir **Pull Request** oluşturun. Her PR’da yapılan değişikliklerin amacını şablon şeklinde kısaca açıklayın.
7. Kod incelemesi (Code Review) sonrasında yapılan geri bildirimleri uygulayın. Onay alındığında kodunuz ana projeyle birleştirilecektir.

---

Destekleriniz ve AeroAI seyahat ekosistemini birlikte daha ileriye taşıdığınız için teşekkür ederiz! 🚀💙
