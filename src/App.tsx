import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateForkPage from './pages/CreateForkPage';
import ForkDetailPage from './pages/ForkDetailPage';
import AiChatPage from './pages/AiChatPage';
import LoginPage from './pages/LoginPage';

// --- 视图状态类型 ---
type View =
  | { page: 'home' }
  | { page: 'create' }
  | { page: 'detail'; forkId: string }
  | { page: 'ai-chat' };

function App() {
  const auth = useAuth();
  const [currentView, setCurrentView] = useState<View>({ page: 'home' });

  // 加载中
  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="flex items-center gap-2 text-amber-600">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">加载中…</span>
        </div>
      </div>
    );
  }

  // 未登录 → 显示登录页
  if (!auth.user) {
    return <LoginPage auth={auth} />;
  }

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  return (
    <Layout
      userEmail={auth.user.email}
      onSignOut={auth.signOut}
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

      {currentView.page === 'ai-chat' && (
        <AiChatPage />
      )}
    </Layout>
  );
}

export default App;
