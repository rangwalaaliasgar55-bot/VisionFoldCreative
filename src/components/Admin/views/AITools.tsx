import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Wand2, FileText, Image, Mail, Hash,
  Loader2, Copy, Check, RefreshCw,
  PenTool, TrendingUp, MessageSquare, Lightbulb,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button, Input, Textarea } from '../../../lib/ui';
import { Card } from '../ui';

type AITool = 'blog' | 'seo' | 'social' | 'email' | 'alttext' | 'summarize' | 'improve' | 'expand';

const TOOLS = [
  { id: 'blog' as const, label: 'Blog Ideas', icon: FileText, description: 'Generate blog post topics and outlines' },
  { id: 'seo' as const, label: 'SEO Meta', icon: TrendingUp, description: 'Write SEO-friendly meta descriptions' },
  { id: 'social' as const, label: 'Social Captions', icon: Hash, description: 'Create engaging social media captions' },
  { id: 'email' as const, label: 'Email Draft', icon: Mail, description: 'Write professional email templates' },
  { id: 'alttext' as const, label: 'Image Alt Text', icon: Image, description: 'Generate descriptive alt text for images' },
  { id: 'summarize' as const, label: 'Summarize', icon: FileText, description: 'Condense long content into key points' },
  { id: 'improve' as const, label: 'Improve Writing', icon: PenTool, description: 'Enhance clarity and impact of text' },
  { id: 'expand' as const, label: 'Expand Content', icon: Lightbulb, description: 'Add depth and detail to brief content' },
];

const SYSTEM_PROMPTS: Record<AITool, string> = {
  blog: 'You are a content strategist for a premium video production studio. Generate creative blog post ideas.',
  seo: 'You are an SEO expert. Write concise meta descriptions (150-160 characters).',
  social: 'You are a social media expert. Create catchy captions.',
  email: 'You are a professional business writer. Draft clear emails.',
  alttext: 'You are an accessibility expert. Write descriptive alt text.',
  summarize: 'Extract key points while maintaining meaning.',
  improve: 'Enhance text for clarity and professionalism.',
  expand: 'Add meaningful depth to brief content.',
};

const TOOL_CONFIG: Record<AITool, { inputPlaceholder: string; inputLabel: string; hasContext?: boolean }> = {
  blog: { inputPlaceholder: 'E.g., video production trends', inputLabel: 'Topic or Keywords' },
  seo: { inputPlaceholder: 'E.g., premium video production studio', inputLabel: 'Topic or Keywords' },
  social: { inputPlaceholder: 'E.g., brand campaign launch', inputLabel: 'Content Topic', hasContext: true },
  email: { inputPlaceholder: 'E.g., Follow up after consultation', inputLabel: 'Email Purpose' },
  alttext: { inputPlaceholder: 'Describe the image', inputLabel: 'Image Description' },
  summarize: { inputPlaceholder: 'Paste content…', inputLabel: 'Content to Summarize' },
  improve: { inputPlaceholder: 'Enter text to improve…', inputLabel: 'Text to Improve' },
  expand: { inputPlaceholder: 'Enter brief content…', inputLabel: 'Brief Content' },
};

async function generateAIResponse(prompt: string, context?: string): Promise<string> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      prompt: context ? `${prompt}\n\nContext: ${context}` : prompt,
      systemPrompt: 'You are a helpful assistant for a premium video production studio.',
      temperature: 0.7,
      maxTokens: 500,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'AI generation failed');
  }
  return data.text;
}

export const AITools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<AITool>('blog');
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentTool = TOOLS.find((t) => t.id === activeTool)!;
  const toolConfig = TOOL_CONFIG[activeTool];

  const generateContent = useCallback(async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setError(null);
    setOutput('');
    try {
      const fullPrompt = `${SYSTEM_PROMPTS[activeTool]}\n\n${input}`;
      const result = await generateAIResponse(fullPrompt, toolConfig.hasContext ? context : undefined);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  }, [activeTool, input, context, toolConfig.hasContext]);

  const copyToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput('');
    setContext('');
    setOutput('');
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-[#EDEDED]">
          <Sparkles className="h-6 w-6 text-[#D4AF37]" />
          AI Content Tools
        </h1>
        <p className="mt-1 text-sm text-[#EDEDED]/60">
          Requires Gemini after Phase D. OpenRouter was removed in Phase A.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              'rounded-xl border p-4 text-left transition-all',
              activeTool === tool.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#EDEDED]'
                : 'border-[#222226] bg-[#121215] text-[#EDEDED]/70 hover:border-[#D4AF37]/30'
            )}
          >
            <tool.icon className="mb-2 h-5 w-5 text-[#D4AF37]" />
            <div className="text-sm font-medium">{tool.label}</div>
            <div className="mt-1 hidden text-xs text-[#EDEDED]/50 md:block">{tool.description}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <currentTool.icon className="h-5 w-5 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-[#EDEDED]">{currentTool.label}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={clearAll} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>
          <div className="space-y-4">
            <Input
              label={toolConfig.inputLabel}
              placeholder={toolConfig.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {toolConfig.hasContext ? (
              <Textarea
                label="Additional Context (optional)"
                placeholder="Tone, constraints…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            ) : null}
            <Button
              onClick={() => void generateContent()}
              disabled={!input.trim() || isGenerating}
              isLoading={isGenerating}
              fullWidth
              leftIcon={!isGenerating ? <Wand2 className="h-4 w-4" /> : undefined}
            >
              {isGenerating ? 'Generating…' : `Generate ${currentTool.label}`}
            </Button>
            {error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
            ) : null}
          </div>
        </Card>

        <Card padding="lg" className="h-full">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#EDEDED]">Generated Content</h3>
            {output ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            ) : null}
          </div>
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div key="loading" className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#D4AF37]" />
                <p className="text-sm text-[#EDEDED]/60">Generating…</p>
              </motion.div>
            ) : output ? (
              <motion.div key="output" className="whitespace-pre-wrap text-sm leading-relaxed text-[#EDEDED]/90">
                {output}
              </motion.div>
            ) : (
              <motion.div key="empty" className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="mb-4 h-12 w-12 text-[#EDEDED]/20" />
                <p className="text-sm text-[#EDEDED]/50">Enter content and generate — or wait for Phase D Gemini</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <div className="rounded-lg border border-[#222226] bg-[#121215] p-4">
        <div className="flex items-center gap-2 text-xs text-[#EDEDED]/50">
          <MessageSquare className="h-4 w-4" />
          <span>Provider: none until GEMINI_API_KEY (Phase D)</span>
          <span className="mx-2">•</span>
          <span>Rate limited · OpenRouter removed</span>
        </div>
      </div>
    </div>
  );
};

export default AITools;
