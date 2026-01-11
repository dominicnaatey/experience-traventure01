
'use client';

import React from 'react';
import { FEATURED_DESTINATIONS } from '../app/lib/constants';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const Destinations: React.FC = () => {
  return (
    <section id="destinations">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111318] dark:text-white mb-2">Featured Destinations</h2>
          <p className="text-gray-500 dark:text-gray-400">Explore our most popular spots around the globe.</p>
        </div>
        <a className="text-primary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all" href="#">
          View all destinations <ArrowRightIcon className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURED_DESTINATIONS.map((dest) => (
          <div key={dest.id} className="group cursor-pointer">
            <div className="overflow-hidden rounded-2xl relative aspect-3/4 mb-3 shadow-md">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                style={{ backgroundImage: `url('${dest.imageUrl}')` }}
              ></div>
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white text-xl font-bold">{dest.name}, {dest.country}</h3>
                <p className="text-white/80 text-sm">{dest.tourCount}+ Tours available</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Destinations;
