import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Toast({ message, type = 'success', onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success' ? '✓' : '✕';

  return createPortal(
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} transition-all duration-300 transform translate-y-0 opacity-100`}>
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
        {icon}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button 
        onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
        className="ml-2 text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>,
    document.body
  );
}
