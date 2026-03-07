import platform
from cpuinfo import get_cpu_info
from pathlib import Path

"""
Used to stamp GameOutcomes
"""

def get_engine_version():
    """Read the current engine version from the VERSION file."""
    try:
        # Navigate from game_runner directory to repo root
        repo_root = Path(__file__).parent.parent.parent
        version_file = repo_root / 'VERSION'
        
        if version_file.exists():
            with open(version_file, 'r') as f:
                return f.read().strip()
        else:
            # Fallback if VERSION file not found
            return "1.0.0"
    except Exception:
        # Final fallback
        return "1.0.0"

def get_cpu():
    info = get_cpu_info()
    return f"brand:{info.get('brand_raw')}, arch: {platform.machine()}, processor: {platform.processor()}, platform: {platform.platform()}"