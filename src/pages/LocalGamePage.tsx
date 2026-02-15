import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Bot } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { GameBoard } from '../components/game/GameBoard';
import { PlayerCards } from '../components/game/PlayerCards';
import { GameResult } from '../components/game/GameResult';
import { useLocalGame } from '../hooks/useLocalGame';
import type { GameMode } from '../hooks/useLocalGame';
import { useAuth } from '../context/AuthContext';
import type { Player } from '../hooks/useOnlineGame';

export default function LocalGamePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { displayName } = useAuth();

    const mode = (searchParams.get('mode') as GameMode) || 'FRIEND';
    const userSymbol: Player = 'X'; // Por ahora el usuario siempre es X en modo IA
    const playerXName = displayName || 'Jugador 1';
    const playerOName = mode === 'AI' ? 'Máquina' : 'Jugador 2';

    const {
        board,
        turn,
        status,
        winner,
        gameResetCount,
        handleMove,
        resetGame
    } = useLocalGame(mode, userSymbol as any);

    // En modo IA, el rol del jugador humano es fijo. 
    // En modo LOCAL (amigo), el rol cambia según el turno para permitir que ambos jueguen.
    const playerRole = mode === 'AI' ? userSymbol : (turn as Player);

    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Navbar onLogoClick={() => navigate('/')} />

            <main className="flex-1 flex flex-col relative max-w-2xl mx-auto w-full px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-medium hover:text-purple-400 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                        {mode === 'AI' ? (
                            <><Bot className="w-3.5 h-3.5" /> vs Máquina</>
                        ) : (
                            <><User className="w-3.5 h-3.5" /> Modo Local</>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <PlayerCards
                        turn={turn as Player}
                        status={status as any}
                        playerXName={playerXName}
                        playerOName={playerOName}
                    />

                    <div className={`relative transition-all duration-500 ${winner ? 'blur-sm scale-95 opacity-40' : ''}`}>
                        <GameBoard
                            key={gameResetCount}
                            board={board as any}
                            status={status as any}
                            turn={turn as Player}
                            playerRole={playerRole}
                            winner={winner as any}
                            onMove={handleMove}
                        />
                    </div>


                </div>

                <AnimatePresence>
                    {winner && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                            <GameResult
                                winner={winner as any}
                                playerXName={playerXName}
                                playerOName={playerOName}
                                isAbandonedGame={false}
                                waitingForRematch={false}
                                rematchIncoming={null}
                                onRequestRematch={resetGame}
                                onAcceptRematch={resetGame}
                                onGoHome={() => navigate('/')}
                                isSpectator={false}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
