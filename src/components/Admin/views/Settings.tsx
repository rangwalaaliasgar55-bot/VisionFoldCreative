import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, Download, Upload, Undo, Redo, 
  Globe, Palette, Key, Code, Database,
  Share2, Image, Eye,
  Check, AlertCircle, Info
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn, formatRelativeTime } from '../../../lib/utils';
import { Button, Input, Textarea, Switch } from '../../../lib/ui';
import { Card } from '../ui';

// Tab configuration
const TABS = [
  { id: 'identity', label: 'Site Identity', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'social', label: 'Social Links', icon: Share2 },
  { id: 'integrations', label: 'Integrations', icon: Key },
  { id: 'advanced', label: 'Advanced', icon: Code },
  { id: 'system', label: 'System', icon: Database },
] as const;

type TabId = typeof TABS[number]['id'];

// Settings section wrapper
function SettingsSection({ 
  title, 
  description, 
  children, 
  className 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-6', className)}
    >
      <div>
        <h3 className="text-lg font-semibold text-[#EDEDED]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-[#EDEDED]/60">{description}</p>
        )}
      </div>
      <Card padding="lg">
        {children}
      </Card>
    </motion.div>
  );
}

// Field row wrapper
function FieldRow({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-[#EDEDED]">{label}</label>
        {description && (
          <p className="mt-1 text-xs text-[#EDEDED]/50">{description}</p>
        )}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

// Site Identity Tab
function IdentityTab() {
  const { settings, updateSettings } = useAdmin();
  const { siteIdentity } = settings;

  return (
    <SettingsSection
      title="Site Identity"
      description="Basic information about your website"
    >
      <div className="space-y-6">
        <FieldRow label="Site Title" description="The name of your website">
          <Input
            value={siteIdentity.siteTitle}
            onChange={(e) => updateSettings('siteIdentity', { siteTitle: e.target.value })}
            placeholder="My Awesome Site"
          />
        </FieldRow>

        <FieldRow label="Tagline" description="A short description of your site">
          <Input
            value={siteIdentity.tagline}
            onChange={(e) => updateSettings('siteIdentity', { tagline: e.target.value })}
            placeholder="The best site on the web"
          />
        </FieldRow>

        <FieldRow label="Logo URL" description="URL to your logo image">
          <Input
            value={siteIdentity.logoUrl}
            onChange={(e) => updateSettings('siteIdentity', { logoUrl: e.target.value })}
            placeholder="/logo.svg"
            leftIcon={<Image className="w-4 h-4" />}
          />
        </FieldRow>

        <FieldRow label="Favicon URL" description="URL to your favicon image">
          <Input
            value={siteIdentity.faviconUrl}
            onChange={(e) => updateSettings('siteIdentity', { faviconUrl: e.target.value })}
            placeholder="/favicon.ico"
            leftIcon={<Image className="w-4 h-4" />}
          />
        </FieldRow>
      </div>
    </SettingsSection>
  );
}

// Appearance Tab
function AppearanceTab() {
  const { settings, updateSettings } = useAdmin();
  const { appearance } = settings;

  const colorPresets = [
    { name: 'Gold Premium', primary: '#D4AF37', secondary: '#0A0A0B' },
    { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#0F172A' },
    { name: 'Emerald', primary: '#10B981', secondary: '#064E3B' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#1E1B4B' },
    { name: 'Rose', primary: '#F43F5E', secondary: '#4C0519' },
    { name: 'Orange', primary: '#F97316', secondary: '#431407' },
  ];

  return (
    <SettingsSection
      title="Appearance"
      description="Customize the look and feel of your site"
    >
      <div className="space-y-6">
        {/* Color Presets */}
        <FieldRow label="Color Presets" description="Quick color theme presets">
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => updateSettings('appearance', { 
                  primaryColor: preset.primary, 
                  secondaryColor: preset.secondary 
                })}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                  appearance.primaryColor === preset.primary
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-[#D4AF37]/20 hover:border-[#D4AF37]/40'
                )}
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: preset.primary }}
                />
                <span className="text-xs text-[#EDEDED]">{preset.name}</span>
                {appearance.primaryColor === preset.primary && (
                  <Check className="w-3 h-3 text-[#D4AF37]" />
                )}
              </button>
            ))}
          </div>
        </FieldRow>

        {/* Primary Color */}
        <FieldRow label="Primary Color" description="Main accent color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={appearance.primaryColor}
              onChange={(e) => updateSettings('appearance', { primaryColor: e.target.value })}
              className="w-12 h-12 rounded-lg border border-[#D4AF37]/20 cursor-pointer"
            />
            <Input
              value={appearance.primaryColor}
              onChange={(e) => updateSettings('appearance', { primaryColor: e.target.value })}
              className="w-32"
            />
          </div>
        </FieldRow>

        {/* Secondary Color */}
        <FieldRow label="Secondary Color" description="Background and dark tones">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={appearance.secondaryColor}
              onChange={(e) => updateSettings('appearance', { secondaryColor: e.target.value })}
              className="w-12 h-12 rounded-lg border border-[#D4AF37]/20 cursor-pointer"
            />
            <Input
              value={appearance.secondaryColor}
              onChange={(e) => updateSettings('appearance', { secondaryColor: e.target.value })}
              className="w-32"
            />
          </div>
        </FieldRow>

        {/* Layout Style */}
        <FieldRow label="Layout Style" description="Overall spacing and density">
          <div className="flex gap-2">
            {(['spacious', 'compact', 'balanced'] as const).map((style) => (
              <button
                key={style}
                onClick={() => updateSettings('appearance', { layoutStyle: style })}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                  appearance.layoutStyle === style
                    ? 'bg-[#D4AF37] text-[#0A0A0B]'
                    : 'bg-[#1E1E23] text-[#EDEDED]/80 hover:bg-[#2A2A30]'
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </FieldRow>

        {/* Dark Mode */}
        <FieldRow label="Dark Mode" description="Enable dark theme by default">
          <Switch
            checked={appearance.darkMode}
            onCheckedChange={(checked) => updateSettings('appearance', { darkMode: checked })}
          />
        </FieldRow>
      </div>
    </SettingsSection>
  );
}

// Social Links Tab
function SocialTab() {
  const { settings, updateSettings } = useAdmin();
  const { socialLinks } = settings;

  const socialFields = [
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/name' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  ] as const;

  return (
    <SettingsSection
      title="Social Links"
      description="Connect your social media profiles"
    >
      <div className="space-y-6">
        {socialFields.map((field) => (
          <FieldRow key={field.key} label={field.label} description={field.placeholder}>
            <Input
              value={socialLinks[field.key as keyof typeof socialLinks]}
              onChange={(e) => updateSettings('socialLinks', { [field.key]: e.target.value })}
              placeholder={field.placeholder}
              leftIcon={<Share2 className="w-4 h-4" />}
            />
          </FieldRow>
        ))}
      </div>
    </SettingsSection>
  );
}

// Integrations Tab
function IntegrationsTab() {
  const { settings, updateSettings } = useAdmin();
  const { apiKeys } = settings;
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  return (
    <SettingsSection
      title="API Integrations"
      description="Configure external services and API keys"
    >
      <div className="space-y-6">
        <FieldRow label="OpenRouter API Key" description="For AI-powered features">
          <div className="relative">
            <Input
              type={showKeys.openRouterKey ? 'text' : 'password'}
              value={apiKeys.openRouterKey}
              onChange={(e) => updateSettings('apiKeys', { openRouterKey: e.target.value })}
              placeholder="sk-or-..."
              leftIcon={<Key className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowKeys((p) => ({ ...p, openRouterKey: !p.openRouterKey }))}
                  className="text-[#EDEDED]/50 hover:text-[#EDEDED]"
                >
                  {showKeys.openRouterKey ? 'Hide' : 'Show'}
                </button>
              }
            />
          </div>
        </FieldRow>

        <FieldRow label="Supabase URL" description="Your Supabase project URL">
          <Input
            value={apiKeys.supabaseUrl}
            onChange={(e) => updateSettings('apiKeys', { supabaseUrl: e.target.value })}
            placeholder="https://xxx.supabase.co"
            leftIcon={<Database className="w-4 h-4" />}
          />
        </FieldRow>

        <FieldRow label="Supabase Key" description="Your Supabase anon/public key">
          <div className="relative">
            <Input
              type={showKeys.supabaseKey ? 'text' : 'password'}
              value={apiKeys.supabaseKey}
              onChange={(e) => updateSettings('apiKeys', { supabaseKey: e.target.value })}
              placeholder="eyJ..."
              leftIcon={<Key className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowKeys((p) => ({ ...p, supabaseKey: !p.supabaseKey }))}
                  className="text-[#EDEDED]/50 hover:text-[#EDEDED]"
                >
                  {showKeys.supabaseKey ? 'Hide' : 'Show'}
                </button>
              }
            />
          </div>
        </FieldRow>

        <FieldRow label="Resend API Key" description="For email notifications">
          <div className="relative">
            <Input
              type={showKeys.resendKey ? 'text' : 'password'}
              value={apiKeys.resendKey}
              onChange={(e) => updateSettings('apiKeys', { resendKey: e.target.value })}
              placeholder="re_..."
              leftIcon={<Key className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowKeys((p) => ({ ...p, resendKey: !p.resendKey }))}
                  className="text-[#EDEDED]/50 hover:text-[#EDEDED]"
                >
                  {showKeys.resendKey ? 'Hide' : 'Show'}
                </button>
              }
            />
          </div>
        </FieldRow>

        <FieldRow label="Notification Email" description="Where to send admin notifications">
          <Input
            value={apiKeys.notificationEmail}
            onChange={(e) => updateSettings('apiKeys', { notificationEmail: e.target.value })}
            placeholder="admin@example.com"
            type="email"
            leftIcon={<Globe className="w-4 h-4" />}
          />
        </FieldRow>
      </div>
    </SettingsSection>
  );
}

// Advanced Tab
function AdvancedTab() {
  const { settings, updateSettings } = useAdmin();
  const { advanced } = settings;

  return (
    <SettingsSection
      title="Advanced Settings"
      description="Custom code and SEO configuration"
    >
      <div className="space-y-6">
        <FieldRow label="Meta Description" description="SEO description for search engines">
          <Textarea
            value={advanced.metaDescription}
            onChange={(e) => updateSettings('advanced', { metaDescription: e.target.value })}
            placeholder="A brief description of your site for search engines..."
            maxLength={160}
            showCharCount
          />
        </FieldRow>

        <FieldRow label="Google Analytics ID" description="Track visitors with GA4">
          <Input
            value={advanced.googleAnalyticsId}
            onChange={(e) => updateSettings('advanced', { googleAnalyticsId: e.target.value })}
            placeholder="G-XXXXXXXXXX"
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.23 6.23l-7.27-7.27A1 1 0 0013.86 0H1v22h14.86a1 1 0 00.94-.73l7.52-12.13a1 1 0 00-.09-1.1 1 1 0 00-1.1-.09l-4.73 1.86.04-.17zM14.86 20H3V2h9.86v6.55l-4 4.04 4 4.04V20zM7.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              </svg>
            }
          />
        </FieldRow>

        <FieldRow label="Custom CSS" description="Add custom styles (will be injected in <style> tag)">
          <Textarea
            value={advanced.customCSS}
            onChange={(e) => updateSettings('advanced', { customCSS: e.target.value })}
            placeholder=".my-class { color: red; }"
            className="font-mono text-sm"
            style={{ minHeight: '150px' }}
          />
        </FieldRow>

        <FieldRow label="Custom JavaScript" description="Add custom scripts (will be injected in <script> tag)">
          <Textarea
            value={advanced.customJS}
            onChange={(e) => updateSettings('advanced', { customJS: e.target.value })}
            placeholder="console.log('Hello!');"
            className="font-mono text-sm"
            style={{ minHeight: '150px' }}
          />
        </FieldRow>

        <FieldRow label="Maintenance Mode" description="Show a maintenance page to visitors">
          <div className="flex items-center gap-3">
            <Switch
              checked={advanced.enableMaintenanceMode}
              onCheckedChange={(checked) => updateSettings('advanced', { enableMaintenanceMode: checked })}
            />
            {advanced.enableMaintenanceMode && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Site is currently showing maintenance page
              </span>
            )}
          </div>
        </FieldRow>
      </div>
    </SettingsSection>
  );
}

// System Tab
function SystemTab() {
  const { 
    settings, 
    resetSettings, 
    importSettings, 
    exportSettings,
    revisionHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    lastSaved,
    hasUnsavedChanges
  } = useAdmin();
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionfold-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSettings]);

  const handleImport = useCallback(() => {
    if (importSettings(importJson)) {
      setImportModalOpen(false);
      setImportJson('');
    }
  }, [importSettings, importJson]);

  return (
    <SettingsSection
      title="System Settings"
      description="Backup, restore, and system information"
    >
      <div className="space-y-6">
        {/* Save Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#1E1E23]">
          <div className="flex items-center gap-3">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-2 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Saved {formatRelativeTime(lastSaved)}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[#EDEDED]/60 text-sm">
                <Info className="w-4 h-4" />
                No changes yet
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              leftIcon={<Undo className="w-4 h-4" />}
            >
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              leftIcon={<Redo className="w-4 h-4" />}
            >
              Redo
            </Button>
          </div>
        </div>

        {/* Revision History */}
        <div>
          <h4 className="text-sm font-medium text-[#EDEDED] mb-3">Revision History</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {revisionHistory.length === 0 ? (
              <p className="text-sm text-[#EDEDED]/50 py-4 text-center">
                No revisions yet. Changes will appear here.
              </p>
            ) : (
              revisionHistory.slice(-10).reverse().map((rev) => (
                <div 
                  key={rev.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg text-sm',
                    'bg-[#1E1E23] hover:bg-[#2A2A30] transition-colors'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <div>
                      <span className="text-[#EDEDED] capitalize">{rev.section}</span>
                      <span className="text-[#EDEDED]/50 ml-2">
                        {formatRelativeTime(rev.timestamp)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#EDEDED]/50">
                    {Object.keys(rev.changes).length} change{Object.keys(rev.changes).length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Import/Export */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Settings
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => setImportModalOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import Settings
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const content = e.target?.result as string;
                  setImportJson(content);
                  setImportModalOpen(true);
                };
                reader.readAsText(file);
              }
            }}
          />
        </div>

        {/* Reset */}
        <div className="pt-4 border-t border-[#D4AF37]/10">
          <h4 className="text-sm font-medium text-red-400 mb-3">Reset to Defaults</h4>
          <p className="text-xs text-[#EDEDED]/50 mb-3">
            This will reset all settings to their default values. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to reset all settings to defaults?')) {
                resetSettings();
              }
            }}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset All Settings
          </Button>
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {importModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setImportModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121215] rounded-xl border border-[#D4AF37]/20 p-6 w-full max-w-lg m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[#EDEDED] mb-4">Import Settings</h3>
              <p className="text-sm text-[#EDEDED]/60 mb-4">
                Paste your settings JSON below or upload a file. This will replace all current settings.
              </p>
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{"siteIdentity": {...}, "appearance": {...}}'
                className="font-mono text-sm"
                style={{ minHeight: '200px' }}
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setImportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                >
                  Import
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsSection>
  );
}

// Live Preview Panel
function LivePreview({ title, tagline }: { title: string; tagline: string }) {
  return (
    <div className="hidden xl:block fixed right-0 top-0 w-80 h-screen p-4 bg-[#0A0A0B]/95 backdrop-blur-sm border-l border-[#D4AF37]/10 overflow-auto">
      <div className="sticky top-0 bg-[#0A0A0B]/95 pb-4 mb-4 border-b border-[#D4AF37]/10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Live Preview
        </h3>
      </div>
      
      <div className="space-y-6">
        {/* Mini site preview */}
        <div className="rounded-lg border border-[#D4AF37]/20 overflow-hidden">
          {/* Preview header */}
          <div className="h-20 bg-[#121215] flex items-center justify-center border-b border-[#D4AF37]/10">
            <div className="text-center">
              <div className="text-lg font-bold text-[#EDEDED]">{title || 'Site Title'}</div>
              <div className="text-xs text-[#EDEDED]/60">{tagline || 'Tagline'}</div>
            </div>
          </div>
          
          {/* Preview content */}
          <div className="p-4 space-y-3">
            <div className="h-24 rounded bg-[#1E1E23]" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded bg-[#1E1E23]" />
              <div className="h-16 rounded bg-[#1E1E23]" />
            </div>
            <div className="h-20 rounded bg-[#1E1E23]" />
          </div>
        </div>
        
        {/* Color preview */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-[#EDEDED]/60 mb-2">
            Colors
          </h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="h-8 rounded bg-[#D4AF37]" />
              <div className="text-[8px] text-center mt-1 text-[#EDEDED]/50">Primary</div>
            </div>
            <div className="flex-1">
              <div className="h-8 rounded bg-[#0A0A0B] border border-[#EDEDED]/20" />
              <div className="text-[8px] text-center mt-1 text-[#EDEDED]/50">Secondary</div>
            </div>
            <div className="flex-1">
              <div className="h-8 rounded bg-[#EDEDED]" />
              <div className="text-[8px] text-center mt-1 text-[#EDEDED]/50">Accent</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Settings Component
export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const { settings } = useAdmin();

  const tabContent: Record<TabId, React.ReactNode> = {
    identity: <IdentityTab />,
    appearance: <AppearanceTab />,
    social: <SocialTab />,
    integrations: <IntegrationsTab />,
    advanced: <AdvancedTab />,
    system: <SystemTab />,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <div className="max-w-5xl mx-auto p-6 pb-32">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-[#EDEDED]"
          >
            Settings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-sm text-[#EDEDED]/60"
          >
            Customize every aspect of your VisionFold Creative site
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-[#0A0A0B]'
                    : 'text-[#EDEDED]/60 hover:text-[#EDEDED] hover:bg-white/5'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Live Preview */}
      <LivePreview
        title={settings.siteIdentity.siteTitle}
        tagline={settings.siteIdentity.tagline}
      />
    </div>
  );
};

export default Settings;
