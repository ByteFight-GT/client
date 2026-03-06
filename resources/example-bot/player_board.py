from game import Board
from game import GameConstants, Direction, Location,Action, MoveType, Parity

class PlayerBoard:
    
    def __init__(self, board: Board, player_parity: int):
        self.player_parity = player_parity
        self.opponent_parity = self.player_parity * -1
        self.board = board

    def get_player(self, opponent=False):
        if(opponent):
            return self.board.get_player(self.opponent_parity)
        return self.board.get_player(self.player_parity)

    def get_opponent(self, opponent=False):
        if(opponent):
            return self.board.get_opponent(self.opponent_parity)
        return self.board.get_opponent(self.player_parity)
    
    def reverse_perspective(self):
        
        self.opponent_parity *= -1
        self.player_parity *=- 1

    def get_copy(self, reverse_perspective=False):
        return PlayerBoard(self.board.get_copy(), self.opponent_parity if reverse_perspective else self.player_parity)

    def can_move(self, move: Action, moves_this_turn: int = 0, opponent=False):
        player = self.get_player(opponent)
        parity_query = self.opponent_parity if opponent else self.player_parity
        stamina = player.stamina
        cell = self.board.cells[player.loc.r][player.loc.c]

        if(cell.powerup):
            stamina += GameConstants.STAMINA_POWERUP_AMOUNT

        if(stamina < GameConstants.EXTRA_MOVE_COST * moves_this_turn):
            return False
        
        if move.move_type == MoveType.ERASE:
            if stamina < GameConstants.ERASE_STEP_EXTRA_COST:
                return False 
            
        if move.move_type == MoveType.BEACON_TRAVEL:
            if (cell.beacon_parity != parity_query):
                return False
            
            target_loc = move.target
            if(self.board.oob(target_loc)):
                return False
            
            dest_cell = self.board.cells[target_loc.r][target_loc.c]
            if dest_cell.beacon_parity != parity_query:
                return False
            
        else:
            # don't use beacon to travel
            target_loc = player.loc + move.direction
            if self.board.oob(target_loc):
                return False
            
        target_cell = self.board.cells[target_loc.r][target_loc.c]
        if target_cell.is_wall:
            return False
        
        if target_loc == self.get_opponent(opponent).loc:
            mover_parity = parity_query
            defender_parity = -parity_query
            # defender-painted cell -> mover loses
            if Parity.owned(target_cell.paint_value, defender_parity):
                return False
            # mover-painted cell -> mover wins (allowed)
            if Parity.owned(target_cell.paint_value, mover_parity):
                return True
            # unpainted: stationary defender loses, so mover wins
            return True
        
        if move.place_beacon:
            if not self.can_place_beacon(target_loc, opponent):
                return False
        
        return True
        

    def can_place_beacon(self, origin, opponent = False):
        parity_query = self.opponent_parity if opponent else self.player_parity

        if self.board.oob(origin):
            return False
        
        player = self.get_player(opponent)
        cell = self.board.cells[origin.r][origin.c]
        if cell.owner_parity != parity_query:
            return False
        if cell.beacon_parity != 0:
            return False
        if player.stamina < GameConstants.BEACON_COST:
            return False
        
        window_radius = GameConstants.BEACON_WINDOW_SIZE_P // 2
        window_cells = origin.square_region(window_radius)
        
        friendly_cells = []
        enemy_cells = []
        opponent_parity = parity_query * -1

        for loc in window_cells:
            if self.board.oob(loc):
                continue
            candidate = self.board.cells[loc.r][loc.c]
            if(Parity.unowned(candidate.beacon_parity)):
                if Parity.owned(candidate.paint_value, parity_query):
                    friendly_cells.append(candidate)
                elif Parity.owned(candidate.paint_value, opponent_parity):
                    enemy_cells.append(candidate)
        
        if len(friendly_cells) < GameConstants.BEACON_REQUIREMENT_Q:
            return False
        
        return True

    def get_valid_non_beacon_moves(self, moves_this_turn = 0,opponent=False):
        return_list = []

        for move_type in [MoveType.REGULAR, MoveType.ERASE]:
            for dir in Direction:
                a = Action.Move(direction=dir, move_type=move_type)
                if(self.can_move(a, moves_this_turn, opponent)):
                    return_list.append(a)
        
        return return_list
                
    def can_paint(self, target, opponent= False):
        player = self.get_player(opponent)
        parity_query = self.opponent_parity if opponent else self.player_parity

        
        if self.board.oob(target):
            return False
        
        manhattan_dist = abs(player.loc.r - target.r) + abs(player.loc.c - target.c)
        if manhattan_dist == 0 or manhattan_dist > GameConstants.PAINT_RANGE:
            return False
        
        if player.stamina < GameConstants.PAINT_STAMINA_COST:
            return False
        
        cell = self.board.cells[target.r][target.c]
        if cell.owner_parity != parity_query:
            return False
        
        return True

    def get_valid_paint_targets(self, opponent = False):
        targets = []
        player = self.get_player(opponent)
        for r in range(-GameConstants.PAINT_RANGE, GameConstants.PAINT_RANGE):
            for c in range(-GameConstants.PAINT_RANGE, GameConstants.PAINT_RANGE):
                target = Location(player.loc.r+r, player.loc.c+c)
                if(self.can_paint(target, opponent)):
                    targets.append(target)
        return targets


    def apply_turn(self, actions, opponent = False):
        self.board.apply_turn(
            self.opponent_parity if opponent else self.player_parity, 
            actions)
        

    def apply_action(self, action:Action, moves_this_turn = 0, opponent = False):
        self.board.apply_action(
            self.opponent_parity if opponent else self.player_parity, 
            action, moves_this_turn)

    def forecast_turn(self, actions, opponent = False):
        return self.board.forecast_turn(
            self.opponent_parity if opponent else self.player_parity,
            actions)

    def forecast_action(self, action:Action, moves_this_turn = 0, opponent = False):
        return self.board.forecast_action(
            self.opponent_parity if opponent else self.player_parity, 
            action, moves_this_turn)
    

    # keep consistency with forecast_, apply_, can_, get_valid_ type moves
    # def forecast_move(
    # 	self,
    # 	player_num: int,
    # 	direction: Direction,
    # 	step_type: MoveStepType = MoveStepType.REGULAR,
    # 	place_beacon: bool = False,
    # 	target: Optional[Location] = None,
    # 	moves_this_turn: int = 0,
    # ) -> Tuple["Board", bool]:
    # 	world_copy = self.get_copy()
    # 	move_action = Action.Move(direction=direction, step_type=step_type, place_beacon=place_beacon, target=target)
    # 	ok = world_copy._execute_move(player_num, move_action, moves_this_turn)
    # 	return world_copy, ok
    
    # def forecast_paint(self, player_num: int, location: Location) -> Tuple["World", bool]:
    # 	world_copy = self.get_copy()
    # 	ok = world_copy._execute_paint(player_num, Action.Paint(location))
    # 	return world_copy, ok
    