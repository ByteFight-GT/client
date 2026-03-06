from __future__ import annotations
from enum import Enum, IntEnum

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Iterator, List, Tuple

"""
This file contains all the immutable classes used in the game.
All classes that perform calculations or are mutable exist in board.py instead.
"""

class MoveType(IntEnum):
    REGULAR = 0
    ERASE = 1
    BEACON_TRAVEL = 2


class Action:	
    """
    Represents a single action. Return either one Action or an iterable of Actions
    on your play() turns. When moving, use direction when using a non-BEACON_TRAVEL move
    or target when using a BEACON_TRAVEL move.
    """
    class Move:		
        direction: Direction | None # Direction of the move
        move_type: MoveType
        place_beacon: bool # whether to place a beacon into the cell you are moving to
        target: Location | None # target location to move to, if you are taking a BEACON_TRAVEL
        
        def __init__(
            self,
            direction: Direction | None,
            move_type: MoveType = MoveType.REGULAR,
            place_beacon: bool = False,
            beacon_target: Location | None = None,
        ):
            self.direction = direction
            self.move_type = move_type
            self.place_beacon = place_beacon
            self.beacon_target = beacon_target

        def to_dict(self):
            ret = {}
            ret["name"] = "Move"
            ret["direction"] = -1 if self.direction is None else Direction(self.direction).name
            ret["move_type"] = MoveType(self.move_type).name
            ret["place_beacon"] = self.place_beacon
            ret["beacon_target"] = (-1, -1) if self.beacon_target is None else \
                (self.beacon_target.r, self.beacon_target.c)
            
            return ret
        
        def __str__(self):
            return f"Move(direction={self.direction}, move_type={self.move_type}, " \
                   f"place_beacon={self.place_beacon}, beacon_target={str(self.beacon_target)})"
            
    
    class Paint:
        """Represents a paint action to try applying paint at a certain location."""
        location: Location
        
        def __init__(self, location: Location):
            self.location = location

        def to_dict(self):
            ret = {}
            ret["name"] = "Paint"
            ret["location"] = (self.location.r, self.location.c)

            return ret
        
        def __str__(self):
            return f"Paint(location={str(self.location)})"

    def to_dict(self):
        raise NotImplementedError
    
    def __str__(self):
        raise NotImplementedError

    

@dataclass(frozen=True)
class Location:
    """Location is essentially a tuple with utility functions."""
    r: int
    c: int
    
    def __add__(self, other: "Direction") -> "Location":
        return Location(self.r + other.value[0], self.c + other.value[1])
    
    def __sub__(self, other: "Location") -> "Location":
        return Location(self.r - other.r, self.c - other.c)
    
    def neighbors(self, allow_diagonals: bool = False) -> Iterator["Location"]:
        for direction in Direction.cardinals():
            yield self + direction
    
    def square_region(self, radius: int) -> List["Location"]:
        cells: List[Location] = []
        for dr in range(-radius, radius + 1):
            for dc in range(-radius, radius + 1):
                cells.append(Location(self.r + dr, self.c + dc))
        return cells
    
    def __str__(self):
        return f"Location(r={self.r}, c={self.c})"
    
    def __hash__(self) -> int:
        return hash((self.r, self.c))
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Location):
            return False
        return self.r == other.r and self.c == other.c


class Direction(Enum):	
    """Enum representing different directions away from center."""
    UP = (-1, 0)
    DOWN = (1, 0)
    LEFT = (0, -1)
    RIGHT = (0, 1)
    
    @staticmethod
    def cardinals() -> Tuple["Direction", ...]:
        return (
            Direction.UP,
            Direction.DOWN,
            Direction.LEFT,
            Direction.RIGHT,
        )
