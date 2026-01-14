
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, ConversationStyle } from './types';
import { getGeminiResponse } from './geminiService';
import ChatBubble from './components/ChatBubble';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        role: Role.MODEL,
        text: "Hello! I’m your AI assistant, built by Joshua Randolph.",
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

    const responseText = await getGeminiResponse(messages, messageText);
    
    const botMessage: Message = {
      role: Role.MODEL,
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const styleShortcuts = [
    { label: "Casual Street 🇸🇱", prompt: "Hello my man, how things looking today?", style: 'casual' },
    { label: "Formal 👔", prompt: "Good afternoon. I require some professional assistance.", style: 'formal' },
    { label: "Church ⛪", prompt: "Greetings in the name of the Lord. I have a question about ministry.", style: 'church' }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <i className="fas fa-comment-dots text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Kolokwa AI</h1>
            <p className="text-xs text-gray-500 font-medium">By Joshua Randolph</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] uppercase font-bold text-gray-400">Online</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar" ref={scrollRef}>
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full mt-20 text-center opacity-40">
              <i className="fas fa-robot text-6xl mb-4 text-slate-300"></i>
              <p className="text-lg font-medium text-slate-500">How can I help you today, ya?</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Suggested Inputs */}
      {messages.length < 5 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar max-w-4xl mx-auto w-full">
          {styleShortcuts.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(undefined, s.prompt)}
              className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-colors shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me something, ya..."
              className="w-full bg-gray-100 border-none rounded-2xl py-3.5 pl-4 pr-14 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
          <div className="mt-2 flex justify-center">
            <p className="text-[10px] text-gray-400">
              Built with love for Liberia by <span className="font-semibold">Joshua Randolph</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
