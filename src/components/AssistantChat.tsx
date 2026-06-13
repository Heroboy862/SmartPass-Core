/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, ArrowLeft, RefreshCw, User, Brain, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { ChatMessage, FlightInfo } from "../types";
import { useFlightStore } from "../store/useFlightStore";

interface AssistantChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClose: () => void;
  flightData: FlightInfo;
}

const QUICK_PROMPTS_TR = [
  "Şu anki uçuşum ve kapı durumum nedir?",
  "Havalimanı içinde kapıya nasıl ulaşırım?",
  "Rötar/İptal durumunda hangi yolcu haklarım var?",
  "Lounge alanlarına nasıl erişebilirim?"
];

const QUICK_PROMPTS_EN = [
  "What is my current flight and gate status?",
  "How do I walk to the gate inside the airport?",
  "What passenger rights do I have for delays/cancellations?",
  "How can I access the lounge areas?"
];

export default function AssistantChat({
  messages,
  onSendMessage,
  isLoading,
  onClose,
  flightData
}: AssistantChatProps) {
  const { accessibilityProfile, isOnline } = useFlightStore();
  const profileLanguage = accessibilityProfile?.preferredLanguage || "tr";

  const [inputText, setInputText] = React.useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isListening, setIsListening] = React.useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = React.useState(false);
  const [speakingMessageId, setSpeakingMessageId] = React.useState<string | null>(null);
  const [micError, setMicError] = React.useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== "undefined" ? window.speechSynthesis : null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Auto scroll to chat base
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Recognition & Synthesis Engine Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = profileLanguage === "en" ? "en-US" : "tr-TR";

      rec.onstart = () => {
        setIsListening(true);
        setMicError(null);
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(30); // Subtle 30ms tap on start listening
        }
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setMicError(profileLanguage === "en" ? "Microphone permission denied." : "Mikrofon izni verilmedi.");
        } else if (event.error === "no-speech") {
          // ignore silence
        } else {
          setMicError(profileLanguage === "en" ? `Microphone error: ${event.error}` : `Mikrofon hatası: ${event.error}`);
        }
        setIsListening(false);
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate([80, 50, 80]); // Triple error pattern
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(50); // Single 50ms pulse on stop listening
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [profileLanguage]);

  // Automatic Voice Announcement Trigger
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === "assistant" && lastMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage.id;
      if (isVoiceOutputEnabled) {
        speakMessage(lastMessage.id, lastMessage.text);
      }
    }
  }, [messages, isVoiceOutputEnabled]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMicError(profileLanguage === "en" ? "Web Speech API is not supported in this browser." : "Web Speech API bu tarayıcıda desteklenmiyor.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const speakMessage = (id: string, text: string) => {
    if (!synthRef.current) return;

    if (speakingMessageId === id) {
      synthRef.current.cancel();
      setSpeakingMessageId(null);
      return;
    }

    synthRef.current.cancel();

    const cleanText = text.replace(/[*#`_\-]/g, ""); // Clean any markdown characters
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = profileLanguage === "en" ? "en-US" : "tr-TR";

    const voices = synthRef.current.getVoices();
    const targetVoiceLang = profileLanguage === "en" ? "en" : "tr";
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetVoiceLang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setSpeakingMessageId(id);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setSpeakingMessageId(null);
    };

    synthRef.current.speak(utterance);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const clickQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const promptList = profileLanguage === "en" ? QUICK_PROMPTS_EN : QUICK_PROMPTS_TR;
  const headerTitle = profileLanguage === "en" ? "AeroAI Passenger Assistant" : "AeroAI Yolcu Asistanı";
  const headerSub = profileLanguage === "en" ? "Gemini 3.5-Flash Active" : "Gemini 3.5-Flash Canlı";
  const voiceResponseBtn = profileLanguage === "en" ? "Voice Response" : "Sesli Yanıt";
  const voiceResponseTitle = profileLanguage === "en" ? (isVoiceOutputEnabled ? "Turn off voice output" : "Turn on voice output") : (isVoiceOutputEnabled ? "Sesli yanıtı kapat" : "Sesli yanıtı aç");
  const automationModeBtn = profileLanguage === "en" ? "Automation Mode" : "Otomasyon Modu";
  const alertBannerText = profileLanguage === "en" ? "AI assistant is continuously tracking your flight delay and gate updates." : "Yapay zeka asistanı uçuş rötar ve kapı verilerinizden haberdardır.";
  const loadingText = profileLanguage === "en" ? "AeroAI is fetching fresh data from aviation authorities and thinking..." : "AeroAI otoritelerden taze veri çekiyor ve düşünüyor...";
  const quickQuestionsText = profileLanguage === "en" ? "Quick Assistant Questions" : "Asistana Hızlı Sorular";
  const isListeningTitle = profileLanguage === "en" ? "Your assistant is listening, speak..." : "Uçuş asistanınız dinliyor, konuşun...";
  const normalPlaceholder = profileLanguage === "en" ? "Type your question or issue..." : "Kelimeniz veya kriz sorunuz...";
  const inputPlaceholder = isListening ? isListeningTitle : normalPlaceholder;
  const micButtonTitle = isListening ? (profileLanguage === "en" ? "Turn Off Mic" : "Mikrofonu Kapat") : (profileLanguage === "en" ? "Speak Voice (Microphone)" : "Sesli Söyle (Mikrofon)");
  const speakBtnTitle = speakingMessageId ? (profileLanguage === "en" ? "Stop Speech" : "Seslendirmeyi Durdur") : (profileLanguage === "en" ? "Read Aloud" : "Sesli Oku");

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-sans text-slate-900">
      
      {/* Header bar */}
      <div className="bg-indigo-950 text-white px-4 py-4.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white ring-2 ring-orange-500/20">
              <Brain className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold leading-none text-slate-100 flex items-center gap-1">
                {headerTitle}
                <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
              </h3>
              <span className="text-[9px] text-slate-300 font-mono">{headerSub}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Automatic TTS voice announcer toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !isVoiceOutputEnabled;
              setIsVoiceOutputEnabled(nextVal);
              if (!nextVal && synthRef.current) {
                synthRef.current.cancel();
                setSpeakingMessageId(null);
              }
            }}
            title={voiceResponseTitle}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] uppercase font-bold border cursor-pointer ${
              isVoiceOutputEnabled 
                ? "bg-amber-500 border-amber-400 text-white shadow-xs animate-pulse" 
                : "bg-indigo-900 border-indigo-800 text-indigo-300 hover:text-white"
            }`}
          >
            {isVoiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceResponseBtn}</span>
          </button>

          <span className="text-[10px] bg-indigo-900 font-extrabold uppercase px-2.5 py-1.5 rounded border border-indigo-800 text-indigo-300">
            {automationModeBtn}
          </span>
        </div>
      </div>

      {/* Warning info panel representing real airport data integration */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50/50 border-b border-indigo-100 p-2.5 px-4 text-[10px] text-indigo-900 font-semibold flex items-center gap-2 justify-center">
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></div>
        <span>{alertBannerText}</span>
      </div>

      {/* Messages timeline */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => {
          const isUser = message.sender === "user";
          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  AI
                </div>
              )}
              
              <div className={`max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans shadow-xs relative group ${
                    isUser
                      ? "bg-indigo-950 text-white rounded-tr-none"
                      : "bg-white border border-slate-150 text-slate-800 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  
                  {/* Speaker icon overlay for assistant messages */}
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => speakMessage(message.id, message.text)}
                      className="absolute -right-3 -bottom-3 bg-white border border-slate-200 hover:border-orange-200 hover:bg-orange-50 rounded-full p-1.5 text-slate-500 hover:text-orange-600 shadow-sm transition-all active:scale-90 animate-fade-in"
                      title={speakBtnTitle}
                    >
                      {speakingMessageId === message.id ? (
                        <div className="flex items-center gap-0.5 px-0.5 h-3.5">
                          <span className="w-0.5 h-3 bg-orange-500 rounded-sm animate-pulse"></span>
                          <span className="w-0.5 h-4 bg-orange-500 rounded-sm animate-pulse delay-75"></span>
                          <span className="w-0.5 h-2 bg-orange-500 rounded-sm animate-pulse delay-150"></span>
                        </div>
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">{message.timestamp}</span>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Dynamic Gemini streaming typing feedback */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs animate-pulse">
              AI
            </div>
            <div className="bg-white border border-slate-150 p-3.5 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>{loadingText}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* Sticky suggestions layout */}
      <div className="px-4 pb-2 pt-1 border-t border-slate-100 bg-white">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          {!isOnline 
            ? (profileLanguage === "en" ? "Suggestions (Offline)" : "Öneriler (Çevrimdışı)") 
            : quickQuestionsText
          }
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none opacity-60">
          {promptList.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => isOnline && clickQuickPrompt(prompt)}
              disabled={!isOnline}
              className={`text-[10.5px] px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                !isOnline 
                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150 active:scale-95 cursor-pointer"
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input panel layout */}
      <form 
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2"
      >
        {!isOnline && (
          <span className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 text-center font-bold self-stretch animate-pulse uppercase tracking-wider">
            {profileLanguage === "en" ? "⚠️ Chat is offline. Reconnect to consult AeroAI." : "⚠️ Asistan çevrimdışı. AeroAI danışmanlığı için interneti onarın."}
          </span>
        )}
        {micError && (
          <span className="text-[10px] text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 text-center font-medium self-stretch">
            {micError}
          </span>
        )}
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            placeholder={!isOnline ? (profileLanguage === "en" ? "Internet disconnected..." : "İnternet bağlantısı kesildi...") : inputPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isListening || !isOnline}
            className={`flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed ${
              isListening ? "border-red-400 bg-red-50/20 text-red-950 font-medium placeholder-red-500 animate-pulse" : ""
            }`}
          />
          
          {/* Microphone Speech-to-Text Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={!isOnline}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border shrink-0 relative disabled:opacity-45 disabled:cursor-not-allowed ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white border-red-400 animate-pulse shadow-md shadow-red-200"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
            }`}
            title={micButtonTitle}
          >
            {isListening ? <Mic className="w-4.5 h-4.5 animate-ping absolute" /> : null}
            {isListening ? <MicOff className="w-4.5 h-4.5 z-10" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isListening || !isOnline}
            className="bg-indigo-900 hover:bg-indigo-800 disabled:bg-slate-300 text-white w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 disabled:shadow-none cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
}
