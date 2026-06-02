'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeInitializer from './ThemeInitializer';
import { useAuthStore } from '@/store/useAuthStore';
import { useSyncStore } from '@/store/useSyncStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAlertStore } from '@/store/useAlertStore';
import { translations } from '@/lib/translations';
import AlertModal from '@/components/ui/AlertModal';
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  BarChart2, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Plus, 
  Menu, 
  X,
  Wifi,
  WifiOff,
  Globe,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };
  
  const { user, clearSession } = useAuthStore();
  const { isOnline, setOnlineStatus } = useSyncStore();
  const { language, setLanguage } = useLanguageStore();

  const t = translations[language] || translations['es'];

  // Sync online status listener
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Intercept native window.alert to show our premium modal alert instead
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      useAlertStore.getState().showAlert(String(message));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/auth/login');
  };

  // Global search bindings and 300ms debounce
  const { searchQuery, setSearchQuery, setDebouncedQuery, setIsSearching } = useSearchStore();

  useEffect(() => {
    if (!searchQuery) {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, setDebouncedQuery, setIsSearching]);

  // Clear search on navigation/path changes
  useEffect(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, [pathname, setSearchQuery, setDebouncedQuery, setIsSearching]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellContainerRef = useRef<HTMLDivElement>(null);

  // Load and poll notifications
  useEffect(() => {
    if (!user) return;

    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success && data.notifications) {
          const parsed = data.notifications.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt)
          }));
          setNotifications(parsed);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll

    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close bell dropdown
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (bellContainerRef.current && !bellContainerRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navigationItems = [
    { name: t.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.incomes, href: '/incomes', icon: TrendingUp },
    { name: t.expenses, href: '/expenses', icon: ShoppingCart },
    { name: t.bills, href: '/invoices', icon: Receipt },
    { name: t.reports, href: '/reports', icon: BarChart2 },
    { name: t.profile, href: '/profile', icon: User },
  ];

  // If on login/register routes, don't wrap with layout navigation

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ThemeInitializer />
        {children}
      </div>
    );
  }

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      <ThemeInitializer />
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-card border-r border-border shadow-sm z-40 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-[80px] p-3 items-center' : 'w-[280px] p-6'
      }`}>
        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-[var(--foreground)] hover:bg-muted transition-all shadow-xs cursor-pointer z-50 active:scale-90"
          title={isSidebarCollapsed ? (language === 'es' ? 'Expandir menú' : 'Expand menu') : (language === 'es' ? 'Colapsar menú' : 'Collapse menu')}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className={`text-2xl font-black text-[var(--primary)] tracking-tight flex items-center transition-all w-full ${
          isSidebarCollapsed ? 'justify-center py-4' : 'px-6 py-6 justify-between'
        }`}>
          {isSidebarCollapsed ? (
            <img src="/logo.png" alt="FC Logo" className="w-10 h-10 rounded-xl object-contain border border-[var(--primary)]/10" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="FinControl Logo" className="w-8 h-8 rounded-lg object-contain" />
                <span>FinControl</span>
              </div>
              {!isOnline && (
                <span className="text-[10px] font-normal text-error bg-error/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> {t.offline}
                </span>
              )}
            </>
          )}
        </div>
        
        {/* Sidebar User Profile has been completely removed as requested (to be placed in top header) */}

        {/* Navigation Links */}
        <nav className={`flex-1 space-y-1 w-full ${isSidebarCollapsed ? 'px-1' : ''}`}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center gap-4 rounded-xl transition-all active:scale-[0.98] ${
                  isSidebarCollapsed ? 'p-3 justify-center' : 'px-6 py-3.5'
                } ${
                  isActive 
                    ? 'text-[var(--primary)] font-bold bg-[var(--primary)]/10' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--primary)]' : ''}`} />
                {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`mt-auto border-t border-border pt-4 w-full ${isSidebarCollapsed ? 'space-y-3 px-1' : 'space-y-1.5'}`}>
          {/* Quick Language Toggle */}
          <button 
            onClick={toggleLanguage}
            title="Idioma / Language"
            className={`w-full flex items-center rounded-xl transition-colors text-sm font-medium text-muted-foreground hover:bg-muted ${
              isSidebarCollapsed ? 'p-3 justify-center' : 'px-6 py-3 justify-between'
            }`}
          >
            <span className="flex items-center gap-4 shrink-0">
              <Globe className="w-5 h-5" />
              {!isSidebarCollapsed && <span>Idioma / Language</span>}
            </span>
            {!isSidebarCollapsed && (
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs px-2 py-0.5 rounded-full font-bold uppercase">
                {language}
              </span>
            )}
          </button>

          <Link 
            href="/settings"
            title={t.settings}
            className={`flex items-center gap-4 rounded-xl transition-colors text-muted-foreground hover:bg-muted ${
              isSidebarCollapsed ? 'p-3 justify-center' : 'px-6 py-3'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">{t.settings}</span>}
          </Link>
          
          <button 
            onClick={handleLogout}
            title={t.logout}
            className={`w-full flex items-center rounded-xl transition-colors font-bold text-sm text-error hover:bg-error/10 ${
              isSidebarCollapsed ? 'p-3 justify-center' : 'px-6 py-3 mt-2'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <main className={`flex-grow pb-24 lg:pb-0 min-h-screen bg-[var(--background)] transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
      }`}>
        {/* Mobile Header Spacer */}
        <div className="h-[73px] lg:hidden shrink-0" />

        {/* Top Header */}
        <header className="flex justify-between items-center w-full px-6 py-4 border-b border-border fixed top-0 left-0 right-0 lg:sticky lg:top-0 z-30 bg-[var(--background)]/80 backdrop-filter backdrop-blur-md">
          {/* Logo centrado en móvil */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 shrink-0 pointer-events-none select-none">
            <img src="/logo.png" alt="FinControl Logo" className="w-6 h-6 object-contain" />
            <span className="text-base font-black text-[var(--primary)] tracking-tight">FinControl</span>
          </div>

          {/* Avatar + Username integrated, Premium Member text removed as requested */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm overflow-hidden border border-border shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.fullName ? user.fullName[0] : 'U'
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-[var(--foreground)] truncate leading-tight">
                {user?.fullName || 'Invitado'}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold hidden sm:inline leading-none mt-0.5">
                {language === 'es' ? 'Bienvenido a FinControl' : 'Welcome to FinControl'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Bell Notification Dropdown */}
            <div className="relative" ref={bellContainerRef}>
              <button 
                onClick={() => setBellOpen(!bellOpen)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full relative transition-colors active:scale-95"
                title="Notificaciones / Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 text-[9px] font-bold text-white bg-error rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="fixed sm:absolute top-[73px] sm:top-auto right-4 sm:right-0 mt-3 w-[calc(100vw-32px)] sm:w-[380px] bg-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden divide-y divide-border/50 animate-in fade-in slide-in-from-top-3 duration-200 backdrop-blur-lg bg-card/90">
                  {/* Dropdown Header */}
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-black text-[var(--foreground)]">
                      {language === 'es' ? 'Notificaciones' : 'Notifications'}
                    </span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Marcar todas como leídas' : 'Mark all as read'}
                      </button>
                    )}
                  </div>

                  {/* Dropdown Body */}
                  <div className="max-h-[350px] overflow-y-auto divide-y divide-border/30">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40 stroke-[1.5]" />
                        <p className="text-xs font-semibold">
                          {language === 'es' ? 'No tienes notificaciones' : 'No notifications yet'}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {language === 'es' ? 'Te avisaremos cuando haya novedades' : 'We will notify you when there are updates'}
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const iconColor = 
                          notif.type === 'success' ? 'bg-success/15 text-success' :
                          notif.type === 'warning' ? 'bg-warning/15 text-warning' :
                          notif.type === 'error' ? 'bg-error/15 text-error' :
                          'bg-[var(--primary)]/10 text-[var(--primary)]';

                        return (
                          <div 
                            key={notif.id} 
                            className={`p-4 flex gap-3 hover:bg-muted/40 transition-colors relative group ${
                              !notif.read ? 'bg-muted/20' : ''
                            }`}
                          >
                            {/* Unread indicator dot */}
                            {!notif.read && (
                              <span className="absolute top-4 right-4 w-2 h-2 bg-error rounded-full" />
                            )}
                            
                            {/* Type icon wrapper */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                              {notif.type === 'success' && <Check className="w-4 h-4" />}
                              {notif.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                              {notif.type === 'error' && <X className="w-4 h-4" />}
                              {notif.type === 'info' && <Info className="w-4 h-4" />}
                            </div>

                            {/* Message text */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h5 className={`text-xs font-bold leading-tight ${notif.read ? 'text-muted-foreground' : 'text-[var(--foreground)]'}`}>
                                {notif.title}
                              </h5>
                              <p className="text-[10px] text-muted-foreground/90 mt-1 leading-normal whitespace-pre-line">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-muted-foreground/50 mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Action to mark as read */}
                            {!notif.read && (
                              <button 
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-3 text-[10px] font-bold text-[var(--primary)] bg-background/90 px-2 py-0.5 rounded-full border border-border shadow-xs hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95"
                                title="Marcar como leída / Mark as read"
                              >
                                {language === 'es' ? 'Marcar' : 'Read'}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[73px] bg-background/98 backdrop-blur-md z-40 p-6 flex flex-col gap-4 overflow-y-auto pb-24">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${
                      isActive 
                        ? 'text-[var(--primary)] font-bold bg-[var(--primary)]/10' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="mt-auto border-t border-border pt-4 space-y-3">
              {/* Language Switcher Mobile */}
              <button 
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-6 py-4 text-muted-foreground hover:bg-muted rounded-xl transition-colors font-semibold text-sm"
              >
                <span className="flex items-center gap-4">
                  <Globe className="w-5 h-5" />
                  <span>Idioma / Language</span>
                </span>
                <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs px-3 py-1 rounded-full font-bold uppercase">
                  {language}
                </span>
              </button>

              {/* Settings Mobile Option */}
              <Link 
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-6 py-4 text-muted-foreground hover:bg-muted rounded-xl transition-colors font-semibold text-sm"
              >
                <Settings className="w-5 h-5" />
                <span>{t.settings}</span>
              </Link>

              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-4 px-6 py-4 text-error hover:bg-error/10 rounded-xl transition-colors font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                {t.logout}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic page content */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* 3. MOBILE BOTTOM NAVBAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-[68px] z-50 flex justify-around items-center px-6 bg-card border-t border-border shadow-lg">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform ${
                isActive ? 'text-[var(--primary)] font-bold' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Premium Global Alert Modal */}
      <AlertModal />
    </div>
  );
}
