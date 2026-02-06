
import React from 'react';
import { Page, Alum } from '../types';

interface Props {
  currentPage: Page;
  isAuthenticated: boolean;
  onPageChange: (page: Page) => void;
  children: React.ReactNode;
  currentUser: Alum | null;
}

const Layout: React.FC<Props> = ({ currentPage, isAuthenticated, onPageChange, children, currentUser }) => {
  const navItems = [
    { id: Page.Dashboard, label: 'Center', desktopLabel: 'Command Center', icon: '⚡' },
    { id: Page.Directory, label: 'Search', desktopLabel: 'Discovery', icon: '🔍' },
    { id: Page.MentorshipMatch, label: 'Vibe', desktopLabel: 'Lightning Match', icon: '✨' },
    { id: Page.Jobs, label: 'Jobs', desktopLabel: 'Opportunity', icon: '💼' },
    { id: Page.Events, label: 'Events', desktopLabel: 'Community', icon: '📅' },
    { id: Page.Networking, label: 'Chat', desktopLabel: 'Relationships', icon: '💬' },
    { id: Page.Analytics, label: 'Data', desktopLabel: 'Insights', icon: '📊' },
  ];

  const hideSidebar = !isAuthenticated || [Page.Landing, Page.Login, Page.SignUp].includes(currentPage);

  if (hideSidebar) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-64 bg-white h-screen sticky top-0 flex-col border-r border-gray-100 shadow-sm p-6 z-50">
        <div 
          className="text-2xl font-bold mb-10 cursor-pointer flex items-center gap-2"
          onClick={() => onPageChange(Page.Landing)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg" />
          <span className="text-gradient">AlumniPulse</span>
        </div>
        
        <div className="flex-1 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                currentPage === item.id 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.desktopLabel}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button 
            onClick={() => onPageChange(Page.Profile)}
            className={`flex items-center gap-3 w-full p-2 rounded-xl transition-all ${
              currentPage === Page.Profile ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'
            }`}
          >
            <img src={currentUser?.avatar || "https://picsum.photos/seed/user/100/100"} className="w-10 h-10 rounded-full border border-indigo-200 object-cover" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{currentUser?.name || "Alex Rivera"}</p>
              <p className="text-xs text-gray-500">View Profile</p>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-2" onClick={() => onPageChange(Page.Landing)}>
           <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-md" />
           <span className="font-bold text-slate-900 text-lg">AlumniPulse</span>
        </div>
        <button 
          onClick={() => onPageChange(Page.Profile)}
          className="w-8 h-8 rounded-full border border-indigo-200 overflow-hidden"
        >
          <img src={currentUser?.avatar || "https://picsum.photos/seed/user/100/100"} className="w-full h-full object-cover" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-2 py-3 z-[60] flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${
              currentPage === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
