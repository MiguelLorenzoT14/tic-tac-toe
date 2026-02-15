import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle } from 'lucide-react';

interface Props {
    show: boolean;
    abandoning: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function AbandonModal({ show, abandoning, onClose, onConfirm }: Props) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => !abandoning && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-panel p-5 sm:p-6 rounded-2xl w-full max-w-sm space-y-4 sm:space-y-5 border border-red-500/30 shadow-2xl shadow-red-500/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">¿Abandonar partida?</h3>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed">
                            Si abandonas la partida, <span className="text-red-400 font-semibold">se contará como una derrota</span> en tus estadísticas
                            y tu oponente recibirá la victoria.
                        </p>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                            <p className="text-red-400 text-sm font-medium">⚠️ Esta acción no se puede deshacer</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                disabled={abandoning}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-white/5 transition-all font-medium text-sm"
                            >
                                Seguir Jugando
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={abandoning}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {abandoning ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Abandonar
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
