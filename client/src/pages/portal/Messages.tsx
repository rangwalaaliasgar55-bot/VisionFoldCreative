import { useEffect, useState } from "react";
import api from "../../hooks/useApi";

export default function PortalMessages() {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    api.get("/messages").then((res) => setMessages(res.data)).catch(() => {});
  }, []);
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-6">Messages</h1>
      {messages.length === 0 ? <div className="glass rounded-2xl p-12 text-center text-white/40">No messages yet.</div> :
       <div className="space-y-3">{messages.map((m: any) => (
         <div key={m.id} className="glass rounded-2xl p-5 border border-white/5">
           <div className="font-semibold text-sm">{m.senderName}</div>
           <p className="text-white/60 text-sm">{m.content}</p>
         </div>
       ))}</div>}
    </div>
  );
}
