
'use client';

import React from 'react';

const Newsletter: React.FC = () => {
  return (
    <section className="bg-blue-600/5 dark:bg-gray-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111318] dark:text-white mb-4">Subscribe to our newsletter</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Get the latest travel updates, exclusive offers, and inspiration delivered straight to your inbox.</p>
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
          <input 
            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all" 
            placeholder="Your email address" 
            type="email"
          />
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors whitespace-nowrap" type="submit">
            Subscribe
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">We respect your privacy. Unsubscribe at any time.</p>
      </div>
    </section>
  );
};

export default Newsletter;
