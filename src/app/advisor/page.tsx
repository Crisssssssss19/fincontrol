'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { translations } from '@/lib/translations';
import { 
  Sparkles, 
  Send, 
  ArrowLeft, 
  User as UserIcon, 
  Bot, 
  RefreshCw, 
  MessageSquare,
  HelpCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AdvisorChatPage() {
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize from sessionStorage or default greeting
  useEffect(() => {
    let loadedFromCache = false;
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('fincontrol_advisor_chat');
        if (cached) {
          const parsed = JSON.parse(cached) as Message[];
          const loaded = parsed.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          if (loaded.length > 0) {
            setMessages(loaded);
            loadedFromCache = true;
          }
        }
      } catch (e) {
        console.error('Error loading chat cache:', e);
      }
    }

    if (!loadedFromCache) {
      const welcomeMsg = language === 'es' 
        ? `¡Hola${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! Soy tu Asesor Financiero Personal IA. Analizo tus registros de FinControl en tiempo real para brindarte recomendaciones de ahorro, presupuestos y hábitos inteligentes. ¿En qué te puedo ayudar hoy?`
        : `Hello${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! I am your AI Financial Advisor. I analyze your FinControl records in real time to provide you with saving tips, budgets, and smart habits. How can I help you today?`;
      
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMsg,
          timestamp: new Date()
        }
      ]);
    }
  }, [language, user]);

  // Save to sessionStorage when messages update
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        sessionStorage.setItem('fincontrol_advisor_chat', JSON.stringify(messages));
      } catch (e) {
        console.error('Error saving chat cache:', e);
      }
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);
    
    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          lang: language
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'Failed response');
      }
    } catch (err) {
      console.error('Error during advisor chat:', err);
      const errorReply = language === 'es'
        ? 'Lo siento, he tenido un problema de conexión al procesar tu solicitud. Por favor, inténtalo de nuevo.'
        : 'Sorry, I encountered a connection issue while processing your request. Please try again.';
        
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorReply,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const suggestions = language === 'es' ? [
    { text: '¿Cómo están mis finanzas este mes?', icon: TrendingUp },
    { text: '¿Qué consejos me das para ahorrar?', icon: Sparkles },
    { text: '¿Cómo funcionan los presupuestos?', icon: HelpCircle },
    { text: 'Analiza mi categoría de gastos', icon: AlertTriangle }
  ] : [
    { text: 'How are my finances looking this month?', icon: TrendingUp },
    { text: 'What saving tips do you recommend?', icon: Sparkles },
    { text: 'How do category budgets work?', icon: HelpCircle },
    { text: 'Analyze my spending categories', icon: AlertTriangle }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[750px] max-w-4xl mx-auto w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      
      {/* Advisor Header */}
      <header className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center relative">
            <Bot className="w-6 h-6" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card"></span>
          </div>
          <div>
            <h2 className="font-black text-sm text-[var(--foreground)] leading-tight">
              {language === 'es' ? 'Asesor Financiero IA' : 'AI Financial Advisor'}
            </h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>●</span> {language === 'es' ? 'En línea' : 'Online'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm(language === 'es' ? '¿Estás seguro de que deseas reiniciar la conversación?' : 'Are you sure you want to restart the conversation?')) {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('fincontrol_advisor_chat');
                }
                const welcomeMsg = language === 'es' 
                  ? `¡Hola${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! Soy tu Asesor Financiero Personal IA. Analizo tus registros de FinControl en tiempo real para brindarte recomendaciones de ahorro, presupuestos y hábitos inteligentes. ¿En qué te puedo ayudar hoy?`
                  : `Hello${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! I am your AI Financial Advisor. I analyze your FinControl records in real time to provide you with saving tips, budgets, and smart habits. How can I help you today?`;
                setMessages([
                  {
                    id: 'welcome',
                    role: 'assistant',
                    content: welcomeMsg,
                    timestamp: new Date()
                  }
                ]);
              }
            }}
            className="flex items-center justify-center p-2 border border-border hover:bg-muted text-muted-foreground rounded-xl transition-all active:scale-95 cursor-pointer"
            title={language === 'es' ? 'Reiniciar chat' : 'Restart chat'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-muted text-muted-foreground rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {language === 'es' ? 'Volver' : 'Back'}
          </Link>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-card/40">
        
        {/* Suggestion Chips (Visible if only the welcome message is there) */}
        {messages.length === 1 && (
          <div className="max-w-2xl mx-auto py-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-2">
              {language === 'es' ? 'Preguntas sugeridas' : 'Suggested questions'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((s, idx) => {
                const IconComponent = s.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s.text)}
                    className="flex items-center gap-2.5 px-4 py-3 bg-muted/40 hover:bg-muted border border-border/80 rounded-xl text-xs font-bold text-left text-muted-foreground hover:text-[var(--foreground)] transition-all cursor-pointer hover:shadow-2xs active:scale-[0.99]"
                  >
                    <IconComponent className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span>{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in duration-200`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                  isUser 
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' 
                    : 'bg-muted border border-border text-muted-foreground'
                }`}>
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className="space-y-1">
                  <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[280px] sm:max-w-md md:max-w-lg lg:max-w-xl whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-tr-none' 
                      : 'bg-muted/80 border border-border text-[var(--foreground)] rounded-tl-none font-medium'
                  }`}>
                    {m.content}
                  </div>
                  <p className={`text-[9px] text-muted-foreground/60 font-semibold ${isUser ? 'text-right' : 'text-left'}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 items-start animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-muted border border-border text-muted-foreground flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3.5 bg-muted/80 border border-border rounded-2xl rounded-tl-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Form Footer */}
      <footer className="px-6 py-4 bg-muted/20 border-t border-border shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="flex gap-2 max-w-3xl mx-auto relative"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 pl-4 pr-12 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-[var(--primary)] outline-none text-xs transition-all disabled:opacity-50"
            placeholder={language === 'es' ? 'Pregúntame algo sobre tus finanzas...' : 'Ask me anything about your finances...'}
            type="text"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer active:scale-90 flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </footer>

    </div>
  );
}
