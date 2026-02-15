import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Copy, Check, Users, Shield } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { PlayerCards } from '../components/game/PlayerCards';
import { GameBoard } from '../components/game/GameBoard';
import { GameResult } from '../components/game/GameResult';
import { AbandonModal } from '../components/game/AbandonModal';
import { useOnlineGame } from '../hooks/useOnlineGame';

export default function OnlineGamePage() {
    const {
        board, status, turn, winner, playerRole,
        playerXName, playerOName,
        copied, loading, showAbandonModal, abandoning,
        isAbandonedGame, waitingForRematch, rematchIncoming,
        handleMove, handleCancelGame, handleAbandonGame,
        copyLink, setShowAbandonModal, navigate,
        requestRematch, acceptRematch, gameResetCount
    } = useOnlineGame();


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Conectando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-purple-500/30" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Navbar
                onLogoClick={() => {
                    if (status === 'PLAYING') return;
                    if (status === 'WAITING') return handleCancelGame();
                    navigate('/');
                }}
            />

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {status === 'WAITING' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="flex-1 flex flex-col items-center justify-center p-6 gap-8 sm:gap-10 max-w-lg mx-auto w-full"
                        >

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center gap-6">

                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                                    <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 relative backdrop-blur-sm">
                                        <Users className="w-10 h-10 text-purple-400" />


                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 rounded-full"
                                        >
                                            <div className="w-3 h-3 bg-purple-400 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                        Esperando Rival
                                    </h2>
                                    <p className="font-medium" style={{ color: 'var(--text-muted)' }}>
                                        Comparte el enlace para comenzar
                                    </p>
                                </div>
                            </div>

                            <div className="w-full space-y-4 z-10">
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={copyLink}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                    {copied ? '¡Estás listo!' : 'Copiar Enlace'}
                                </motion.button>

                                <button
                                    onClick={handleCancelGame}
                                    className="w-full py-3 text-sm transition-colors font-medium hover:bg-purple-500/10 rounded-lg" style={{ color: 'var(--text-muted)' }}
                                >
                                    Cancelar espera
                                </button>
                            </div>
                        </motion.div>
                    )}


                    {status !== 'WAITING' && (
                        <motion.div
                            key="game"
                            className="flex-1 flex flex-col relative w-full h-full"
                        >

                            <div className="pt-2 pb-2 px-4 flex-none z-10 w-full max-w-2xl mx-auto">
                                <PlayerCards
                                    turn={turn}
                                    status={status}
                                    playerXName={playerXName}
                                    playerOName={playerOName}
                                />
                            </div>


                            <div className={`flex-1 flex items-center justify-center p-4 relative transition-all duration-500 ${winner ? 'blur-sm scale-95 opacity-40' : ''}`}>
                                <GameBoard
                                    key={gameResetCount}
                                    board={board}
                                    status={status}
                                    turn={turn}
                                    playerRole={playerRole}
                                    winner={winner}
                                    onMove={handleMove}
                                />
                            </div>


                            {!winner && playerRole !== 'SPECTATOR' && (
                                <div className="absolute bottom-6 right-6 z-20">
                                    <button
                                        onClick={() => setShowAbandonModal(true)}
                                        className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}
                                    >
                                        <XCircle className="w-3.5 h-3.5" /> Abandonar
                                    </button>
                                </div>
                            )}

                            {!winner && playerRole === 'SPECTATOR' && (
                                <div className="absolute bottom-6 right-6 z-20 backdrop-blur px-3 py-1.5 rounded-full text-xs text-yellow-500 flex items-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                    <Shield className="w-3.5 h-3.5" /> Modo Espectador
                                </div>
                            )}


                            <AnimatePresence>
                                {winner && (
                                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                                        <GameResult
                                            winner={winner}
                                            playerXName={playerXName}
                                            playerOName={playerOName}
                                            isAbandonedGame={isAbandonedGame}
                                            waitingForRematch={waitingForRematch}
                                            rematchIncoming={rematchIncoming}
                                            onRequestRematch={requestRematch}
                                            onAcceptRematch={acceptRematch}
                                            isSpectator={playerRole === 'SPECTATOR'}
                                            onGoHome={() => navigate('/')}
                                        />
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>


            <AbandonModal
                show={showAbandonModal}
                abandoning={abandoning}
                onClose={() => setShowAbandonModal(false)}
                onConfirm={handleAbandonGame}
            />
        </div>
    );
}
