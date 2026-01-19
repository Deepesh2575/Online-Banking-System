import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Send, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const navLinks = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/transfer', icon: Send, label: 'Transfer' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 p-4">
            <div className="container glass-panel rounded-full px-6 py-3 flex items-center justify-between" style={{ maxWidth: '1000px', margin: '0 auto', borderRadius: 'var(--radius-full)' }}>
                <Link to="/" className="flex items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} />
                    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>BankApp+</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6" style={{ display: 'flex', gap: '1.5rem' }}>
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="relative flex items-center gap-2 px-3 py-1 transition-colors"
                                style={{ color: isActive ? 'white' : 'var(--text-muted)' }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', position: 'absolute', inset: 0 }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <link.icon size={18} className="relative z-10" />
                                <span className="relative z-10 font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel" style={{ padding: '0.4rem 1rem' }}>
                        <User size={16} className="text-primary" style={{ color: 'var(--accent)' }} />
                        <span className="text-sm font-medium">{user.name}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn-primary p-2 rounded-full"
                        style={{ padding: '0.6rem', borderRadius: '50%', minWidth: 'auto' }}
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
