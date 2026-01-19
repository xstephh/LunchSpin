import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const StatsView: React.FC = () => {
  const { userData } = useAuth();
  const { t } = useLanguage();
  
  const history = useMemo(() => userData?.history || [], [userData]);

  // Calculate Cuisine Distribution
  const cuisineData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(h => {
      const c = h.cuisine || 'Other';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [history]);

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#84cc16', '#ef4444'];

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <i className="fa-solid fa-chart-simple text-5xl mb-4 opacity-20"></i>
        <p>No history yet. Spin the wheel!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 pb-20">
      <h2 className="text-2xl font-bold text-orange-900 mb-6">{t('yourCravings')}</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
           <div className="text-gray-500 text-xs uppercase font-bold tracking-wider">{t('totalPicks')}</div>
           <div className="text-3xl font-bold text-orange-600 mt-1">{history.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
           <div className="text-gray-500 text-xs uppercase font-bold tracking-wider">{t('topCuisine')}</div>
           <div className="text-xl font-bold text-orange-600 mt-1 truncate">
             {cuisineData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
           </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
        <h3 className="font-bold text-gray-700 mb-4">{t('cuisineDist')}</h3>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={cuisineData}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {cuisineData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip />
             </PieChart>
           </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
            {cuisineData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                    {entry.name}
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
        <h3 className="font-bold text-gray-700 mb-4">{t('recentHistory')}</h3>
        <div className="space-y-3">
          {history.slice(0, 5).map(h => (
            <div key={h.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
               <div>
                 <div className="font-medium text-sm text-gray-800">{h.restaurantName}</div>
                 <div className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</div>
               </div>
               <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">{h.cuisine}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};