
'use client';

import React from 'react';
import { SearchResult } from '../app/types';

interface SearchResultModalProps {
  result: SearchResult | null;
  onClose: () => void;
}

const SearchResultModal: React.FC<SearchResultModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">auto_awesome</span>
            <h3 className="text-xl font-bold dark:text-white">AI Travel Insights</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <span className="material-symbols-outlined dark:text-white">close</span>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto">
          <div className="prose prose-blue dark:prose-invert max-w-none">
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Location & Resources</h4>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, idx) => {
                  const isMap = !!source.maps;
                  const data = source.maps || source.web;
                  if (!data) return null;

                  return (
                    <a 
                      key={idx}
                      href={data.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1 ${
                        isMap 
                        ? 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white' 
                        : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isMap ? 'map' : 'link'}
                      </span>
                      {data.title}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
          >
            Start Planning
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultModal;
