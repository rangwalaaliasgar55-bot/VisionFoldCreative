import React, { useState } from 'react';
import { authApi } from '../../lib/api';
import { KeyRound, X, Check } from 'lucide-react';

export const ChangePasswordPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] bg-black/70 flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label="Change password">
      <div className="w-full max-w-sm bg-[#121215] border border-[#222226] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#EDEDED]">Change Password</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[#888891] hover:text-[#EDEDED] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input"
          />
          <input
            type="password"
            required
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
          />
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />

          {error && (
            <div role="alert" className="text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-2 flex items-center justify-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest py-3 rounded hover:bg-white transition-colors disabled:opacity-60"
          >
            {success ? <Check className="w-4 h-4" /> : null}
            {isSaving ? 'Saving…' : success ? 'Updated' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
