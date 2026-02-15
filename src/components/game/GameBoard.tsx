import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import type { Player, GameStatus } from '../../hooks/useOnlineGame';

interface Props {
    board: (Player | null)[];
    status: GameStatus;
    turn: Player;
    playerRole: Player | 'SPECTATOR';
    winner: Player | 'DRAW' | null;
    onMove: (index: number) => void;
}

const gridVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.04,
        },
    },
};

const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function GameBoard({ board, status, turn, playerRole, winner, onMove }: Props) {
    const isMyTurn = turn === playerRole && status === 'PLAYING';

    return (
        <motion.div
            className={`relative w-full max-w-[340px] sm:max-w-[420px] aspect-square mx-auto transition-all duration-500 ${winner && winner !== 'DRAW' ? 'animate-victory-glow' : ''
                } ${isMyTurn && !winner ? 'scale-[1.02]' : ''
                }`}
            variants={gridVariants}
            initial="hidden"
            animate="visible"
        >

            {isMyTurn && !winner && (
                <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-60 blur-md animate-pulse -z-10" />
            )}


            <div
                className={`relative z-10 grid grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl shadow-2xl transition-colors duration-500 h-full ${isMyTurn ? 'border-2 border-indigo-500/50 shadow-indigo-500/20' : ''
                    }`}
                style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: isMyTurn ? undefined : '1px solid var(--border-color)',
                }}
            >

                {playerRole === 'SPECTATOR' && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-2xl">
                        <div className="bg-black/90 px-4 py-2 rounded-full border border-yellow-500/30 text-yellow-400 flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-xl">
                            <ShieldAlert className="w-4 h-4" /> Modo Espectador
                        </div>
                    </div>
                )}

                {board.map((square, i) => {
                    const canClick = !square && !winner && isMyTurn;

                    return (
                        <motion.button
                            key={i}
                            variants={cellVariants}
                            whileHover={canClick ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.03)' } : {}}
                            whileTap={canClick ? { scale: 0.95 } : {}}
                            onClick={() => onMove(i)}
                            disabled={!canClick}
                            className={`
                                relative aspect-square rounded-xl text-5xl sm:text-6xl font-black
                                flex items-center justify-center overflow-hidden
                                transition-all duration-300
                                ${square === 'X' ? 'bg-blue-500/10 text-blue-500' : ''}
                                ${square === 'O' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                                ${canClick
                                    ? 'cursor-pointer hover:ring-2 ring-indigo-500/30 hover:shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]'
                                    : 'cursor-default'
                                }
                            `}
                            style={!square ? { backgroundColor: 'var(--card-bg)' } : undefined}
                        >

                            {!square && canClick && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity" />
                            )}

                            {square && (
                                <motion.span
                                    initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
                                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                    className={`relative z-10 drop-shadow-2xl ${square === 'X'
                                        ? 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                        : 'drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        }`}
                                >
                                    {square}
                                </motion.span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
