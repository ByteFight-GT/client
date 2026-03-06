from __future__ import annotations


from typing import Dict, List, Iterable
import os

from game import Board, Action, ScheduledPowerup

"""
This file is for board visualizations in ASCII for terminal-based visualization of the game.
Used by devs and likely some competitors who opt to not use the client.
"""


def init_display(board: Board, player_a_name: str, player_b_name: str, clear_screen: bool) -> None:
    if clear_screen:
        os.system("cls||clear")
    print(f"{player_a_name} vs. {player_b_name}")
    print(f"Turn {board.turn_count}")

def print_board(board: Board, a_time: float, b_time: float) -> None:
    display = get_board_string(board, a_time, b_time)
    print(display, end="\n")
    paint_display = get_paint_string(board)
    print(paint_display, end="")

def print_actions(player_parity, actions: Action.Move | Action.Paint | Iterable[Action.Move | Action.Paint], timer: float) -> None:
    player_label = "Player 1" if player_parity == 1 else "Player 2"
    if isinstance(actions, Iterable):
        print(f"{player_label} plays {[str(a) for a in actions]} in {timer:.3f}s")
    else:
        print(f"{player_label} plays {actions} in {timer:.3f}s")
    


def _cell_repr(board: Board, r: int, c: int) -> str:
    cell = board.cells[r][c]
    if board.p1.loc.r == r and board.p1.loc.c == c and board.p2.loc.r == r and board.p2.loc.c == c:
        return "X  "
    if board.p1.loc.r == r and board.p1.loc.c == c:
        return "A  "
    if board.p2.loc.r == r and board.p2.loc.c == c:
        return "B  "
    if cell.is_wall:
        return "#  "
    if cell.powerup:
        return "S  "
    if cell.beacon_parity == 1:
        return "a  "
    if cell.beacon_parity == -1:
        return "b  "
    if cell.hill_id != 0:
        return f"H{cell.hill_id:<2d}"
    return ".  "

def _paint_repr(board:Board, r, c):
    cell = board.cells[r][c]
    if cell.paint_value != 0:
        return f"{cell.paint_value:<2d} "
    if cell.hill_id != 0:
        return f"H{cell.hill_id:<2d}"
    return "0  "

def get_paint_string(board: Board) -> str:
    lines: List[str] = []
    lines.append("  " + "".join(f"{c:3d}" for c in range(board.board_size.c)))
    for r in range(board.board_size.r):
        row_chars = "".join(_paint_repr(board, r, c) for c in range(board.board_size.c))
        lines.append(f"{r:2d}  {row_chars}")
    return "\n".join(lines) + "\n"


def get_board_string(board: Board, a_time: float, b_time: float) -> str:
    lines: List[str] = []

    p1_hills = len(board.p1.controlled_hills)
    p2_hills = len(board.p2.controlled_hills)
    total_hills = len(board.hills)

    lines.append(f"A time: {a_time:.2f}s | B time: {b_time:.2f}s")
    lines.append(f"A: stamina={board.p1.stamina}/{board.p1.max_stamina}, hills={p1_hills}/{total_hills} | B: stamina={board.p2.stamina}/{board.p2.max_stamina}, hills={p2_hills}/{total_hills}")
    lines.append("  " + "".join(f"{c:3d}" for c in range(board.board_size.c)))
    for r in range(board.board_size.r):
        row_chars = "".join(_cell_repr(board, r, c) for c in range(board.board_size.c))
        lines.append(f"{r:2d}  {row_chars}")
    return "\n".join(lines) + "\n"
