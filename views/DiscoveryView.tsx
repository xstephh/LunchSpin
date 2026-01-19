import React, { useState } from "react";
import { discoverRestaurants } from "../services/geminiService";
import { Restaurant } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { updateLists } from "../services/storageService";

interface DiscoveryViewProps {
  onAddRestaurant?: (r: Restaurant) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  onAddRestaurant,
}) => {
  const { t, language } = useLanguage();
  const { user, userData, refreshData } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e?: React.FormEvent, termOverride?: string) => {
    if (e) e.preventDefault();
    const searchTerm = termOverride || query;
    if (!searchTerm.trim()) return;

    if (termOverride && termOverride !== query) setQuery(searchTerm);

    setLoading(true);
    setError("");
    // Clear previous results to show loading state clearly
    setResults([]);

    try {
      let location = undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 3000,
              });
            },
          );
          location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        } catch (err) {
          console.log("Location skipped:", err);
        }
      }

      // Explicitly ask for language in the search prompt if needed
      const searchPrompt =
        language === "zh-TW"
          ? `${searchTerm} (請以繁體中文提供餐廳資訊)`
          : searchTerm;

      const found = await discoverRestaurants(searchPrompt, location);

      if (found && found.length > 0) {
        setResults(found);
      } else {
        setError(t("noResults"));
      }
    } catch (err) {
      console.error("Discovery Search Error:", err);
      setError(
        "Service temporarily unavailable. Please check your connection or API configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (restaurant: Restaurant) => {
    if (!user || !userData) return;

    const lists = userData.lists;
    if (lists.length === 0) return;

    const targetList = lists[0];

    if (targetList.restaurants.some((r) => r.name === restaurant.name)) {
      alert("Already in your list!");
      return;
    }

    const updatedList = {
      ...targetList,
      restaurants: [...targetList.restaurants, restaurant],
    };

    const newLists = lists.map((l) =>
      l.id === targetList.id ? updatedList : l,
    );
    updateLists(user.id, newLists);
    refreshData();
    alert(t("addedToDefault"));
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-orange-500 p-6 pt-10 rounded-b-[2rem] shadow-lg z-20 relative">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t("discoverTitle")}
        </h2>
        <form onSubmit={(e) => handleSearch(e)} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 pr-12 py-3.5 rounded-2xl shadow-inner border-none focus:ring-4 focus:ring-orange-300 outline-none bg-white text-gray-900 placeholder-gray-400"
          />
          <i className="fa-solid fa-search absolute left-4 top-4 text-gray-300"></i>
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bg-orange-600 text-white p-2 rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50"
          >
            <i
              className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-arrow-right"}`}
            ></i>
          </button>
        </form>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar py-1">
          {["Sushi", "Tacos", "Burgers", "Cafe", "Healthy"].map((tag) => (
            <button
              key={tag}
              onClick={() => handleSearch(undefined, tag)}
              className="px-4 py-1.5 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-md whitespace-nowrap hover:bg-white/40 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {error && (
          <div className="text-center text-red-500 mt-10 bg-red-50 p-6 rounded-2xl border border-red-100">
            <i className="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-2xl w-full"
              ></div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center text-gray-300 mt-20">
            <i className="fa-solid fa-wand-magic-sparkles text-6xl mb-4 opacity-20"></i>
            <p className="text-sm font-medium italic">
              Type something and let AI guide your appetite...
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {results.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col animate-[fadeIn_0.5s]"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">
                    {r.name}
                  </h3>
                  <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-2">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                      {r.cuisine}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <i className="fa-solid fa-star text-yellow-400"></i>{" "}
                      {r.rating}
                    </span>
                    <span className="text-green-600 font-black">
                      {r.priceLevel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(r)}
                  className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-sm"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              {r.address && (
                <p className="text-xs text-gray-400 mt-3 line-clamp-1">
                  <i className="fa-solid fa-location-dot mr-1"></i>
                  {r.address}
                </p>
              )}

              {r.googleMapsUri && (
                <a
                  href={r.googleMapsUri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-500 mt-3 hover:text-blue-700 flex items-center gap-1 self-start"
                >
                  View Location{" "}
                  <i className="fa-solid fa-up-right-from-square text-[10px]"></i>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
