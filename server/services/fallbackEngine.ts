// Rule-based fallback response engine (Plan B)
// Triggered automatically when the Gemini API is offline, quota is exceeded, or the API key is not configured.
export function getRuleBasedFallbackResponse(userMessage: string, flight: any, currencyInfo: any): string {
  const query = (userMessage || "").trim().toLowerCase();
  
  // 1. CURRENCY / DÖVİZ / BÜTÇE
  if (query.match(/(kur|döviz|para|lira|tl|sterlin|euro|dolar|ruble|bütçe|currency|money|price|fiyat|exchange|bozdur)/i)) {
    if (currencyInfo.isDomestic) {
      return `### 🪙 Havalimanı Finansal Rehberi (Yurt İçi Sefer)
Sistem verilerine göre seyahat edeceğiniz **${flight.toCity}** yurt içi sınırlarında yer aldığı için geçerli para biriminiz **Türk Lirası (TRY)**'dir.

**💡 Duty-Free & Lüks Alışveriş İpucu:**
Terminal içerisindeki bazı lüks mağazalar ve Duty-Free reyonları fiyatlarını döviz bazlı listeliyor olabilir. Sistemimizdeki güncel referans Amerikan Doları (USD) kuru:
*   **1 USD = ${currencyInfo.terminalUsdRate} TRY**
*   **1 TRY = ${Math.round((1 / currencyInfo.terminalUsdRate) * 10000) / 10000} USD**

**💰 Asistan Önerisi:**
*   Havalimanı içindeki lüks mağazalarda ödeme yaparken kredi kartınızın yerel para biriminde (TRY) çekilmesini talep ederek komisyon kayıplarını minimuma indirebilirsiniz.`;
    } else {
      return `### 🪙 Havalimanı Finansal Rehberi (Uluslararası Sefer)
Uçuş yapacağınız **${flight.toCity}** için yerel para birimi bilgileri ve canlı döviz kurları başarıyla eşitlendi:

*   **Para Birimi:** ${currencyInfo.currencyName} (${currencyInfo.toCurrency})
*   **Sembol:** \`${currencyInfo.symbol}\`
*   **Satış Kuru:** **1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY**
*   **Alış Kuru:** **1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}**
*   **Kur Eğilimi:** ${currencyInfo.trend === "up" ? "📈 Yukarı Yönlü (TRY karşısında güçleniyor)" : currencyInfo.trend === "down" ? "📉 Aşağı Yönlü (TRY karşısında hafif gerileme)" : "↔️ Stabil seyrediyor"}

**💡 Akıllı Seyahat Bütçe Önerileri:**
1.  **Döviz Bürosu Komisyonu:** Havalimanı içerisindeki fiziki döviz büroları yüksek komisyon uygulayabilir. Nakit ihtiyacınız için havalimanı dışındaki yerel banka ATM'lerini komisyonsuz veya düşük ücretli seyahat kartları ile kullanmanız önerilir.
2.  **Kartla Ödeme:** Gittiğiniz ülkede POS cihazlarında ödeme yaparken her zaman yerel para birimini (**${currencyInfo.toCurrency}**) seçin. "Dinamik Para Birimi Çevrimi (DCC)" sistemleri genellikle zararlıdır.`;
    }
  }

  // 2. BOARDING STATUS / DELAY / CANCELLATION / PASSENGER RIGHTS (SHY)
  if (query.match(/(rötar|gecikme|iptal|delayed|cancelled|boarding|saat|uçuş|uçak|sefer|gecikti|shgm|shy|tazminat|iade|bilet|haklarım|haklarim)/i)) {
    const status = flight.boardingStatus;
    let mainStatusText = "";
    let actionRecommendation = "";
    
    if (status === "Delayed") {
      mainStatusText = `Uçuşunuzda **RÖTAR (Gecikme)** durumu bildirilmiştir. Güvenlik ve kapı durumlarınızı bu yeni biniş saatine göre yönetebilirsiniz.`;
      actionRecommendation = `*   **Uzak Mesafe:** ${flight.estimatedWalkTime} uzağınızdaki **Gate ${flight.gate}** kapısına gitmeden önce havalimanı danışma ekranlarından yeni saati teyit edin.
*   **SHY Yolcu Hakları (Gecikme Durumu):** 2 saati aşan gecikmelerde havayolu şirketi size sıcak/soğuk içecekler ve hafif yiyecek ikramı sunmakla yükümlüdür. Gecikme süresi arttıkça ücretsiz haberleşme ve telefon hakkı isteyebilirsiniz.`;
    } else if (status === "Cancelled") {
      mainStatusText = `🚨 **Uçuşunuz Maalesef İPTAL Edilmiştir.** Operasyonel veya meteorolojik nedenlerle uçuşunuz askıya alındı.`;
      actionRecommendation = `*   **SHY Yolcu Hakları (İptal Durumu):** Sivil Havacılık Genel Müdürlüğü SHY-YOLCU yönetmeliği uyarınca, iptal edilen uçuşlar için havayolu size:
    1.  Bilet ücretinin **tam iadesini** veya,
    2.  En yakın tarihte ücretsiz **alternatif seferle seyahat** hakkı sunmak zorundadır.
    3.  Ayrıca tazminat limitleri çerçevesinde ek haklarınız doğabilir.
*   **Sıradaki Adım:** Derhal ilgili havayolu şirketinin (örneğin **${flight.airline}**) satış ofisine veya transfer bankosuna bizzat müracaat ederek alternatif uçuş rezervasyonunuzu gerçekleştirin.`;
    } else {
      mainStatusText = `Uçuşunuz şu anda **Normal Akışında (Status: ${status})** görünüyor. Herhangi bir rötar veya iptal uyarısı bulunmamaktadır.`;
      actionRecommendation = `*   Uçuş saatiniz yaklaştığı için **Gate ${flight.gate}** numaralı kapıya tahmini **${flight.estimatedWalkTime}** içinde ulaşacak şekilde planınızı yapın.
*   Biyometrik doğrulamanız **${flight.biometricVerified ? "tamamlanmıştır" : "eksiktir, lütfen yetkililerden destek alın"}**.`;
    }

    return `### ✈️ Uçuş Durumu ve Sivil Havacılık Yolcu Hakları
Mevcut uçuş verilerinizin ve statünün analizi:

*   **Güncel Biniş Durumu:** \`${status}\`
*   **Uçuş No:** **${flight.flightNumber}** (${flight.airline})
*   **Uçuş Hattı:** ${flight.from} -> ${flight.to}

${mainStatusText}

**📋 Ne Yapmalısınız? (Öneriler):**
${actionRecommendation}
*   **Müşteri Hizmetleri:** Detaylı bilet işlemleri veya tazminat süreçleri için havayolunun çağrı merkezini arayabilirsiniz.`;
  }

  // 3. GATE / WALK TIME
  if (query.match(/(kapı|kapısı|gate|yürüme|nerede|nasıl giderim|uzaklık|mesafe|harita|biyometrik|smart id|smartpass)/i)) {
    return `### 🚶 Kapı ve Akıllı Geçiş Rehberi
Uçağınızın kalkış kapısı ve kapıya ulaşım detaylarınız canlı olarak haritalandırılmıştır:

*   **Kalkış Kapısı:** **Gate ${flight.gate}**
*   **Yürüme Süresi:** Tahmini **${flight.estimatedWalkTime}** (Yavaş yürüyüş hızıyla)
*   **Biyometrik Kimlik (Smart ID):** ${flight.biometricVerified ? "✅ Başarıyla Doğrulandı (Biyometrik geçiş kapılarını sıra beklemeden kullanabilirsiniz)" : "⚠️ Doğrulanmadı (Klasik pasaport ve kimlik kontrolünden geçmeniz gerekecektir)"}

**💡 AeroAI Akıllı Tavsiyesi:**
*   Havalimanı içindeki tüm yönlendirmeler dijital harita modülümüzde entegredir. Ekranın üst kısmındaki **"Terminal Haritası"** butonunu tıklayarak kapıya giden engelsiz rotayı interaktif olarak inceleyebilirsiniz.`;
  }

  // 4. TRANSFERS / TRANSPORT / SHUTTLES
  if (query.match(/(ulaşım|otobüs|shuttle|havaist|havaş|nasıl giderim|binerim|peron|transfer|metro|tren|tramvay)/i)) {
    return `### 🚌 Entegre Havalimanı Karayolu ve Sefer Entegrasyonu
Terminalden şehir merkezine veya çevre illere transfer planı:

*   **Kalkış Bölgesi:** ${flight.fromCity} (${flight.from})
*   **Önerilen Entegre Hat:** Bulunduğunuz konuma veya yolcu tercihlerine uygun tüm ulusal hat tarifeleri (HAVAİST, HAVAŞ vb.) seyahat asistanımızın alt kısmındaki **"Sefer Tarife Cetveli"** kartına entegre edilmiştir. 

**💡 Yolcu Önerisi:**
*   Aktif bölgenizi seçerek sonraki sefer saatlerini ve durak planlarını gerçek zamanlı inceleyebilirsiniz. İnternetin kısıtlı veya kapalı olduğu anlarda dahi saat kurguları ve peron yerleşimi yerel bellekte tutulmaktadır.`;
  }

  // 5. SECURITY & QUEUE
  if (query.match(/(güvenlik|kuyruk|sıra|pasaport|bekleme|screening|security)/i)) {
    return `### 🛡️ Güvenlik ve Pasaport Arındırılmış Alan Analizi
Mevcut güvenlik kontrol noktası verileri:

*   **Ortalama Bekleme Süresi:** **${flight.securityQueueTime} Dakika**
*   **Hattın Yoğunluk Durumu:** ${flight.securityQueueTime > 20 ? "🔴 Yoğun (Lütfen işlemlerinizi tamamlamak için kapılara erken ilerleyin)" : "🟢 Akıcı (Standart kontroller sorunsuz ilerlemektedir)"}

**💡 Zaman Yönetimi Önerisi:**
*   Biyometrik doğrulama (**Smart ID**) sayesinde biyometrik onaylı hızlı geçiş şeritlerinden saniyeler içinde geçerek klasik kuyrukları bypass edebilirsiniz. Biyometrik statünüz: **${flight.biometricVerified ? "AKTİF" : "PASİF"}**.`;
  }

  // DEFAULT CHATBOT RESPONSE
  return `### 👋 Merhaba! Ben SmartPass Seyahat Asistanınız AeroAI
Sistemimiz şu anda **Plan B (Yapay Zeka Destekli Güvenli Çevrimdışı / Statik Yardımcı)** modunda kesintisiz hizmet vermektedir. İnternet kesintileri, sunucu kotası dolulukları veya API anahtarı yokluğundan etkilenmeden uçuş verileriniz üzerinden en doğru yönlendirmeleri sağlıyorum.

Yolcumuz **Sayın ${flight.passengerName}** için aktif uçuş özet bilgileri:
*   ✈️ **Uçuşunuz:** ${flight.flightNumber} (${flight.airline}) numaralı seyahat ${flight.from} -> ${flight.to}
*   💺 **Koltuk & Kapı:** Koltuk ${flight.seat} (Grup ${flight.group}) | **Gate ${flight.gate}** (${flight.estimatedWalkTime} yürüyüş mesafesinde)
*   ⏳ **Biniş Durumu:** \`${flight.boardingStatus}\`
*   🛡️ **Güvenlik Sırası Bekleme Süresi:** ${flight.securityQueueTime} dakika
*   🪙 **Varış Para Birimi:** ${currencyInfo.currencyName} (${currencyInfo.symbol}) ve kurları yerel belleğimizde hazırdır.

**Size nasıl yardımcı olabilirim?** Aşağıdaki konular hakkında bana dilediğiniz gibi soru sorabilirsiniz:
*   *Döviz kurları, seyahat bütçeleme ve lüks alışveriş,*
*   *Gecikme (Rötar) veya İptal durumunda haklarınız (SHY),*
*   *Havalimanı ulaşım, metro, Havaş/Havaist peronları,*
*   *Güvenlik kontrolü bekleme süreleri ve kapı haritası.*`;
}
