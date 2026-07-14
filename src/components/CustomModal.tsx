'use client';

import React from 'react';

interface AlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  okLabel?: string;
}

export function CustomAlertModal({
  isOpen,
  title,
  message,
  onClose,
  okLabel = '확인'
}: AlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e16]/95 p-6 shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col gap-4 text-left transform scale-100 transition-all duration-300 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-sm font-black text-white tracking-wide uppercase border-b border-white/5 pb-2">
            🚨 {title}
          </h3>
        )}
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
          {message}
        </p>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  okLabel?: string;
  cancelLabel?: string;
}

export function CustomConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  okLabel = '확인',
  cancelLabel = '취소'
}: ConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e16]/95 p-6 shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col gap-4 text-left transform scale-100 transition-all duration-300 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-sm font-black text-white tracking-wide uppercase border-b border-white/5 pb-2">
            ❓ {title}
          </h3>
        )}
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
          {message}
        </p>
        <div className="mt-2 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-white/5 font-bold text-xs tracking-wider transition-all cursor-pointer active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
