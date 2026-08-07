import React, { useEffect, useMemo, useState } from 'react';
import { PencilLine, Loader2, Check } from 'lucide-react';
import { useContent } from '../context/ContentContext';

interface EditableTextProps {
  page: string;
  sectionKey: string;
  fallback: string;
  className?: string;
  tagName?: keyof React.JSX.IntrinsicElements;
  multiline?: boolean;
  placeholder?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  page,
  sectionKey,
  fallback,
  className = '',
  tagName = 'div',
  multiline = false,
  placeholder = 'Add copy',
}) => {
  const { editMode, isAdmin, getValue, saveValue } = useContent();
  const [draft, setDraft] = useState(fallback);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState('');

  const currentValue = useMemo(
    () => getValue(page, sectionKey, fallback),
    [fallback, getValue, page, sectionKey]
  );

  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  const handleBlur = async () => {
    if (!isAdmin || !editMode) {
      setIsEditing(false);
      return;
    }

    const trimmed = draft.trim();
    if (trimmed === currentValue) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await saveValue(page, sectionKey, trimmed || fallback);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed');
      setDraft(currentValue);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      setDraft(currentValue);
      setIsEditing(false);
      return;
    }

    if (event.key === 'Enter' && !multiline && !event.shiftKey) {
      event.preventDefault();
      await handleBlur();
    }
  };

  if (!isAdmin || !editMode || !isEditing) {
    const Tag = tagName;
    return (
      <Tag
        className={`${className} ${isAdmin && editMode ? 'cursor-text ring-1 ring-transparent hover:ring-[#D4AF37]/25 rounded-sm' : ''}`}
        onClick={() => isAdmin && editMode && setIsEditing(true)}
      >
        {currentValue || fallback}
        {isAdmin && editMode ? (
          <span className="ml-2 inline-flex items-center gap-1 align-middle text-[#D4AF37]">
            {saving ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : null}
            {savedFlash ? <Check className="inline h-3.5 w-3.5" /> : null}
            {!saving && !savedFlash ? <PencilLine className="inline h-4 w-4" /> : null}
          </span>
        ) : null}
        {saveError ? (
          <span className="ml-2 text-[10px] text-red-400">{saveError}</span>
        ) : null}
      </Tag>
    );
  }

  if (multiline) {
    return (
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void handleBlur()}
        onKeyDown={(event) => void handleKeyDown(event)}
        placeholder={placeholder}
        disabled={saving}
        className={`min-h-24 w-full bg-[#0A0A0B] border border-[#222226] px-4 py-3 text-sm text-[#EDEDED] shadow-inner outline-none ring-0 focus:border-[#D4AF37] ${className}`}
        autoFocus
      />
    );
  }

  return (
    <input
      type="text"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void handleBlur()}
      onKeyDown={(event) => void handleKeyDown(event)}
      placeholder={placeholder}
      disabled={saving}
      className={`w-full bg-[#0A0A0B] border border-[#222226] px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#D4AF37] ${className}`}
      autoFocus
    />
  );
};
