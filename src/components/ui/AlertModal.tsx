'use client';

import React, { useEffect } from 'react';
import { useAlertStore } from '@/store/useAlertStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useThemeStore } from '@/store/useThemeStore';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export default function AlertModal() {
  const { 
    isOpen, 
    message, 
    title, 
    type, 
    isConfirm, 
    confirmText, 
    cancelText, 
    handleConfirm, 
    hideAlert 
  } = useAlertStore();
  const { language } = useLanguageStore();
  const { animations } = useThemeStore();

  // Listen for Enter or Escape keys to confirm or cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isConfirm) {
          handleConfirm(false);
        } else {
          hideAlert();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isConfirm) {
          handleConfirm(true);
        } else {
          hideAlert();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirm, handleConfirm, hideAlert]);

  if (!isOpen) return null;

  // Icon and Color mapping based on alert type
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      colorClass: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20',
      btnClass: 'bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]',
    },
    error: {
      icon: AlertOctagon,
      colorClass: 'text-error bg-error/10 border-error/20',
      btnClass: 'bg-error hover:opacity-90 text-white',
    },
    warning: {
      icon: AlertTriangle,
      colorClass: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20',
      btnClass: 'bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]',
    },
    info: {
      icon: Info,
      colorClass: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20',
      btnClass: 'bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]',
    },
  };

  const currentConfig = typeConfig[type] || typeConfig.info;
  const IconComponent = currentConfig.icon;

  const acceptText = language === 'es' ? 'Aceptar' : 'Accept';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with elegant blur */}
      <div 
        className="fixed inset-0 bg-background/40 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          if (isConfirm) {
            handleConfirm(false);
          } else {
            hideAlert();
          }
        }}
      />

      {/* Modal Box */}
      <div 
        className={`relative w-full max-w-md bg-card border border-border p-6 shadow-2xl z-10 transition-all duration-300 overflow-hidden flex flex-col items-center text-center animate-in fade-in zoom-in-95 ${
          animations ? 'duration-300' : 'duration-0'
        }`}
        style={{
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 ${
          type === 'error' ? 'bg-error' : 'bg-[var(--primary)]'
        }`} />

        {/* Close button top right */}
        <button 
          onClick={() => {
            if (isConfirm) {
              handleConfirm(false);
            } else {
              hideAlert();
            }
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Circular Icon Container */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center border mb-4 shrink-0 animate-bounce ${currentConfig.colorClass}`}>
          <IconComponent className="w-7 h-7 stroke-[2]" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-[var(--foreground)] mb-2 leading-tight tracking-tight">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-xs mb-6 font-medium">
          {message}
        </p>

        {/* Buttons Area */}
        {isConfirm ? (
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={() => handleConfirm(false)}
              className="flex-1 py-3 px-4 border border-border hover:bg-muted text-muted-foreground text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
              style={{
                borderRadius: 'calc(var(--radius) * 0.8)',
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={() => handleConfirm(true)}
              className={`flex-1 py-3 px-4 text-sm font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer ${currentConfig.btnClass}`}
              style={{
                borderRadius: 'calc(var(--radius) * 0.8)',
              }}
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button
            onClick={hideAlert}
            className={`w-full py-3 px-6 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer ${currentConfig.btnClass}`}
            style={{
              borderRadius: 'calc(var(--radius) * 0.8)',
            }}
          >
            {acceptText}
          </button>
        )}
      </div>
    </div>
  );
}
