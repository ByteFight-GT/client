
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

/**
 * gets the time elapsed since `timestamp` (unix ms) in an english string.
 * Form:
 * - x (seconds|minutes|hours|days|weeks|months|years) ago
 * 
 * Months are counted as 30 days, years are counted as 365 days
 */
export function timeElapsedString(timestamp: number): string {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - timestamp) / 1000);

  const minutes = Math.floor(elapsedSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${word(years, 'year', 'years')} ago`;
  if (months > 0) return `${word(months, 'month', 'months')} ago`;
  if (weeks > 0) return `${word(weeks, 'week', 'weeks')} ago`;
  if (days > 0) return `${word(days, 'day', 'days')} ago`;
  if (hours > 0) return `${word(hours, 'hour', 'hours')} ago`;
  if (minutes > 0) return `${word(minutes, 'minute', 'minutes')} ago`;
  
  return `${word(elapsedSeconds, 'second', 'seconds')} ago`;
}