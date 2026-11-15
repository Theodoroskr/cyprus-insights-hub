/** Weight of one view in "Most Read": halves every 6 hours (mirrors get_most_read_articles). */
export const HALF_LIFE_HOURS = 6;
export const viewWeight = (hoursAgo: number) => Math.pow(0.5, hoursAgo / HALF_LIFE_HOURS);
