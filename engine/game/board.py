from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, Iterable, Iterator, List, Optional, Tuple

from game.game_structs import Location, Action, MoveType
from game.outcome import Result, WinReason
from game.game_constants import GameConstants
from game.player import Player 
import math

class Parity:
    """
    This utility class is used to determine if a cell's ownership.
    Player 1 has positive parity and Player 2 has negative parity.
    """

    @staticmethod
    def parity_from_value(value: int) -> int:
        """
        Convert a numeric value into a parity indicator.

        Args:
            value (int): A signed integer representing ownership or state.

        Returns:
            int: 
                - 1 if the value is positive
                - -1 if the value is negative
                - 0 if the value is zero
        """
        return 0 if value == 0 else value // abs(value)
    
    @staticmethod
    def get_opponent_parity(parity: int) -> int:
        """
        Get the opposing player's parity.

        Args:
            parity (int): The current player's parity (1 or -1).

        Returns:
            int: The opposite parity (-1 or 1).
        """
        return -1 * parity
    
    @staticmethod
    def owned(cell_parity:int, player_parity:int) -> bool:
        """
        Determine whether a cell is owned by a given player.

        Args:
            cell_parity (int): The parity of the cell.
            player_parity (int): The parity of the player.

        Returns:
            bool: True if the cell is owned by the player, False otherwise.
        """
        return cell_parity * player_parity > 0
    

    @staticmethod
    def unowned(cell_parity:int) -> bool:
        """
        Check whether a cell is unowned.

        Args:
            cell_parity (int): The parity of the cell.

        Returns:
            bool: True if the cell is unowned (parity is 0), False otherwise.
        """
        return cell_parity == 0

@dataclass
class CellState:
    """Represents the state of a single cell on the board."""
    
    paint_value: int = 0
    is_wall: bool = False
    beacon_parity: Optional[int] = 0
    hill_id: Optional[int] = 0 # if this cell has a registered a hill, it will have a nonzero id
    powerup: Optional[bool] = False 
    
    @property
    def owner_parity(self) -> int:
        """
        Determine the effective owner of the cell.

        Returns:
            int: 
                - 1 if owned by Player 1
                - -1 if owned by Player 2
                - 0 if unowned
        """
        return Parity.parity_from_value(self.paint_value)
        
    def clear_beacon(self) -> None:
        """
        Remove the beacon from the cell.
        """
        self.beacon_parity = 0
        
    def set_beacon(self, player_parity: int) -> None:
        """
        Place a beacon on the cell for a given player.

        Args:
            player_parity (int): Parity of the player placing the beacon.
        """
        self.beacon_parity = player_parity

    def paint(self, player_parity: int, max_value: int) -> None:
        """
        Apply paint to the cell for a given player.

        Paint can if the
        cell is either unowned or already owned by the painting player.
        The paint value has a maximum maginitude specified in GameConstants.

        Args:
            player_parity (int): Parity of the painting player.
            max_value (int): Maximum absolute value for paint strength.
        """
        if (
            Parity.unowned(self.paint_value) or Parity.owned(self.paint_value, player_parity)
        ):
            self.paint_value  = min(max(self.paint_value + player_parity, -max_value),  max_value)

    def weaken_opponent(self, player_parity: int) -> None:
        """
        Reduce the opponent's paint strength on this cell.

        The cell is weakened if it is currently owned by the opposing player.
        Occurs automatically after moving into a cell.

        Args:
            player_parity (int): Parity of the acting player.
        """
        if Parity.owned(self.paint_value, Parity.get_opponent_parity(player_parity)):
            self.paint_value += player_parity
    
    def erase(self) -> None:
        self.paint_value = 0

@dataclass
class Hill:
    """Represents a hill on the map."""
    
    id: int
    cells: List[Location]
    control_positive: int = 0
    control_negative: int = 0
    controller_parity: int = 0

    def get_control_diff(self, parity):
        """
        Get the net control difference from the perspective of a player.

        Args:
            parity (int): Parity of the querying player.

        Returns:
            int: Signed control difference relative to the given parity.
        """
        return (self.control_positive + self.control_negative) * parity

    def above_threshold(self, parity, thresh):
        """
        Check whether a player's control exceeds the threshold
        necessary to capture the hill. See GameConstants for parameter.

        Args:
            parity (int): Parity of the player.
            thresh (int): Control threshold to compare against.

        Returns:
            bool: True if the player's control is above the threshold,
            False otherwise.
        """
        required_cells = math.ceil(len(self.cells) * thresh)
        if parity > 0:
            return self.control_positive >= required_cells
        else:
            return -self.control_negative >= required_cells
    
    def decrement_control(self, player_parity):
        """
        Decrease control for the specified player.

        Args:
            player_parity (int): Parity of the player whose control is reduced.
        """
        if(player_parity > 0):
            self.control_positive -= 1
        elif(player_parity < 0):
            self.control_negative += 1
            
    def increment_control(self, player_parity):
        """
        Increase control for the specified player.

        Args:
            player_parity (int): Parity of the player whose control is increased.
        """
        if(player_parity > 0):
            self.control_positive += 1
        elif(player_parity < 0):
            self.control_negative -= 1
    
    def control_fraction(self, player_parity) -> Tuple[int, float]:
        """
        Get the fraction of the hill controlled by a player.

        Args:
            player_parity (int): Parity of the player.

        Returns:
            float: Fraction of hill control held by the player.
        """
        if(player_parity > 0):
            return self.control_positive / len(self.cells)
        elif(player_parity < 0):
            return self.control_negative / len(self.cells)

@dataclass
class ScheduledPowerup:
    """Represents a powerup that will spawn during the match."""
    round_num: int
    location: Location

class Board:
    """
    Represents the game world state. The contents of this class are minimal, and are mostly functions
    used directly in game simulation. Other utility functions are written into PlayerBoard.py instead.

    This class will be given to players' code for querying and mutating game state.
    Note that the class is not written for maximum efficiency of simulation,
    but rather for readability and clarity. If you want to speed up simulation,
    the board class and its supporting structures are written in such a way to be 
    easily rewritten in compiled languages or for python JIT compilers.
    """
    
    def __init__(
        self,
        board_size: Location,
        p1_start: Location = None,
        p2_start: Location = None,
        powerup_schedule: List[ScheduledPowerup]= [],
        wall_list: Optional[List[Location]] = [],
        hill_list: Optional[List[Hill]] = [],
        
        copy = False
    ):
        self.board_size = board_size
        self.powerup_schedule = powerup_schedule

        self.cells: List[List[CellState]] = [
            [CellState() for _ in range(board_size.c)] for _ in range(board_size.r)
        ]

        if not copy:
            self.current_round = 0
            self.turn_count = 0
            self.event_pointer = 0
            self.parity_to_play = 0
            self.moves_this_turn = 0
            
            self.p1 = Player(
                parity=1, 
                location=p1_start, 
                max_stamina=GameConstants.BASE_MAX_STAMINA, 
                copy=False
            )

            self.p2 = Player(
                parity=-1, 
                location=p2_start, 
                max_stamina=GameConstants.BASE_MAX_STAMINA, 
                copy=False
            )
            
            
            for wall_loc in wall_list:
                if self.oob(wall_loc):
                    continue
                self.cells[wall_loc.r][wall_loc.c].is_wall = True
            
            self.hills: Dict[int, Hill] = {}
            for hill in hill_list:
                self.register_hill(hill)

            self._spawn_scheduled_powerups()

    def oob(self, loc: "Location") -> bool:
        """
        Check whether a location is out of bounds.

        Args:
            loc (Location): Location to check.

        Returns:
            bool: True if the location is outside the board.
        """
        return loc.r < 0 or loc.c < 0 or loc.r >= self.board_size.r or loc.c >= self.board_size.c

    def apply_bid(self, bid1:int, bid2:int):
        # assumes given bids are valid
        """
        Resolve bidding between players to determine turn order.

        The higher bid gains initiative and pays stamina equal to the bid.
        Ties are resolved randomly.

        Args:
            bid1 (int): Player 1's bid.
            bid2 (int): Player 2's bid.
        """
        if not self.is_valid_bid(bid1) or not self.is_valid_bid(bid2):
            return
        
        if(bid1 > bid2):
            self.parity_to_play = 1
            self.p1.stamina -= bid1
        elif(bid1 < bid2):
            self.parity_to_play = -1
            self.p2.stamina -= bid2
        else:
            if random.random() < 0.5:
                self.parity_to_play = 1
                self.p1.stamina -= bid1
            else:
                self.parity_to_play = -1
                self.p2.stamina -= bid2

    def is_valid_bid(self, bid):
        """
        Validate a stamina bid.

        Args:
            bid: Value to validate.

        Returns:
            bool: True if the bid is a valid integer within allowed limits.
        """
        
        try:
            bid = int(bid)
            return bid <= GameConstants.BASE_MAX_STAMINA and bid >= 0 
        except:
            return False
    
    def register_hill(self, hill: Hill) -> None:
        """
        Register a hill and mark its cells on the board.

        Args:
            hill (Hill): Hill object to register.
        """
        self.hills[hill.id] = hill
        for loc in hill.cells:
            if not self.oob(loc):
                self.cells[loc.r][loc.c].hill_id = hill.id
    
    def get_player(self, player_parity: int) -> Player:
        """
        Retrieve a player by parity.

        Args:
            player_parity (int): Player parity (1 or -1).

        Returns:
            Player: The corresponding player.
        """
        return self.p1 if player_parity == 1 else self.p2
    
    def get_opponent(self, player_parity: int) -> Player:
        """
        Retrieve the opponent of the given player.

        Args:
            player_parity (int): Parity of the reference player.

        Returns:
            Player: The opposing player.
        """
        return self.p2 if player_parity == 1 else self.p1
    
    def get_copy(self) -> "Board":
        """
        Create a deep copy of the board state.

        Used for simulation, forecasting, and hypothetical evaluation.

        Returns:
            Board: Independent copy of the current board state.
        """
        new_world = Board(
            board_size = self.board_size, # board size can be copied by ref since it doesn't change
            # p1_start=, p2_start=,  # starts don't need to be copied, players will be with their postiions
            powerup_schedule = self.powerup_schedule, # powerup schedule will not change, can be copied via ref
            # walls_list=[], # wall data is copied via copying self.cells below instead
            # hills_list=[], # hill data is copied via copying self.hills below instead
            copy = True
        )

        new_world.current_round = self.current_round
        new_world.event_pointer = self.event_pointer
        new_world.turn_count = self.turn_count
        new_world.parity_to_play = self.parity_to_play
        new_world.moves_this_turn = self.moves_this_turn
        
        new_world.p1 = self.p1.get_copy()
        new_world.p2 = self.p2.get_copy()
        
        for r in range(self.board_size.r):
            for c in range(self.board_size.c):
                source = self.cells[r][c]
                target = new_world.cells[r][c]
                target.paint_value = source.paint_value
                target.is_wall = source.is_wall
                target.beacon_parity = source.beacon_parity
                target.hill_id = source.hill_id
                target.powerup = source.powerup
        
        # hill cells are copied by reference since they don't change between hills
        # reregistering hills is unnecessary because target hill_ids were set when copying cells
        new_world.hills = {hid: Hill(h.id, h.cells, h.control_positive, h.control_negative, h.controller_parity) for hid, h in self.hills.items()}
        
        return new_world
    

    def apply_turn(self, player_parity: int, actions: Action | Iterable[Action]) -> bool:
        """
        Apply a full turn consisting of one or more actions.

        Actions are executed sequentially until completion, death,
        or invalid execution.

        Args:
            player_parity (int): Acting player's parity.
            actions (Action or Iterable[Action]): Single action or iterable of actions.

        Returns:
            bool: True if at least one move was successfully executed.
        """
        # convert actions to iterable if they aren't already
        if isinstance(actions, (Action.Move, Action.Paint)):
            action_iterable = [actions]
        else:
            try:
                action_iterable = list(actions)
            except TypeError:
                action_iterable = [actions]
        
        # keeps track of the number of moves thave have already executed this turn
        self.moves_this_turn = 0
        for action in action_iterable:
            if isinstance(action, Action.Move):
                if not self._execute_move(player_parity, action):
                    return False
            elif isinstance(action, Action.Paint):
                if not self._execute_paint(player_parity, action):
                    return False
            else:
                continue
            
            if self.get_player(player_parity).is_dead():
                return False
            
            if self.get_opponent(player_parity).is_dead():
                return True



        ok = self.moves_this_turn > 0
        self.end_turn()

        return ok
    
    def forecast_turn(self, player_parity: int, actions: Action | Iterable[Action]) -> Tuple["Board", bool]:
        """
        Simulate a turn without mutating the current board.

        Args:
            player_parity (int): Acting player's parity.
             actions (Action or Iterable[Action]): Actions to simulate.

        Returns:
            Tuple[Board, bool]: Copied board after the turn and success flag.
        """
        world_copy = self.get_copy()
        ok = world_copy.apply_turn(player_parity, actions)
        return world_copy, ok
    
    def apply_action(self, player_parity: int, action: Action.Move | Action.Paint) -> bool:
        """
        Apply a single action for a player.

        Args:
            player_parity (int): Acting player's parity.
            action (Action): Action to execute.

        Returns:
            bool: True if the action was successfully applied.
        """
        if isinstance(action, Action.Move):
            return self._execute_move(player_parity, action)
        if isinstance(action, Action.Paint):
            return self._execute_paint(player_parity, action)
        return False
    
    def forecast_action(self, player_parity: int, action: Action) -> Tuple["Board", bool]:
        """
        Simulate a single action without mutating the board.

        Args:
            player_parity (int): Acting player's parity.
            action (Action): Action to simulate.

        Returns:
            Tuple[Board, bool]: Copied board and success flag.
        """
        world_copy = self.get_copy()
        ok = world_copy.apply_action(player_parity, action)
        return world_copy, ok
    
    
    def _execute_move(self, player_parity: int, move: Action.Move, moves_this_turn = None) -> bool:
        """
        Execute a movement action for a player.

        Handles stamina costs, beacon travel, collisions, erase effects,
        power-ups, and beacon placement.

        Args:
            player_parity (int): Acting player's parity.
            move (Action.Move): Move action.

        Returns:
            bool: True if the move was successful.
        """
        player = self.get_player(player_parity)
        self._apply_powerup_if_present(player_parity, self.cells[player.loc.r][player.loc.c])

        if(moves_this_turn is None):
            moves_this_turn = self.moves_this_turn

        if moves_this_turn >= 1:
            cost = GameConstants.EXTRA_MOVE_COST * moves_this_turn
            if player.stamina < cost:
                return False 
            player.stamina -= cost

        if move.move_type == MoveType.ERASE:
            cost = GameConstants.ERASE_STEP_EXTRA_COST
            if player.stamina < cost:
                return False 
            player.stamina -= cost
            
        if move.move_type == MoveType.BEACON_TRAVEL:
            # use beacon to travel 
            target_loc = self._beacon_travel(player_parity, move)
            if target_loc is None:
                return False
        else:
            # don't use beacon to travel
            target_loc = player.loc + move.direction
            if self.oob(target_loc):
                return False
        
        # movement occurs here
        target_cell = self.cells[target_loc.r][target_loc.c]
        if target_cell.is_wall:
            return False

        player.loc = target_loc

        if self._resolve_collision(player_parity):
            return True
        
        # Beacon decay: decrease paint by 1 layer when teleporting to a beacon
        if move.move_type == MoveType.BEACON_TRAVEL:
            prev_paint = target_cell.paint_value
            if Parity.owned(prev_paint, target_cell.beacon_parity):
                # Decrease paint value by 1 toward zero
                target_cell.paint_value += -1 * target_cell.beacon_parity
                
                # Release square if paint reaches 0
                if target_cell.paint_value == 0:
                    original_parity = Parity.parity_from_value(prev_paint)
                    self._release_square(target_cell, original_parity)
        
        # handle movement effects
        self._handle_erase_effects(player_parity, target_cell, move.move_type)
        self._apply_powerup_if_present(player_parity, target_cell)
        
        # Check if beacon should be destroyed after teleporting
        if move.move_type == MoveType.BEACON_TRAVEL:
            if target_cell.beacon_parity != 0:
                # Destroy beacon if paint is 0 or contains enemy paint
                if target_cell.paint_value == 0 or Parity.owned(target_cell.paint_value, Parity.get_opponent_parity(target_cell.beacon_parity)):
                    target_cell.clear_beacon()
        
        if move.place_beacon:
            ok = self._place_beacon(player_parity, target_loc)
            if not ok:
                return False

        if not player.clamp_stamina():
            return False
        
        self.moves_this_turn += 1
        
        return True
    
    def _beacon_travel(self, player_parity: int, move: Action.Move) -> bool:
        """
        Perform beacon-based teleportation.

        Args:
            player_parity (int): Acting player's parity.
            move (Action.Move): Move containing beacon target.

        Returns:
            Optional[Location]: Destination location, or None if invalid.
        """
        player = self.get_player(player_parity)
        # must specify a target beacon location
        if move.beacon_target is None:
            return None
        
        current_cell = self.cells[player.loc.r][player.loc.c]
        if current_cell.beacon_parity != player_parity: 
            return None
        
        # use the beacon_target field rather than generic 'target'
        dest = move.beacon_target
        if self.oob(dest):
            return None
        
        dest_cell = self.cells[dest.r][dest.c]
        if dest_cell.beacon_parity != player_parity:
            return None
        
        # Beacons aren't consumed anymore 
        #dest_cell.clear_beacon(GameConstants.BEACON_CONSUME_LEFTOVER_PAINT)
        #player.beacon_count = max(0, player.beacon_count - 1)

        self.moves_this_turn = 1

        return dest
    
    def _handle_erase_effects(self, player_parity: int, target_cell: CellState, step_type: MoveType) -> None:
        """
        Apply erase or weaken effects to a cell after movement.

        Args:
            player_parity (int): Acting player's parity.
            target_cell (CellState): Cell affected by the step.
            step_type (MoveType): Type of movement step.
        """
        
        prev = target_cell.paint_value
        if step_type == MoveType.ERASE:
            target_cell.erase()
        else:
            target_cell.weaken_opponent(player_parity)
        now = target_cell.paint_value

        if(now==0 and prev != 0):
            self._release_square(target_cell, Parity.parity_from_value(prev))

    def _apply_powerup_if_present(self, player_parity: int, cell: CellState) -> None:
        """
        Apply a stamina power-up if present on the cell.

        Args:
            player_parity (int): Acting player's parity.
            cell (CellState): Cell to check.
        """
        if not cell.powerup:
            return
    
        player = self.get_player(player_parity)
        player.stamina = min(player.max_stamina, player.stamina + GameConstants.STAMINA_POWERUP_AMOUNT)
        
        cell.powerup = False
    
    def _place_beacon(self, player_parity: int, origin: Location) -> bool:
        """
        Attempt to place a beacon at a location.

        Applies stamina cost and modifies surrounding paint.

        Args:
            player_parity (int): Acting player's parity.
            origin (Location): Beacon placement location.

        Returns:
            bool: True if the beacon was successfully placed.
        """
        if self.oob(origin):
            return False
        
        player = self.get_player(player_parity)
        opponent_parity = Parity.get_opponent_parity(player_parity)

        cell = self.cells[origin.r][origin.c]
        if cell.owner_parity == opponent_parity:
            return False
        if player.stamina < GameConstants.BEACON_COST:
            return False
        
        window_radius = GameConstants.BEACON_WINDOW_SIZE_P // 2
        window_cells = origin.square_region(window_radius)
        
        friendly_cells: List[CellState] = []
        valid_cells_count = 0
        
        for loc in window_cells:
            if self.oob(loc):
                continue
            candidate = self.cells[loc.r][loc.c]
            if candidate.is_wall:
                continue
            valid_cells_count += 1
            if Parity.owned(candidate.paint_value, player_parity):
                friendly_cells.append(candidate)
        
        # Calculate requirement based on constants (2/3 in this case)

        # can beacon on 2
        # if valid_cells_count < 3:
        #     return False
        
        # use proportional calculation so no float
        if len(friendly_cells) * (GameConstants.BEACON_WINDOW_SIZE_P ** 2) < GameConstants.BEACON_REQUIREMENT_Q * valid_cells_count:
            return False
        
        player.stamina -= GameConstants.BEACON_COST
        
        for candidate in friendly_cells:
            candidate.paint_value = candidate.paint_value - player_parity
            if(candidate.paint_value == 0):
                self._release_square(candidate, player_parity)


        # function ends here if you are clearing a beacon
        if cell.beacon_parity == opponent_parity:
            cell.clear_beacon()
            return True
        
        # painting the cell by increment always captures
        if cell.owner_parity != player_parity:
            self._claim_square(cell, player_parity)
        
        # this you are setting your own beacon   
        cell.set_beacon(player_parity)  
        cell.paint_value += math.ceil(len(friendly_cells) * 0.5) * player_parity
        cell.paint_value = max(-GameConstants.MAX_PAINT_VALUE, min(GameConstants.MAX_PAINT_VALUE, cell.paint_value))
        player.beacon_count += 1
        
        

        return True

    
    def _resolve_collision(self, moving_player_parity: int) -> None:
        """
        Resolve a collision between players occupying the same cell.

        Args:
            moving_player_parity (int): Parity of the moving player.

        Returns:
            bool: True if a collision occurred.
        """
        # returns if collision occured
        moving_player = self.get_player(moving_player_parity)
        opponent = self.get_opponent(moving_player_parity)
        
        if moving_player.loc != opponent.loc:
            return False
        
        cell = self.cells[moving_player.loc.r][moving_player.loc.c]
        cell_owner = cell.owner_parity
        
        if cell_owner == opponent.parity:
            moving_player.stamina = -1
        else:
            opponent.stamina = -1

        return True
    
    def _execute_paint(self, player_parity: int, action: Action.Paint) -> bool:
        """
        Execute a paint action.

        Applies stamina cost, modifies cell paint, and triggers hill control.

        Args:
            player_parity (int): Acting player's parity.
            action (Action.Paint): Paint action.

        Returns:
            bool: True if painting was successful.
        """
        player = self.get_player(player_parity)
        target = action.location
        
        if self.oob(target):
            return False
        
        manhattan_dist = abs(player.loc.r - target.r) + abs(player.loc.c - target.c)
        if manhattan_dist == 0 or manhattan_dist > GameConstants.PAINT_RANGE:
            return False
        
        if player.stamina < GameConstants.PAINT_STAMINA_COST:
            return False
        
        cell = self.cells[target.r][target.c]
        if cell.is_wall:
            return False
        if cell.owner_parity != player_parity and cell.owner_parity != 0:
            return False
        if cell.beacon_parity == player_parity:
            return False
        
        player.stamina -= GameConstants.PAINT_STAMINA_COST

        prev = cell.paint_value
        cell.paint(player_parity, GameConstants.MAX_PAINT_VALUE)
        next = cell.paint_value

        if(prev == 0 and next != 0): 
            # you can't paint on squares of opponent color
            self._claim_square(cell, player_parity)

        if not player.clamp_stamina():
            return False
        
        return True
        
    # turn	
    def end_turn(self) -> None:
        """
        Finalize the current turn.

        Advances round counters, switches active player,
        spawns power-ups, and applies stamina regeneration.
        """
        self.turn_count += 1
        self.parity_to_play *= -1 
        self.moves_this_turn = 0
        self.current_round = self.turn_count // 2
        self._spawn_scheduled_powerups()
        self._apply_regeneration(self.parity_to_play)
    

    def _claim_square(self, cell: CellState, player_parity: int):
        """
        Handle claiming a square for hill control.

        Args:
            cell (CellState): Cell being claimed.
            player_parity (int): Claiming player's parity.
        """
        if(cell.hill_id == 0):
            return
        
        hill =self.hills[cell.hill_id]
        hill.increment_control(player_parity)

        opponent_parity = Parity.get_opponent_parity(player_parity)
        opponent = self.get_opponent(player_parity)

        if (
            Parity.owned(hill.controller_parity, opponent_parity)
            and hill.get_control_diff(player_parity) >= 0
        ):
            
            opponent.lose_hill_control(hill.id)
            hill.controller_parity = 0

        if (
            Parity.unowned(hill.controller_parity) 
            and hill.above_threshold(player_parity, GameConstants.HILL_CONTROL_THRESHOLD) 
            and hill.get_control_diff(player_parity) > 0
        ):
            player = self.get_player(player_parity)
            player.gain_hill_control(hill.id)
            hill.controller_parity = player_parity

            if( len(self.hills) > 0 and 
                  len(player.controlled_hills) >= GameConstants.DOMINATION_WIN_THRESHOLD * len(self.hills)):
                
                opponent.stamina = -1
            


            
    def _release_square(self, cell: CellState, owner_parity: int):
        """
        Handle releasing control of a square.

        Args:
            cell (CellState): Cell being released.
            owner_parity (int): Parity of the former owner.
        """
        if(cell.hill_id == 0):
            return
        
        hill =self.hills[cell.hill_id]
        hill.decrement_control(owner_parity)

        if (
            Parity.owned(hill.controller_parity, owner_parity) 
            and hill.get_control_diff(owner_parity) <= 0
        ):
            player = self.get_player(owner_parity)
            player.lose_hill_control(hill.id)
            hill.controller_parity = 0

        # opponent still have to be above threshold though to gain it
        opponent_parity = Parity.get_opponent_parity(owner_parity)
        if (
            Parity.unowned(hill.controller_parity) 
            and hill.above_threshold(opponent_parity, GameConstants.HILL_CONTROL_THRESHOLD) 
            and hill.get_control_diff(owner_parity) < 0
        ):

            opponent = self.get_player(opponent_parity)
            opponent.gain_hill_control(hill.id)
            hill.controller_parity = opponent_parity

            if( len(self.hills) > 0 and 
                  len(opponent.controlled_hills) >= GameConstants.DOMINATION_WIN_THRESHOLD * len(self.hills)):
                
                owner = self.get_player(owner_parity)
                owner.stamina = -1
    
    
    def _apply_regeneration(self, player_parity) -> None:
        """
        Apply stamina regeneration to a player.

        Regeneration depends on adjacency and active beacons.

        Args:
            player_parity (int): Player to regenerate.
        """
        
        player = self.get_player(player_parity)
        if player.is_dead():
            return

        regen = GameConstants.BASE_STAMINA_REGEN
        regen += self._count_adjacent_friendly(player_parity) * GameConstants.ADJACENT_REGEN_BONUS
        # if player.beacon_count > 0:
        #     regen += player.beacon_count * GameConstants.BEACON_REGEN_BONUS
        regen += min(self.get_territory_count(player_parity) // GameConstants.GLOBAL_PAINT_REGEN_RATIO,
                      GameConstants.GLOBAL_PAINT_REGEN_CAP) 

        if self.turn_count > GameConstants.GLOBAL_DECAY_TURN_THRESHOLD:
            delta = self.turn_count - GameConstants.GLOBAL_DECAY_TURN_THRESHOLD - 1
            intervals = (delta // GameConstants.GLOBAL_DECAY_INTERVAL) + 1
            regen -= intervals * GameConstants.GLOBAL_DECAY_REGEN_PENALTY
            regen = max(0, regen)

        player.stamina = min(player.max_stamina, player.stamina + regen)
    
    def _count_adjacent_friendly(self, player_parity: int) -> int:
        """
        Count adjacent friendly-controlled cells.

        Args:
            player_parity (int): Player parity.

        Returns:
            int: Number of friendly adjacent cells.
        """
        player = self.get_player(player_parity)
        loc = player.loc
        count = 0
        radius = max(1, GameConstants.ADJACENCY_RADIUS)
        for dr in range(-radius, radius + 1):
            for dc in range(-radius, radius + 1):
                neighbor = Location(loc.r + dr, loc.c + dc)
                if self.oob(neighbor):
                    continue
                cell = self.cells[neighbor.r][neighbor.c]
                if cell.owner_parity == player_parity:
                    count += 1
        return count
    
    def _spawn_scheduled_powerups(self) -> None:
        """
        Spawn any powerups scheduled for the current round.
        """
        while self.event_pointer < len(self.powerup_schedule) and self.powerup_schedule[self.event_pointer].round_num <= self.current_round:
            fp = self.powerup_schedule[self.event_pointer]
            self._spawn_powerup(fp.location)
            self.event_pointer += 1	
    
    def _spawn_powerup(self, location: Location) -> None:
        """
        Spawn a powerup at a specific location.

        Args:
            location (Location): Target location.
        """
        if self.oob(location):
            return
        cell = self.cells[location.r][location.c]
        if cell.is_wall:
            return
        
        cell.powerup = True
    
    
    def get_territory_count(self, player_parity: int) -> int:
        """
        Count the number of cells owned by a player.

        Args:
            player_parity (int): Player parity.

        Returns:
            int: Number of owned cells.
        """
        count = 0
        for row in self.cells:
            for cell in row:
                if cell.owner_parity == player_parity:
                    count += 1
        return count
    
    
    def get_winner(self):
        """
        Determine the current game outcome.

        Checks in order: stamina loss, domination victory, collisions,
        and round-limit tiebreakers.

        Returns:
            Optional[Tuple[Result, WinReason]]: Winner and reason,
            or None if the game is still ongoing.
        """
        if self.p1.is_dead():
            if (len(self.hills) > 0 and 
                len(self.p2.controlled_hills) >= GameConstants.DOMINATION_WIN_THRESHOLD * len(self.hills)):
                return Result.PLAYER_2, WinReason.DOMINATION
            if self.p1.loc == self.p2.loc:
                return Result.PLAYER_2, WinReason.COLLISION

            return Result.PLAYER_2, WinReason.STAMINA_LOSS
        if self.p2.is_dead():
            if (len(self.hills) > 0 and 
                len(self.p1.controlled_hills) >= GameConstants.DOMINATION_WIN_THRESHOLD * len(self.hills)):
                return Result.PLAYER_1, WinReason.DOMINATION
            if self.p1.loc == self.p2.loc:
                return Result.PLAYER_1, WinReason.COLLISION

            return Result.PLAYER_1, WinReason.STAMINA_LOSS
        
        if self.current_round >= GameConstants.MAX_ROUNDS:
            if len(self.p1.controlled_hills) > len(self.p2.controlled_hills):
                return Result.PLAYER_1, WinReason.TIEBREAK
            if len(self.p1.controlled_hills) < len(self.p2.controlled_hills):
                return Result.PLAYER_2, WinReason.TIEBREAK

            p1_territory = self.get_territory_count(1)
            p2_territory = self.get_territory_count(-1)            
            
            if p1_territory > p2_territory:
                return Result.PLAYER_1, WinReason.TIEBREAK
            if p2_territory > p1_territory:
                return Result.PLAYER_2, WinReason.TIEBREAK
            return Result.TIE, WinReason.TIEBREAK
        
        return None
    
    """
    # TODO: Do we want inlined hill control calcualtions, or do we want to do it all at the end of a round
    # def _update_hill_control(self, hill_id) -> None:
    # 	for hill in self.hills.values():
    # 		controller, fraction = hill.control_fraction(self.cells)
    # 		threshold = GameConstants.HILL_CONTROL_THRESHOLD
    # 		if controller == 0 or fraction < threshold:
    # 			if hill.controller != 0:
    # 				self._release_hill(hill.controller, hill.id)
    # 			hill.controller = 0
    # 			continue
            
    # 		if hill.controller == controller:
    # 			continue
            
    # 		if hill.controller != 0:
    # 			self._release_hill(hill.controller, hill.id)
            
    # 		hill.controller = controller
    # 		self._claim_hill(controller, hill.id)
    """
