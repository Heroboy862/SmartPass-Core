import { Router, Request, Response } from "express";
import { MOCK_BOARDINGS, getSimVariables } from "../data/mockFlights";
import { ai } from "../services/geminiService";
import { getLiveRates, getCurrencyInfo } from "../services/currencyService";
import { getRuleBasedFallbackResponse } from "../services/fallbackEngine";
import { sendError } from "../services/errorResponse";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
  const { messages, flightData } = req.body;

  // 1. Strict Input Validation for messages schema and character count bounds
  if (!messages || !Array.isArray(messages)) {
    return sendError(res, 400, "VALIDATION_ERROR", "messages parametresi dizi (Array) tipinde olmak zorundadır.");
  }

  if (messages.length > 50) {
    return sendError(res, 400, "VALIDATION_ERROR", "Konuşma geçmişi (messages) maksimum 50 mesaj içerebilir.");
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return sendError(res, 400, "VALIDATION_ERROR", `messages[${i}] geçerli bir mesaj nesnesi değil.`);
    }
    
    // Validate text contents safely
    const textVal = msg.text || msg.content;
    if (textVal === undefined || typeof textVal !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", `messages[${i}] içindeki text veya content parametresi metin (string) olmak zorundadır.`);
    }

    if (textVal.length > 2000) {
      return sendError(res, 400, "VALIDATION_ERROR", `Maksimum karakter sınırına erişildi. messages[${i}] içindeki metin 2000 karakterden uzun olamaz.`);
    }
  }

  const simVariables = getSimVariables();

  // Fallback if AI SDK is not present or error is encountered
  if (!ai) {
    try {
      const flight = flightData || MOCK_BOARDINGS["TK1903"];
      const liveRates = await getLiveRates();
      const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || undefined);
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
      const text = getRuleBasedFallbackResponse(lastUserMessage, flight, currencyInfo);
      return res.status(200).json({ text });
    } catch (fallbackErr: any) {
      console.error("Critical fallback failure inside !ai condition:", fallbackErr);
      return res.status(200).json({
        text: "AeroAI seyahat asistanı şu anda güvence modu kapsamında sınırlı yanıtlar üretiyor. Lütfen uçağınızın kapı ekranlarını takip ediniz."
      });
    }
  }

  try {
    const flight = flightData || MOCK_BOARDINGS["TK1903"];
    
    // Fetch live currency rates and construct currency info for the destination city/airport code
    const liveRates = await getLiveRates();
    const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || undefined);
    
    const currencyStr = currencyInfo.isDomestic 
      ? `Yurt içi seyahat. Türk Lirası (TRY) geçerli. Terminal içi lüks ve duty free harcamaları için güncel Amerikan Doları (USD) referans kuru: 1 USD = ${currencyInfo.terminalUsdRate} TRY.` 
      : `Varış Yeri Para Birimi: ${currencyInfo.currencyName} (${currencyInfo.toCurrency}, Sembol: ${currencyInfo.symbol}). Güncel Döviz Kuru: 1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY (1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}).`;

    // Custom formatted active schedule for instructions
    const flightContext = `
      Yolcunun Aktif Bilgileri:
      - İsim: ${flight.passengerName}
      - Uçuş No: ${flight.flightNumber}
      - Havayolu: ${flight.airline}
      - Güzergah: ${flight.from} (${flight.fromCity}) -> ${flight.to} (${flight.toCity})
      - Biniş Durumu (Canlı Otorite Verisi): ${flight.boardingStatus}
      - Kapı Bilgisi: ${flight.gate}
      - Koltuk: ${flight.seat} (Grup ${flight.group})
      - Biyometrik Doğrulama (Smart ID): ${flight.biometricVerified ? "Aktif" : "Pasif"}
      - Kapıya Uzaklık: ${flight.estimatedWalkTime} yürüme mesafesinde
      - Güvenlik Kuyruğu Bekleme Süresi (Canlı ${flight.airportOperator} Verisi): ${flight.securityQueueTime} dakika
      - FİNANSAL / DÖVİZ BİLGİSİ: ${currencyStr}
    `;

    const instructions = `
      Sen SMART PASS platformunun akıllı havacılık asistanı AeroAI'sın.
      Sistemimiz; DHMİ, İGA, TAV, HEAŞ gibi canlı havalimanı otoritelerinden veri akışı alarak çalışır ve PWA/mobil uygulamamıza entegredir.
      Görevin: Yolcunun zaman yönetimini optimize etmek, kriz anlarında (ertelemeler, iptaller, kapı değişiklikleri, kayıp bagajlar, kuyruk yoğunlukları) yolcuya sakin, net ve proaktif çözümler sunmaktır.
      
      Yolcunun canlı bağlamı şudur:
      ${flightContext}
  
      Tavri ve Kuralları:
      1. Sıcak, güvenilir ve havacılık uzmanı tonunda Türkçe konuş. Emojileri yerinde ve ölçülü kullan.
      2. Yolcunun zaman çizelgesini, uçağın kaç dakika rötar yaptığını veya kapının mesafesini analiz et. 
      3. Örneğin güvenlik sırası ${flight.securityQueueTime} dakika ve boarding bitti bitti durumdaysa yolcuyu derhal uyar.
      4. Kriz durumlarında (İptal/Rötar): Yolcuya SHY (Sivil Havacılık Genel Müdürlüğü) yolcu hakları kanunu uyarınca haklarını anlatabilirsiniz (ücretsiz ikram, alternatif uçuş, bilet iadesi vb.).
      5. Döviz/Kur Soruları & Rehberliği: Yolcu seyahat bütçesi, yerel harcamalar veya döviz kurunu sorarsa, yukarıda belirtilen ${currencyInfo.isDomestic ? "ek USD kurunu" : `${currencyInfo.toCurrency} kurunu (1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY)`} tam sayısal değeriyle vererek proaktif öneriler sun (örneğin döviz bürolarının komisyonları yerine havalimanı dışı ATM kullanımı, bütçeleme vb.).
      6. Cevapların kısa, mobil telefonda kolayca okunabilecek şekilde (maksimum 3-4 paragraflık, listeli, temiz Markdown) olsun.
      
      Şu anki kullanıcı mesajına cevap ver. Son konuşma geçmişini dikkate al.
    `;

    // Process messaging payload into generative AI SDK format
    // Map existing history
    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: instructions,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Assistant Failure, falling back to Plan B:", error);
    try {
      const flight = flightData || MOCK_BOARDINGS["TK1903"];
      const liveRates = await getLiveRates();
      const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || undefined);
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
      const text = getRuleBasedFallbackResponse(lastUserMessage, flight, currencyInfo);
      return res.status(200).json({ text });
    } catch (fallbackError: any) {
      console.error("Plan B Fallback encountered fatal error:", fallbackError);
      res.status(200).json({
        text: "AeroAI geçici hizmet kesintisi nedeniyle kısıtlı moddadır. Lütfen kapı yönlendirmelerini takip ediniz."
      });
    }
  }
});

export default router;
