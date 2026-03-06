from game import ScheduledPowerup, Location, Hill, Board, GameConstants
from typing import List, Tuple, Optional
import random

"""
This file deals with everything related to map strings, including translation
between different types of strings and translating map strings to board
initializations, and vice versa.
"""

def build_default_game(constants: Optional[GameConstants] = None) -> Board:
    constants = constants or GameConstants()
    board_size = Location(17, 17)
    p1_start = Location(1, 1)
    p2_start = Location(board_size.r - 2, board_size.c - 2)

    
    walls: List[Location] = []
    # hills = [
    # 	hill_from_diamond("center", Location(board_size.r // 2, board_size.c // 2), 2),
    # 	hill_from_diamond("north", Location(board_size.r // 4, board_size.c // 2), 1),
    # 	hill_from_diamond("south", Location(3 * board_size.r // 4, board_size.c // 2), 1),
    # ]
    hills = []
    board = Board(
        board_size,
        p1_start,
        p2_start,
        walls=walls,
        hills=hills,
        constants=GameConstants(),
    )
    return board


def reflect(board_size:Location, coords, symmetry):
    """
    Reflects coordinates across the map given a type of symmetry.
    """
    r, c = coords
    match symmetry:
        case "Horizontal":
            return (board_size.r-1-r, c)
        case "Vertical":
            return (r, board_size.c - 1 - c)
        case "Origin":
            return (board_size.r-1-r, board_size.c - 1 - c)

def generate_single_spawn_round(powerups_schedule: List[ScheduledPowerup], possible_spawns, board_size, round_num, num_spawns, symmetry, walls):

    """
    Algorithm for determining random apple spawns in O(N*T) grid spaces,
    Where N is the number of possible spaces and T is the number of grid spaces.
    """
    random.shuffle(possible_spawns)
    spawn_count = 0
    apple_count = 0
    i = 0
    while(spawn_count < num_spawns and i < len(possible_spawns)):
        r, c = possible_spawns[i]
        reflection = reflect(board_size, (r, c), symmetry)

        if (r, c) == reflection:
            apple_count+=1
            powerups_schedule.append(ScheduledPowerup(round_num, Location(r, c))) 
            spawn_count+=1
        else:
            apple_count+=2
            powerups_schedule.append(ScheduledPowerup(round_num, Location(r, c)))   
            powerups_schedule.append(ScheduledPowerup(round_num, Location(reflection[0], reflection[1])))
            spawn_count+=2

        i+=1
    

def generate_powerup_schedule(
        board_size: Location, 
        p1_spawn:Location, p2_spawn:Location, 
        spawn_interval:int, 
        min_num_spawns:int, 
        symmetry:str, 
        walls: List[Location]
        ) -> List[ScheduledPowerup]:
    

    remove_from_consideration = set()
    for wall in walls:
        remove_from_consideration.add((wall.r, wall.c))
        reflect_r, reflect_c = reflect(board_size, (wall.r, wall.c), symmetry)
        remove_from_consideration.add((reflect_r, reflect_c))

    possible_spawns = []

    for r in range(board_size.r):
        for c in range(board_size.c):
            if(not (r, c) in remove_from_consideration and (r, c) != p1_spawn and (r, c) != p2_spawn):
                remove_from_consideration.add((r, c))
                remove_from_consideration.add(reflect(board_size, (r, c), symmetry))
                possible_spawns.append((r, c))
    
    powerup_schedule = []
    # first powerup spawns should not include player spawns
    spawn_turn = 2
    generate_single_spawn_round(
        powerup_schedule, possible_spawns, board_size, spawn_turn, min_num_spawns, symmetry, walls)

    possible_spawns.append((p1_spawn.r, p1_spawn.c))
    possible_spawns.append((p2_spawn.r, p2_spawn.c))

    while(spawn_turn < 2 * GameConstants.MAX_ROUNDS):
        generate_single_spawn_round(
            powerup_schedule, possible_spawns, board_size, spawn_turn, min_num_spawns, symmetry, walls)
        spawn_turn += spawn_interval

    return powerup_schedule
               

def hill_from_diamond(id: int, center: Location, radius: int):
    cells: List[Location] = []
    for dr in range(-radius, radius + 1):
        for dc in range(-radius, radius + 1):
            if abs(dr) + abs(dc) <= radius:
                cells.append(Location(center.r + dr, center.c + dc))
    return Hill(id=id, cells=cells)


def get_board_from_map_string(map_string:str):
    """
    map string goes 
    size_r,size_c#
    p1_x,p1_y#
    p2_x,p2_y#
    walls#
    hill_ids#
    hill_1x1,hill1y1,hill1x2,hill1y2_hill2...#
    powerups_generated_vs_scheduled#
    schedule/params, schedule: (round1,r1,c1_round2,r2,c2_...) params:(round_interval, spawns, symmetry)#
    
   """    
    infos = map_string.split("#")

    size_r, size_c = infos[0].split(",")
    board_size = Location(int(size_r), int(size_c))

    x1, y1 = infos[1].split(",")
    p1_start = Location(int(x1), int(y1))

    x2, y2 = infos[2].split(",")
    p2_start = Location(int(x2), int(y2))

    walls = []

    for i in range(len(infos[3])):
        if infos[3][i] == '1':
            walls.append(Location(i // int(size_c), i % int(size_c)))


    hill_ids = infos[4].split(",")
    hills = []
    hill_sets = infos[5].split("_")

    
    for i in range(len(hill_ids)):
        if hill_ids[i] == '':
            continue
        hill_id = int(hill_ids[i])
        hill_set = hill_sets[i]
        if len(hill_set) > 0:
            hill_coords = hill_set.split(",")
            hill_cells = []
            for i in range(len(hill_coords)//2):
                x = int(hill_coords[2 * i])
                y = int(hill_coords[2 * i + 1])
                hill_cells.append(Location(x, y))
            hills.append(Hill(hill_id, hill_cells))

            
    powerups_generated = int(infos[6]) == 0

    powerup_schedule = []
    if(powerups_generated):
        round_interval, num_spawns, symmetry = infos[7].split(",")
        round_interval, num_spawns = int(round_interval), int(num_spawns)
        powerup_schedule = generate_powerup_schedule(board_size, p1_start, p2_start, round_interval, num_spawns, symmetry, walls)
    else:
        powerups = infos[7].split("_")
        for powerup in powerups:
            if len(powerup) > 0:
                round, row, col = powerup.split(",")
                round, row, col = int(round), int(row), int(col)
                powerup_schedule.append(ScheduledPowerup(round, Location(row, col)))    
    
    return Board(board_size, p1_start, p2_start, powerup_schedule, walls, hills, copy=False)


def map_string_from_board(initial_board:Board):

    wall_str = "".join(
        ["".join(["1" if cell.is_wall else "0" for cell in row]) for row in initial_board.cells]
    )

    hill_id_list = []
    hill_list = []
    for hill_id in initial_board.hills.keys():
        hill = initial_board.hills[hill_id]
        hill_id_list.append(f"{hill_id}")
        hill_list.append(",".join([f"{location.r},{location.c}" for location in hill.cells])) # each hill

        
    hill_id_str = ",".join(hill_id_list)
    hill_str = "_".join(hill_list)
    powerup_str = "_".join(
        f"{powerup.round_num},{powerup.location.r},{powerup.location.c}" for powerup in initial_board.powerup_schedule
        )
    
    return "#".join([
        f"{initial_board.board_size.r},{initial_board.board_size.c}",
        f"{initial_board.p1.loc.r},{initial_board.p1.loc.c}",
        f"{initial_board.p2.loc.r},{initial_board.p2.loc.c}",
        f"{wall_str}",
        f"{hill_id_str}",
        f"{hill_str}",
        "1",
        f"{powerup_str}"
    ])


def convert_map_string(map_string, powerup_schedule: List[ScheduledPowerup]):
    infos = map_string.split("#")
    if infos[6] == "1":
        return map_string
    
    infos[6] = "1"
    powerup_list = []
    for powerup in powerup_schedule:
        powerup_str = ",".join([str(powerup.round_num), str(powerup.location.r), str(powerup.location.c)])
        powerup_list.append(powerup_str)
    infos[7] = "_".join(powerup_list)
    
    return "#".join(infos)