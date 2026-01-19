import React, { useState } from 'react';
import { Restaurant, SavedList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { updateLists } from '../services/storageService';

export const ListView: React.FC = () => {
  const { user, userData, refreshData } = useAuth();
  const { t } = useLanguage();
  
  const lists = userData?.lists || [];
  const cuisines = userData?.cuisines || [];

  const [activeListId, setActiveListId] = useState(lists[0]?.id);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  
  // Form State
  const [newResName, setNewResName] = useState('');
  const [newResCuisine, setNewResCuisine] = useState(cuisines[0] || 'Other');
  const [newResPrice, setNewResPrice] = useState('$$');
  const [newListName, setNewListName] = useState('');

  // Ensure active list selection is valid
  React.useEffect(() => {
    if (lists.length > 0 && !lists.find(l => l.id === activeListId)) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  const activeList = lists.find(l => l.id === activeListId);

  const handleDelete = (rId: string) => {
    if (!activeList || !user) return;
    const updated = activeList.restaurants.filter(r => r.id !== rId);
    const updatedLists = lists.map(l => l.id === activeListId ? { ...l, restaurants: updated } : l);
    updateLists(user.id, updatedLists);
    refreshData();
  };

  const handleAddRestaurant = () => {
    if (!newResName.trim() || !activeList || !user) return;
    const newRestaurant: Restaurant = {
      id: Date.now().toString(),
      name: newResName,
      cuisine: newResCuisine,
      priceLevel: newResPrice,
      source: 'manual',
      rating: 0
    };
    
    const updatedLists = lists.map(l => 
      l.id === activeListId 
      ? { ...l, restaurants: [...l.restaurants, newRestaurant] } 
      : l
    );
    updateLists(user.id, updatedLists);
    refreshData();
    setNewResName('');
    setShowAddModal(false);
  };

  const handleCreateList = () => {
    if (!newListName.trim() || !user) return;
    
    const newList: SavedList = {
      id: `list-${Date.now()}`,
      name: newListName,
      restaurants: [],
      isDefault: false
    };

    const updatedLists = [...lists, newList];
    updateLists(user.id, updatedLists);
    refreshData();
    
    // Switch to new list and close modal
    setActiveListId(newList.id);
    setNewListName('');
    setShowCreateListModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Top Bar - List Selector */}
      <div className="flex overflow-x-auto p-4 gap-2 border-b border-gray-100 bg-orange-50 no-scrollbar items-center">
        {lists.map(list => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
              activeListId === list.id 
              ? 'bg-orange-500 text-white shadow-md' 
              : 'bg-white text-orange-400 border border-orange-100'
            }`}
          >
            {list.name}
          </button>
        ))}
        {/* Create New List Button */}
        <button 
          onClick={() => setShowCreateListModal(true)}
          className="px-4 py-2 rounded-full bg-white text-orange-400 border border-orange-200 text-sm font-bold hover:bg-orange-100 hover:text-orange-600 transition-colors"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {activeList ? (
          <div className="space-y-3">
             {activeList.restaurants.length === 0 && (
                 <div className="text-center text-gray-400 mt-10">
                     <p>{t('pleaseCreateList')}</p>
                 </div>
             )}
             {activeList.restaurants.map(r => (
               <div key={r.id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                      <i className="fa-solid fa-utensils"></i>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{r.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{r.cuisine}</span>
                        {r.priceLevel && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{r.priceLevel}</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(r.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
               </div>
             ))}
          </div>
        ) : (
          <div className="p-4">{t('pleaseCreateList')}</div>
        )}
      </div>
      
      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="absolute bottom-20 right-4 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform z-30"
      >
        <i className="fa-solid fa-plus"></i>
      </button>

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-[slideInUp_0.3s]">
             <h3 className="text-xl font-bold mb-4">{t('addPlace')}</h3>
             
             {/* Name Input */}
             <div className="mb-4">
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('name')}</label>
                 <input 
                   autoFocus
                   className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400"
                   placeholder={t('name')}
                   value={newResName}
                   onChange={e => setNewResName(e.target.value)}
                 />
             </div>

             {/* Cuisine Select */}
             <div className="mb-4">
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('manageCuisines')}</label>
                 <select 
                   className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                   value={newResCuisine}
                   onChange={e => setNewResCuisine(e.target.value)}
                 >
                    {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </div>

             {/* Price Level Select */}
             <div className="mb-6">
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('priceLevel')}</label>
                 <select 
                   className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                   value={newResPrice}
                   onChange={e => setNewResPrice(e.target.value)}
                 >
                    <option value="$">$ (Cheap)</option>
                    <option value="$$">$$ (Moderate)</option>
                    <option value="$$$">$$$ (Expensive)</option>
                    <option value="$$$$">$$$$ (Luxury)</option>
                 </select>
             </div>

             <div className="flex gap-2">
               <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
               <button onClick={handleAddRestaurant} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600">{t('add')}</button>
             </div>
           </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-[slideInUp_0.3s]">
             <h3 className="text-xl font-bold mb-4 text-gray-900">{t('createList')}</h3>
             <input 
               autoFocus
               className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded-lg mb-6 focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400"
               placeholder={t('listName')}
               value={newListName}
               onChange={e => setNewListName(e.target.value)}
             />
             <div className="flex gap-2">
               <button onClick={() => setShowCreateListModal(false)} className="flex-1 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
               <button onClick={handleCreateList} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600">{t('create')}</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};