import React, { useState } from 'react';
import { Compass, Map, User } from 'lucide-react';
import DiscoverPage from './pages/discover';
import TripsPage from './pages/trips';
import ProfilePage from './pages/profile';
import TripDetailPage from './pages/trip-detail';

type TabType = 'discover' | 'trips' | 'profile';

interface NavigationState {
  currentTab: TabType;
  detailTripId: string | null;
}

export default function App() {
  const [navigation, setNavigation] = useState<NavigationState>({
    currentTab: 'discover',
    detailTripId: null
  });

  const handleNavigateToDetail = (tripId: string) => {
    setNavigation(prev => ({ ...prev, detailTripId: tripId }));
  };

  const handleNavigateBack = () => {
    setNavigation(prev => ({ ...prev, detailTripId: null }));
  };

  const handleTabChange = (tab: TabType) => {
    setNavigation({ currentTab: tab, detailTripId: null });
  };

  // Show detail page if there's a detail trip ID
  if (navigation.detailTripId) {
    return (
      <TripDetailPage 
        tripId={navigation.detailTripId} 
        onBack={handleNavigateBack}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Main Content */}
      <div className="h-full">
        {navigation.currentTab === 'discover' && (
          <DiscoverPage onNavigateToDetail={handleNavigateToDetail} />
        )}
        {navigation.currentTab === 'trips' && (
          <TripsPage onNavigateToDetail={handleNavigateToDetail} />
        )}
        {navigation.currentTab === 'profile' && <ProfilePage />}
      </div>

      {/* Bottom Navigation Bar - Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong shadow-lg">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex items-center justify-around">
            <TabButton
              icon={<Compass size={24} />}
              label="发现"
              active={navigation.currentTab === 'discover'}
              onClick={() => handleTabChange('discover')}
            />
            <TabButton
              icon={<Map size={24} />}
              label="行程"
              active={navigation.currentTab === 'trips'}
              onClick={() => handleTabChange('trips')}
            />
            <TabButton
              icon={<User size={24} />}
              label="我的"
              active={navigation.currentTab === 'profile'}
              onClick={() => handleTabChange('profile')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
        active
          ? 'text-white scale-105'
          : 'text-white/60 hover:text-white/80'
      }`}
    >
      <div className={active ? 'animate-pulse' : ''}>{icon}</div>
      <span className="text-xs">{label}</span>
    </button>
  );
}
