import { MapIcon } from 'lucide-react';
import {Action, Board, Map} from './game_engine'

class Match{
    match_states: MatchState[];
    bid_a: number;
    bid_b: number;
    win_reason: string;
    result: number;

    constructor(match_states:MatchState[], bid_a: number, bid_b: number, win_reason:string, result:number){
        this.match_states = match_states;
        this.bid_a = bid_a;
        this.bid_b = bid_b;
        this.win_reason = win_reason;
        this.result = result;

        
    }

}

class MatchState{
    time_a: number;
    time_b: number;
    map_state: number[][];
    trap_state: number[][];
    apple_state: number[][];
    portals: number[][];
    a_dir: Action;
    b_dir: Action;
    turn_num: number;
    a_to_play: boolean;
    a_apples_eaten: number;
    b_apples_eaten: number;
    a_length: number;
    b_length: number;

    constructor(b:Board, a_length:number, b_length:number){
        this.time_a = b.a_time;
        this.time_b = b.b_time;
        this.a_dir = b.snake_a.dir;
        this.b_dir = b.snake_b.dir;
        this.turn_num = b.get_turn_num();
        this.a_to_play = b.is_as_turn;

        this.a_apples_eaten = b.snake_a.apples_eaten;
        this.b_apples_eaten = b.snake_b.apples_eaten;

        this.a_length = a_length;
        this.b_length = b_length;

        this.portals = b.get_portal_map();
        this.map_state = b.get_occupancy_map();
        this.trap_state = b.get_trap_map();
        this.apple_state = b.get_apple_map();
        
    }    
}

export function getMap(map_string:string): MatchState {
    let m: Map = new Map(map_string);
    let b:Board = new Board(m, true, 220, m.start_size, m.start_size)

    return new MatchState(b, m.start_size, m.start_size)
}

export async function processData(history: BoardHistory): Promise<Match> {
    let match_states: MatchState[] = new Array(history.turn_count+1).fill(null);

    let m:Map = new Map(history.game_map);
    let b:Board = new Board(m, history.a_start, history.start_time,history.a_length[0], history.b_length[0])
    
    if(history.turn_count>0){
        match_states[0] = new MatchState(b, history.a_length[0], history.b_length[0])
        
        for(let i:number = 1; i<= history.turn_count; i++){
            
            b.play_turn(history.moves[i-1], history.cells_gained[i-1], history.cells_lost[i-1], history.traps_created[i-1], history.traps_lost[i-1], history.times[i-1]);
            match_states[i] = new MatchState(b, history.a_length[i], history.b_length[i]);
            b.next_turn();
            
        }
    }

    let match:Match = new Match(match_states, history.bidA, history.bidB, history.reason, history.result);

    return match;    
}

interface BoardHistory{
    moves:number[][],
    times:number[],
    game_map: string,
    bidA: number,
    bidB: number,
    a_start:boolean,
    result: number,
    reason: string,
    turn_count: number,
    start_time: number,
    cells_gained: number[][][],
    cells_lost: number[][][],
    a_length: number[],
    b_length: number[],
    traps_created: number[][][],
    traps_lost: number[][][]

}