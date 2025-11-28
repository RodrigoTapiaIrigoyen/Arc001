import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WeaponsDatabase from './components/WeaponsDatabase';
import Marketplace from './components/Marketplace';
import Trackers from './components/Trackers';
import CommunityHub from './components/CommunityHub';
import PlaceholderView from './components/PlaceholderView';
import { Shield, Package, Target, Map, ScrollText } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'weapons':
        return <WeaponsDatabase />;
      case 'armor':
        return (
          <PlaceholderView
            title="Armor & Protection"
            description="Complete armor and equipment database"
            icon={Shield}
            stats={[
              { label: 'Total Armor Pieces', value: '186' },
              { label: 'Unique Sets', value: '42' },
              { label: 'Max Defense', value: '850' },
            ]}
          />
        );
      case 'items':
        return (
          <PlaceholderView
            title="Items & Resources"
            description="Consumables, materials, and resources database"
            icon={Package}
            stats={[
              { label: 'Total Items', value: '324' },
              { label: 'Consumables', value: '78' },
              { label: 'Resources', value: '156' },
            ]}
          />
        );
      case 'enemies':
        return (
          <PlaceholderView
            title="ARC Enemies"
            description="Enemy types, stats, and weaknesses"
            icon={Target}
            stats={[
              { label: 'Enemy Types', value: '47' },
              { label: 'Boss Variants', value: '12' },
              { label: 'Max Level', value: '50' },
            ]}
          />
        );
      case 'maps':
        return (
          <PlaceholderView
            title="Maps & Locations"
            description="Explore regions, zones, and points of interest"
            icon={Map}
            stats={[
              { label: 'Total Regions', value: '8' },
              { label: 'POIs', value: '124' },
              { label: 'Raid Zones', value: '15' },
            ]}
          />
        );
      case 'quests':
        return (
          <PlaceholderView
            title="Quests & Missions"
            description="Complete quest database and objectives"
            icon={ScrollText}
            stats={[
              { label: 'Total Quests', value: '156' },
              { label: 'Main Storyline', value: '28' },
              { label: 'Side Missions', value: '92' },
            ]}
          />
        );
      case 'trackers':
        return <Trackers />;
      case 'marketplace':
        return <Marketplace />;
      case 'community':
        return <CommunityHub />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
