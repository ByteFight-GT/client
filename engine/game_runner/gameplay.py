from __future__ import annotations

import os
import threading
import time
import traceback
from collections.abc import Iterable

from multiprocessing import Queue
from typing import Callable, List, Optional, Tuple

from game_runner.board_viz import get_board_string, init_display, print_board, print_actions
from game_runner.gen_board import hill_from_diamond, get_board_from_map_string, convert_map_string, build_default_game, map_string_from_board
from game_runner.game_controller import GameController, GameOutcome
from game_runner.player_process import PlayerProcess
from game_runner import engine_stamp

from game import Action, GameConstants, Hill, Location, Board, Result, WinReason


import json

"""
This file is used for managing general gameplay. This includes 

1. Initializing player processes and communication queues for those processes
2. Setting up the game controller for the match/validation.
3. Asking player processes for construction, bids, gameplay, and commentary with
    associated timeouts.
4. Figuring out who won and why. This is complicated, due to the involvement of
    player process crashes, timeouts, and invalid turns.
5. Return a GameOutcome reflecting the result, with annotations if desired. 
"""

EXTRA_RETURN_TIME = 5 #avoid spurious timeouts

def validate_submission(directory_a: str, player_a_name: str, limit_resources: bool = False, 
                        use_gpu: bool = False, 
                        board_to_play: Optional[Board] = None,
                        map_string = "") -> Tuple[bool, str]:
    from multiprocessing import set_start_method
    import sys
    
    set_start_method("spawn", force=True)

    if(board_to_play is None):
        if(not map_string is None):
            board_to_play = get_board_from_map_string(map_string)
        else:
            board_to_play = build_default_game()
            
    try:
        # setup game controller
        play_timeout = GameConstants.PLAY_TIME_LIMIT
        if not limit_resources:
            play_timeout = 2 * GameConstants.PLAY_TIME_LIMIT

        if(board_to_play is None):
            board_to_play = get_board_from_map_string(map_string)

        game_controller = GameController(
            board_to_play, play_timeout, GameConstants(), record_history = False, output_stream = None)
        
        main_q = Queue()
        player_a_q = Queue()
        out_queue = Queue()
        
        if directory_a not in sys.path:
            sys.path.append(directory_a)
        
        player_process = PlayerProcess(
            True,
            player_a_name,
            directory_a,
            player_a_q,
            main_q,
            limit_resources,
            use_gpu,
            out_queue,
            user_name="player_a_user",
            group_name="player_a",
        )
        player_process.start()
    
    
        ok = main_q.get(block=True, timeout=10)
        if not ok:
            return False, "Failed to initialize agent process"
        player_process.pause_process_and_children()

        init_timeout = GameConstants.CONSTRUCT_TIME_LIMIT
        bid_timeout = GameConstants.BID_TIME_LIMIT
        play_timeout = GameConstants.PLAY_TIME_LIMIT

        if(not limit_resources):
            init_timeout = 2 * GameConstants.CONSTRUCT_TIME_LIMIT
            bid_timeout = 2 * GameConstants.BID_TIME_LIMIT
            play_timeout = 2 * GameConstants.PLAY_TIME_LIMIT
        

        player_process.restart_process_and_children()
        ok, message = player_process.run_timed_constructor(init_timeout, 1, EXTRA_RETURN_TIME)
        player_process.pause_process_and_children()
        if not ok:
            return False, message
        
        board_copy = game_controller.get_board_copy()
        player_process.restart_process_and_children()
        bid_value, bid_timer, message = player_process.run_timed_bid(
            board_copy, 1, bid_timeout, EXTRA_RETURN_TIME)
        player_process.pause_process_and_children()
        if bid_value is None:
            return False, message
        
        result = game_controller.run_bid(bid_value, 0)
        if result is Result.PLAYER_2 or result is Result.TIE:
            return False, f"Returned invalid bid: {bid_value}"

        board_copy = game_controller.get_board_copy()
        player_process.restart_process_and_children()
        actions, timer, message = player_process.run_timed_play(
            board_copy, 1, play_timeout, EXTRA_RETURN_TIME)
        player_process.pause_process_and_children()
        if actions is None:
            return False, message
        if not game_controller.execute_turn(1, actions, timer):
            return False, "Invalid turn during validation"
        
        return True, ""
    except:
        print(traceback.format_exc())
        return False, f"Validation crashed: {traceback.format_exc()}"
    finally:
        terminate_validation(player_process, [player_a_q, main_q], out_queue)


def delete_module(name: str) -> None:
    import sys
    if name in sys.modules:
        del sys.modules[name]

def terminate_validation(process_a, queues, out_queue):
    delete_module("player_a.agent")
    delete_module("player_a")
    
    process_a.terminate_process_and_children()

    for q in queues:
        try:
            while True:
                q.get_nowait()
        except:
            pass

    try:
        while True:
            out_queue.get_nowait()
    except:
        pass

# Listener function to continuously listen to the queue
def listen_for_output(output_queue: Queue, stop_event: threading.Event) -> None:
    while not stop_event.is_set():
        try:
            print(output_queue.get(timeout=1), flush=True)  # Wait for 1 second for output
        except:
            continue  # No output yet, continue listening


#TODO refactor this
def _run_match(
    game_controller: GameController,
    player_a_process: PlayerProcess,
    player_b_process: PlayerProcess,
    main_q_a: Queue,
    main_q_b: Queue,
    limit_resources: bool,
    display_game: bool,
    player_a_name: str,
    player_b_name: str,
    clear_screen: bool,
    delay: float,
) -> GameOutcome:

    message_a = ""
    message_b = ""
    result: Optional[Result] = None
    reason: Optional[WinReason] = None


    init_timeout = GameConstants.CONSTRUCT_TIME_LIMIT
    bid_timeout = GameConstants.BID_TIME_LIMIT
    
    if(not limit_resources):
        init_timeout = 2 * GameConstants.CONSTRUCT_TIME_LIMIT
        bid_timeout = 2 * GameConstants.BID_TIME_LIMIT
        

    result = None
    reason = None
    

    # Process initialization
    try:
        player_a_process.start()
        success_a = main_q_a.get(block=True, timeout=10)
        player_a_process.pause_process_and_children()
    except Exception:
        message_a = traceback.format_exc()
        success_a = False
    
    try:
        player_b_process.start()
        success_b = main_q_b.get(block=True, timeout=10)
        player_b_process.pause_process_and_children()
    except Exception:
        message_b = traceback.format_exc()
        success_b = False
    

    # Player class construction
    if success_a:
        player_a_process.restart_process_and_children()
        success_a, message_a = player_a_process.run_timed_constructor(init_timeout, 1, EXTRA_RETURN_TIME)
        player_a_process.pause_process_and_children()
    
    if success_b:
        player_b_process.restart_process_and_children()
        success_b, message_b = player_b_process.run_timed_constructor(init_timeout, -1, EXTRA_RETURN_TIME)
        player_b_process.pause_process_and_children()
    
    if not success_a and not success_b:
        return GameOutcome(
            game_controller, Result.TIE, WinReason.CODE_CRASH, message_a, message_b)
    if not success_a:
        return GameOutcome(
            game_controller, Result.PLAYER_2, WinReason.CODE_CRASH, message_a, message_b)
    if not success_b:
        return GameOutcome(
            game_controller, Result.PLAYER_1, WinReason.CODE_CRASH, message_a, message_b)
    
    # Players bid for initiative
    board_snapshot = game_controller.get_board_copy()
    
    player_a_process.restart_process_and_children()
    bid_a, bid_time_a, bid_msg_a = player_a_process.run_timed_bid(
        board_snapshot, 1, bid_timeout, EXTRA_RETURN_TIME)
    player_a_process.pause_process_and_children()
    if bid_a is None:
        reason = WinReason.TIMEOUT if bid_time_a in (-1, bid_timeout) else WinReason.CODE_CRASH
        message_a = bid_msg_a
        success_a = False
    
    player_b_process.restart_process_and_children()
    bid_b, bid_time_b, bid_msg_b = player_b_process.run_timed_bid(
        board_snapshot, -1, bid_timeout, EXTRA_RETURN_TIME)
    player_b_process.pause_process_and_children()
    if bid_b is None:
        reason = WinReason.TIMEOUT if bid_time_b in (-1, bid_timeout) else WinReason.CODE_CRASH
        message_b = bid_msg_b
        success_b = False

    if not success_a and not success_b:
        return GameOutcome(
            game_controller, Result.TIE, WinReason.CODE_CRASH, message_a, message_b)
    if not success_a:
        return GameOutcome(
            game_controller, Result.PLAYER_2, reason, message_a, message_b)
    if not success_b:
        return GameOutcome(
            game_controller, Result.PLAYER_1, reason, message_a, message_b)
    
    result = game_controller.run_bid(bid_a, bid_b)
    if not result is None:
        # in the case of invalid bids being returned
        return GameOutcome(
            game_controller, result, WinReason.INVALID_TURN, message_a, message_b)


    # Main gameplay loop
    last_turn_completed = True
    while result is None:

        current_round = game_controller.board.current_round
        
        # Turn start
        if display_game:
            init_display(
                game_controller.board, player_a_name, player_b_name, clear_screen)
            print_board(
                game_controller.board, 
                game_controller.get_time_left(1), 
                game_controller.get_time_left(-1))
        
        player_parity = game_controller.board.parity_to_play
        time_left = game_controller.get_time_left(player_parity)
        if time_left <= 0:
            result = Result.PLAYER_2 if player_parity == 1 else Result.PLAYER_1
            reason = WinReason.TIMEOUT
            if player_parity == 1:
                message_a = "Timeout"
            else:
                message_b = "Timeout"
            last_turn_completed = False
            break
    
        player_process = player_a_process if player_parity == 1 else player_b_process
        
        board_copy = game_controller.get_board_copy()
        player_process.restart_process_and_children()
        actions, timer, message = player_process.run_timed_play(
            board_copy, player_parity, time_left, EXTRA_RETURN_TIME)
        player_process.pause_process_and_children()
        
        if actions is None:
            result = Result.PLAYER_2 if player_parity == 1 else Result.PLAYER_1
            if timer == -1:
                reason = WinReason.CODE_CRASH
            elif timer == -2:
                reason = WinReason.MEMORY_ERROR
            else:
                reason = WinReason.TIMEOUT
            if player_parity == 1:
                message_a = message
            else:
                message_b = message
            last_turn_completed = False
            break
        
        success = game_controller.execute_turn(player_parity, actions, timer)
        if not success:
            result = Result.PLAYER_2 if player_parity == 1 else Result.PLAYER_1
            reason = WinReason.INVALID_TURN if game_controller.get_time_left(player_parity) > 0 else WinReason.TIMEOUT
            if player_parity == 1:
                message_a = f"Invalid actions: {[str(a) for a in actions] if isinstance(actions, Iterable) else actions}"
            else:
                message_b = f"Invalid actions: {[str(a) for a in actions] if isinstance(actions, Iterable) else actions}"
            
            last_turn_completed = False
        
        if display_game:
            print_actions(player_parity, actions, timer)
            if delay > 0:
                time.sleep(delay)
        
        winner = game_controller.get_winner()
        if not winner is None:
            result, reason = winner
            last_turn_completed = True
            break

        
    if(last_turn_completed):
        init_display(
            game_controller.board, player_a_name, player_b_name, clear_screen)
        print_board(
            game_controller.board, 
            game_controller.get_time_left(1), 
            game_controller.get_time_left(-1), )
        print_actions(player_parity, actions, timer)
        
    if display_game:
        print(f"{result.name} wins by {reason.name}")
    outcome = GameOutcome(game_controller, result or Result.TIE, reason or WinReason.MATCH_ISSUE, message_a, message_b)
    return outcome




def play_game(
    directory_a: str,
    directory_b: str,
    player_a_name: str,
    player_b_name: str,
    display_game: bool = False,
    delay: float = 0.0,
    clear_screen: bool = True,
    record: bool = True,
    output_stream = None,
    limit_resources: bool = False,
    use_gpu: bool = False,
    board_to_play: Optional[Board] = None,
    map_string: str = "",
    annotate:bool = False,
) -> GameOutcome:
   

    import sys
    
    if directory_a not in sys.path:
        sys.path.append(directory_a)
    if directory_b not in sys.path:
        sys.path.append(directory_b)
    
    #setup main thread queue for getting results
    main_q_a = Queue()
    main_q_b = Queue()

    #setup two thread queues for passing commands to players
    player_a_q = Queue()
    player_b_q = Queue()

    # setup queue listener thread
    out_queue = Queue()
    stop_event: Optional[threading.Event] = None
    if not limit_resources:
        stop_event = threading.Event()
        listener_thread = threading.Thread(target=listen_for_output, args=(out_queue, stop_event))
        listener_thread.daemon = True
        listener_thread.start()

    queues = [player_a_q, player_b_q, main_q_a, main_q_b]
    
    #startup two player processes    
    player_a_process = PlayerProcess(
        True,
        player_a_name,
        directory_a,
        player_a_q,
        main_q_a,
        limit_resources,
        use_gpu,
        out_queue,
        user_name="player_a_user",
        group_name="player_a",
    )
    player_b_process = PlayerProcess(
        False,
        player_b_name,
        directory_b,
        player_b_q,
        main_q_b,
        limit_resources,
        use_gpu,
        out_queue,
        user_name="player_b_user",
        group_name="player_b",
    )

    # setup game controller
    play_timeout = GameConstants.PLAY_TIME_LIMIT
    commentate_timeout = GameConstants.COMMENTATE_TIME_LIMIT

    if not limit_resources:
        play_timeout = 2 * GameConstants.PLAY_TIME_LIMIT
        commentate_timeout = 2 * GameConstants.COMMENTATE_TIME_LIMIT

    if(board_to_play is None):
        board_to_play = get_board_from_map_string(map_string)
    else:
        map_string = map_string_from_board(board_to_play)

    game_controller = GameController(
        board_to_play, play_timeout, GameConstants(), record, output_stream)
    
    try:
        outcome: GameOutcome = _run_match(
            game_controller,
            player_a_process,
            player_b_process,
            main_q_a,
            main_q_b,
            limit_resources,
            display_game,
            player_a_name,
            player_b_name,
            clear_screen,
            delay,
        )
        

        if(annotate):
            if limit_resources:
                commentate_timeout = GameConstants.COMMENTATE_TIME_LIMIT
            else:
                commentate_timeout = 2 * GameConstants.COMMENTATE_TIME_LIMIT

            player_a_process.restart_process_and_children()
            player_a_commentary, _ , _ = player_a_process.run_timed_commentate(
                game_controller.board, 1, commentate_timeout, 1.0
            )
            player_a_process.pause_process_and_children()

            player_b_process.restart_process_and_children()            
            player_b_commentary, _ , _ = player_b_process.run_timed_commentate(
                game_controller.board, -1, commentate_timeout, 1.0
            )
            player_b_process.pause_process_and_children()
            outcome.commentary_a = player_a_commentary
            outcome.commentary_b = player_b_commentary

            outcome.engine_version = engine_stamp.get_engine_version()
            outcome.cpu = engine_stamp.get_cpu()
            outcome.map_string = convert_map_string(
                map_string, game_controller.board.powerup_schedule)
    except:
        print(traceback.format_exc())
    finally:
        terminate_game(player_a_process, player_b_process, queues, out_queue, stop_event)
    
    return outcome


# closes down player processes
def terminate_game(process_a: PlayerProcess, process_b: PlayerProcess, queues: List[Queue], out_queue: Queue, stop_event: Optional[threading.Event]) -> None:
    delete_module("player_a.agent")
    delete_module("player_a")
    delete_module("player_b.agent")
    delete_module("player_b")
    
    if stop_event is not None:
        stop_event.set()
        try:
            while True:
                print(out_queue.get_nowait())
        except Exception:
            pass
    
    process_a.terminate_process_and_children()
    process_b.terminate_process_and_children()
    
    for q in queues:
        try:
            while True:
                q.get_nowait()
        except:
            pass