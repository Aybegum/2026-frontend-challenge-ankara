import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Dashboard } from './pages/Dashboard';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <div className="layout-root">
        <Header />

        <div className="layout-main">
          <main className="layout-content" id="main-content">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1>404 — Page Not Found</h1>
      <p>This trail has gone cold.</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '10px' }} />
      ))}
    </div>
  );
}

export default App;
