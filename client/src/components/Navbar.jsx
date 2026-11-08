import React, { useState } from 'react';
import { 
  Package, Bell, User, LogOut, Shield, ChevronDown, Check, 
  Menu, X, Laptop, ClipboardList, Layers, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './Badge';

export function Navbar({ activePage, setActivePage, onOpenBorrowSlip }) {
  const { user, logout, notifications, unreadNotifCount, markAllNotificationsRead } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setActivePage('catalog')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  CampusEquip
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    PROD
                  </span>
                </span>
                <span className="block text-[11px] text-slate-500 font-medium -mt-0.5">
                  College Equipment Borrowing System
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActivePage('catalog')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activePage === 'catalog'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Equipment Catalog
              </button>

              {user && (
                <button
                  onClick={() => setActivePage('borrower-dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activePage === 'borrower-dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  My Loans & Slips
                </button>
              )}

              {user && (user.role === 'staff' || user.role === 'admin') && (
                <button
                  onClick={() => setActivePage('staff')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activePage === 'staff'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Custodian Desk
                </button>
              )}

              {user && user.role === 'admin' && (
                <button
                  onClick={() => setActivePage('admin')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activePage === 'admin'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  Admin Control Center
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    if (!showNotifs && unreadNotifCount > 0) markAllNotificationsRead();
                  }}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
                      <span className="font-bold">Notifications ({notifications.length})</span>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[11px] text-blue-400 hover:text-white underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition ${n.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-900">{n.title}</span>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="block -mt-0.5">
                      <RoleBadge role={user.role} />
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      <div className="mt-1">
                        <RoleBadge role={user.role} />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActivePage('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        setActivePage('catalog');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('login')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActivePage('register')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => { setActivePage('catalog'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Equipment Catalog
          </button>
          {user && (
            <button
              onClick={() => { setActivePage('borrower-dashboard'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              My Loans & Slips
            </button>
          )}
          {user && (user.role === 'staff' || user.role === 'admin') && (
            <button
              onClick={() => { setActivePage('staff'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Custodian Desk
            </button>
          )}
          {user && user.role === 'admin' && (
            <button
              onClick={() => { setActivePage('admin'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Admin Control Center
            </button>
          )}

          {!user && (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { setActivePage('login'); setMobileMenuOpen(false); }}
                className="w-1/2 py-2 text-center text-xs font-bold text-slate-700 bg-slate-50 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => { setActivePage('register'); setMobileMenuOpen(false); }}
                className="w-1/2 py-2 text-center text-xs font-bold text-white bg-blue-600 rounded-xl"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
