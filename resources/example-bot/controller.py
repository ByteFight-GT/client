from collections.abc import Callable, Iterable
from typing import Union

from game import *
# from .player_board import PlayerBoard
import random


class PlayerController:
	"""
	You may add functions, however, __init__, bid, and play are the entry
	points for your program and should not be changed.
	"""
	
	def __init__(self, player_parity:int, time_left: Callable):
		return
	
	def bid(self, board: Board, player_parity: int, time_left: Callable) -> int:
		"""
		Called at the start of each round. Return the number of stamina you
		want to bid for initiative. Defaults to zero.
		"""
		return 0
	
	def play(
		self,
		board: Board,
		player_parity: int,
		time_left: Callable,
	) -> Union[Action.Move, Action.Paint, Iterable[Action.Move | Action.Paint]]:
		"""
		Return either a single Action or an iterable of Actions for this turn.
		This sample agent idles by returning an empty list.
		"""
		available = []
		for dir in Direction:
			next_loc = board.get_player(player_parity).loc + dir
			if not board.oob(next_loc) and not board.cells[next_loc.r][next_loc.c].is_wall:
				available.append(Action.Move(dir))

		return random.choice(available)
	
	def commentate(self, board: Board, player_parity: int, time_left: Callable) -> str:
		"""
		Allows for you to display a string at the end of the match on our online
		portal for your own statistics usage. Be careful, your opponents will be 
		able to see this as well.
		"""
		return ""
		
