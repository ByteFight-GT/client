from typing import List, Tuple, Optional, Dict
import random
from game.board import Board, Hill, CellState
from game.game_structs import Action, Location
from game.game_constants import GameConstants
from game.outcome import Result, WinReason
import json
from dataclasses import dataclass

from game_runner.engine_stamp import get_engine_version, get_cpu


class CustomEncoder(json.JSONEncoder):
	def default(self, obj):
		if hasattr(obj, "to_dict"):
			return obj.to_dict()
		return super().default(obj)
			

class GameController:
	"""
	Main game controller that manages the entire game state, flow, and state recording.
	Don't use this if you're a player.

	The primary purpose of game_controller is the following:
	1. Validate and execute the initial bid
	2. Manage the time of each player.
	3. Record the history of the board state, and write it out to a stream for
		the client if necessary.
	
	Essentially, this class is used to set up the player's turn, then record what
	happened during that turn for replay.
	"""
	p1_time_left: float
	p2_time_left: float
	constants: GameConstants	
	
	def __init__(self, board: Board, 
	             time_limit: float = 300.0, 
				 constants: Optional[GameConstants] = None,
				 record_history = True, output_stream = None,
				 ):
		# output stream is a TCP connection returned after binding TCP socket
		"""
		Initialize a new game.
		
		Args:
			board_size: Dimensions of the board
			p1_start: Starting location for player 1
			p2_start: Starting location for player 2
			walls: List of wall locations (optional)
			hills: Static hills present on the board (optional)
			time_limit: Time limit per player in seconds (default 5 minutes)
			constants: Game constants (optional, creates default if None)
		"""
		self.constants = constants if constants else GameConstants()
		self.board = board
		self.p1_time_left = time_limit
		self.p2_time_left = time_limit

		self.record_history = record_history
		self.output_stream  = output_stream

		self._init_history()
		self._record_round_history()


	def run_bid(self, bid1, bid2):
		valid_1 = self.board.is_valid_bid(bid1)
		valid_2 = self.board.is_valid_bid(bid2)

		if not valid_1 and not valid_2:
			return Result.TIE
		
		if not valid_1:
			return Result.PLAYER_2
		
		if not valid_2:
			return Result.PLAYER_1
		
		if(self.record_history):
			self.history["p1_bid"] = bid1
			self.history["p2_bid"] = bid2

		if(self.output_stream):
			bid_dict = {
				"p1_bid": bid1,
				"p2_bid": bid2, # 2d array of ints
				"type": "bid", # 2d array of ints					
			}
			message = (json.dumps(bid_dict)+"\n").encode("utf-8")
			self.output_stream.sendall(message)
		
		self.board.apply_bid(bid1, bid2)

		return None

	
	def get_time_left(self, player_parity: int) -> float:
		return self.p1_time_left if player_parity == 1 else self.p2_time_left
	
	def get_board_copy(self) -> Board:
		return self.board.get_copy()
	
	def _stream_output(self):
		# TODO
		return
	
	def _init_history(self):
		if(not self.record_history and self.output_stream is None):
			return
		
		self.prev_cell_states = [[CellState() for _ in range(self.board.board_size.c)] for _ in range(self.board.board_size.r)]
		self.prev_hill_states = {}

		for hill_id in self.board.hills.keys():
			self.prev_hill_states[hill_id] = 0

		hill_mapping = [[cell.hill_id for cell in cell_row] for cell_row in self.board.cells]
		walls = [[cell.is_wall for cell in cell_row] for cell_row in self.board.cells]
		
		if(self.record_history):
			self.history = {
				"p1_bid":0,
				"p2_bid":0,
				"p1_time_left": [], # list of float
				"p2_time_left": [], # list of float
				"p1_loc": [], # list of tuple, row, col
				"p2_loc": [], # list of tuple, row, col
				"p1_stamina": [], # list of int, 
				"p2_stamina": [], # list of int
				"p1_max_stamina": [], # list of tuple, row, col
				"p2_max_stamina": [], # list of tuple, row, col
				"p1_territory":[], # list of int
				"p2_territory":[], # list of int
				"parity_playing": [], # list of ints, 1 or -1
				"paint_updates": [], # list of dicts, location -> int
				"beacon_updates": [], # list of dicts, location -> int
				"powerup_updates": [], # list of dicts, location -> int
				"hill_updates": [], # list of dicts, int id -> int:
				"hill_mapping": hill_mapping, # 2d array of ints
				"walls": walls, # 2d array of ints
				"actions": [], # list of actions
			}

		if(self.output_stream):
			init_dict = {
				"type": "init_game",
				"hill_mapping": hill_mapping, # 2d array of ints
				"walls": walls, # 2d array of ints					
			}
			message = (json.dumps(init_dict)+"\n").encode("utf-8")
			self.output_stream.sendall(message)
			
			

		
	def _record_round_history(self, actions = None, turn_ended = True) -> None:
		if(not self.record_history and  self.output_stream is None):
			return
		
		row_size = self.board.board_size.r
		col_size = self.board.board_size.c
		paint_dict = {}
		beacon_dict = {}
		powerup_dict = {}
		p1_territory = 0
		p2_territory = 0

		for row in range(row_size):
			for col in range(col_size):
				cell_num = row * col_size + col

				prev_cell = self.prev_cell_states[row][col]
				new_cell = self.board.cells[row][col]

				if(prev_cell.beacon_parity != new_cell.beacon_parity):
					prev_cell.beacon_parity = new_cell.beacon_parity
					beacon_dict[cell_num] = new_cell.beacon_parity
				if(prev_cell.paint_value != new_cell.paint_value):
					prev_cell.paint_value = new_cell.paint_value
					paint_dict[cell_num] = new_cell.paint_value
				if(prev_cell.powerup != new_cell.powerup):
					prev_cell.powerup = new_cell.powerup
					powerup_dict[cell_num] = new_cell.powerup

				if(new_cell.owner_parity > 0):
					p1_territory += 1
				if(new_cell.owner_parity < 0):
					p2_territory += 1

		hill_dict = {}
		for hill_id in self.board.hills.keys():
			hill_parity = self.board.hills[hill_id].controller_parity
			if(hill_parity != self.prev_hill_states[hill_id]):
				self.prev_hill_states[hill_id] = hill_parity
				hill_dict[hill_id] = hill_parity

		#construct update dictionary
		update_dict = {
			"p1_time_left": self.p1_time_left,
			"p2_time_left": self.p2_time_left,
			"p1_loc": (self.board.p1.loc.r, self.board.p1.loc.c),
			"p2_loc": (self.board.p2.loc.r, self.board.p2.loc.c),
			"p1_stamina": self.board.p1.stamina,
			"p2_stamina": self.board.p2.stamina,
			"p1_max_stamina": self.board.p1.max_stamina,
			"p2_max_stamina": self.board.p2.max_stamina,
			"paint_updates": paint_dict,
			"beacon_updates": beacon_dict,
			"powerup_updates": powerup_dict,
			"p1_territory": p1_territory,
			"p2_territory": p2_territory,
			"hill_updates": hill_dict
		}
		update_dict["parity_playing"] = self.board.parity_to_play * -1 if turn_ended else self.board.parity_to_play

		if actions is not None:
			update_dict["actions"] = actions
		else:
			update_dict["actions"] = "NONE"


		# add update terms to history
		if self.record_history:
			for key, value in update_dict.items():
				if key not in self.history:
					self.history[key] = []  # ensure the key exists
				self.history[key].append(value)


		if(self.output_stream):
			update_dict["type"] = "update"
			message = (json.dumps(update_dict, cls=CustomEncoder)+"\n").encode("utf-8")
			self.output_stream.sendall(message)

		# write update terms to output stream
		if(self.output_stream != None):
			#TODO
			pass


	def execute_turn(self, player_parity: int, actions, time_taken: float) -> bool:
		"""
		Executes a turn for the given player.
		
		Args:
			player_parity: Player number (1 or -1)
			actions: Single Action or iterable of Actions
			time_taken: Time taken for this turn in seconds
		
		Returns:
			True if turn was executed successfully, False if player timed out
		"""
		if player_parity == 1:
			self.p1_time_left -= time_taken
			if self.p1_time_left <= 0:
				return False
		else:
			self.p2_time_left -= time_taken
			if self.p2_time_left <= 0:
				return False
			
		ok = self.board.apply_turn(player_parity, actions)

		self._record_round_history(actions, ok)
		
		return ok

	
	def get_winner(self) -> Optional[int]:
		"""
		Determines the winner of the game.
		
		Returns:
			1 if player 1 wins
			-1 if player 2 wins
			0 if tie
			None if game is not over
		"""
		if self.p1_time_left <= 0:
			return Result.PLAYER_1, WinReason.TIMEOUT
		if self.p2_time_left <= 0:
			return Result.PLAYER_2, WinReason.TIMEOUT
		
		winner = self.board.get_winner()
		
		if winner is None:
			return None

		result, reason = winner

		if(result == Result.TIE):
			if (self.p1_time_left > self.p2_time_left + self.constants.TIME_TIEBREAK_THRESH):
				return Result.PLAYER_1, WinReason.TIEBREAK
			if (self.p2_time_left > self.p1_time_left + self.constants.TIME_TIEBREAK_THRESH):
				return Result.PLAYER_2, WinReason.TIEBREAK
			
		return result, reason
	
	def is_game_over(self) -> bool:
		"""
		Returns True if the game is over.
		"""
		return self.get_winner() is not None
	

@dataclass
class GameOutcome:
	"""
	This is used to store the result of a match, as well as the option to
	append extra information in to that outcome in the form of error logs,
	commentary, the engine stamp, and the map string.

	It compiles the game history and these tags into a single output json.
	"""
	game_controller: GameController
	result: Result
	reason: WinReason
	errlog_a: str = ""
	errlog_b: str = ""
	commentary_a: str = ""
	commentary_b: str = ""
	engine_version: str = get_engine_version()
	cpu:str = get_cpu()
	map_string = ""
	
	
	def get_winner(self) -> Result:
		return self.result
	
	def get_num_turns(self) -> int:
		return self.game_controller.board.turn_count
	

	def get_game_annotation(self) -> Dict[str, object]:
		
		return {
			"turn_count": self.game_controller.board.turn_count,
			"result": self.result.name,
			"reason": self.reason.name,
			"p1_err": self.errlog_a,
			"p2_err": self.errlog_b,
			"p1_commentary": self.commentary_a,
			"p2_commentary": self.commentary_b,
			"map_string": self.map_string,
			"engine_version":self.engine_version,
			"cpu":self.cpu
		}
	
	
	def assemble_history_dict(self) -> Dict[str, object]:
		
		history = self.game_controller.history
		annotations = self.get_game_annotation()
		
		for key in annotations.keys():
			history[key] = annotations[key]
		return history
	
	def get_history_json(self) -> str:
		
		return json.dumps(self.assemble_history_dict(), cls=CustomEncoder )