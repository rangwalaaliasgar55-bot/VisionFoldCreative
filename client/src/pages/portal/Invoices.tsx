import { useEffect, useState } from "react";
import api from "../../hooks/useApi";

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    api.get("/invoices").then((res) => setInvoices(res.data)).catch(() => {});
  }, []);
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-6">Invoices</h1>
      {invoices.length === 0 ? <div className="glass rounded-2xl p-12 text-center text-white/40">No invoices yet.</div> :
       <div className="space-y-3">{invoices.map((inv: any) => (
         <div key={inv.id} className="glass rounded-2xl p-5 border border-white/5 flex justify-between">
           <div>
             <h3 className="font-semibold">Invoice #{inv.id?.slice(0, 8)}</h3>
             <p className="text-sm text-white/40">${(inv.amount || 0).toLocaleString()} • {inv.status}</p>
           </div>
         </div>
       ))}</div>}
    </div>
  );
}
