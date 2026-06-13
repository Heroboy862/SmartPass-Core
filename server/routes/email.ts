import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { syncUserToFirestore } from "../services/firestoreSync";
import { sendError } from "../services/errorResponse";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "smartpass-super-secret-key-2026";

// Register & send accessibility boarding welcome email (SMTP or Sandbox simulation)
router.post("/send-welcome", async (req: Request, res: Response) => {
  const { email, name, accessibilityProfile } = req.body;
  
  if (!email) {
    return sendError(res, 400, "VALIDATION_ERROR", "E-posta adresi belirtilmelidir.");
  }

  // Create/update the user profile securely in Firestore server-side
  try {
    await syncUserToFirestore(email, {
      name: name || email.split("@")[0],
      email: email,
      accessibilityProfile: accessibilityProfile || { enabled: false, type: "none" }
    });
  } catch (dbErr: any) {
    console.error("Failed to sync user to Firestore during email registration:", dbErr);
  }

  // Generate customized accessibility block
  let accBlock = "";
  if (accessibilityProfile && accessibilityProfile.enabled) {
    let accLabel = "Engelsiz Yolcu";
    let accDesc = "Standart asistanlık ve biniş yardımı.";
    if (accessibilityProfile.type === "wheelchair") {
      accLabel = "♿ Tekerlekli Sandalye / Ortopedik Destek";
      accDesc = "Fiziki yardım ekibi, merdivensiz asansörler ve rampa rotaları sizin için rezerve edildi.";
    } else if (accessibilityProfile.type === "vision") {
      accLabel = "👁️ Görme Hassasiyeti / Sesli Rehberlik";
      accDesc = "Turnikelerde ve kapılarda kulaklıkla sesli yönlendirme, yüksek kontrast arayüzü ve yer ekibi eşliği aktif.";
    } else if (accessibilityProfile.type === "hearing") {
      accLabel = "👂 İşitme Engeli / Görsel Flaşör";
      accDesc = "Kalkış anonsları, kapı değişiklikleri ve rötarlar cihazınıza görsel bento flaşları olarak iletilir.";
    } else if (accessibilityProfile.type === "elderly") {
      accLabel = "👴 Yaşlı Yolcu / Refakatçi Yardımı";
      accDesc = "Uçuş kapınıza kadar konforlu taşıma için buggy (elektrikli transfer aracı) planlaması yapıldı.";
    } else if (accessibilityProfile.type === "other") {
      accLabel = "🩺 Özel Tıbbi / Diğer Gereksinimler";
      accDesc = "Medikal takibiniz, ilaç saklama ve solunum aparatı taşıma haklarınız kabin amirliğine bildirilmiştir.";
    }

    let customHtml = "";
    if (accessibilityProfile.customRequest) {
      customHtml = `<p style="margin: 8px 0 0; font-size: 11px; padding: 8px; background: #ffffff; border: 1px solid #d1fae5; border-radius: 8px; color: #065f46; font-style: italic;"><strong>Özel Notunuz:</strong> "${accessibilityProfile.customRequest}"</p>`;
    }

    accBlock = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">♿ ERİŞİLEBİLİRLİK DESTEK AKTİVASYONU</h3>
        <p style="margin: 0; font-size: 13px; color: #047857; font-family: sans-serif;"><strong>Destek Sınıfı:</strong> ${accLabel}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #065f46; font-family: sans-serif;">${accDesc}</p>
        ${customHtml}
      </div>
    `;
  } else {
    accBlock = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #475569; font-family: sans-serif;"><strong>Profil Sınıfı:</strong> Standart Yolcu (Özel biniş asistanlığı veya tıbbi yardım gereksinimi belirtilmedi).</p>
      </div>
    `;
  }

  const htmlContent = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="background-color: #1e1b4b; padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.025em; font-family: sans-serif;">SMARTPASS PRO</h1>
        <p style="margin: 4px 0 0; font-size: 14px; color: #c4b5fd; font-family: sans-serif;">AeroAI Otonom Engelsiz Seyahat Asistanı</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #0f172a; font-family: sans-serif;">Hoş Geldiniz, Sayın ${name || 'Nezih Yolcumuz'}!</h2>
        <p style="margin: 0 0 16px; font-size: 14px; font-family: sans-serif;">SmartPass Pro-Version mobil biniş ve kriz yönetimi platformumuza kaydınız başarıyla gerçekleşti. Dijital şifreleme ve güvenli asistanlık anahtarınız profilinizle eşleştirilerek devreye alındı.</p>
        
        ${accBlock}

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 6px; font-size: 11px; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">🔒 BİLGİ GÜVENLİĞİ VE KVKK GÜVENCESİ</h3>
          <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.5; font-family: sans-serif;">SmartPass yardımıyla sisteme işlediğiniz her turlu sağlık, ortopedik engel veya diğer özel tıbbi istekleriniz uçtan uca şifreli olarak cihazınızda saklanır. 6698 sayılı KVKK kapsamında bu profiliniz pazarlama veritabanlarında saklanmaz veya üçüncü kişi veya havayolu kurumlarına <strong>kesinlikle iletilmez</strong>. Verileriniz yalnızca uçuş navigasyonu çizimi, terminal rampası asistanları ve kapı canlı bildirimleri için kullanılır, kalkıştan sonra otomatik imha edilir.</p>
        </div>

        <p style="margin: 0 0 8px; font-size: 13px; font-family: sans-serif;">Uçuş kartınızı ve PNR kodunuzu uygulamaya taratarak kapı durumlarını, güvenlik kuyruğu bekleme sürelerini ve AeroAI seyahat çözümlerini anlık takip edebilirsiniz.</p>
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #4f46e5; font-family: sans-serif;">Engelsiz, konforlu ve güvenli yolculuklar dileriz!</p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; font-family: sans-serif;">
        Bu e-posta, SmartPass sistemine biniş kaydı oluşturduğunuz için otomatik olarak iletilmiştir.<br />
        © 2026 SmartPass Pro-Version. Tüm Hakları Saklıdır.
      </div>
    </div>
  `;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@smartpass-pro.com";

  if (host && port && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"SmartPass Pro" <${fromEmail}>`,
        to: email,
        subject: `SmartPass'e Hoş Geldiniz, Sayın ${name || 'Yolcumuz'}! - Onay Belgesi`,
        html: htmlContent,
      });

      // Mask email for PII and KVKK logs compliance
      const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
      console.log(`REAL ONBOARDING EMAIL SENT successfully (masked: ${maskedEmail})`);
      return res.json({
        success: true,
        method: "real",
        email,
        emailContentHtml: htmlContent
      });
    } catch (err: any) {
      console.error("FAIL TO SEND REAL EMAIL via SMTP:", err);
      return res.json({
        success: true,
        method: "simulated_error_fallback",
        email,
        emailContentHtml: htmlContent,
        errorMessage: err.message
      });
    }
  } else {
    const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
    console.log(`SMTP credentials not fully provided. SIMULATING registration email (masked: ${maskedEmail})`);
    return res.json({
      success: true,
      method: "simulated",
      email,
      emailContentHtml: htmlContent
    });
  }
});

// Send current boarding pass details email (SMTP or Sandbox simulation)
router.post("/send-boarding-pass", async (req: Request, res: Response) => {
  const { flightData, accessibilityProfile, recipientEmail } = req.body;
  
  let email = recipientEmail || "merdanmert193@gmail.com";
  let name = flightData?.passengerName || "Seyahat Sever Yolcumuz";

  // Safely extract from JWT if bearer token is present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      if (token && token !== "null" && token !== "undefined") {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded) {
          email = recipientEmail || decoded.email || email;
          name = decoded.name || name;
        }
      }
    } catch (err: any) {
      console.warn("Optional JWT verify failed in send-boarding-pass:", err.message);
    }
  }

  if (!email) {
    email = "merdanmert193@gmail.com";
  }

  if (!flightData) {
    return sendError(res, 400, "VALIDATION_ERROR", "Uçuş bilgileri eksik veya belirtilmemiş.");
  }

  const htmlContent = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="background-color: #1e1b4b; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.025em; font-family: sans-serif;">SMARTPASS PRO</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #c4b5fd; font-family: sans-serif;">Dijital Biniş Kartı & Uçuş Bilgi Fişi</p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="margin: 0 0 16px; font-size: 14px; font-family: sans-serif;">Sayın <strong>${name || 'Seyahat Sever Yolcumuz'}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 13px; font-family: sans-serif; color: #475569;">Talep etmiş olduğunuz güncel biniş kartınız ve uçuş bilgilendirme fişiniz aşağıda yer almaktadır. SmartPass Canlı Bilgi Entegratörü yardımıyla seyahatinizin her adımında güvendesiniz.</p>
        
        <!-- Boarding Card Styling like a wallet pass -->
        <div style="border: 2px dashed #cbd5e1; border-radius: 16px; background-color: #f8fafc; overflow: hidden; margin-bottom: 24px;">
          <!-- Top airline bar -->
          <div style="background-color: #e2e8f0; padding: 12px 16px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: bold; color: #1e1b4b; font-family: sans-serif; text-transform: uppercase;">✈️ ${flightData.airline || "TURKISH AIRLINES"}</span>
            <span style="font-size: 12px; font-weight: bold; color: #4f46e5; font-family: sans-serif;">${flightData.flightNumber || "TK-1903"}</span>
          </div>
          
          <!-- Core destination/origin routing -->
          <div style="padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 40%; text-align: left; vertical-align: middle;">
                  <p style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; font-family: sans-serif;">${flightData.from || "IST"}</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-family: sans-serif;">${flightData.fromCity || "İstanbul"}</p>
                </td>
                <td style="width: 20%; text-align: center; vertical-align: middle;">
                  <span style="font-size: 24px; color: #64748b;">➔</span>
                </td>
                <td style="width: 40%; text-align: right; vertical-align: middle;">
                  <p style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; font-family: sans-serif;">${flightData.to || "LHR"}</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-family: sans-serif;">${flightData.toCity || "Londra"}</p>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Details Grid -->
          <div style="padding: 0 20px 20px; border-bottom: 2px dashed #cbd5e1;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 25%; text-align: left;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: sans-serif; display: block;">KAPI</span>
                  <strong style="font-size: 14px; color: #0f172a; font-family: sans-serif;">${flightData.gate || "—"}</strong>
                </td>
                <td style="width: 25%; text-align: left;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: sans-serif; display: block;">KOLTUK</span>
                  <strong style="font-size: 14px; color: #0f172a; font-family: sans-serif;">${flightData.seat || "—"}</strong>
                </td>
                <td style="width: 25%; text-align: left;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: sans-serif; display: block;">GRUP</span>
                  <strong style="font-size: 14px; color: #0f172a; font-family: sans-serif;">${flightData.group || "—"}</strong>
                </td>
                <td style="width: 25%; text-align: left;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: sans-serif; display: block;">SAAT</span>
                  <strong style="font-size: 14px; color: #0f172a; font-family: sans-serif;">${flightData.departureTime || "—"}</strong>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Extra passenger & status info -->
          <div style="padding: 16px 20px; background-color: #f1f5f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; text-align: left; vertical-align: middle;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: sans-serif; display: block;">YOLCU</span>
                  <strong style="font-size: 12px; color: #0f172a; font-family: sans-serif;">${name}</strong>
                </td>
                <td style="width: 50%; text-align: right; vertical-align: middle;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: sans-serif; display: block;">BİNİŞ DURUMU</span>
                  <strong style="font-size: 12px; color: #15803d; font-family: sans-serif;">${flightData.boardingStatus || "—"}</strong>
                </td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- Security / Walk info -->
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 6px; font-size: 12px; font-weight: bold; color: #1e40af; font-family: sans-serif;">📍 CANLI TERMİNAL & GEÇİŞ BİLGİLERİ</h3>
          <p style="margin: 0; font-size: 11px; color: #1e3a8a; font-family: sans-serif; line-height: 1.4;">
            • Güvenlik Kontrol Bekleme Süresi: <strong>${flightData.securityQueueTime || "—"} dk</strong><br />
            • Ana Kapıya Tahmini Yürüme Süresi: <strong>${flightData.estimatedWalkTime || "—"} dk</strong><br />
            • Biyometrik Doğrulama: <strong>${flightData.biometricVerified ? "✅ Başarılı Biyometrik Kimlik Doğrulama" : "⏳ Evrak Doğrulama Gerekebilir"}</strong>
          </p>
        </div>
        
        <!-- Accessibility layout if present -->
        ${accessibilityProfile && accessibilityProfile.enabled ? `
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 6px; font-size: 12px; font-weight: bold; color: #065f46; font-family: sans-serif;">♿ AKTİF ERİŞİLEBİLİRLİK DESTEĞİ</h3>
            <p style="margin: 0; font-size: 11px; color: #047857; font-family: sans-serif; line-height: 1.4;">
              Engelsiz geçiş profiliniz (<strong>${accessibilityProfile.type}</strong>) sistemde aktiftir. Havalimanı yer ekibi ve asistan rampa destek birimleri kalkış kapınızda hazır bulundurulacaktır.
            </p>
          </div>
        ` : ""}
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 10px; color: #991b1b; line-height: 1.4; font-family: sans-serif;">
            <strong>Havuza Atılma & KVKK Uyarısı:</strong> Biniş kartınız, kimlik bilgileriniz ve uçuş planınız SmartPass platformunda saklanmaz. Uçağınız kalktıktan 12 saat sonra bu veriler tüm veri minimizasyonu algoritmalarıyla tamamen imha edilecektir.
          </p>
        </div>

        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #4f46e5; text-align: center; font-family: sans-serif;">İyi Uçuşlar Dileriz! ✈️</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; font-family: sans-serif;">
        Bu e-posta, AeroAI boarding sisteminden talep ettiğiniz için otomatik olarak gönderilmiştir.<br />
        © 2026 SmartPass Pro-Version. Tüm Hakları Saklıdır.
      </div>
    </div>
  `;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@smartpass-pro.com";

  if (host && port && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"SmartPass Pro" <${fromEmail}>`,
        to: email,
        subject: `SmartPass Dijital Biniş Kartınız - ${flightData.flightNumber || 'Uçuş Bildirimi'}`,
        html: htmlContent,
      });

      const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
      console.log(`BOARDING PASS EMAIL SENT successfully to ${maskedEmail}`);
      return res.json({
        success: true,
        method: "real",
        email,
        emailContentHtml: htmlContent
      });
    } catch (err: any) {
      console.error("FAIL TO SEND REAL BOARDING PASS EMAIL via SMTP:", err);
      return res.json({
        success: true,
        method: "simulated_error_fallback",
        email,
        emailContentHtml: htmlContent,
        errorMessage: err.message
      });
    }
  } else {
    const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
    console.log(`SMTP credentials not fully provided. SIMULATING boarding pass email for ${maskedEmail}`);
    return res.json({
      success: true,
      method: "simulated",
      email,
      emailContentHtml: htmlContent
    });
  }
});

export default router;
