import React from 'react';
import { X } from 'lucide-react';

const SIZE_CLASS: Record<string, string> = {
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className={`bg-white border border-sand-200 rounded-card w-full ${SIZE_CLASS[size] ?? SIZE_CLASS.md} shadow-soft-lg flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex justify-between items-center p-4 btn-grad text-white">
          <h2 className="font-black text-lg">{title}</h2>
          <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-white flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
