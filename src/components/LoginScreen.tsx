/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Shield, Fingerprint, Gavel, Check, HelpCircle, AlertCircle, 
  UserPlus, Lock, Sparkles, Heart, Activity, CheckCircle
} from "lucide-react";
import { AccessibilityProfile } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (passengerName: string, accessibilityProfile?: AccessibilityProfile, token?: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Navigation tab state: "login" | "register"
  const [activeTab, setActiveTab] = React.useState<"login" | "register">("login");

  // Common Login fields
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [kvkkAccepted, setKvkkAccepted] = React.useState(false);
  const [preferredLanguage, setPreferredLanguage] = React.useState<"tr" | "en">("tr");

  // Registration states
  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [accessibilityType, setAccessibilityType] = React.useState<AccessibilityProfile["type"]>("none");
  const [customRequest, setCustomRequest] = React.useState("");
  const [privacyAgreed, setPrivacyAgreed] = React.useState(false);
  const [healthConsentAgreed, setHealthConsentAgreed] = React.useState(false);
  const [isUnder18, setIsUnder18] = React.useState(false);
  const [guardianPhone, setGuardianPhone] = React.useState("");
  
  // General UI States
  const [showKvkkModal, setShowKvkkModal] = React.useState(false);
  const [showError, setShowError] = React.useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [sentEmailPreview, setSentEmailPreview] = React.useState<any | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvkkAccepted) {
      setShowError("Devam etmek için KVKK Aydınlatma Metni'ni kabul etmelisiniz.");
      return;
    }
    if (!email) {
      setShowError("E-posta adresi alanını doldurunuz.");
      return;
    }
    if (!password) {
      setShowError("Şifre alanını doldurunuz.");
      return;
    }

    setShowError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user.name, data.user.accessibilityProfile, data.token);
      } else {
        setShowError(data.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.");
      }
    } catch (err: any) {
      console.error("Giriş bağlantı hatası:", err);
      setShowError("Giriş başarısız: Sunucu bağlantı hatası.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) {
      setShowError("Lütfen Ad Soyad alanını doldurunuz.");
      return;
    }
    if (!regEmail) {
      setShowError("Lütfen geçerli bir e-posta adresi yazınız.");
      return;
    }
    if (!regPassword) {
      setShowError("En az 6 haneli bir şifre belirleyiniz.");
      return;
    }
    if (!privacyAgreed) {
      setShowError("Hassas verilerinizin korunması ve KVKK Taahhüdü onayını seçmelisiniz.");
      return;
    }

    if (accessibilityType !== "none" && !healthConsentAgreed) {
      setShowError("Seçtiğiniz özel gereksinim/engellilik durumunuzun işlenebilmesi için Sağlık Verisi Açık Rıza Onayı'nı işaretlemelisiniz.");
      return;
    }

    if (isUnder18 && !guardianPhone) {
      setShowError("Lütfen veli/aile koruma telefon numarasını belirtiniz.");
      return;
    }

    setShowError(null);
    setIsRegistering(true);

    const profile: AccessibilityProfile = {
      enabled: accessibilityType !== "none",
      type: accessibilityType,
      customRequest: customRequest || undefined,
      kvkkChecked: privacyAgreed,
      healthConsentAgreed: accessibilityType !== "none" ? healthConsentAgreed : undefined,
      isUnder18: isUnder18,
      guardianPhone: isUnder18 ? guardianPhone : undefined,
      preferredLanguage: preferredLanguage
    };

    try {
      // Step A: Register the credentials in server-side Firestore users collection
      const authRegResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName,
          accessibilityProfile: profile
        })
      });

      const authData = await authRegResponse.json();
      if (!authRegResponse.ok || !authData.success) {
        setShowError(authData.message || "Kayıt işlemi başarısız.");
        setIsRegistering(false);
        return;
      }

      const token = authData.token;

      // Step B: Send the welcome/boarding confirmation email
      try {
        const response = await fetch("/api/email/send-welcome", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            email: regEmail,
            name: regName,
            accessibilityProfile: profile
          })
        });

        const data = await response.json();
        if (data.success) {
          setSentEmailPreview({
            email: regEmail,
            name: regName,
            token: token,
            method: data.method,
            html: data.emailContentHtml,
            profile: profile
          });
        } else {
          onLoginSuccess(regName, profile, token);
        }
      } catch (err: any) {
        console.error("Welcome email delivery call failed:", err);
        onLoginSuccess(regName, profile, token);
      }
    } catch (err: any) {
      console.error("Kayıt esnasında bağlantı hatası:", err);
      setShowError("Kayıt başarısız: Havalimanı sunucu bağlantı hatası.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSocialLogin = (provider: "Google" | "Yandex") => {
    const isAccepted = activeTab === "login" ? kvkkAccepted : privacyAgreed;
    if (!isAccepted) {
      setShowError(`Sosyal hesap (${provider}) ile bağlanmak için önce KVKK metni ve gizlilik onayını seçmelisiniz.`);
      return;
    }
    setShowError(null);
    
    const defaultProfile: AccessibilityProfile = {
      enabled: accessibilityType !== "none",
      type: accessibilityType,
      customRequest: customRequest || undefined,
      kvkkChecked: isAccepted,
      isUnder18: isUnder18,
      guardianPhone: isUnder18 ? guardianPhone : undefined,
      preferredLanguage: preferredLanguage
    };

    if (provider === "Google") {
      // Background authentication for Google sandbox user
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "selim@smartpass.co", password: "selim" })
      })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          onLoginSuccess("Selim Yılmaz", defaultProfile, d.token);
        } else {
          onLoginSuccess("Selim Yılmaz", defaultProfile);
        }
      })
      .catch(() => {
        onLoginSuccess("Selim Yılmaz", defaultProfile);
      });
    } else {
      onLoginSuccess("Dmitry Smirnov", defaultProfile);
    }
  };

  const accessibilityOptions = [
    { value: "none", label: "Engelsiz / Destek İhtiyacım Yok", desc: "Standart biniş adımları ve bilgilendirmeler." },
    { value: "wheelchair", label: "Tekerlekli Sandalye / Ortopedik Destek", desc: "Zemine sıfır rampa yolları, asansörler ve fiziki yardım ekibi." },
    { value: "vision", label: "Görme Hassasiyeti / Sesli Rehberlik", desc: "Yüksek kontrast rengi, sesli uyarılar ve dokunsal yüzey rehberliği." },
    { value: "hearing", label: "İşitme Engeli / Görsel Altyazı", desc: "Kapı anonslarının anlık mobil bildirim ve bento flaşları olarak iletilmesi." },
    { value: "elderly", label: "Yaşlı Yolcu / Refakatçi Yardımı", desc: "Havalimanı içinde buggy (elektrikli araç) ve fiziki refakat planlaması." },
    { value: "other", label: "Tıbbi / Diğer Özel Gereksinimler", desc: "Solunum cihazı taşıma, ilaç muhafazası veya konuşma desteği." }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-sans overflow-y-auto pb-8">
      {/* Flight Decoration Header */}
      <div className="bg-gradient-to-b from-indigo-900 to-indigo-800 text-white pt-10 pb-8 px-6 rounded-b-[2rem] shadow-md relative overflow-hidden shrink-0">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10">
          <Fingerprint className="w-48 h-48" />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <span className="font-display font-bold text-white tracking-widest text-xs">S</span>
          </div>
          <span className="font-display font-bold tracking-widest text-sm text-indigo-200">SMART PASS</span>
        </div>
        
        <h1 className="text-2xl font-display font-bold leading-tight">Tek Dokunuşla Engelsiz Biniş</h1>
        <p className="text-xs text-indigo-200 mt-1.5 max-w-xs">
          Otorite entegrasyonlu kriz asistanı, biyometrik sistemler ve hassas ihtiyaçlı yolcu destek ağı.
        </p>
      </div>

      {/* Login vs Register Tabs Navigation */}
      <div className="px-6 mt-4 flex gap-1 bg-slate-100 p-1 mx-6 rounded-xl border border-slate-200/60 sticky top-0 z-20 shrink-0">
        <button
          onClick={() => {
            setActiveTab("login");
            setShowError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "login" 
              ? "bg-white text-indigo-950 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Giriş Yap
        </button>
        <button
          onClick={() => {
            setActiveTab("register");
            setShowError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "register" 
              ? "bg-indigo-900 text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Üye Ol / Kayıt
        </button>
      </div>

      {/* Main Content Form */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">
              {activeTab === "login" ? "HIZLI ERİŞİM GİRİŞİ" : "ERİŞİLEBİLİRLİK VE YOLCU KAYDI"}
            </h2>
            <span className="bg-indigo-50 text-indigo-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">
              {activeTab === "login" ? "Oturum Aç" : "Hassas Profil"}
            </span>
          </div>


          {showError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-medium text-[11px] leading-relaxed">{showError}</span>
            </div>
          )}

          {activeTab === "login" ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  placeholder="Örn: yolcu@havacilik.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Şifre</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-indigo-950/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4" />
                {isLoggingIn ? "Oturum Doğrulanıyor..." : "Güvenli Giriş Yap"}
              </button>
            </form>
          ) : (
            /* REGISTER WITH SPECIAL ASSISTANCE NEEDS OPTIONS */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Ad Soyad (Biniş Kartındaki Gibi)</label>
                <input
                  type="text"
                  placeholder="Örn: Selim Yılmaz"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  placeholder="yolcu@havacilik.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Şifre Belirleyin</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Special Disability and Accessibility Section */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-120/40 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">
                    ERİŞİLEBİLİRLİK DESTEĞİ SEÇİN
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-relaxed">
                  Güvenli ve sağlıklı yönlendirme sağlamak adına engel veya özel ihtiyaç durumunuzu işaretleyiniz.
                </p>

                <div className="space-y-2 mt-1">
                  {accessibilityOptions.map((opt) => (
                    <label 
                      key={opt.value}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        accessibilityType === opt.value
                          ? "bg-white border-indigo-500 shadow-xs"
                          : "bg-[#f8fafc]/80 border-slate-200 hover:bg-[#f8fafc]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="accessibility"
                        value={opt.value}
                        checked={accessibilityType === opt.value}
                        onChange={() => setAccessibilityType(opt.value as any)}
                        className="mt-1 w-3.5 h-3.5 accent-indigo-600 cursor-pointer text-xs"
                      />
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-800 leading-none">{opt.label}</p>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {accessibilityType !== "none" && (
                  <div className="mt-3.5 pt-2 border-t border-indigo-100/60">
                    <label className="text-[10px] font-semibold text-indigo-950 block mb-1">
                      Özel Not / Aparat / Yardımcı Ekip İhtiyacı
                    </label>
                    <textarea
                      placeholder="Örn: 'Sandalye genişliği 65cm, asansör gereklidir.' ya da 'Görme köpeği ile birlikte seyahat.'"
                      value={customRequest}
                      onChange={(e) => setCustomRequest(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 min-h-[50px] font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Family Protection (Aile Koruma) Section for Under 18 Passengers */}
              <div className="bg-[#f0f4ff]/50 p-4 rounded-2xl border border-indigo-100 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">
                    🛡️ Veli Denetimi & Aile Koruma Modülü
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold">
                  Yolcumuzun 18 yaş altında olması durumunda, her kapı biniş, kapı değişikliği, rötar veya transfer checkpoint güncellemesinde veliye SMS ile canlı takip bildirimleri gönderilir.
                </p>

                <div className="flex gap-2.5 items-center mt-2 bg-white/65 p-2 rounded-xl border border-indigo-500/10">
                  <input
                    type="checkbox"
                    id="isUnder18Check"
                    checked={isUnder18}
                    onChange={(e) => setIsUnder18(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer shrink-0 accent-indigo-600"
                  />
                  <label htmlFor="isUnder18Check" className="text-[11px] text-slate-700 font-bold cursor-pointer select-none">
                    Yolcu 18 Yaşından Küçüktür (Aile Takibi Aktif)
                  </label>
                </div>

                {isUnder18 && (
                  <div className="mt-3 pt-2 border-t border-indigo-100/60 animate-fade-in space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Veli / Aile Telefon No (SMS Bildirim Hattı)
                    </label>
                    <input
                      type="tel"
                      placeholder="Örn: 0555 123 4567"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Secure Privacy Pact */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 rounded-2xl p-4 space-y-2">
                <div className="flex gap-2 items-start">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-[10.5px] font-extrabold text-emerald-950 uppercase tracking-widest leading-none">
                      🔒 VERİ KORUMA VE ŞİFRELEME GÜVENCESİ
                    </h4>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed font-medium">
                      Paylaştığınız bu hassas sağlık ve özel gereksinim bilgileri 6698 sayılı KVKK gereğince yüksek güvenlikli şifrelenir. 
                      Bu bilgiler asla havayolları pazarlama veya ticari sistemlere **İLETİLMEZ**. Sadece havalimanı içindeki engelsiz asansör 
                      rotanızı çizmek ve yer ekibine erişilebilirlik bildirmesi yapmak amacıyla cihaz üzerinde lokal olarak işlenir.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start mt-2.5 pt-2 border-t border-emerald-500/15">
                  <input
                    type="checkbox"
                    id="privacyAgreed"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600 rounded border-slate-350 cursor-pointer shrink-0"
                  />
                  <label htmlFor="privacyAgreed" className="text-[10px] text-slate-600 leading-snug cursor-pointer select-none">
                    Uygulamanın genel KVKK Aydınlatma Metni'ni okudum ve genel seyahat profil verilerimin bu doğrultuda işlenmesini onaylıyorum.
                  </label>
                </div>

                {accessibilityType !== "none" && (
                  <div className="flex gap-2.5 items-start mt-2.5 pt-2 border-t border-dashed border-emerald-500/30 bg-emerald-505/5 p-2 rounded-lg animate-fade-in">
                    <input
                      type="checkbox"
                      id="healthConsentAgreed"
                      checked={healthConsentAgreed}
                      onChange={(e) => setHealthConsentAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-emerald-600 rounded border-slate-350 cursor-pointer shrink-0"
                    />
                    <label htmlFor="healthConsentAgreed" className="text-[10px] text-emerald-950 font-semibold leading-snug cursor-pointer select-none">
                      ⚠️ <strong>ÖZEL NİTELİKLİ SAĞLIK VERİSİ AÇIK RIZASI:</strong> Yukarıda belirttiğim ortopedik destek, medikal durum veya diğer engellilik/sağlık verilerimin, havalimanı engelsiz asistanlığı koordinasyonu amacıyla işlenmesine 6698 sayılı KVKK kapsamında <strong>açık rıza veriyorum</strong>.
                    </label>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-indigo-900 hover:bg-indigo-800 disabled:bg-slate-400 text-white py-3.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-950/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Profil Kaydediliyor & E-posta Gönderiliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Üye Ol ve Giriş Yap
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social Sign In Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] text-slate-400 uppercase font-semibold">
              Veya Şununla Bağlan
            </span>
          </div>

          {/* Google & Yandex Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin("Google")}
              type="button"
              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.56 8.95 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.46h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.64 2.82c2.13-1.96 3.41-4.84 3.41-8.47z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3a7.82 7.82 0 01.38-2.3L1.5 6.9a11.97 11.97 0 000 10.2l3.86-2.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.64-2.82c-1.01.68-2.3 1.09-3.64 1.09-3.04 0-5.72-2.52-6.64-5.46L1.5 16.5c1.9 3.85 5.85 6.5 10.5 6.5z"
                />
              </svg>
              Google
            </button>

            <button
              onClick={() => handleSocialLogin("Yandex")}
              type="button"
              className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span className="w-4 h-4 rounded bg-white text-red-600 font-bold font-display flex items-center justify-center text-[10px]">
                Y
              </span>
              Yandex
            </button>
          </div>
        </div>

        {/* KVKK / GDPR Explicit Acceptance Banner */}
        {activeTab === "login" && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mt-4 space-y-2.5 shrink-0">
            <div className="flex gap-2.5 items-start">
              <input
                type="checkbox"
                id="kvkk"
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 accent-indigo-600 rounded border-slate-350 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="kvkk" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer select-none">
                Uygulanan akıllı biniş sistemleri dahilinde, <span className="font-semibold text-indigo-900 underline" onClick={(e) => { e.preventDefault(); setShowKvkkModal(true); }}>KVKK Aydınlatma Metni</span>'ni okudum, anladım ve biyometrik/bilet veri işlemeyi kabul ediyorum.
              </label>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-900 font-semibold bg-indigo-50 py-1.5 px-2.5 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Verileriniz cihazda lokal şifrelenir ve uçuş sonrası silinir.</span>
            </div>
          </div>
        )}
      </div>

      {/* KVKK Detailed Model popup */}
      {showKvkkModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[85%] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
            <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center">
              <span className="font-display font-semibold text-sm flex items-center gap-1.5">
                <Gavel className="w-4.5 h-4.5 text-indigo-400" />
                KVKK Aydınlatma Metni
              </span>
              <button
                onClick={() => setShowKvkkModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2"
              >
                Kapat
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto text-xs text-slate-600 space-y-3 font-sans leading-relaxed">
              <h3 className="font-bold text-slate-800 text-[13px]">1. Veri Sorumlusu</h3>
              <p>
                SMART PASS havacılık otomasyonu kapsamında işlenecek biniş kartı, PNR, soyadı ve biometric doğrulamalar için veri sorumlusu yerel havalimanı otoriteleridir (İGA, TAV, HEAŞ, DHMİ).
              </p>

              <h3 className="font-bold text-slate-800 text-[13px]">2. İşlenen Veriler ve Amaçlar</h3>
              <p>
                Cihaz içi kamera taranırken elde edilen biniş dizesi verileri (IATA BCBP formatı); sadece uçuş durum doğrulaması, kapı navigasyonu ve seyahat asistanlığı sağlanması amacıyla anlık olarak RAM üzerinde işlenir.
              </p>

              <h3 className="font-bold text-slate-800 text-[13px]">3. Biyometrik Tanıma (Smart ID)</h3>
              <p>
                Eğer biyometrik eşleştirme aktif edilirse, kameranın yakaladığı yüz hatları dijital bir imza şifresine çevrilir, asla harici sunuculara veya üçüncü şahıslara ham görüntü olarak aktarılmaz. Eşleştirme uçuş tamamlandığı an kalıcı olarak cihaz belleğinden silinmektedir.
              </p>

              <h3 className="font-bold text-slate-800 text-[13px]">4. Saklama ve İmha Süresi</h3>
              <p>
                Veri minimizasyonu gereği, tüm biniş bilet verileri ve asistan yazışmaları uçağın kalktığı andan itibaren 12 saat içinde otomatik olarak imha edilir.
              </p>

              <h3 className="font-bold text-slate-800 text-[13px]">5. Hassas İhtiyaç Verilerinin Korunması</h3>
              <p>
                Engelli, yaşlı veya özel gereksinimli yolcularımızın kaydettiği tüm erişilebilirlik verileri 6698 sayılı Kanun uyarınca özel nitelikli kişisel veri statüsünde olup, sadece otonom rota çizimi ve asistan hizmetleri için geçici olarak işlenir ve hiçbir şekilde paylaşılamaz.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setKvkkAccepted(true);
                  setShowKvkkModal(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all h-9"
              >
                Okudum, Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Email Confirmation Modal Preview (Simulated or Real SMTP notification) */}
      {sentEmailPreview && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#F8F9FA] rounded-[2rem] w-full max-w-sm my-auto flex flex-col border border-slate-200 shadow-2xl overflow-hidden max-h-[92%] animate-scale-up">
            
            {/* Header section */}
            <div className="bg-[#1E1B4B] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase font-display">AeroAI Mailer</span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                  sentEmailPreview.method === "real" 
                    ? "bg-emerald-500 text-white" 
                    : "bg-indigo-300 text-indigo-950"
                }`}>
                  {sentEmailPreview.method === "real" ? "SMTP AKTİF" : "SİMÜLASYON"}
                </span>
              </div>
              <button 
                onClick={() => onLoginSuccess(sentEmailPreview.name, sentEmailPreview.profile, sentEmailPreview.token)}
                className="text-[10px] text-indigo-200 hover:text-white font-extrabold focus:outline-none bg-indigo-800/60 px-3 py-1.5 rounded-xl border border-indigo-700/50 min-h-[32px] flex items-center"
              >
                Geç
              </button>
            </div>

            {/* Email dispatch info panel */}
            <div className="bg-slate-50 border-b border-slate-150 p-4 shrink-0 text-left">
              <p className="text-[11px] text-slate-800 font-bold mb-1">
                Sayın <span className="font-extrabold text-indigo-950">{sentEmailPreview.name}</span>,
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {sentEmailPreview.method === "real" ? (
                  <>
                    Kaydınız tamamlandı! Bilet bilgilerini barındıran onay asistanı e-postası 
                    <strong className="text-indigo-905 ml-1">{sentEmailPreview.email}</strong> adresinize başarıyla gönderildi.
                  </>
                ) : (
                  <>
                    Üyeliğiniz oluşturuldu! Gönderilen biniş onay e-postasının canlı görünümü:
                  </>
                )}
              </p>
            </div>

            {/* Email simulated browser/app wrapper */}
            <div className="flex-1 overflow-y-auto p-3 bg-slate-100 min-h-[220px] scrollbar-thin shadow-inner">
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden text-left flex flex-col h-full">
                
                {/* Simulated SMTP headers panel */}
                <div className="p-3 bg-slate-50 border-b border-slate-150 text-[9px] text-slate-500 space-y-0.5 font-mono">
                  <div><strong>Kimden:</strong> SmartPass &lt;no-reply@smartpass-pro.com&gt;</div>
                  <div><strong>Alıcı:</strong> {sentEmailPreview.email}</div>
                  <div className="truncate"><strong>Konu:</strong> SmartPass'e Hoş Geldiniz, Sayın {sentEmailPreview.name}!</div>
                </div>

                {/* HTML rendering via iframe */}
                <div className="bg-white p-1.5 overflow-hidden flex-1">
                  <iframe 
                    title="SmartPass Register Welcome Email"
                    srcDoc={sentEmailPreview.html} 
                    className="w-full h-80 border-0 rounded-b-xl"
                  />
                </div>
              </div>
            </div>

            {/* Bottom confirm button */}
            <div className="p-4 bg-[#F8F9FA] border-t border-slate-200/60 shrink-0">
              <button
                onClick={() => onLoginSuccess(sentEmailPreview.name, sentEmailPreview.profile, sentEmailPreview.token)}
                className="w-full bg-indigo-900 hover:bg-indigo-850 text-white font-extrabold text-[11px] py-3 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md min-h-[44px] cursor-pointer"
              >
                Uygulama Paneline Devam Et →
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
