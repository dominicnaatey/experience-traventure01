
'use client';

import React, { useState } from 'react';

interface HeroProps {
  onSearch: (destination: string) => void;
  isLoading: boolean;
}

const Hero: React.FC<HeroProps> = ({ onSearch, isLoading }) => {
  const [destination, setDestination] = useState('');

  const handleSearch = () => {
    if (destination.trim()) {
      onSearch(destination);
    }
  };

  return (
    <div className="relative w-full min-h-[600px] flex items-center justify-center bg-gray-900">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 w-full h-full bg-cover bg-center" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwB0amVSwuTCwlQmUxN0I9gTZEn41-9yKQ5f5kw-PKp7V6eyxj9B3-MaQWNQWfMaksj7vsDCJXDpPRAN6tXySVfwAygdBFL0yLyLnXpwfY6hejKVzspIfq9FUNpjtPwlP-q9CjuXqyiIjj6floOtBmJeasvbC216vwXJO2Gox-8jBDVNK4XVUTJ3BwMlyLxRzDGUbwEZIm2csEvQyvRFL5OlTDo0a4SzF0hHtg6nQn57inOK-DauLbKILo7qWW95hd3LWPl0Il6w')" }}
      ></div>
      {/* Overlay */}
      <div className="absolute inset-0 z-0 bg-linear-to-b from-black/40 via-black/20 to-black/60"></div>
      
      <div className="relative z-10 w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 drop-shadow-lg max-w-4xl">
          Discover Your Next Adventure
        </h1>
        <p className="text-lg sm:text-xl text-gray-100 mb-10 max-w-2xl font-medium drop-shadow-md">
          Curated tours for the modern explorer. Experience the world like never before with our exclusive packages and AI-powered recommendations.
        </p>

        {/* Search Widget */}
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl p-2 sm:p-3 shadow-xl flex flex-col md:flex-row gap-2">
          {/* Destination */}
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-blue-600">location_on</span>
            </div>
            <input 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-600/20 focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium" 
              placeholder="Where do you want to go?" 
              type="text"
            />
          </div>
          {/* Date */}
          <div className="flex-1 md:max-w-[200px] relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-blue-600">calendar_month</span>
            </div>
            <input 
              className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-600/20 focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium" 
              placeholder="Add dates" 
              type="text"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
            />
          </div>
          {/* Travelers */}
          <div className="flex-1 md:max-w-[180px] relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-blue-600">group</span>
            </div>
            <select className="block w-full pl-10 pr-8 py-3 border-none rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-600/20 focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium appearance-none cursor-pointer">
              <option disabled defaultValue="">Travelers</option>
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4+">4+ Guests</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">expand_more</span>
            </div>
          </div>
          {/* Submit Button */}
          <button 
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
