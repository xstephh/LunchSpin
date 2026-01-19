import React, { useState } from 'react';
import { discoverRestaurants } from '../services/geminiService';
import { Restaurant } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { updateLists } from '../services/storageService';

interface DiscoveryViewProps {
  onAddRestaurant?: (r: Restaurant) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onAddRestaurant }) => {
  const { t, language } = useLanguage();
  const { user, userData, refreshData } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent, termOverride?: string) => {
    if (e) e.preventDefault();
    const searchTerm = termOverride || query;
    if (!searchTerm.trim()) return;

    if (termOverride && termOverride !== query) setQuery(searchTerm);

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Get location if possible
      let location = undefined;
      if (navigator.geolocation) {
        try {
           const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
             navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
           });
           location = {
             latitude: pos.coords.latitude,
             longitude: pos.coords.longitude
           };
        } catch (err) {
          console.log("Location access denied or timeout");
        }
      }

      // Append language instruction
      const langSuffix = language === 'zh-TW' ? " (in Traditional Chinese)" : "";
      const searchPrompt = `${searchTerm}${langSuffix}`;

      const found = await discoverRestaurants(searchPrompt, location);
      setResults(found);
      if (found.length === 0) setError(t('noResults'));
    } catch (err) {
      setError("Failed to fetch results. Check API Key or connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (restaurant: Restaurant) => {
    if (!user || !userData) return;
    
    // Add to default list (first one)
    const lists = userData.lists;
    if (lists.length === 0) return;
    
    const targetList = lists[0];
    
    // Check duplicates
    if (targetList.restaurants.some(r => r.name === restaurant.name)) {
      alert("Already in your list!");
      return;
    }

    const updatedList = {
      ...targetList,
      restaurants: [...targetList.restaurants, restaurant]
    };
    
    const newLists = lists.map(l => l.id === targetList.id ? updatedList : l);
    updateLists(user.id, newLists);
    refreshData();
    alert(t('addedToDefault'));
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
       <div className="bg-orange-500 p-6 pt-10 rounded-b-[2rem] shadow-md z-10 relative">
          <h2 className="text-2xl font-bold text-white mb-4">{t('discoverTitle')}</h2>
          <form onSubmit={(e) => handleSearch(e)} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 rounded-xl shadow-lg border-none focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-900 placeholder-gray-400"
            />
            <i className="fa-solid fa-search absolute left-4 top-3.5 text-gray-400"></i>
            <button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-2 bg-orange-600 text-white p-1.5 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
                <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-arrow-right'}`}></i>
            </button>
          </form>
          
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
            {['Sushi', 'Tacos', 'Vegan', 'Cafe', 'BBQ'].map(tag => (
              <button 
                key={tag}
                onClick={() => handleSearch(undefined, tag)}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded-full backdrop-blur-sm whitespace-nowrap hover:bg-white/30"
              >
                {tag}
              </button>
            ))}
          </div>
          
          <div className="absolute bottom-2 right-6 text-[10px] text-orange-100 opacity-80">
            <i className="fa-solid fa-bolt mr-1"></i>{t('poweredBy')}
          </div>
       </div>

       <div className="flex-1 p-6 pb-20">
         {error && (
           <div className="text-center text-red-500 mt-10 bg-red-50 p-4 rounded-xl">
             <i className="fa-solid fa-triangle-exclamation mb-2"></i>
             <p>{error}</p>
           </div>
         )}
         
         {!loading && results.length === 0 && !error && (
           <div className="text-center text-gray-400 mt-10">
             <i className="fa-solid fa-map-location text-4xl mb-3 opacity-30"></i>
             <p>{t('discoverTitle')}</p>
           </div>
         )}

         <div className="grid gap-4">
           {results.map((r) => (
             <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col animate-[fadeIn_0.5s]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{r.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                       <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{r.cuisine}</span>
                       <span>{r.rating} <i className="fa-solid fa-star text-yellow-400"></i></span>
                       <span>{r.priceLevel}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAdd(r)}
                    className="text-orange-500 hover:bg-orange-50 p-2 rounded-full transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                {r.address && <p className="text-xs text-gray-400 mt-2 truncate">{r.address}</p>}
                
                {r.googleMapsUri && (
                     <a href={r.googleMapsUri} target="_blank" rel="noreferrer" className="text-xs text-blue-500 mt-2 hover:underline flex items-center gap-1">
                        View on Maps <i className="fa-solid fa-external-link-alt text-[10px]"></i>
                     </a>
                )}
             </div>
           ))}
         </div>
       </div>
    </div>
  );
};