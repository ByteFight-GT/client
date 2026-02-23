
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