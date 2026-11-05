import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CatalogPage } from './pages/CatalogPage';
import { BorrowerDashboard } from './pages/BorrowerDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { DigitalBorrowSlip } from './components/DigitalBorrowSlip';
import { ShieldCheck, Heart, Sparkles, Building2 } from 'lucide-react';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [activePage, setActivePage] = useState('catalog');
  const [activeBorrowSlip, setActiveBorrowSlip] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading CampusEquip...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenBorrowSlip={(slip) => setActiveBorrowSlip(slip)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activePage === 'catalog' && (
          <CatalogPage
            setActivePage={setActivePage}
            onOpenBorrowSlip={(slip) => setActiveBorrowSlip(slip)}
          />
        )}

        {activePage === 'borrower-dashboard' && (
          <BorrowerDashboard
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'staff' && (
          user && (user.role === 'staff' || user.role === 'admin') ? (
            <StaffDashboard />
          ) : (
            <LoginPage setActivePage={setActivePage} />
          )
        )}

        {activePage === 'admin' && (
          user && user.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You must be logged in as an administrator to access the system control panel.
              </p>
              <button
                onClick={() => setActivePage('catalog')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Return to Catalog
              </button>
            </div>
          )
        )}

        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
        {activePage === 'register' && <RegisterPage setActivePage={setActivePage} />}
        {activePage === 'profile' && (
          user ? <ProfilePage /> : <LoginPage setActivePage={setActivePage} />
        )}
      </main>

      {/* Global Digital Slip Modal if triggered from elsewhere */}
      {activeBorrowSlip && (
        <DigitalBorrowSlip
          request={activeBorrowSlip}
          onClose={() => setActiveBorrowSlip(null)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              CE
            </div>
            <span className="font-semibold text-slate-700">
              CampusEquip v1.0 • College Equipment Borrowing & Custody System
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span>Engineering Laboratories</span>
            <span>Media Production Hub</span>
            <span>Science Facilities</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Fully functional production release • 100% operational
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

