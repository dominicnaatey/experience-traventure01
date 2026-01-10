
'use client';

import React from 'react';
import { TESTIMONIALS } from '../lib/constants';

const Testimonials: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#111318] dark:text-white mb-10">What Travelers Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex text-yellow-500 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`material-symbols-outlined text-sm ${i < Math.floor(t.rating) ? 'fill-1' : ''}`}>star</span>
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-300 italic mb-6">"{t.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                <img alt={t.name} className="w-full h-full object-cover" src={t.avatar} />
              </div>
              <div>
                <p className="font-bold text-sm text-[#111318] dark:text-white">{t.name}</p>
                <p className="text-xs text-gray-500">{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
