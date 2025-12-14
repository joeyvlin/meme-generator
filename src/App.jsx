import { Link, useLocation } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { auth } from './config/instantdb';
import CreatePage from './pages/CreatePage';
import BrowsePage from './pages/BrowsePage';
import FetchPage from './pages/FetchPage';
import './styles/App.css';

function App() {
  const location = useLocation();
  // Get current user - InstantDB auth.user is reactive
  const user = auth.user;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Meme Generator</h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <nav style={{ display: 'flex', gap: '20px' }}>
              <Link
                to="/"
                style={{
                  color: location.pathname === '/' ? '#333' : '#999',
                  fontWeight: location.pathname === '/' ? 600 : 400,
                  textDecoration: 'none',
                  fontSize: '16px'
                }}
              >
                Create
              </Link>
              <Link
                to="/browse"
                style={{
                  color: location.pathname === '/browse' ? '#333' : '#999',
                  fontWeight: location.pathname === '/browse' ? 600 : 400,
                  textDecoration: 'none',
                  fontSize: '16px'
                }}
              >
                Browse
              </Link>
              <Link
                to="/fetch"
                style={{
                  color: location.pathname === '/fetch' ? '#333' : '#999',
                  fontWeight: location.pathname === '/fetch' ? 600 : 400,
                  textDecoration: 'none',
                  fontSize: '16px'
                }}
              >
                Fetch
              </Link>
            </nav>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {user.email || 'Signed in'}
                </span>
                <button
                  onClick={handleSignOut}
                  style={{
                    padding: '6px 12px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<CreatePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/fetch" element={<FetchPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

