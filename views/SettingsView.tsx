import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { updateCuisines, saveUserData, getUserData } from '../services/storageService';

export const SettingsView: React.FC = () => {
  const { user, userData, logout, refreshData } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [newCuisine, setNewCuisine] = useState('');
  const [toast, setToast] = useState('');

  const cuisines = userData?.cuisines || [];

  const handleAddCuisine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCuisine.trim() && user) {
      const updated = [...cuisines, newCuisine.trim()];
      updateCuisines(user.id, updated);
      refreshData();
      setNewCuisine('');
    }
  };

  const handleDeleteCuisine = (cuisine: string) => {
    if (user) {
      const updated = cuisines.filter(c => c !== cuisine);
      updateCuisines(user.id, updated);
      refreshData();
    }
  };

  const handleExport = () => {
    if (!user) return;
    const data = getUserData(user.id);
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setToast(t('dataExported'));
      setTimeout(() => setToast(''), 3000);
    });
  };

  const handleImport = () => {
    if (!user) return;
    const input = window.prompt("Paste your JSON data here:");
    if (input) {
      try {
        const data = JSON.parse(input);
        if (data.lists && Array.isArray(data.lists)) {
          saveUserData(user.id, data);
          refreshData();
          setToast(t('dataImported'));
          setTimeout(() => setToast(''), 3000);
        } else {
          alert("Invalid data format.");
        }
      } catch (e) {
        alert("Invalid JSON.");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 relative">
      {/* Toast */}
      {toast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-[fadeIn_0.3s]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 pb-4 border-b border-gray-100">
         <h2 className="text-2xl font-bold text-gray-800">{t('settings')}</h2>
         <p className="text-gray-500 text-sm mt-1">{t('welcome')} {user?.name}</p>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Language */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
           <h3 className="font-bold text-gray-700 mb-4 flex items-center">
             <i className="fa-solid fa-globe mr-2 text-orange-500"></i> {t('language')}
           </h3>
           <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${language === 'en' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('zh-TW')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${language === 'zh-TW' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
              >
                繁體中文
              </button>
           </div>
        </div>

        {/* Cuisine Management */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
           <h3 className="font-bold text-gray-700 mb-4 flex items-center">
             <i className="fa-solid fa-pepper-hot mr-2 text-red-500"></i> {t('manageCuisines')}
           </h3>
           
           <form onSubmit={handleAddCuisine} className="flex gap-2 mb-4">
             <input 
               value={newCuisine}
               onChange={e => setNewCuisine(e.target.value)}
               placeholder={t('addCuisine')}
               className="flex-1 bg-white text-gray-900 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-orange-200 outline-none placeholder-gray-400"
             />
             <button type="submit" className="bg-orange-500 text-white w-10 h-10 rounded-lg shadow-md hover:bg-orange-600">
               <i className="fa-solid fa-plus"></i>
             </button>
           </form>

           <div className="flex flex-wrap gap-2">
             {cuisines.map(c => (
               <div key={c} className="bg-orange-50 text-orange-800 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 group">
                 {c}
                 <button onClick={() => handleDeleteCuisine(c)} className="text-orange-300 hover:text-red-500">
                   <i className="fa-solid fa-times"></i>
                 </button>
               </div>
             ))}
           </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
           <h3 className="font-bold text-gray-700 mb-4 flex items-center">
             <i className="fa-solid fa-database mr-2 text-blue-500"></i> {t('dataManagement')}
           </h3>
           <div className="space-y-3">
             <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700"
             >
                <span>{t('exportData')}</span>
                <i className="fa-solid fa-copy text-gray-400"></i>
             </button>
             <button 
                onClick={handleImport}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700"
             >
                <span>{t('importData')}</span>
                <i className="fa-solid fa-file-import text-gray-400"></i>
             </button>
             
             {/* Cloud Sync Placeholder */}
             <div className="relative overflow-hidden w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl opacity-70">
                <span className="flex items-center gap-2 text-sm font-medium text-orange-800">
                  <i className="fa-solid fa-cloud"></i> {t('cloudSync')}
                </span>
                <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-bold">{t('comingSoon')}</span>
             </div>
           </div>
        </div>

        {/* Logout */}
        <button 
          onClick={logout}
          className="w-full bg-white text-red-500 font-bold py-4 rounded-2xl shadow-sm border border-red-50 hover:bg-red-50 transition-colors"
        >
          {t('logout')}
        </button>

      </div>
    </div>
  );
};