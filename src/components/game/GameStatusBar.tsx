import { motion } from 'framer-motion';
import { Users, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import type { GameStatus } from '../../hooks/useOnlineGame';

interface Props {
    status: GameStatus;
    playerXName: string;
    playerOName: string;
    copied: boolean;
    onCopyLink: () => void;
}

export function GameStatusBar({ status, playerXName, playerOName, copied, onCopyLink }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="glass-panel p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full max-w-lg gap-3 sm:gap-0"
        >
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <motion.div
                    animate={status === 'PLAYING' ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className={`p-2 rounded-full shrink-0 ${status === 'PLAYING' ? 'bg-green-500/20 text-green-400' :
                        status === 'FINISHED' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}
                >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm sm:text-base flex items-center gap-2">
                        {status === 'WAITING' ? 'Esperando oponente...' :
                            status === 'FINISHED' ? 'Partida Finalizada' :
                                <>Partida en Curso <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" /></>}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                        {status === 'WAITING'
                            ? 'Comparte el link para invitar'
                            : `${playerXName} vs ${playerOName}`}
                    </p>
                </div>
            </div>

            {status === 'WAITING' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full sm:w-auto"
                >
                    <Button size="sm" variant="secondary" onClick={onCopyLink} className="w-full sm:w-auto">
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copiado' : 'Copiar Link'}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
