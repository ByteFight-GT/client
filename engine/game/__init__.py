"""
Bytefight 2026 Game Engine - King of the Hill

A competitive coding game where players control territories, manage stamina,
and compete for control of hills on a dynamic battlefield. The files included
in these packages are sufficient for simulating the entirety of the game mechanics.
If you are a competitor, you will most likely only be looking at files in
this package (and potentially some scripts if you are running from terminal).

If you're confused about how the game works, the `apply_turn`, 
`_execute_move`, and `_execute_paint` functions of the Board.board
class is an excellent place to get started. 

If you are a developer, for game setup and gameplay management, 
see the game_runner package.
"""

from .game_structs import Action, MoveType, Location, Direction
from .game_constants import GameConstants
from .player import Player
from .board import Board, CellState, Hill, ScheduledPowerup, Parity
from .outcome import Result, WinReason


import sys

from .game_structs import Action, MoveType, Location, Direction
from .game_constants import GameConstants
from .player import Player
from .board import Board, CellState, Hill, ScheduledPowerup, Parity
from .outcome import Result, WinReason

__all__ = [
    'Action', 'MoveType', 'GameConstants', 'Location', 'Direction',
    'Player', 'Board', 'CellState', 'ScheduledPowerup', 'Parity',
    'Hill', 'Result', 'WinReason',
]

#
if 'pdoc' in sys.modules:
    __all__ = ['game_structs', 'game_constants', 'player', 'board', 'outcome']