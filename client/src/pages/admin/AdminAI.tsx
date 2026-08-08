import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import api from "../../hooks/useApi";

export default function AdminAI() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm VisionFold AI. I can help you analyze projects, generate insights, or answer questions about your studio.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { message: input });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl">AI Assistant</h1>
          <p className="text-sm text-white/40">Powered by Gemini</p>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl border border-white/5 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-accent/20" : "bg-emerald/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-accent" />
                  ) : (
                    <Bot className="w-4 h-4 text-emerald" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user" ? "bg-accent/20 text-white" : "bg-white/5 text-white/80"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce animation-delay-200" />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce animation-delay-400" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/5 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50"
            placeholder="Ask anything about your studio..."
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="p-2.5 bg-accent rounded-xl text-white hover:bg-accent/80 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
