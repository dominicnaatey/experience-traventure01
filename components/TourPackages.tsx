
'use client';

import React from 'react';
import { TOUR_PACKAGES } from '../app/lib/constants';
import { TourPackage } from '../app/types';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface TourPackagesProps {
  onGenerateItinerary: (pkg: TourPackage) => void;
  isGenerating: string | null;
}

const TourPackages: React.FC<TourPackagesProps> = ({ onGenerateItinerary, isGenerating }) => {
  return (
    <section id="tours">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111318] dark:text-white mb-2">Popular Tour Packages</h2>
          <p className="text-gray-500 dark:text-gray-400">Best selling packages chosen by travelers like you.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOUR_PACKAGES.map((pkg) => (
          <div key={pkg.id} className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700">
            <div className="relative h-60 overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                style={{ backgroundImage: `url('${pkg.imageUrl}')` }}
              ></div>
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#111318] dark:text-white flex items-center gap-1">
                <StarIcon className="w-3.5 h-3.5 text-yellow-500" /> {pkg.rating}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
                <MapPinIcon className="w-[18px] h-[18px]" />
                <span>{pkg.location}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 mx-1"></span>
                <span>{pkg.duration}</span>
              </div>
              <h3 className="text-lg font-bold text-[#111318] dark:text-white mb-2 group-hover:text-primary transition-colors">{pkg.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                {pkg.description}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-xl font-bold text-primary">${pkg.price}</p>
                </div>
                <button 
                  onClick={() => onGenerateItinerary(pkg)}
                  disabled={isGenerating === pkg.id}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-primary hover:text-white text-[#111318] dark:text-white dark:bg-gray-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                >
                  {isGenerating === pkg.id ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : 'View Details'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TourPackages;
