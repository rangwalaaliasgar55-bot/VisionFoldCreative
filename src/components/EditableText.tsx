import React, { useEffect, useMemo, useState } from 'react';
import { PencilLine } from 'lucide-react';
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

  const currentValue = useMemo(() => getValue(page, sectionKey, fallback), [fallback, getValue, page, sectionKey]);

  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  const handleBlur = async () => {
    if (!isAdmin || !editMode) {
      setIsEditing(false);
      return;
    }

    const trimmed = draft.trim();
    if (trimmed !== currentValue) {
      await saveValue(page, sectionKey, trimmed || fallback);
    }
    setIsEditing(false);
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
      <Tag className={className} onClick={() => isAdmin && editMode && setIsEditing(true)}>
        {currentValue || fallback}
        {isAdmin && editMode ? <PencilLine className="ml-2 inline h-4 w-4 align-middle text-[#D4AF37]" /> : null}
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
      className={`w-full bg-[#0A0A0B] border border-[#222226] px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#D4AF37] ${className}`}
      autoFocus
    />
  );
};
