import { useState, useEffect } from 'react';
import { CreatePage } from '@/pages/CreatePage';
import { UpgradePage } from '@/pages/UpgradePage';
import { ExplorePage, CoverPage, LibraryPage } from '@/pages/OtherPages';
import { BottomNav } from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import type { Page } from '@/lib/types';

type View = Page | 'upgrade';

export default function App() {
  const [view, setView] = useState<View>('create');
  const [credits, setCredits] = useState(() => storage.getCredits());

  useEffect(() => {
    setCredits(storage.getCredits());
  }, []);

  const handleNavigate = (page: Page) => {
    setView(page);
  };

  const handleUpgrade = () => {
    setView('upgrade');
  };

  const handlePaid = (boughtCredits: number) => {
    setCredits(storage.getCredits());
    setView('create');
  };

  const showBottomNav = view !== 'upgrade';

  return (
    <div className="min-h-screen bg-[#0a0612]">
      {view === 'create' && <CreatePage onUpgrade={handleUpgrade} />}
      {view === 'explore' && <ExplorePage />}
      {view === 'cover' && <CoverPage />}
      {view === 'library' && <LibraryPage />}
      {view === 'upgrade' && (
        <UpgradePage onBack={() => setView('create')} onPaid={handlePaid} />
      )}

      {showBottomNav && (
        <BottomNav
          active={view === 'upgrade' ? 'create' : (view as Page)}
          onChange={handleNavigate}
        />
      )}
    </div>
  );
}
