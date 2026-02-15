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
                        <div className="flex items-center gap-1">
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://github.com/MiguelLorenzoT14/tic-tac-toe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--border-color)] transition-all text-[var(--text-primary)]"
                                aria-label="GitHub Repository"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-[18px] h-[18px] fill-current"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>
                            </motion.a>

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
                        </div>

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
