import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError(t('missingFields'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('invalidEmail'));
      return;
    }

    login(email, name);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-orange-50 min-h-[100dvh]">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center animate-[fadeIn_0.5s]">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl text-orange-500 mx-auto mb-6 shadow-inner">
          <i className="fa-solid fa-user-astronaut"></i>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('login')}</h1>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">{t('loginDesc')}</p>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t('name')}</label>
            <div className="relative">
                <i className="fa-solid fa-user absolute left-4 top-4 text-gray-300"></i>
                <input 
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl p-3 pl-10 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
                  placeholder="e.g. Chef John"
                />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t('email')}</label>
            <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-4 text-gray-300"></i>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl p-3 pl-10 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
                  placeholder="e.g. john@example.com"
                />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 hover:scale-[1.02] transition-all">
            {t('loginBtn')}
          </button>
        </form>

        <div className="bg-blue-50 p-3 rounded-lg mt-6 flex items-start gap-2 text-left">
          <i className="fa-solid fa-info-circle text-blue-500 mt-0.5"></i>
          <p className="text-[10px] text-blue-800 leading-tight">
            {t('loginDisclaimer')}
          </p>
        </div>

        <div className="mt-6 border-t pt-6">
          <button 
            onClick={() => login('guest@lunchspin.app', 'Guest')}
            className="text-sm text-gray-400 hover:text-orange-500 font-medium flex items-center justify-center gap-2 w-full"
          >
            {t('guestBtn')} <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};