
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Destinations from '../components/Destinations';
import TourPackages from '../components/TourPackages';
import ValueProps from '../components/ValueProps';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import SearchResultModal from '../components/SearchResultModal';
import ItineraryModal from '../components/ItineraryModal';
import { geminiService } from './services/geminiService';
import { SearchResult, TourPackage } from './types';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [activeItinerary, setActiveItinerary] = useState<{ content: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingPkgId, setGeneratingPkgId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Geolocation denied or unavailable")
      );
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const result = await geminiService.searchDestination(
        query, 
        userLocation?.lat, 
        userLocation?.lng
      );
      setSearchResult(result);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateItinerary = async (pkg: TourPackage) => {
    setGeneratingPkgId(pkg.id);
    try {
      const itinerary = await geminiService.getItinerary(pkg.title, pkg.location, pkg.duration);
      setActiveItinerary({ content: itinerary, title: pkg.title });
    } catch (error) {
      console.error("Itinerary failed", error);
      alert("We couldn't generate an itinerary right now. Please try again later.");
    } finally {
      setGeneratingPkgId(null);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-blue-600/20 ${isDarkMode ? 'dark' : ''}`}>
      <Navbar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1">
        <Hero onSearch={handleSearch} isLoading={isLoading} />
        
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-20">
          <Destinations />
          <TourPackages onGenerateItinerary={handleGenerateItinerary} isGenerating={generatingPkgId} />
          <ValueProps />
          <Testimonials />
          <Newsletter />
        </div>
      </main>

      <Footer />

      <SearchResultModal 
        result={searchResult} 
        onClose={() => setSearchResult(null)} 
      />

      <ItineraryModal 
        itinerary={activeItinerary?.content || null}
        title={activeItinerary?.title || ""}
        onClose={() => setActiveItinerary(null)}
      />
    </div>
  );
}
