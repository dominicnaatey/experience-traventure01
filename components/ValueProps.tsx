
'use client';

import React from 'react';

const ValueProps: React.FC = () => {
  return (
    <section className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">verified_user</span>
          </div>
          <h3 className="text-lg font-bold mb-2 text-[#111318] dark:text-white">Expert Guides</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Our tours are led by certified locals who know the hidden gems and history of every location.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">savings</span>
          </div>
          <h3 className="text-lg font-bold mb-2 text-[#111318] dark:text-white">Best Price Guarantee</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">We match any competitor&apos;s price for identical tour packages so you always get the best deal.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">support_agent</span>
          </div>
          <h3 className="text-lg font-bold mb-2 text-[#111318] dark:text-white">24/7 Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Our dedicated support team is available around the clock to assist you with any questions.</p>
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
