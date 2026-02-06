
import React from 'react';
import { Page, type UserProfile } from '../types';

interface Props {
    currentPage: Page;
    isAuthenticated: boolean;
    onPageChange: (page: Page) => void;
    onLogout: () => void;
    children: React.ReactNode;
    currentUser: UserProfile | null;
}

const Layout: React.FC<Props> = ({ currentPage, isAuthenticated, onPageChange, onLogout, children, currentUser }) => {
    const navItems = [
        { id: Page.Dashboard, label: 'Center', desktopLabel: 'Command Center', icon: '⚡' },
        { id: Page.Directory, label: 'Search', desktopLabel: 'Discovery', icon: '🔍' },
        { id: Page.Jobs, label: 'Jobs', desktopLabel: 'Opportunity', icon: '💼' },
        { id: Page.Events, label: 'Events', desktopLabel: 'Community', icon: '📅' },
        { id: Page.Networking, label: 'Chat', desktopLabel: 'Relationships', icon: '💬' },
        { id: Page.Analytics, label: 'Data', desktopLabel: 'Insights', icon: '📊' },
    ];

    const hideSidebar = !isAuthenticated || [Page.Landing, Page.Login, Page.SignUp].includes(currentPage);

    if (hideSidebar) return <>{children}</>;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-surface bg-dot-pattern">
            {/* Desktop Sidebar - Oxford Blue */}
            <nav className="hidden md:flex w-64 bg-oxford h-screen sticky top-0 flex-col p-6 z-50 shadow-premium">
                <div
                    className="text-2xl font-heading font-bold mb-10 cursor-pointer flex items-center gap-3"
                    onClick={() => onPageChange(Page.Dashboard)}
                >
                    <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center text-oxford font-black text-lg">A</div>
                    <span className="text-white tracking-tight">Alumni<span className="text-gold">Pulse</span></span>
                </div>

                <div className="flex-1 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${currentPage === item.id
                                ? 'bg-white/10 text-gold border border-gold/20'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span className="font-medium text-sm">{item.desktopLabel}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <button
                        onClick={() => onPageChange(Page.Profile)}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentPage === Page.Profile ? 'bg-white/10 border border-gold/20' : 'hover:bg-white/5'
                            }`}
                    >
                        <img src={currentUser?.photoURL || "https://picsum.photos/seed/user/100/100"} className="w-10 h-10 rounded-full border-2 border-gold object-cover" alt="Profile" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-white line-clamp-1">{currentUser?.displayName || "Alumni User"}</p>
                            <p className="text-xs text-white/50">View Profile</p>
                        </div>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full mt-3 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-alert hover:bg-white/5 rounded-xl transition-all"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-oxford sticky top-0 z-40 shadow-card">
                <div className="flex items-center gap-2" onClick={() => onPageChange(Page.Dashboard)}>
                    <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-oxford font-black text-sm">A</div>
                    <span className="font-heading font-bold text-white text-lg">Alumni<span className="text-gold">Pulse</span></span>
                </div>
                <button
                    onClick={() => onPageChange(Page.Profile)}
                    className="w-9 h-9 rounded-full border-2 border-gold overflow-hidden"
                >
                    <img src={currentUser?.photoURL || "https://picsum.photos/seed/user/100/100"} className="w-full h-full object-cover" alt="Profile" />
                </button>
            </div>

            {/* Mobile Bottom Navigation - Glass Effect */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 glass px-2 py-3 z-[60] flex justify-around items-center shadow-glass">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`flex flex-col items-center gap-1 min-w-[50px] transition-all ${currentPage === item.id ? 'text-oxford scale-110' : 'text-text-muted'
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
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
