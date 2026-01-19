import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Navbar } from './components/Navbar';
import { PickerView } from './views/PickerView';
import { DiscoveryView } from './views/DiscoveryView';
import { ListView } from './views/ListView';
import { StatsView } from './views/StatsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { AppView } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.PICKER);

  if (!user) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.PICKER:
        return <PickerView />;
      case AppView.DISCOVERY:
        return <DiscoveryView />;
      case AppView.LISTS:
        return <ListView />;
      case AppView.STATS:
        return <StatsView />;
      case AppView.SETTINGS:
        return <SettingsView />;
      default:
        return <PickerView />;
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {renderView()}
      </div>
      <Navbar currentView={currentView} setView={setCurrentView} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Layout>
          <AppContent />
        </Layout>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;