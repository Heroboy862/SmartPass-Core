/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, ArrowLeft, RefreshCw, User, Brain } from "lucide-react";
import { ChatMessage, FlightInfo } from "../types";

interface AssistantChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClose: () => void;
  flightData: FlightInfo;
}

const QUICK_PROMPTS = [
  "Şu anki uçuşum ve kapı durumum nedir?",
  "Havalimanı içinde kapıya nasıl ulaşırım?",
  "Rötar/İptal durumunda hangi yolcu haklarım var?",
  "Lounge alanlarına nasıl erişebilirim?"
];

export default function AssistantChat({
  messages,
  onSendMessage,
  isLoading,
  onClose,
  flightData
}: AssistantChatProps) {
  const [inputText, setInputText] = React.useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to chat base
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
                AeroAI Yolcu Asistanı
                <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
              </h3>
              <span className="text-[9px] text-slate-300 font-mono">Gemini 3.5-Flash Canlı</span>
            </div>
          </div>
        </div>

        <span className="text-[10px] bg-indigo-900 font-extrabold uppercase px-2.5 py-0.5 rounded border border-indigo-800 text-indigo-300">
          Otomasyon Modu
        </span>
      </div>

      {/* Warning info panel representing real airport data integration */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50/50 border-b border-indigo-100 p-2.5 px-4 text-[10px] text-indigo-900 font-semibold flex items-center gap-2 justify-center">
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></div>
        <span>Yapay zeka asistanı uçuş rötar ve kapı verilerinizden haberdardır.</span>
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
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans shadow-xs ${
                    isUser
                      ? "bg-indigo-950 text-white rounded-tr-none"
                      : "bg-white border border-slate-150 text-slate-800 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
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
              <span>AeroAI otoritelerden taze veri çekiyor ve düşünüyor...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* Sticky suggestions layout */}
      <div className="px-4 pb-2 pt-1 border-t border-slate-100 bg-white">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Asistana Hızlı Sorular
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => clickQuickPrompt(prompt)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150 text-[10.5px] px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition-colors active:scale-95 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input panel layout */}
      <form 
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Kelimeniz veya kriz sorunuz..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans text-slate-800"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-indigo-900 hover:bg-indigo-800 disabled:bg-slate-300 text-white w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 disabled:shadow-none cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
