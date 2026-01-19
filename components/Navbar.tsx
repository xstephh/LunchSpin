import React from "react";
import { AppView } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface NavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const { t } = useLanguage();

  const navItems = [
    { view: AppView.PICKER, icon: "fa-utensils", label: t("pick") },
    { view: AppView.LISTS, icon: "fa-list-ul", label: t("lists") },
    { view: AppView.STATS, icon: "fa-chart-pie", label: t("stats") },
    { view: AppView.SETTINGS, icon: "fa-gear", label: t("settings") },
  ];

  return (
    /* 
       Fixed at bottom of the flex container. 
       safe-pb applies padding for the iOS Home Screen indicator.
    */
    <nav className="shrink-0 w-full bg-white border-t border-orange-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50 safe-pb">
      <div className="flex justify-around items-center w-full h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-90 ${
              currentView === item.view ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <i
              className={`fa-solid ${item.icon} text-xl mb-1 ${currentView === item.view ? "animate-pulse" : ""}`}
            ></i>
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};
