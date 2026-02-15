
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            matches: {
                Row: {
                    id: string
                    user_id: string
                    winner: 'X' | 'O' | 'DRAW'
                    moves_count: number | null
                    board_final: Json | null
                    created_at: string
                    my_role: 'X' | 'O' | null
                    result: 'WIN' | 'LOSS' | 'DRAW' | null
                    opponent_name: string | null
                    game_type: 'local' | 'online' | null
                    is_abandoned: boolean | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    winner: 'X' | 'O' | 'DRAW'
                    moves_count?: number | null
                    board_final?: Json | null
                    created_at?: string
                    my_role?: 'X' | 'O' | null
                    result?: 'WIN' | 'LOSS' | 'DRAW' | null
                    opponent_name?: string | null
                    game_type?: 'local' | 'online' | null
                    is_abandoned?: boolean | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    winner?: 'X' | 'O' | 'DRAW'
                    moves_count?: number | null
                    board_final?: Json | null
                    created_at?: string
                    my_role?: 'X' | 'O' | null
                    result?: 'WIN' | 'LOSS' | 'DRAW' | null
                    opponent_name?: string | null
                    game_type?: 'local' | 'online' | null
                    is_abandoned?: boolean | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    first_name: string | null
                    last_name: string | null
                    x_wins: number
                    o_wins: number
                    x_losses: number
                    o_losses: number
                    draws: number
                    total_games: number
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    x_wins?: number
                    o_wins?: number
                    x_losses?: number
                    o_losses?: number
                    draws?: number
                    total_games?: number
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    x_wins?: number
                    o_wins?: number
                    x_losses?: number
                    o_losses?: number
                    draws?: number
                    total_games?: number
                    updated_at?: string
                }
            }
            games: {
                Row: {
                    id: string
                    player_x: string | null
                    player_o: string | null
                    player_x_email: string | null
                    player_o_email: string | null
                    player_x_name: string | null
                    player_o_name: string | null
                    board: Json
                    current_turn: 'X' | 'O'
                    status: 'WAITING' | 'PLAYING' | 'FINISHED'
                    winner: 'X' | 'O' | 'DRAW' | null
                    abandoned_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    player_x?: string | null
                    player_o?: string | null
                    player_x_email?: string | null
                    player_o_email?: string | null
                    player_x_name?: string | null
                    player_o_name?: string | null
                    board?: Json
                    current_turn?: 'X' | 'O'
                    status?: 'WAITING' | 'PLAYING' | 'FINISHED'
                    winner?: 'X' | 'O' | 'DRAW' | null
                    abandoned_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    player_x?: string | null
                    player_o?: string | null
                    player_x_email?: string | null
                    player_o_email?: string | null
                    player_x_name?: string | null
                    player_o_name?: string | null
                    board?: Json
                    current_turn?: 'X' | 'O'
                    status?: 'WAITING' | 'PLAYING' | 'FINISHED'
                    winner?: 'X' | 'O' | 'DRAW' | null
                    abandoned_by?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            record_match: {
                Args: {
                    p_winner: 'X' | 'O' | 'DRAW'
                    p_moves_count: number
                    p_board_final: Json
                }
                Returns: string
            }

        }
        Enums: {
            match_winner: 'X' | 'O' | 'DRAW'
        }
    }
}
