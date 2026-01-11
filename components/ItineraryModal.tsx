
'use client';

import React from 'react';

interface ItineraryModalProps {
  itinerary: string | null;
  onClose: () => void;
  title: string;
}

const ItineraryModal: React.FC<ItineraryModalProps> = ({ itinerary, onClose, title }) => {
  if (!itinerary) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-primary text-white">
          <div>
            <h3 className="text-xl font-bold">Your Custom Itinerary</h3>
            <p className="text-sm opacity-90">{title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-display">
              {itinerary}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-500 max-w-[60%]">
            This itinerary was uniquely crafted for you by our Wanderlust AI agent.
          </p>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryModal;
