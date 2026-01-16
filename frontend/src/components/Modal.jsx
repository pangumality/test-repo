import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-xl mx-4 border border-white/40">
        <div className="px-6 py-4 border-b border-white/40 flex items-center justify-between"
             style={{ backgroundImage: 'linear-gradient(to right, var(--ui-accent-strong), transparent)' }}>
          <h3 className="text-lg font-semibold text-slate-900 text-gradient">{title}</h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={onClose}>✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
