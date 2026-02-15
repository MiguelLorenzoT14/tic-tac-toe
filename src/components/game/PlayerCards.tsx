import { motion } from 'framer-motion';
import type { Player, GameStatus } from '../../hooks/useOnlineGame';

interface Props {
    turn: Player;
    status: GameStatus;
    playerXName: string;
    playerOName: string;
}

const cardVariants = {
    inactive: { scale: 1, y: 0 },
    active: {
        scale: 1.05,
        y: -2,
        transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
    },
};

export function PlayerCards({ turn, status, playerXName, playerOName }: Props) {
    const xIsActive = turn === 'X' && status === 'PLAYING';
    const oIsActive = turn === 'O' && status === 'PLAYING';

    return (
        <div className="flex items-center justify-center gap-3 sm:gap-6 w-full">

            <motion.div
                variants={cardVariants}
                animate={xIsActive ? 'active' : 'inactive'}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-colors duration-300 ${xIsActive
                    ? 'bg-blue-500/15 border-blue-500/60 shadow-md shadow-blue-500/10'
                    : 'bg-white/[0.03] border-gray-700/50'
                    }`}
            >
                <span className={`text-lg sm:text-xl font-black ${xIsActive ? 'text-blue-400' : 'text-gray-600'}`}>X</span>
                <div className="flex flex-col min-w-0">
                    <span className={`text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[100px] ${xIsActive ? 'text-blue-300' : 'text-gray-400'}`}>
                        {playerXName}
                    </span>
                </div>
            </motion.div>


            <span className="text-gray-600 font-bold text-xs sm:text-sm">VS</span>


            <motion.div
                variants={cardVariants}
                animate={oIsActive ? 'active' : 'inactive'}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-colors duration-300 ${oIsActive
                    ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                    : 'bg-white/[0.03] border-gray-700/50'
                    }`}
            >
                <span className={`text-lg sm:text-xl font-black ${oIsActive ? 'text-emerald-400' : 'text-gray-600'}`}>O</span>
                <div className="flex flex-col min-w-0">
                    <span className={`text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[100px] ${oIsActive ? 'text-emerald-300' : 'text-gray-400'}`}>
                        {playerOName}
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
