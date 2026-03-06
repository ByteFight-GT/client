from enum import IntEnum

"""
Enums for representing game state.
"""

class Result(IntEnum):
	PLAYER_1 = 1
	PLAYER_2 = -1
	TIE = 0
	FAILED = 2

class WinReason(IntEnum):
	TIEBREAK = 0
	TIMEOUT = 1
	INVALID_TURN = 2
	CODE_CRASH = 3
	MEMORY_ERROR = 4
	STAMINA_LOSS = 5
	MATCH_ISSUE = 6
	DOMINATION = 7
	COLLISION = 8