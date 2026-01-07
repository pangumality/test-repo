import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({ value, onChange, options, className, buttonClassName, menuClassName, placeholder }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const opts = useMemo(() => options || [], [options]);
  const current = useMemo(() => opts.find(o => o.value === value) || null, [opts, value]);
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  function onKey(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      setOpen(true);
      setActiveIndex(Math.max(0, opts.findIndex(o => o.value === value)));
      return;
    }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') setActiveIndex(i => Math.min((i < 0 ? 0 : i) + 1, opts.length - 1));
    if (e.key === 'ArrowUp') setActiveIndex(i => Math.max((i < 0 ? 0 : i) - 1, 0));
    if (e.key === 'Enter') {
      const idx = activeIndex < 0 ? opts.findIndex(o => o.value === value) : activeIndex;
      const sel = opts[idx];
      if (sel) {
        onChange(sel.value);
        setOpen(false);
      }
    }
  }
  return (
    <div ref={ref} className={className || 'relative'}>
      <button
        type="button"
        className={
          buttonClassName ||
          'w-full px-3 py-2 pr-9 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 shadow-soft hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-300 transition-colors text-sm flex items-center justify-between'
        }
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current ? current.label : placeholder || 'Select'}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
      {open && (
        <div
          className={
            menuClassName ||
            'absolute z-50 mt-2 w-full rounded-xl bg-white border border-gray-200 shadow-soft overflow-hidden'
          }
          role="listbox"
        >
          {opts.map((o, i) => {
            const selected = o.value === value;
            const active = i === activeIndex;
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={selected}
                className={
                  'px-3 py-2 text-sm flex items-center justify-between cursor-pointer ' +
                  (active ? 'bg-gray-100 ' : '') +
                  (selected ? 'text-gray-900 ' : 'text-gray-700 ')
                }
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{o.label}</span>
                {selected && <Check size={16} className="text-gray-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
