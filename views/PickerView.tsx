import React, { useState, useEffect, useRef } from 'react';
import { SavedList, Restaurant, HistoryEntry } from '../types';
import { Confetti } from '../components/Confetti';
import { addToHistory, toggleFavorite } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const PickerView: React.FC = () => {
  const { user, userData, refreshData } = useAuth();
  const { t } = useLanguage();
  
  const lists = userData?.lists || [];
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<string>(t('whatToEat'));
  const [winner, setWinner] = useState<Restaurant | null>(null);
  
  // Toast State
  const [toastMsg, setToastMsg] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  const selectedList = lists.find(l => l.id === selectedListId);

  useEffect(() => {
    // Update default display if list changes
    if (selectedList && !isSpinning && !winner) {
      setCurrentDisplay(`${t('pickFrom')} ${selectedList.restaurants.length} ${t('places')}`);
    }
  }, [selectedList, isSpinning, winner, t]);

  // Auto-scroll to winner when selected
  useEffect(() => {
    if (winner && resultRef.current && containerRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [winner]);

  const handleSpin = () => {
    if (!selectedList || selectedList.restaurants.length === 0 || !user) return;

    setIsSpinning(true);
    setWinner(null);
    let counter = 0;
    const candidates = selectedList.restaurants;
    
    // Spinning animation logic
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      setCurrentDisplay(candidates[randomIndex].name);
      counter++;

      // Stop condition
      if (counter > 20) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * candidates.length);
        const finalWinner = candidates[finalIndex];
        
        setCurrentDisplay(finalWinner.name);
        setWinner(finalWinner);
        setIsSpinning(false);
        
        // Save to history
        const entry: HistoryEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          restaurantId: finalWinner.id,
          restaurantName: finalWinner.name,
          cuisine: finalWinner.cuisine || 'Unknown'
        };
        addToHistory(user.id, entry);
        refreshData();
      }
    }, 100);
  };

  const handleToggleFavorite = () => {
    if (!winner || !user) return;
    const added = toggleFavorite(user.id, winner);
    refreshData();
    
    setToastMsg(added ? t('savedToFavorites') : t('removedFromFavorites'));
    setTimeout(() => setToastMsg(''), 2000);
  };

  // Check if current winner is in favorites
  const isFavorited = winner && userData?.lists
    .find(l => l.id === 'favorites-list')
    ?.restaurants.some(r => r.name === winner.name);

  if (!selectedList) return <div className="p-10 text-center">{t('pleaseCreateList')}</div>;

  return (
    // Added pb-24 to ensure content clears the fixed bottom navbar
    <div ref={containerRef} className="flex-1 flex flex-col bg-transparent overflow-y-auto pb-24 no-scrollbar scroll-smooth relative">
      {winner && <Confetti />}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-[fadeIn_0.3s]">
          <i className={`fa-solid ${toastMsg === t('savedToFavorites') ? 'fa-heart text-red-400' : 'fa-check'} mr-2`}></i>
          {toastMsg}
        </div>
      )}
      
      {/* Header / List Selector */}
      <div className="p-6 pt-10 text-center z-10">
        <h1 className="text-3xl font-bold text-orange-900 mb-2">{t('appTitle')}</h1>
        <div className="inline-block relative">
          <select 
            value={selectedListId}
            onChange={(e) => {
              setSelectedListId(e.target.value);
              setWinner(null);
            }}
            className="appearance-none bg-white border border-orange-200 text-orange-800 py-2 px-4 pr-8 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-orange-600">
            <i className="fa-solid fa-chevron-down text-xs"></i>
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-10 min-h-[400px]">
        
        {/* The Card / Display */}
        <div className={`
          w-64 h-64 rounded-full bg-white shadow-[0_20px_50px_rgba(234,88,12,0.2)] 
          flex flex-col items-center justify-center p-6 text-center border-4 border-orange-100
          transition-all duration-300 transform
          ${isSpinning ? 'scale-105 border-orange-300' : ''}
          ${winner ? 'ring-4 ring-orange-400 ring-offset-4 animate-[bounce_1s]' : ''}
        `}>
           <div className="text-5xl mb-4 text-orange-500">
              {isSpinning ? (
                <i className="fa-solid fa-burger fa-spin"></i>
              ) : winner ? (
                <i className="fa-solid fa-champagne-glasses text-yellow-500 animate-pulse"></i>
              ) : (
                <i className="fa-solid fa-utensils"></i>
              )}
           </div>
           <h2 className={`font-bold text-slate-800 break-words w-full ${isSpinning ? 'text-xl' : 'text-2xl'}`}>
             {currentDisplay}
           </h2>
           {winner && (
             <p className="text-sm text-gray-500 mt-2 font-medium">{winner.cuisine} • {winner.rating}⭐</p>
           )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || selectedList.restaurants.length === 0}
          className={`
            mt-12 px-10 py-4 rounded-full text-white font-bold text-lg shadow-lg tracking-wide
            transition-all transform hover:scale-105 active:scale-95
            ${isSpinning 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-orange-300/50'}
          `}
        >
          {isSpinning ? t('spinning') : winner ? t('spinAgain') : t('spinBtn')}
        </button>

      </div>

      {/* Winner Details Card (if winner exists) */}
      {winner && (
        <div ref={resultRef} className="px-6 pb-6 animate-[slideInUp_0.5s] scroll-mt-24">
          <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-100">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-lg">{winner.name}</h3>
                 <p className="text-gray-500 text-sm">{winner.address || 'Address not available'}</p>
               </div>
               <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{winner.priceLevel || '$$'}</span>
            </div>
            
            <div className="mt-4 flex gap-2">
                {winner.googleMapsUri && (
                    <a href={winner.googleMapsUri} target="_blank" rel="noreferrer" 
                       className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-center text-sm font-semibold hover:bg-blue-100">
                       <i className="fa-solid fa-map-location-dot mr-2"></i> Map
                    </a>
                )}
                <button 
                  onClick={handleToggleFavorite}
                  className={`flex-1 py-2 rounded-lg text-center text-sm font-semibold transition-colors ${
                    isFavorited 
                    ? 'bg-red-50 text-red-500 border border-red-100' 
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  }`}
                >
                   <i className={`fa-${isFavorited ? 'solid' : 'regular'} fa-heart mr-2`}></i> 
                   {t('favorites')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};