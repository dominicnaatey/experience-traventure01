
'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-6 text-blue-600">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
                </svg>
              </div>
              <span className="text-xl font-bold text-[#111318] dark:text-white">Wanderlust</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
              We are a modern travel agency dedicated to providing unique and unforgettable travel experiences. Explore the world with confidence and comfort.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all" href="#">
                <span className="text-xs font-bold">FB</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all" href="#">
                <span className="text-xs font-bold">TW</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all" href="#">
                <span className="text-xs font-bold">IG</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#111318] dark:text-white mb-6">Company</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-blue-600 transition-colors" href="#">About Us</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Careers</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Blog</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#111318] dark:text-white mb-6">Support</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-blue-600 transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Safety Information</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Cancellation Options</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#111318] dark:text-white mb-6">Legal</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-blue-600 transition-colors" href="#">Terms of Service</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-blue-600 transition-colors" href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">© 2023 Wanderlust Travel & Tour Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="material-symbols-outlined text-sm">language</span>
              <span className="text-sm">English (US)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="material-symbols-outlined text-sm">attach_money</span>
              <span className="text-sm">USD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
