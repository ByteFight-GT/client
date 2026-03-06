import platform
from cpuinfo import get_cpu_info

"""
Used to stamp GameOutcomes
"""

def get_engine_version():
    return "0.1.1"

def get_cpu():
    info = get_cpu_info()
    return f"brand:{info.get('brand_raw')}, arch: {platform.machine()}, processor: {platform.processor()}, platform: {platform.platform()}"