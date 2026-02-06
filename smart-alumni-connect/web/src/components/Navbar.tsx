import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
    user: any;
    onLogout: () => void;
    role: string | undefined;
}

const Navbar = ({ user, onLogout, role }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🚀</span>
                        <span className="font-bold text-xl tracking-tight text-blue-600">AlumniConnect</span>
                        {role && (
                            <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-semibold ${role === 'alumni' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                {role}
                            </span>
                        )}
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gray-200" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <UserIcon size={16} />
                                        </div>
                                    )}
                                    <span className="font-medium">{user.displayName}</span>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Log Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-sm">Welcome, Guest</span>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
