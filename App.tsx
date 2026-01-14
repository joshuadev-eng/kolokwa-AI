
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, AIStyle, StyleOption } from './types';
import { getGeminiResponse } from './geminiService';
import ChatBubble from './components/ChatBubble';

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'classic', label: 'Classic', icon: 'fa-robot', description: 'Balanced Kolokwa' },
  { id: 'street', label: 'Street', icon: 'fa-glasses', description: 'Deep Street Slang' },
  { id: 'executive', label: 'Executive', icon: 'fa-user-tie', description: 'Professional Tone' },
  { id: 'counselor', label: 'Counselor', icon: 'fa-hands-praying', description: 'Empathetic & Wise' },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<AIStyle>('classic');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initial Greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        role: Role.MODEL,
        text: "Hello! I’m your AI assistant, built by Joshua Randolph. How you feeling today?",
        timestamp: new Date()
      }]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const messageText = customPrompt || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      role: Role.USER,
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    const responseText = await getGeminiResponse([...messages, userMessage], messageText, currentStyle);
    
    const botMessage: Message = {
      role: Role.MODEL,
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const styleShortcuts = [
    { label: "Casual Street 🇸🇱", prompt: "Hello my man, how things looking today?" },
    { label: "Formal 👔", prompt: "Good afternoon. I require some professional assistance." },
    { label: "Church ⛪", prompt: "Greetings in the name of the Lord. I have a question about ministry." }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg shadow-sm">
              <i className="fas fa-comment-dots text-white text-lg"></i>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-none">Kolokwa AI</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">Joshua Randolph</p>
            </div>
          </div>

          {/* Style Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                onClick={() => setCurrentStyle(style.id)}
                title={style.description}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentStyle === style.id 
                    ? 'bg-white text-red-600 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className={`fas ${style.icon}`}></i>
                <span className="hidden md:inline">{style.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full mt-32 text-center text-slate-400 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-xl">
                <i className="fas fa-robot text-4xl text-red-600"></i>
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">How the body?</h2>
              <p className="max-w-xs mx-auto text-sm">I'm ready in <span className="text-red-600 font-bold">{STYLE_OPTIONS.find(s => s.id === currentStyle)?.label}</span> mode, ya?</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs shadow-md animate-pulse">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 italic">Kolokwa AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Bar / Suggested Inputs */}
      <div className="bg-gradient-to-t from-white via-white to-transparent pt-4">
        {messages.length < 10 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar max-w-3xl mx-auto w-full pb-2">
            {styleShortcuts.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(undefined, s.prompt)}
                className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-100 p-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask in ${currentStyle} style...`}
              className="w-full bg-slate-100 border-2 border-transparent rounded-2xl py-4 pl-5 pr-16 text-sm focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-200 outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-1.5 bottom-1.5 px-4 rounded-xl transition-all flex items-center justify-center ${
                input.trim() && !isLoading 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-105 active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <i className={`fas ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`}></i>
            </button>
          </form>
          <div className="mt-3 flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-2 opacity-60">
               <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Built by Joshua Randolph</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
