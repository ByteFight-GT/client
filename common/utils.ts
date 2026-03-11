import { MapLoc, Symmetry_t } from "./types";

/**
 * Adds an item to the end of the array if it doesn't exist, or moves it to the end if it does.
 * Returns a new array.
 */
export function addOrMoveToEnd<T>(arr: T[], item: T, equalityFn?: (a: T) => boolean): T[] {
  const index = equalityFn? arr.findIndex(equalityFn) : arr.indexOf(item);
  const newArr = [...arr];

  if (index !== -1) {
    newArr.splice(index, 1);
  }

  newArr.push(item);
  return newArr;
}

export function addOrMoveToEndInplace<T>(arr: T[], item: T, equalityFn?: (a: T) => boolean): void {
  const index = equalityFn? arr.findIndex(equalityFn) : arr.indexOf(item);

  if (index !== -1) {
    arr.splice(index, 1);
  }
  arr.push(item);
}

/**
 * Generates a *very very probably* unique match id given the seconds timestamp it was queued at.
 * 
 * format is this: timestamp-[5 random alphanumeric (b36) chars], e.g. `1697059200-1x2y3`
 * 
 * There are 60,466,176 possibilites for the suffix so surely there wont be collisions
 * - using birthday paradox calculator, even with 100 matches queued in the SAME SECOND
 * there would only be a 0.01% chance of collision. if that happens then we have bigger problems.
 */
export function generateMatchId(queuedTime: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 7); // 5 random alphanumeric chars
  return `${queuedTime}-${randomSuffix}`;
}

/** returns `{count} {plural}` if count != 1 otherwise `{count} {singular}` */
export function word(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1? singular : plural}`;
}

export function arrayEq1D<T>(arr1: T[], arr2: T[], eqFn?: (a: T, b: T) => boolean): boolean {
  if (arr1.length !== arr2.length) return false;

  if (eqFn) {
    for (let i = arr1.length; --i >= 0;) {
      const eq = eqFn(arr1[i], arr2[i]);
      if (!eq) return false;
    }
    return true;
  } else {
    for (let i = arr1.length; --i >= 0;) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }
}

export function oob(loc: MapLoc, mapSize: MapLoc): boolean {
  return loc[0] < 0 || loc[0] >= mapSize[0] || loc[1] < 0 || loc[1] >= mapSize[1];
}


/**
 * Format a number of milliseconds into human-readable format
 * Forms:
 * - {x}d {y}h
 * - {x}h {y}m
 * - {x}m {y}s
 * - {x.ab}s
 */
export function fmtTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

export function applySymmetry(mapLoc: MapLoc, mapSize: MapLoc, symmetry: Symmetry_t): MapLoc {
  const [r, c] = mapLoc;
  const [mapHeight, mapWidth] = mapSize;
  switch (symmetry) {
    case 'Vertical': // x (c) values are symmetric
      return [r, mapWidth - 1 - c];
    case 'Horizontal': // y (r) values are symmetric
      return [mapHeight - 1 - r, c];
    case 'Origin': // both
      return [mapHeight - 1 - r, mapWidth - 1 - c];
  }
}
