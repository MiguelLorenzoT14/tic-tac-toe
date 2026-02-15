import { Github } from 'lucide-react';

export function Footer() {
    return (
        <footer
            className="py-8 text-center text-xs font-medium tracking-wide flex flex-col items-center gap-3"
            style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
        >
            <p>
                © {new Date().getFullYear()} — Hecho por{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                    Miguel Enrique Lorenzo Torres
                </span>
            </p>
            <a
                href="https://github.com/MiguelLorenzoT14/tic-tac-toe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors duration-200"
            >
                <Github size={16} />
                <span className="underline underline-offset-4">Ver código en GitHub</span>
            </a>
        </footer>
    );
}
