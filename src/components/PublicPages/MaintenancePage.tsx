import React, { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';

type Maint = { enabled: boolean; until: string | null; message: string };

export function MaintenancePage({ data }: { data: Maint }) {
  const [left, setLeft] = useState('');

  useEffect(() => {
    if (!data.until) return;
    const tick = () => {
      const ms = new Date(data.until!).getTime() - Date.now();
      if (ms <= 0) {
        setLeft('Almost ready…');
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data.until]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050507] px-6 text-center text-[#EDEDED]">
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl" />
      <div
        className="relative rounded-3xl border border-white/10 bg-[#0C0C10]/90 p-10 shadow-2xl backdrop-blur-xl"
        style={{ transform: 'perspective(1000px) rotateX(4deg)' }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
          <Wrench className="h-6 w-6 text-[#D4AF37]" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">VisionFold Creative</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Studio under maintenance</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#B8B3AA]">{data.message}</p>
        {left ? (
          <p className="mt-6 font-mono text-2xl font-bold text-[#D4AF37]">{left}</p>
        ) : (
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#666]">We will be back shortly</p>
        )}
        <a href="/admin" className="mt-8 inline-block text-[10px] font-bold uppercase tracking-wider text-[#555] hover:text-[#D4AF37]">
          Admin access
        </a>
      </div>
    </div>
  );
}

export default MaintenancePage;
