import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Handshake, Trophy, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Player } from '../../hooks/useOnlineGame';
import { useEffect, useState } from 'react';

interface Props {
    winner: Player | 'DRAW' | null;
    playerXName: string;
    playerOName: string;
    isAbandonedGame: boolean;
    waitingForRematch: boolean;
    rematchIncoming: string | null;
    onRequestRematch: () => void;
    onAcceptRematch: () => void;
    onGoHome: () => void;
    isSpectator: boolean;
}

interface Particle {
    id: number;
    color: string;
    left: string;
    delay: number;
    size: number;
    borderRadius: string;
}


function ConfettiExplosion() {
    const [particles] = useState<Particle[]>(() => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 0.8,
            size: 6 + Math.random() * 8,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        }));
    });

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="confetti-particle"
                    style={{
                        left: p.left,
                        backgroundColor: p.color,
                        width: p.size,
                        height: p.size,
                        animationDelay: `${p.delay}s`,
                        borderRadius: p.borderRadius,
                    }}
                />
            ))}
        </div>
    );
}

export function GameResult({
    winner,
    playerXName,
    playerOName,
    isAbandonedGame,
    waitingForRematch,
    rematchIncoming,
    onRequestRematch,
    onAcceptRematch,
    onGoHome,
    isSpectator
}: Props) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (winner && winner !== 'DRAW' && !isAbandonedGame) {
            const startTimer = setTimeout(() => {
                setShowConfetti(true);
            }, 0);

            const stopTimer = setTimeout(() => setShowConfetti(false), 3000);

            return () => {
                clearTimeout(startTimer);
                clearTimeout(stopTimer);
            };
        }
    }, [winner, isAbandonedGame]);

    if (!winner) return null;

    const winnerName = winner === 'X' ? playerXName : winner === 'O' ? playerOName : null;

    return (
        <AnimatePresence>
            {showConfetti && <ConfettiExplosion key="confetti" />}

            <motion.div
                key="modal"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center space-y-4 bg-white/5 p-5 sm:p-6 rounded-xl border border-white/10 mt-4 backdrop-blur-md w-full max-w-sm relative overflow-hidden"
            >

                {rematchIncoming && !isAbandonedGame && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute inset-x-0 top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 text-sm text-white font-medium z-10 shadow-lg"
                    >
                        🎮 ¡{rematchIncoming} quiere la revancha!
                    </motion.div>
                )}


                <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                    className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center animate-float ${winner === 'DRAW'
                        ? 'bg-purple-500/20 text-purple-400'
                        : winner === 'X'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                >
                    {winner === 'DRAW' ? <Minus className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
                </motion.div>


                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className={`text-2xl sm:text-3xl font-bold ${rematchIncoming ? 'pt-6' : ''}`}
                >
                    {winner === 'DRAW' ? (
                        <span className="text-purple-400">¡Empate!</span>
                    ) : (
                        <span className={winner === 'X' ? 'text-blue-400' : 'text-emerald-400'}>
                            🎉 ¡{winnerName} Gana!
                        </span>
                    )}
                </motion.h2>

                {isAbandonedGame && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-400"
                    >
                        (Victoria por abandono del oponente)
                    </motion.p>
                )}


                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col gap-3 pt-2"
                >

                    {!isAbandonedGame && !isSpectator && (
                        <>
                            {rematchIncoming ? (
                                <motion.div
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    <Button onClick={onAcceptRematch} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25">
                                        <Handshake className="w-4 h-4 mr-2" />
                                        Aceptar Revancha
                                    </Button>
                                </motion.div>
                            ) : (
                                <Button
                                    onClick={onRequestRematch}
                                    variant="secondary"
                                    className="w-full"
                                    disabled={waitingForRematch}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${waitingForRematch ? 'animate-spin' : ''}`} />
                                    {waitingForRematch ? 'Esperando respuesta...' : 'Jugar de Nuevo'}
                                </Button>
                            )}
                        </>
                    )}

                    <Button onClick={onGoHome} variant="outline" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Inicio
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
