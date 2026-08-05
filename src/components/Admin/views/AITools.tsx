import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Wand2, FileText, Image, Mail, Hash, 
  ChevronRight, Loader2, Copy, Check, RefreshCw,
  PenTool, TrendingUp, MessageSquare, Lightbulb
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../lib/utils';
import { Button, Input, Textarea } from '../../../lib/ui';
import { Card } from '../ui';

// AI Tool types
type AITool = 'blog' | 'seo' | 'social' | 'email' | 'alttext' | 'summarize' | 'improve' | 'expand';

// Tool configuration
const TOOLS = [
  { id: 'blog', label: 'Blog Ideas', icon: FileText, description: 'Generate blog post topics and outlines' },
  { id: 'seo', label: 'SEO Meta', icon: TrendingUp, description: 'Write SEO-friendly meta descriptions' },
  { id: 'social', label: 'Social Captions', icon: Hash, description: 'Create engaging social media captions' },
  { id: 'email', label: 'Email Draft', icon: Mail, description: 'Write professional email templates' },
  { id: 'alttext', label: 'Image Alt Text', icon: Image, description: 'Generate descriptive alt text for images' },
  { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Condense long content into key points' },
  { id: 'improve', label: 'Improve Writing', icon: PenTool, description: 'Enhance clarity and impact of text' },
  { id: 'expand', label: 'Expand Content', icon: Lightbulb, description: 'Add depth and detail to brief content' },
] as const;

// Prompts for each tool
const SYSTEM_PROMPTS: Record<AITool, string> = {
  blog: 'You are a content strategist for a premium video production studio. Generate creative, engaging blog post ideas that showcase expertise in video production, brand storytelling, and creative direction.',
  seo: 'You are an SEO expert for a creative agency. Write concise, keyword-rich meta descriptions (150-160 characters) that improve search visibility while being compelling.',
  social: 'You are a social media expert for a creative studio. Create catchy, engaging captions that drive interaction and reflect the brand voice.',
  email: 'You are a professional business writer. Draft clear, concise emails that are professional yet personable.',
  alttext: 'You are an accessibility expert. Write descriptive alt text that conveys the essence, context, and key elements of an image for visually impaired users.',
  summarize: 'You are a content summarizer. Extract key points and main ideas while maintaining the essential meaning.',
  improve: 'You are an expert editor. Enhance text for clarity, impact, and professionalism while preserving the original voice.',
  expand: 'You are a creative writer. Add meaningful depth, examples, and context to brief content while maintaining coherence.',
};

// Tool-specific input/output handling
const TOOL_CONFIG: Record<AITool, { inputPlaceholder: string; inputLabel: string; hasContext?: boolean }> = {
  blog: { inputPlaceholder: 'E.g., video production trends, brand storytelling techniques', inputLabel: 'Topic or Keywords' },
  seo: { inputPlaceholder: 'E.g., premium video production studio Mumbai', inputLabel: 'Topic or Keywords' },
  social: { inputPlaceholder: 'E.g., Just finished shooting a brand campaign for a tech startup', inputLabel: 'Content Topic', hasContext: true },
  email: { inputPlaceholder: 'E.g., Follow up with potential client after initial consultation', inputLabel: 'Email Purpose' },
  alttext: { inputPlaceholder: 'Describe what you see in the image or its context', inputLabel: 'Image Description' },
  summarize: { inputPlaceholder: 'Paste or summarize the content here...', inputLabel: 'Content to Summarize' },
  improve: { inputPlaceholder: 'Enter text to improve...', inputLabel: 'Text to Improve' },
  expand: { inputPlaceholder: 'Enter brief content to expand...', inputLabel: 'Brief Content' },
};

// AI API call
async function generateAIResponse(
  prompt: string,
  context?: string
): Promise<string> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: context ? `${prompt}\n\nContext: ${context}` : prompt,
      systemPrompt: 'You are a helpful AI assistant for a premium video production studio. Be concise, practical, and professional.',
      temperature: 0.7,
      maxTokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI generation failed');
  }

  const data = await response.json();
  return data.text;
}

// Main AI Tools Component
export const AITools: React.FC = () => {
  const { settings } = useAdmin();
  const [activeTool, setActiveTool] = useState<AITool>('blog');
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentTool = TOOLS.find((t) => t.id === activeTool);
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
    navigator.clipboard.writeText(output);
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[#EDEDED] flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          AI Content Tools
        </h1>
        <p className="mt-1 text-sm text-[#EDEDED]/60">
          AI-powered content generation for your video production studio
        </p>
      </motion.div>

      {/* Tool Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {TOOLS.map((tool) => (
          <motion.button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              'p-4 rounded-xl border text-left transition-all',
              activeTool === tool.id
                ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#EDEDED]'
                : 'bg-[#121215] border-[#222226] text-[#EDEDED]/70 hover:border-[#D4AF37]/30 hover:text-[#EDEDED]'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tool.icon className="w-5 h-5 mb-2 text-[#D4AF37]" />
            <div className="font-medium text-sm">{tool.label}</div>
            <div className="text-xs text-[#EDEDED]/50 mt-1 hidden md:block">{tool.description}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <motion.div
          key={`input-${activeTool}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <currentTool.icon className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-lg font-semibold text-[#EDEDED]">{currentTool.label}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
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

              {toolConfig.hasContext && (
                <Textarea
                  label="Additional Context (optional)"
                  placeholder="Add any specific details, tone preferences, or constraints..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  style={{ minHeight: '100px' }}
                />
              )}

              <Button
                onClick={generateContent}
                disabled={!input.trim() || isGenerating}
                isLoading={isGenerating}
                fullWidth
                leftIcon={!isGenerating && <Wand2 className="w-4 h-4" />}
              >
                {isGenerating ? 'Generating...' : `Generate ${currentTool.label}`}
              </Button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Output Panel */}
        <motion.div
          key={`output-${activeTool}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card padding="lg" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#EDEDED]">Generated Content</h3>
              {output && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-4" />
                  <p className="text-sm text-[#EDEDED]/60">Generating content...</p>
                </motion.div>
              ) : output ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="prose prose-invert prose-sm max-w-none"
                >
                  <div className="text-sm text-[#EDEDED]/90 whitespace-pre-wrap leading-relaxed">
                    {output}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <Sparkles className="w-12 h-12 text-[#EDEDED]/20 mb-4" />
                  <p className="text-sm text-[#EDEDED]/50">
                    Enter content and click generate to see results
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>

      {/* Usage Stats */}
      {settings.apiKeys.openRouterKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-[#121215] border border-[#222226]"
        >
          <div className="flex items-center gap-2 text-xs text-[#EDEDED]/50">
            <MessageSquare className="w-4 h-4" />
            <span>AI powered by OpenRouter</span>
            <span className="mx-2">•</span>
            <span>Rate limited to prevent abuse</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AITools;
