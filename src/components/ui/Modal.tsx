import React from 'react';
import { X } from 'lucide-react';

const SIZE_CLASS: Record<string, string> = {
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl">
      <div className={`border-[3px] border-black bg-white w-full ${SIZE_CLASS[size] ?? SIZE_CLASS.md} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-4 border-b-[3px] border-black bg-orange-500 text-black">
          <h2 className="font-black text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-white flex-1 relative">
          {/* Brutalist Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
