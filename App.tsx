import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, AIStyle, StyleOption } from './types';
import { getGeminiResponse, connectLive, decode, decodeAudioData, encode } from './geminiService';
import ChatBubble from './components/ChatBubble';

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'classic', label: 'Classic', icon: 'fa-robot', description: 'Standard Kolokwa.' },
  { id: 'street', label: 'Street', icon: 'fa-glasses', description: 'Street slang & proverbs.' },
  { id: 'executive', label: 'Executive', icon: 'fa-user-tie', description: 'Professional flair.' },
  { id: 'counselor', label: 'Counselor', icon: 'fa-hands-praying', description: 'Church & Ministry tone.' },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<AIStyle>('classic');
  const [isLive, setIsLive] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([{
      role: Role.MODEL,
      text: "Hello! I’m your AI assistant, built by Joshua Randolph. How you feeling today?",
      timestamp: new Date()
    }]);
  }, []);

  const stopLive = () => {
    if (liveSessionRef.current) liveSessionRef.current.then((s: any) => s.close());
    audioSourcesRef.current.forEach(s => s.stop());
    setIsLive(false);
  };

  const startLive = async () => {
    setGlobalError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = connectLive(currentStyle, 
        async (msg) => {
          const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const buffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            audioSourcesRef.current.add(source);
          }
          if (msg.serverContent?.interrupted) {
            audioSourcesRef.current.forEach(s => s.stop());
            nextStartTimeRef.current = 0;
          }
        },
        () => {
          setIsLive(true);
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(data.length);
            for(let i=0; i<data.length; i++) int16[i] = data[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ 
              media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
            }));
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        (err) => setGlobalError(err.message)
      );
      liveSessionRef.current = sessionPromise;
    } catch (e) {
      setGlobalError("Need microphone access for Live Mode, ya?");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = { role: Role.USER, text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    const response = await getGeminiResponse(messages, userMsg.text, currentStyle);
    setMessages(prev => [...prev, { role: Role.MODEL, text: response, timestamp: new Date() }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg"><i className="fas fa-robot text-white"></i></div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Kolokwa AI</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase">By Joshua Randolph</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={isLive ? stopLive : startLive} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <i className="fas fa-microphone mr-2"></i>{isLive ? 'Live Now' : 'Go Live'}
          </button>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {STYLE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setCurrentStyle(s.id)} className={`px-3 py-1 rounded-lg text-xs font-bold ${currentStyle === s.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {globalError && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold flex justify-between">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)}><i className="fas fa-times"></i></button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {isLive && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-1 h-8">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-blue-600 rounded-full wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                <span className="ml-4 text-xs font-bold text-blue-600 uppercase tracking-widest">Listening in {currentStyle} mode...</span>
              </div>
            </div>
          )}
          {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}
          {isLoading && <div className="text-xs text-slate-400 animate-pulse italic">Kolokwa AI is thinking...</div>}
        </div>
      </main>

      <footer className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex space-x-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Chat in ${currentStyle} style...`} className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-100 text-sm" />
          <button type="submit" disabled={!input.trim()} className="bg-blue-600 text-white px-6 rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50"><i className="fas fa-paper-plane"></i></button>
        </form>
      </footer>
    </div>
  );
};

export default App;