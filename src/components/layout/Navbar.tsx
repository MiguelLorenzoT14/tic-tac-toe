import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavbarProps {
    onLogoClick?: () => void;
}

export function Navbar({ onLogoClick }: NavbarProps) {
    const { user, signOut, displayName } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    <Link
                        to="/"
                        onClick={(e) => {
                            if (onLogoClick) {
                                e.preventDefault();
                                onLogoClick();
                            }
                        }}
                        className="text-lg font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent"
                    >
                        TicTacToe Pro
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">

                        <motion.button
                            whileTap={{ scale: 0.9, rotate: 180 }}
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--border-color)] transition-all"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-[18px] h-[18px] text-yellow-400" />
                            ) : (
                                <Moon className="w-[18px] h-[18px] text-indigo-500" />
                            )}
                        </motion.button>

                        {user && (
                            <>
                                <div className="hidden md:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <User className="w-4 h-4" />
                                    <span>{displayName || user.email}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                    <LogOut className="w-4 h-4 mr-1.5" />
                                    <span className="hidden sm:inline">Cerrar Sesión</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
