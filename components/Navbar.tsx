import React from 'react';
import { AppView } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const { t } = useLanguage();

  const navItems = [
    { view: AppView.PICKER, icon: 'fa-utensils', label: t('pick') },
    { view: AppView.DISCOVERY, icon: 'fa-compass', label: t('discover') },
    { view: AppView.LISTS, icon: 'fa-list-ul', label: t('lists') },
    { view: AppView.STATS, icon: 'fa-chart-pie', label: t('stats') },
    { view: AppView.SETTINGS, icon: 'fa-gear', label: t('settings') },
  ];

  return (
    <div className="fixed bottom-0 md:absolute md:bottom-0 w-full max-w-md bg-white border-t border-orange-100 flex justify-around items-center h-16 z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            currentView === item.view ? 'text-orange-600' : 'text-gray-400 hover:text-orange-400'
          }`}
        >
          <i className={`fa-solid ${item.icon} text-xl mb-1`}></i>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
