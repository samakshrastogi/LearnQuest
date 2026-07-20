import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, Globe, Bot, User, Trash2, Volume2, Mic, MicOff } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AITutorChat() {
  const { profile } = useAuthStore();
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('tutorGreeting') || 'Namaste! I am Guruji, your learning companion. Ask me any doubts!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLanguage, setChatLanguage] = useState<'en' | 'hi'>('en');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleMicToggle = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Try Google Chrome or Microsoft Edge!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = chatLanguage === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userQuery = input.trim();
    setInput('');
    setSending(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userQuery, timestamp: new Date() }]);

    try {
      const res = await api.post('/ai/tutor/ask', {
        query: userQuery,
        language: chatLanguage,
      });

      const reply = res.data.data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Guruji is currently meditating. Please try again in a few moments.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: t('tutorGreeting') || 'Namaste! I am Guruji, your learning companion. Ask me any doubts!',
        timestamp: new Date(),
      },
    ]);
  };

  const suggestionPills = [
    'Explain prime numbers simply',
    'Explain States of Matter in Hindi',
    'How do I calculate square area?',
    'Give me a tip on daily study goals',
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-130px)]">
      
      {/* 1. Suggestion Sidebar (Desktop only) */}
      <div className="hidden md:flex flex-col w-64 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 gap-4 shrink-0">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Sparkles className="h-4 w-4" /> Suggestions
        </div>
        <div className="flex flex-col gap-2">
          {suggestionPills.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setInput(s)}
              className="p-3 text-left bg-slate-950/40 border border-slate-850 hover:border-slate-700/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all leading-relaxed"
            >
              "{s}"
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Chat Box */}
      <div className="flex-1 flex flex-col bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        
        {/* Chat Header */}
        <header className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100">Guruji AI</h2>
              <span className="text-[10px] text-accent-cyan font-bold uppercase tracking-wider">
                PERSONALIZED TUTOR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatLanguage((l) => (l === 'en' ? 'hi' : 'en'))}
              className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 transition-all"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              {chatLanguage === 'en' ? 'Hinglish Mode' : 'English Mode'}
            </button>
            <button
              onClick={handleClear}
              className="p-2 bg-slate-850 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isBot = m.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  isBot ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isBot ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/15 text-accent-gold border border-amber-500/20'
                  }`}
                >
                  {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed border relative group ${
                    isBot
                      ? 'bg-slate-900/80 border-slate-800/80 text-slate-200 rounded-tl-none'
                      : 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/15 text-slate-100 rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>

                  {isBot && typeof window !== 'undefined' && 'speechSynthesis' in window && (
                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(m.content);
                        utterance.rate = 0.95;
                        window.speechSynthesis.speak(utterance);
                      }}
                      className="mt-2 text-[10px] bg-slate-950 text-cyan-400 font-bold px-2 py-1 rounded border border-slate-800 flex items-center gap-1 hover:bg-slate-800 transition-all"
                    >
                      <Volume2 className="h-3 w-3 text-cyan-400" /> Listen to Guruji
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex gap-3 max-w-[85%] self-start mr-auto items-center">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/50 p-4 rounded-2xl rounded-tl-none text-xs text-slate-400">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950/30 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening to your voice...' : (t('chatPlaceholder') || 'Ask Guruji a query...')}
            className={`flex-1 glass-input py-2.5 text-xs focus:ring-0 focus:ring-offset-0 focus:border-slate-700 ${
              isListening ? 'border-red-500/50 bg-red-500/10 animate-pulse' : ''
            }`}
          />

          <button
            type="button"
            onClick={handleMicToggle}
            className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-400 animate-bounce'
                : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={isListening ? 'Listening...' : 'Speak to Guruji'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-cyan-400" />}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="btn-gold px-4 py-2.5 flex items-center justify-center shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
