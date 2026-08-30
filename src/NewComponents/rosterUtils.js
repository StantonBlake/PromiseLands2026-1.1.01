// utils/rosterUtils.js

/**
 * Calculate budget left and max bid for a team.
 * @param {Array} roster - array of players with `cost` field
 * @param {number} budget - starting budget (default 300)
 * @param {number} rosterSize - total roster slots (default 15)
 * @returns {object} { budgetLeft, maxBid }
 */
 export const calculateBudgetAndMaxBid = (roster, budget = 300, rosterSize = 17) => {
  if (!roster) return { budgetLeft: budget, maxBid: budget };

  // Total spent so far
  const spent = roster.reduce((sum, p) => sum + (p.cost || 0), 0);

  // Money left
  const budgetLeft = budget - spent;

  // Open slots left to fill
  const openSpots = rosterSize - roster.length;

  // Max bid = budgetLeft - (openSpots - 1) so you can leave $1 for each open slot
  const maxBid = openSpots > 0 ? budgetLeft - (openSpots - 1) : budgetLeft;

  return {
    budgetLeft: Math.max(budgetLeft, 0),
    maxBid: Math.max(maxBid, 0),
  };
};
