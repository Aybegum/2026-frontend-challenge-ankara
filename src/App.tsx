import { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import './styles/global.css';

// Lazy pages (to be built in subsequent commits)
// import { Dashboard } from './pages/Dashboard';

function App() {
  const [_sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="layout-root">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />

        <div className="layout-main">
          <main className="layout-content" id="main-content">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* Placeholder — Dashboard page will replace this in commit 2 */}
                <Route path="/" element={<ComingSoon />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

/* ------------------------------------------------------------------ */
/* Temporary placeholder components                                     */
/* ------------------------------------------------------------------ */

function ComingSoon() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '3rem' }}>🐾</span>
      <h1>Missing Podo: The Ankara Case</h1>
      <p>Investigation dashboard is being assembled…</p>
      <p className="text-muted text-sm">
        Foundation commit — types, API service &amp; design system in place.
      </p>
    </div>
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
