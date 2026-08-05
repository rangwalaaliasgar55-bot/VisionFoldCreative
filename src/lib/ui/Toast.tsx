import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast context
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdRef.current}`;
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { addToast, removeToast, clearToasts } = context;
  
  const toast = {
    success: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'error', title, message, duration: duration ?? 8000 }),
    warning: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'info', title, message, duration }),
    custom: (toast: Omit<Toast, 'id'>) => addToast(toast),
  };
  
  return { ...context, toast };
}

// Icon mapping
const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

// Color mapping
const colorMap: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    progress: 'bg-blue-500',
  },
};

// Single toast component
function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: string) => void;
}) {
  const colors = colorMap[toast.type];
  const duration = toast.duration ?? 5000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 },
        y: { type: 'spring', stiffness: 400, damping: 25 },
        scale: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      className={cn(
        'relative w-80 overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm',
        'bg-[#121215]/95',
        colors.border,
        colors.bg
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className={cn('flex-shrink-0 mt-0.5', colors.icon)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.05 }}
          >
            {iconMap[toast.type]}
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#EDEDED]">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-1 text-xs text-[#EDEDED]/60">
                {toast.message}
              </p>
            )}
            
            {/* Action */}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-xs font-medium text-[#D4AF37] hover:text-[#E5C349] transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          {/* Close button */}
          <motion.button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 p-1 rounded-md text-[#EDEDED]/40 hover:text-[#EDEDED] hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={cn('h-0.5', colors.progress)}
          initial={{ width: '100%', opacity: 0.5 }}
          animate={{ width: '0%', opacity: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

// Toast container
function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]; 
  onRemove: (id: string) => void;
}) {
  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Promise toast hook
export function usePromiseToast() {
  const { toast } = useToast();
  
  const wrapPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    // Show loading toast
    const loadingToastId = toast.info(messages.loading, undefined, 0); // No auto-dismiss
    
    return promise
      .then((result) => {
        toast.success(messages.success);
        return result;
      })
      .catch((error) => {
        toast.error(messages.error, error instanceof Error ? error.message : undefined);
        throw error;
      });
  };
  
  return { wrapPromise };
}
