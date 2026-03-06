from typing import Dict, Set
from game.game_structs import Location
from game.game_constants import GameConstants


class Player:
    """
    Represents a player in the game. Parity of 1 for player 1, and parity of -1 for 
    player 2.
    """
    
    stamina: int
    max_stamina: int
    loc: Location
    controlled_hills: Set[int]
    beacon_count: int
    parity: int
    
    def __init__(self, 
              parity:int, 
              location:Location, 
              max_stamina:int, copy=False):
        self.max_stamina = max_stamina
        self.loc = location
        self.parity = parity

        if not copy:
            self.stamina = max_stamina
            self.controlled_hills = set()
            self.beacon_count = 0
    
    def clamp_stamina(self) -> bool:
        """
        Clamp stamina to the player's current max stamina value.

        Returns:
            bool: True if the player is alive after clamping,
            False if stamina is below zero.
        """
        if self.stamina > self.max_stamina:
            self.stamina = self.max_stamina
        return self.stamina >= 0
    
    def is_dead(self) -> bool:
        """
        Check whether the player is dead.

        Returns:
            bool: True if stamina is below zero, False otherwise.
        """
        return self.stamina < 0
    
    def gain_hill_control(self, hill_id):
        """
        Grant control of a hill to the player.

        Controlling a new hill increases the player's maximum stamina.

        Args:
            hill_id (int): Identifier of the hill being gained.
        """
        if hill_id in self.controlled_hills:
            return
        self.controlled_hills.add(hill_id)
        self.max_stamina = GameConstants.BASE_MAX_STAMINA + len(self.controlled_hills) * GameConstants.HILL_MAX_STAMINA_BONUS

    def lose_hill_control(self, hill_id):
        """
        Remove control of a hill from the player.

        Losing a hill reduces the player's maximum stamina and clamps
        current stamina if necessary.

        Args:
            hill_id (int): Identifier of the hill being lost.
        """
        if hill_id not in self.controlled_hills:
            return
        self.controlled_hills.remove(hill_id)
        self.max_stamina = GameConstants.BASE_MAX_STAMINA + len(self.controlled_hills) * GameConstants.HILL_MAX_STAMINA_BONUS
        self.clamp_stamina()
    
    def get_copy(self) -> "Player":
        """
        Create a deep copy of this player.

        The copy has independent mutable state and can be safely modified
        without affecting the original player.

        Returns:
            Player: A duplicated player instance.
        """
        new_player = Player(
            self.parity, 
            Location(self.loc.r, self.loc.c), 
            self.max_stamina,
            copy=True
        )

        new_player.stamina = self.stamina
        new_player.controlled_hills = set(self.controlled_hills)
        new_player.beacon_count = self.beacon_count

        return new_player
        
