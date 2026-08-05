import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, X, Loader2, Bot, User,
  Sparkles, ChevronDown, ChevronUp, HelpCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button, Input } from '../../../lib/ui';

// Quick action suggestions
const SUGGESTIONS = [
  { label: 'How do I add a portfolio item?', action: 'How do I add a new portfolio item to showcase my work?' },
  { label: 'Create a pricing update', action: 'Help me update the pricing for my video production services' },
  { label: 'Write a client email', action: 'Write a professional follow-up email for a new client inquiry' },
  { label: 'SEO tips', action: 'Give me tips to improve SEO for my video production website' },
];

// Chat message type
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// AI Chat API call
async function sendChatMessage(
  messages: { role: string; content: string }[],
  context?: string
): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Chat failed');
  }

  const data = await response.json();
  return data.text;
}

// Main AI Chat Assistant Component
export const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context about the admin panel
  const adminContext = `
    You are an AI assistant for the VisionFold Creative admin panel.
    The admin panel allows managing:
    - Portfolio items (videos, case studies)
    - Client leads and messages
    - Projects and invoices
    - Team members
    - Site settings (appearance, integrations, social links)
    - Pricing configuration
    - AI content generation tools

    Be helpful, concise, and practical in your responses.
  `;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(
        [...chatHistory, { role: 'user', content }],
        adminContext
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (action: string) => {
    sendMessage(action);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'flex items-center gap-2 px-4 py-3 rounded-full',
          'bg-[#D4AF37] text-[#0A0A0B] font-semibold',
          'shadow-lg shadow-[#D4AF37]/20',
          'hover:bg-[#E5C349] transition-colors'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm">AI Assistant</span>
        {isOpen ? <X className="w-4 h-4 ml-1" /> : null}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[500px] flex flex-col"
          >
            <div className="bg-[#121215] rounded-xl border border-[#222226] shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
              {/* Header */}
              <div className="p-4 border-b border-[#222226] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#EDEDED]">VisionFold Assistant</h3>
                    <p className="text-xs text-[#EDEDED]/50">AI-powered help</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 rounded-lg text-[#EDEDED]/50 hover:text-[#EDEDED] hover:bg-white/5 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-[#EDEDED]/50 hover:text-[#EDEDED] hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <HelpCircle className="w-10 h-10 text-[#EDEDED]/20 mx-auto mb-4" />
                    <p className="text-sm text-[#EDEDED]/50 mb-6">
                      Hi! I'm your VisionFold assistant. How can I help you today?
                    </p>
                    
                    {/* Suggestions */}
                    <div className="space-y-2">
                      <p className="text-xs text-[#EDEDED]/40 uppercase tracking-wider mb-3">Quick actions</p>
                      {SUGGESTIONS.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion.action)}
                          className="w-full p-3 rounded-lg bg-[#1E1E23] text-left text-sm text-[#EDEDED]/80 hover:text-[#EDEDED] hover:bg-[#2A2A30] transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          {suggestion.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' && 'flex-row-reverse'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
                      message.role === 'user' ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/20'
                    )}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-[#0A0A0B]" />
                      ) : (
                        <Bot className="w-4 h-4 text-[#D4AF37]" />
                      )}
                    </div>
                    <div className={cn(
                      'flex-1 p-3 rounded-lg',
                      message.role === 'user' 
                        ? 'bg-[#D4AF37]/10 text-[#EDEDED]' 
                        : 'bg-[#1E1E23] text-[#EDEDED]/90'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-[#1E1E23]">
                      <div className="flex items-center gap-2 text-[#EDEDED]/50">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#222226]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    isLoading={isLoading}
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;
