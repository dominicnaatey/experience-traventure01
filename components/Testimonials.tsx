
'use client';

import React from 'react';
import Image from 'next/image';
import { TESTIMONIALS } from '../app/lib/constants';
import { StarIcon } from '@heroicons/react/24/solid';

const Testimonials: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#111318] dark:text-white mb-10">What Travelers Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex mb-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(t.rating) ? 'text-yellow-500' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-300 italic mb-6">&quot;{t.comment}&quot;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                <Image 
                  alt={t.name} 
                  src={t.avatar} 
                  fill
                  className="object-cover"
                />
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
