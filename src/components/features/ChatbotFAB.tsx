import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import type { ChatMessage } from '@/types';

export function ChatbotFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Hello! 🇬🇭 Welcome to GhanaTravel. How can I help you plan your trip?', timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    // Simulate bot response
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Thank you for your question! I\'d recommend checking out Cape Coast for historical sites or Volta Region for nature adventures. Would you like more specific recommendations?',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">GhanaTravel Assistant</p>
                <p className="text-xs opacity-80">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-primary-foreground/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-full bg-muted text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
