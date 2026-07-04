import { useState } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateForkPage from './pages/CreateForkPage';
import ForkDetailPage from './pages/ForkDetailPage';

// --- 视图状态类型 ---
type View =
  | { page: 'home' }
  | { page: 'create' }
  | { page: 'detail'; forkId: string };

function App() {
  const [currentView, setCurrentView] = useState<View>({ page: 'home' });

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  return (
    <Layout
      onNavigate={handleNavigate}
      currentPage={currentView.page}
    >
      {currentView.page === 'home' && (
        <HomePage
          onNewFork={() => setCurrentView({ page: 'create' })}
          onSelectFork={(id) => setCurrentView({ page: 'detail', forkId: id })}
        />
      )}

      {currentView.page === 'create' && (
        <CreateForkPage
          onSaved={() => setCurrentView({ page: 'home' })}
          onCancel={() => setCurrentView({ page: 'home' })}
        />
      )}

      {currentView.page === 'detail' && (
        <ForkDetailPage
          forkId={currentView.forkId}
          onBack={() => setCurrentView({ page: 'home' })}
          onDeleted={() => setCurrentView({ page: 'home' })}
        />
      )}
    </Layout>
  );
}

export default App;
