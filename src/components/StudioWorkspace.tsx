import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Film, Scissors, Sliders, Layers, Sparkles, Clock, Check } from 'lucide-react';

export const StudioWorkspace: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'v1' | 'v2' | 'a1'>('v1');
  const [showColorGraded, setShowColorGraded] = useState(true);
  const [playheadPos, setPlayheadPos] = useState(38); // percentage

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPos((prev) => (prev >= 95 ? 5 : prev + 0.5));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full bg-[#0a0c12] border border-[#1a1d28] rounded-2xl overflow-hidden shadow-2xl font-mono text-xs select-none">
      {/* Editor Top Bar */}
      <div className="bg-[#0e1017] border-b border-[#181b26] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase ml-2 border-l border-[#222736] pl-3">
            VISION_FOLD_TIMELINE.prproj
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
            4K RAW &bull; 23.976 fps
          </span>
          <span className="text-slate-400 font-mono hidden sm:inline">TIMECODE: 00:02:14:08</span>
        </div>
      </div>

      {/* Main Studio Viewport Grid */}
      <div className="grid lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#181b26] bg-[#07080c]">
        {/* Left Video Monitor / Preview Canvas */}
        <div className="lg:col-span-8 p-4 bg-black/60 flex flex-col justify-between min-h-[260px] sm:min-h-[320px] relative">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#1e2333] group">
            {/* Video Image Preview */}
            <img
              src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80"
              alt="Editor Monitor Preview"
              className={`w-full h-full object-cover transition-all duration-500 ${
                showColorGraded ? 'contrast-110 saturate-120 brightness-105' : 'grayscale opacity-75 contrast-80'
              }`}
            />

            {/* Overlaid Captions / Motion Graphics */}
            {showColorGraded && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/90 text-amber-400 font-black px-4 py-1.5 rounded-lg text-sm tracking-wider uppercase border border-amber-400/40 shadow-xl">
                RETENTION HOOK &bull; 00:02
              </div>
            )}

            {/* Live Play Status Overlay */}
            <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-md text-[10px] text-slate-300 font-mono flex items-center gap-1.5 border border-[#222736]">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
              <span>{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
            </div>

            {/* Before / After Toggle Pill */}
            <button
              onClick={() => setShowColorGraded(!showColorGraded)}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-amber-400 px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase border border-amber-400/30 transition-all flex items-center gap-1.5"
            >
              <Sliders className="w-3 h-3" />
              <span>{showColorGraded ? 'GRADE: ON' : 'RAW LOG'}</span>
            </button>
          </div>

          {/* Transport Controls Bar */}
          <div className="flex items-center justify-between pt-3 px-1 text-slate-400 text-[11px]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-300 transition-colors shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>
              <span className="text-slate-200 font-bold">00:02:14:08 / 00:05:00:00</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-[#141722] text-amber-400 font-bold">LUT: Rec.709 Film</span>
              <span className="px-2 py-0.5 rounded bg-[#141722] text-slate-300">SFX: Stereo Master</span>
            </div>
          </div>
        </div>

        {/* Right Editing Parameters & Audio Meters */}
        <div className="lg:col-span-4 p-4 bg-[#0a0c12] flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>EDITING PROCESS CONTROL</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div
                onClick={() => setActiveTrack('v1')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeTrack === 'v1'
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-400 font-bold'
                    : 'bg-[#10131d] border-[#181b26] text-slate-300 hover:bg-[#141722]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pacing & Retention Cuts</span>
                </div>
                <Check className="w-3.5 h-3.5 opacity-80" />
              </div>

              <div
                onClick={() => setActiveTrack('v2')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeTrack === 'v2'
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-400 font-bold'
                    : 'bg-[#10131d] border-[#181b26] text-slate-300 hover:bg-[#141722]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Motion Graphics & Captions</span>
                </div>
                <Check className="w-3.5 h-3.5 opacity-80" />
              </div>

              <div
                onClick={() => setActiveTrack('a1')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeTrack === 'a1'
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-400 font-bold'
                    : 'bg-[#10131d] border-[#181b26] text-slate-300 hover:bg-[#141722]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sound Design & Audio Mix</span>
                </div>
                <Check className="w-3.5 h-3.5 opacity-80" />
              </div>
            </div>
          </div>

          {/* Audio Peaks Visualizer */}
          <div className="p-3 bg-[#0e1017] rounded-xl border border-[#181b26] space-y-1.5">
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>AUDIO MASTER (L/R)</span>
              <span className="text-emerald-400 font-bold">-0.2 dB</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-2 bg-[#181b26] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 w-[82%]" />
              </div>
              <div className="h-2 bg-[#181b26] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 w-[78%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Section */}
      <div className="bg-[#0c0e15] border-t border-[#181b26] p-4 space-y-2 relative">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span className="font-bold text-slate-300">MULTI-TRACK TIMELINE</span>
          <span>SCALE: 1 SECOND</span>
        </div>

        {/* Playhead Scrubber Line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 transition-all duration-75 pointer-events-none"
          style={{ left: `${playheadPos}%` }}
        >
          <div className="w-3 h-3 -ml-[5px] bg-red-500 rotate-45 transform" />
        </div>

        {/* Track V2 - B-Roll & Subtitles */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-amber-400 w-6">V2</span>
          <div className="flex-1 h-6 bg-[#121522] rounded-md border border-[#1e2333] relative overflow-hidden flex items-center px-2">
            <div className="absolute left-[10%] w-[25%] h-4 bg-amber-400/30 border border-amber-400/60 rounded text-[9px] text-amber-300 flex items-center px-1 font-bold truncate">
              [Hook Graphic]
            </div>
            <div className="absolute left-[40%] w-[35%] h-4 bg-amber-400/30 border border-amber-400/60 rounded text-[9px] text-amber-300 flex items-center px-1 font-bold truncate">
              [Dynamic Subtitles]
            </div>
          </div>
        </div>

        {/* Track V1 - Main Video A-Roll */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-sky-400 w-6">V1</span>
          <div className="flex-1 h-6 bg-[#121522] rounded-md border border-[#1e2333] relative overflow-hidden flex items-center px-2">
            <div className="absolute left-[0%] w-[90%] h-4 bg-sky-500/20 border border-sky-400/50 rounded text-[9px] text-sky-300 flex items-center px-1 font-bold truncate">
              Talking_Head_Cam01_Edited_Master.mov
            </div>
          </div>
        </div>

        {/* Track A1 - Audio Dialogue & SFX */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-emerald-400 w-6">A1</span>
          <div className="flex-1 h-6 bg-[#121522] rounded-md border border-[#1e2333] relative overflow-hidden flex items-center px-2">
            <div className="absolute left-[0%] w-[95%] h-4 bg-emerald-500/20 border border-emerald-400/50 rounded text-[9px] text-emerald-300 flex items-center px-1 font-bold truncate">
              Voiceover_NoiseReduced_MasterSFX.wav
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
