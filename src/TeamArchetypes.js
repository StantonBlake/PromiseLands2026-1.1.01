/*
 * Team archetype engine
 * ---------------------
 *
 * This file owns:
 * - live-draft archetype labels
 * - historical season archetype labels
 * - numeric thresholds
 * - rule priority
 * - the literal definition of each archetype
 *
 * NewMain.jsx calls:
 *
 * createTeamArchetype({
 *   manager,
 *   leagueSettings,
 * });
 *
 * DataDashboard.jsx calls:
 *
 * createHistoricalDraftArchetype({
 *   draftRows,
 *   leagueDraftRows,
 *   rosterSettings,
 * });
 */

const POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
];

/*
 * ============================================================
 * LIVE-DRAFT ARCHETYPE ENGINE
 * ============================================================
 */

/*
 * Edit this object when you want to tune the live-draft
 * archetype system.
 *
 * Every archetype keeps its display label and thresholds
 * together.
 */
export const TEAM_ARCHETYPE_SETTINGS = {
  formingIdentity: {
    label:
      "Forming Identity",

    minimumFilledSlots:
      3,

    minimumCoverage:
      0.25,
  },

  heroRb: {
    label:
      "Hero RB",

    /*
     * The roster must contain at least
     * this many running backs.
     */
    minimumRbCount:
      1,

    /*
     * The top RB must meet or exceed
     * this player percentile.
     */
    eliteRbPercentile:
      96,

    /*
     * If a second RB exists, that player
     * must remain below this percentile.
     *
     * This prevents a roster with two
     * strong RBs from being called Hero RB.
     */
    maximumSecondRbPercentile:
      80,

    /*
     * The WR group must either be filled
     * to its starter requirement or rank
     * this well against the league.
     */
    minimumWrRankPercentile:
      0.70,
  },

  zeroRb: {
    label:
      "Zero RB",

    /*
     * Do not identify Zero RB too early.
     */
    minimumFilledSlots:
      4,

    /*
     * The RB group must be weak relative
     * to the rest of the league.
     */
    maximumRbRankPercentile:
      0.35,

    /*
     * The WR group must be relatively
     * strong compared with the league.
     */
    minimumWrRankPercentile:
      0.70,
  },

  eliteQbBuild: {
    label:
      "Elite QB Build",

    minimumQbCount:
      1,

    minimumRankPercentile:
      0.92,

    minimumAveragePlayerPercentile:
      65,
  },

  eliteTeBuild: {
    label:
      "Elite TE Build",

    minimumTeCount:
      1,

    minimumRankPercentile:
      0.94,

    minimumAveragePlayerPercentile:
      80,
  },

  starsAndScrubs: {
    label:
      "Stars and Scrubs",

    minimumFilledSlots:
      6,

    /*
     * Average percentile of the roster's
     * three strongest counted players.
     */
    minimumTopThreeAverage:
      87,

    /*
     * Difference between the top-three
     * average and the entire roster average.
     */
    minimumTopToRosterSpread:
      17,

    /*
     * At least one counted player must be
     * this weak or weaker.
     */
    maximumBottomPlayerPercentile:
      70,
  },

  topHeavy: {
    label:
      "Top Heavy",

    minimumFilledSlots:
      5,

    minimumTopThreeAverage:
      80,

    minimumTopToRosterSpread:
      18,
  },

  aggressiveSpender: {
    label:
      "Aggressive Spender",

    minimumRosterFilledPercent:
      0.25,

    /*
     * Spending pace equals:
     *
     * budget spent percentage
     * minus
     * roster filled percentage
     *
     * A positive value means the manager
     * has spent faster than the roster
     * has been filled.
     */
    minimumPositiveSpendingPace:
      0.18,
  },

  budgetHoarder: {
    label:
      "Budget Hoarder",

    minimumRosterFilledPercent:
      0.3,

    /*
     * A negative spending pace means the
     * manager has spent more slowly than
     * roster progress would suggest.
     */
    maximumNegativeSpendingPace:
      -0.2,
  },

  rbHeavy: {
    label:
      "RB Heavy",

    /*
     * This is compared with the league's
     * configured RB starter requirement.
     *
     * The larger value is used.
     */
    minimumPlayerCount:
      4,

    minimumPointShare:
      0.36,

    minimumRankPercentile:
      0.69,

    minimumShareLeadOverWr:
      0.08,
  },

  wrHeavy: {
    label:
      "WR Heavy",

    minimumPlayerCount:
      2,

    minimumPointShare:
      0.4,

    minimumRankPercentile:
      0.6,

    minimumShareLeadOverRb:
      0.08,
  },

  depthCollector: {
    label:
      "Depth Collector",

    minimumFilledSlots:
      6,

    minimumOverallAverage:
      58,

    maximumTopToRosterSpread:
      10,

    minimumBottomPlayerPercentile:
      30,
  },

  balancedBuild: {
    label:
      "Balanced Build",

    minimumFilledSlots:
      5,

    minimumRbCount:
      1,

    minimumWrCount:
      1,

    maximumRbWrShareDifference:
      0.14,

    maximumSinglePositionShare:
      0.52,
  },

  positionFocused: {
    /*
     * This is the minimum combined score
     * required for a fallback positional
     * identity such as RB Focused.
     */
    minimumIdentityScore:
      0.42,

    rankWeight:
      0.55,

    pointShareWeight:
      0.45,

    labels: {
      QB:
        "QB Focused",

      RB:
        "RB Focused",

      WR:
        "WR Focused",

      TE:
        "TE Focused",
    },
  },

  fallback: {
    label:
      "Balanced Build",
  },
};

/*
 * The first matching archetype wins.
 *
 * Move an archetype higher when it should
 * take precedence over broader identities.
 */
export const TEAM_ARCHETYPE_PRIORITY = [
  
  "zeroRb",
  "eliteQbBuild",
  "eliteTeBuild",
  "heroRb",
  "starsAndScrubs",
  "topHeavy",
  "aggressiveSpender",
  "budgetHoarder",
  "rbHeavy",
  "wrHeavy",
  "depthCollector",
  "balancedBuild",
  "positionFocused",
];

/*
 * Public function used by NewMain.jsx.
 */
export function createTeamArchetype({
  manager,
  leagueSettings,
  settings =
    TEAM_ARCHETYPE_SETTINGS,
}) {
  const metrics =
    createArchetypeMetrics({
      manager,
      leagueSettings,
    });

  const formingSettings =
    settings
      .formingIdentity;

  /*
   * Keep the identity unfinished until
   * enough of the scoring roster exists.
   */
  if (
    metrics.filledSlots <
      formingSettings
        .minimumFilledSlots ||
    metrics.coverage <
      formingSettings
        .minimumCoverage
  ) {
    return (
      formingSettings.label
    );
  }

  /*
   * Evaluate rules in configured priority.
   */
  for (
    const archetypeKey
    of TEAM_ARCHETYPE_PRIORITY
  ) {
    const evaluator =
      ARCHETYPE_EVALUATORS[
        archetypeKey
      ];

    if (!evaluator) {
      continue;
    }

    const matchedLabel =
      evaluator({
        metrics,
        settings,
      });

    if (matchedLabel) {
      return matchedLabel;
    }
  }

  return (
    settings
      .fallback
      .label
  );
}

/*
 * Literal live-draft archetype definitions
 * ----------------------------------------
 *
 * The settings object stores the labels
 * and numbers.
 *
 * These evaluators define what each
 * archetype actually means.
 */
const ARCHETYPE_EVALUATORS = {
  /*
   * HERO RB
   *
   * Definition:
   * - At least one RB exists.
   * - The lead RB is elite.
   * - There is no strong second RB.
   * - The roster has established a useful
   *   WR foundation.
   */
  heroRb: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.heroRb;

    const hasEliteLeadRb =
      metrics.rbCount >=
        rule.minimumRbCount &&
      metrics
        .bestRbPercentile >=
        rule.eliteRbPercentile;

    const hasLimitedRbSupport =
      metrics.rbCount === 1 ||
      metrics
        .secondRbPercentile <
        rule
          .maximumSecondRbPercentile;

    const hasWrFoundation =
      metrics.wrCount >=
        metrics
          .starterRequirements
          .WR ||
      metrics
        .wrRankPercentile >=
        rule
          .minimumWrRankPercentile;

    if (
      hasEliteLeadRb &&
      hasLimitedRbSupport &&
      hasWrFoundation
    ) {
      return rule.label;
    }

    return null;
  },

  /*
   * ZERO RB
   *
   * Definition:
   * - The roster is developed enough to
   *   infer strategy.
   * - The manager has built the required
   *   WR volume.
   * - RB is either incomplete or clearly
   *   weak compared with the league.
   * - WR contributes more projected points
   *   than RB.
   */
  zeroRb: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.zeroRb;

    const rosterIsDeveloped =
      metrics.filledSlots >=
      rule.minimumFilledSlots;

    const hasRequiredWrVolume =
      metrics.wrCount >=
      metrics
        .starterRequirements
        .WR;

    const rbRoomIsIncomplete =
      metrics.rbCount <
      metrics
        .starterRequirements
        .RB;

    const wrRoomClearlyOutranksRb =
      metrics
        .rbRankPercentile <=
        rule
          .maximumRbRankPercentile &&
      metrics
        .wrRankPercentile >=
        rule
          .minimumWrRankPercentile;

    const wrOutproducesRb =
      metrics.wrShare >
      metrics.rbShare;

    if (
      rosterIsDeveloped &&
      hasRequiredWrVolume &&
      (
        rbRoomIsIncomplete ||
        wrRoomClearlyOutranksRb
      ) &&
      wrOutproducesRb
    ) {
      return rule.label;
    }

    return null;
  },

  /*
   * ELITE QB BUILD
   *
   * Definition:
   * - At least one QB exists.
   * - The QB room ranks near the top of
   *   the league.
   * - The average counted QB is elite.
   */
  eliteQbBuild: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .eliteQbBuild;

    const qualifies =
      metrics.qbCount >=
        rule.minimumQbCount &&
      metrics
        .qbRankPercentile >=
        rule
          .minimumRankPercentile &&
      metrics
        .positionData
        .QB
        .averagePercentile >=
        rule
          .minimumAveragePlayerPercentile;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * ELITE TE BUILD
   *
   * Definition:
   * - At least one TE exists.
   * - The TE room ranks near the top of
   *   the league.
   * - The average counted TE is elite.
   */
  eliteTeBuild: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .eliteTeBuild;

    const qualifies =
      metrics.teCount >=
        rule.minimumTeCount &&
      metrics
        .teRankPercentile >=
        rule
          .minimumRankPercentile &&
      metrics
        .positionData
        .TE
        .averagePercentile >=
        rule
          .minimumAveragePlayerPercentile;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * STARS AND SCRUBS
   *
   * Definition:
   * - The scoring roster has developed.
   * - The top three players are elite.
   * - There is a large quality gap between
   *   those stars and the full roster.
   * - At least one weak counted player
   *   exists near the bottom.
   */
  starsAndScrubs: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .starsAndScrubs;

    const qualifies =
      metrics.filledSlots >=
        rule.minimumFilledSlots &&
      metrics
        .topThreeAverage >=
        rule
          .minimumTopThreeAverage &&
      metrics.spread >=
        rule
          .minimumTopToRosterSpread &&
      metrics
        .bottomPlayerPercentile <=
        rule
          .maximumBottomPlayerPercentile;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * TOP HEAVY
   *
   * Definition:
   * - The scoring roster has developed.
   * - The top three players are strong.
   * - The top of the roster is materially
   *   stronger than the roster average.
   *
   * This is less extreme than
   * Stars and Scrubs.
   */
  topHeavy: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.topHeavy;

    const qualifies =
      metrics.filledSlots >=
        rule.minimumFilledSlots &&
      metrics
        .topThreeAverage >=
        rule
          .minimumTopThreeAverage &&
      metrics.spread >=
        rule
          .minimumTopToRosterSpread;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * AGGRESSIVE SPENDER
   *
   * Definition:
   * - Enough of the roster has been filled
   *   to infer spending behavior.
   * - The manager has spent faster than
   *   the roster has been filled.
   * - The manager still has more than the
   *   $1-per-open-slot reserve required to
   *   complete the roster.
   */
  aggressiveSpender: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .aggressiveSpender;

    const canStillFinishRoster =
      metrics.availableBudget >
      metrics
        .remainingRosterSpots;

    const qualifies =
      metrics
        .rosterFilledPercent >=
        rule
          .minimumRosterFilledPercent &&
      metrics.spendingPace >=
        rule
          .minimumPositiveSpendingPace &&
      canStillFinishRoster;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * BUDGET HOARDER
   *
   * Definition:
   * - Enough of the roster has been filled
   *   to infer spending behavior.
   * - The manager has spent much more
   *   slowly than roster progress.
   * - The manager holds budget above the
   *   required $1-per-open-slot reserve.
   */
  budgetHoarder: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .budgetHoarder;

    const hasBudgetFlexibility =
      metrics.availableBudget >
      metrics
        .remainingRosterSpots;

    const qualifies =
      metrics
        .rosterFilledPercent >=
        rule
          .minimumRosterFilledPercent &&
      metrics.spendingPace <=
        rule
          .maximumNegativeSpendingPace &&
      hasBudgetFlexibility;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * RB HEAVY
   *
   * Definition:
   * - The manager has at least the required
   *   RB starter count or configured minimum.
   * - RB owns a meaningful share of projected
   *   roster points.
   * - The RB room ranks well.
   * - RB has a clear projected-point lead
   *   over WR.
   */
  rbHeavy: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.rbHeavy;

    const requiredCount =
      Math.max(
        metrics
          .starterRequirements
          .RB,
        rule
          .minimumPlayerCount
      );

    const qualifies =
      metrics.rbCount >=
        requiredCount &&
      metrics.rbShare >=
        rule
          .minimumPointShare &&
      metrics
        .rbRankPercentile >=
        rule
          .minimumRankPercentile &&
      metrics.rbShare >=
        metrics.wrShare +
        rule
          .minimumShareLeadOverWr;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * WR HEAVY
   *
   * Definition:
   * - The manager has at least the required
   *   WR starter count or configured minimum.
   * - WR owns a meaningful share of projected
   *   roster points.
   * - The WR room ranks well.
   * - WR has a clear projected-point lead
   *   over RB.
   */
  wrHeavy: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.wrHeavy;

    const requiredCount =
      Math.max(
        metrics
          .starterRequirements
          .WR,
        rule
          .minimumPlayerCount
      );

    const qualifies =
      metrics.wrCount >=
        requiredCount &&
      metrics.wrShare >=
        rule
          .minimumPointShare &&
      metrics
        .wrRankPercentile >=
        rule
          .minimumRankPercentile &&
      metrics.wrShare >=
        metrics.rbShare +
        rule
          .minimumShareLeadOverRb;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * DEPTH COLLECTOR
   *
   * Definition:
   * - The roster has several counted players.
   * - The roster average is solid.
   * - The best players are not dramatically
   *   stronger than the full roster.
   * - The weakest counted player is still
   *   reasonably useful.
   */
  depthCollector: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .depthCollector;

    const qualifies =
      metrics.filledSlots >=
        rule.minimumFilledSlots &&
      metrics
        .overallAverage >=
        rule
          .minimumOverallAverage &&
      metrics.spread <=
        rule
          .maximumTopToRosterSpread &&
      metrics
        .bottomPlayerPercentile >=
        rule
          .minimumBottomPlayerPercentile;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * BALANCED BUILD
   *
   * Definition:
   * - The roster has developed.
   * - At least one RB and WR are present.
   * - RB and WR projected-point shares are
   *   reasonably close.
   * - No single position dominates the
   *   scoring roster.
   */
  balancedBuild: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .balancedBuild;

    const qualifies =
      metrics.filledSlots >=
        rule.minimumFilledSlots &&
      metrics.rbCount >=
        rule.minimumRbCount &&
      metrics.wrCount >=
        rule.minimumWrCount &&
      metrics
        .rbWrDifference <=
        rule
          .maximumRbWrShareDifference &&
      metrics
        .largestPositionShare <=
        rule
          .maximumSinglePositionShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * POSITION FOCUSED
   *
   * Definition:
   * - This is a fallback identity.
   * - Every position receives a combined
   *   score based on:
   *
   *   league-relative position rank
   *   plus
   *   projected-point share
   *
   * - The strongest position receives its
   *   focused label when the score clears
   *   the configured minimum.
   */
  positionFocused: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings
        .positionFocused;

    const identities =
      POSITIONS.map(
        (position) => {
          const rankScore =
            metrics
              .rankPercentiles[
                position
              ];

          const pointShare =
            metrics
              .pointShares[
                position
              ];

          return {
            position,

            label:
              rule.labels[
                position
              ],

            score:
              (
                rankScore *
                rule.rankWeight
              ) +
              (
                pointShare *
                rule
                  .pointShareWeight
              ),
          };
        }
      )
        .sort(
          (
            firstIdentity,
            secondIdentity
          ) =>
            secondIdentity.score -
            firstIdentity.score
        );

    const strongestIdentity =
      identities[0];

    if (
      strongestIdentity &&
      strongestIdentity.score >=
        rule
          .minimumIdentityScore
    ) {
      return (
        strongestIdentity.label
      );
    }

    return null;
  },
};

/*
 * Build every normalized metric needed
 * by the live-draft archetype evaluators.
 */
function createArchetypeMetrics({
  manager,
  leagueSettings,
}) {
  const breakdown =
    manager
      ?.strength_position_breakdown ??
    {};

  const countedPlayers =
    Array.isArray(
      manager
        ?.strength_counted_players
    )
      ? manager
          .strength_counted_players
      : [];

  const rosterAssignments =
    Array.isArray(
      manager
        ?.roster_assignments
    )
      ? manager
          .roster_assignments
      : [];

  const filledSlots =
    toSafeNumber(
      manager
        ?.strength_filled_slots
    );

  const expectedSlots =
    toSafeNumber(
      manager
        ?.strength_total_slots
    );

  const coverage =
    toSafeNumber(
      manager
        ?.strength_coverage
    );

  const availableBudget =
    toSafeNumber(
      manager
        ?.available_budget
    );

  const startingBudget =
    toSafeNumber(
      manager
        ?.starting_budget
    );

  const amountSpent =
    toSafeNumber(
      manager
        ?.amount_spent
    );

  const remainingRosterSpots =
    toSafeNumber(
      manager
        ?.remaining_roster_spots
    );

  const positionData =
    createPositionData(
      breakdown
    );

  const totalProjectedPoints =
    POSITIONS.reduce(
      (
        total,
        position
      ) =>
        total +
        positionData[
          position
        ].projectedPoints,
      0
    );

  const pointShares =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          totalProjectedPoints >
          0
            ? positionData[
                position
              ].projectedPoints /
              totalProjectedPoints
            : 0,
        ]
      )
    );

  const rankPercentiles =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          getRankPercentile(
            positionData[
              position
            ]
          ),
        ]
      )
    );

  const starterRequirements = {
    QB:
      toSafeNumber(
        leagueSettings
          ?.starters?.qb
      ),

    RB:
      toSafeNumber(
        leagueSettings
          ?.starters?.rb
      ),

    WR:
      toSafeNumber(
        leagueSettings
          ?.starters?.wr
      ),

    TE:
      toSafeNumber(
        leagueSettings
          ?.starters?.te
      ),
  };

  const naturalPositionCounts =
    createNaturalPositionCounts(
      rosterAssignments
    );

  const playersByPosition =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          countedPlayers
            .filter(
              (player) =>
                normalizePosition(
                  player?.position
                ) ===
                position
            )
            .sort(
              (
                firstPlayer,
                secondPlayer
              ) =>
                toSafeNumber(
                  secondPlayer
                    ?.percentile
                ) -
                toSafeNumber(
                  firstPlayer
                    ?.percentile
                )
            ),
        ]
      )
    );

  const allPercentiles =
    countedPlayers
      .map(
        (player) =>
          toSafeNumber(
            player?.percentile
          )
      )
      .sort(
        (
          firstPercentile,
          secondPercentile
        ) =>
          secondPercentile -
          firstPercentile
      );

  const topPercentiles =
    allPercentiles.slice(
      0,
      Math.min(
        3,
        allPercentiles.length
      )
    );

  const topThreeAverage =
    average(
      topPercentiles
    );

  const overallAverage =
    average(
      allPercentiles
    );

  const bottomPlayerPercentile =
    allPercentiles.length >
    0
      ? allPercentiles[
          allPercentiles.length -
          1
        ]
      : 0;

  const budgetSpentPercent =
    startingBudget > 0
      ? amountSpent /
        startingBudget
      : 0;

  const rosterFilledPercent =
    expectedSlots > 0
      ? filledSlots /
        expectedSlots
      : 0;

  const rbShare =
    pointShares.RB;

  const wrShare =
    pointShares.WR;

  return {
    positionData,
    pointShares,
    rankPercentiles,
    starterRequirements,
    naturalPositionCounts,
    playersByPosition,

    filledSlots,
    expectedSlots,
    coverage,

    availableBudget,
    startingBudget,
    amountSpent,
    remainingRosterSpots,

    budgetSpentPercent,
    rosterFilledPercent,

    spendingPace:
      budgetSpentPercent -
      rosterFilledPercent,

    topThreeAverage,
    overallAverage,

    spread:
      topThreeAverage -
      overallAverage,

    bottomPlayerPercentile,

    rbWrDifference:
      Math.abs(
        rbShare -
        wrShare
      ),

    largestPositionShare:
      Math.max(
        pointShares.QB,
        pointShares.RB,
        pointShares.WR,
        pointShares.TE
      ),

    qbShare:
      pointShares.QB,

    rbShare,

    wrShare,

    teShare:
      pointShares.TE,

    qbRankPercentile:
      rankPercentiles.QB,

    rbRankPercentile:
      rankPercentiles.RB,

    wrRankPercentile:
      rankPercentiles.WR,

    teRankPercentile:
      rankPercentiles.TE,

    qbCount:
      naturalPositionCounts.QB,

    rbCount:
      naturalPositionCounts.RB,

    wrCount:
      naturalPositionCounts.WR,

    teCount:
      naturalPositionCounts.TE,

    bestRbPercentile:
      toSafeNumber(
        playersByPosition
          .RB[0]
          ?.percentile
      ),

    secondRbPercentile:
      toSafeNumber(
        playersByPosition
          .RB[1]
          ?.percentile
      ),
  };
}

/*
 * Normalize the position breakdown that
 * NewMain.jsx creates.
 */
function createPositionData(
  breakdown
) {
  return Object.fromEntries(
    POSITIONS.map(
      (position) => {
        const data =
          breakdown[
            position
          ] ?? {};

        return [
          position,

          {
            position,

            playerCount:
              toSafeNumber(
                data.playerCount
              ),

            projectedPoints:
              toSafeNumber(
                data.projectedPoints
              ),

            averagePercentile:
              toSafeNumber(
                data.averagePercentile
              ),

            rank:
              data.rank == null
                ? null
                : toSafeNumber(
                    data.rank
                  ),

            fieldSize:
              toSafeNumber(
                data.fieldSize
              ),
          },
        ];
      }
    )
  );
}

/*
 * Count natural player positions from the
 * entire roster, including ABN and SBN.
 *
 * A running back placed in ABN still counts
 * as an RB for archetype purposes.
 */
function createNaturalPositionCounts(
  rosterAssignments
) {
  const counts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  };

  rosterAssignments.forEach(
    (player) => {
      const position =
        normalizePosition(
          player?.position
        );

      if (
        Object.hasOwn(
          counts,
          position
        )
      ) {
        counts[
          position
        ] += 1;
      }
    }
  );

  return counts;
}

/*
 * Convert rank into a zero-to-one score.
 *
 * First place approaches 1.
 * Last place approaches 0.
 */
function getRankPercentile(
  positionData
) {
  const rank =
    toSafeNumber(
      positionData?.rank
    );

  const fieldSize =
    toSafeNumber(
      positionData
        ?.fieldSize
    );

  if (
    rank <= 0 ||
    fieldSize <= 0
  ) {
    return 0;
  }

  if (
    fieldSize === 1
  ) {
    return 1;
  }

  return (
    fieldSize -
    rank
  ) /
  (
    fieldSize -
    1
  );
}

/*
 * ============================================================
 * HISTORICAL DRAFT ARCHETYPE ENGINE
 * ============================================================
 */

/*
 * Historical season draft settings.
 *
 * This engine is intentionally separate from the live-draft
 * engine above.
 */
export const HISTORICAL_DRAFT_ARCHETYPE_SETTINGS = {
  formingIdentity: {
    label:
      "Forming Identity",
  },

  minimumDraftedPlayers:
    4,

  heroRb: {
    label:
      "Hero RB",

    minimumRbCount:
      1,

    minimumLeadRbCostShare:
      0.22,

    maximumSecondRbCostShare:
      0.12,

    minimumWrCount:
      2,
  },

  zeroRb: {
    label:
      "Zero RB",

    minimumDraftedPlayers:
      6,

    maximumRbSpendShare:
      0.18,

    minimumWrSpendShare:
      0.34,

    minimumWrCount:
      3,
  },

  eliteQbBuild: {
    label:
      "Elite QB Build",

    minimumQbCount:
      1,

    minimumQbSpendShare:
      0.13,

    minimumLeadQbPricePercentile:
      0.75,
  },

  eliteTeBuild: {
    label:
      "Elite TE Build",

    minimumTeCount:
      1,

    minimumTeSpendShare:
      0.11,

    minimumLeadTePricePercentile:
      0.75,
  },

  starsAndScrubs: {
    label:
      "Stars and Scrubs",

    minimumDraftedPlayers:
      8,

    minimumTopThreeSpendShare:
      0.56,

    maximumBottomHalfSpendShare:
      0.2,
  },

  topHeavy: {
    label:
      "Top Heavy",

    minimumDraftedPlayers:
      7,

    minimumTopThreeSpendShare:
      0.46,
  },

  aggressiveSpender: {
    label:
      "Aggressive Spender",

    minimumDraftedPlayers:
      5,

    minimumEarlySpendShare:
      0.62,

    earlyDraftFraction:
      0.4,
  },

  budgetHoarder: {
    label:
      "Budget Hoarder",

    minimumDraftedPlayers:
      6,

    maximumEarlySpendShare:
      0.38,

    earlyDraftFraction:
      0.4,
  },

  rbHeavy: {
    label:
      "RB Heavy",

    minimumRbCount:
      3,

    minimumRbSpendShare:
      0.38,

    minimumLeadOverWr:
      0.08,
  },

  wrHeavy: {
    label:
      "WR Heavy",

    minimumWrCount:
      4,

    minimumWrSpendShare:
      0.42,

    minimumLeadOverRb:
      0.08,
  },

  valueHunter: {
    label:
      "Value Hunter",

    minimumRowsWithSurplus:
      5,

    minimumPositiveSurplusRate:
      0.6,

    minimumTotalSurplus:
      20,
  },

  depthCollector: {
    label:
      "Depth Collector",

    minimumDraftedPlayers:
      9,

    maximumTopThreeSpendShare:
      0.38,

    minimumMiddleRosterSpendShare:
      0.38,
  },

  balancedBuild: {
    label:
      "Balanced Build",

    minimumDraftedPlayers:
      7,

    minimumRbCount:
      2,

    minimumWrCount:
      2,

    maximumRbWrSpendDifference:
      0.14,

    maximumSinglePositionSpendShare:
      0.5,
  },

  positionFocused: {
    minimumSpendShare:
      0.32,

    labels: {
      QB:
        "QB Focused",

      RB:
        "RB Focused",

      WR:
        "WR Focused",

      TE:
        "TE Focused",
    },
  },

  fallback: {
    label:
      "Balanced Build",
  },
};

/*
 * Historical rule priority.
 *
 * The first matching historical archetype wins.
 */
export const HISTORICAL_DRAFT_ARCHETYPE_PRIORITY = [
  "heroRb",
  "zeroRb",
  "eliteQbBuild",
  "eliteTeBuild",
  "starsAndScrubs",
  "topHeavy",
  "aggressiveSpender",
  "budgetHoarder",
  "rbHeavy",
  "wrHeavy",
  "valueHunter",
  "depthCollector",
  "balancedBuild",
  "positionFocused",
];

/*
 * Public historical function that returns only the label.
 */
export function createHistoricalDraftArchetype({
  draftRows,
  leagueDraftRows = [],
  rosterSettings = {},
  settings =
    HISTORICAL_DRAFT_ARCHETYPE_SETTINGS,
}) {
  return (
    createHistoricalDraftArchetypeDetails({
      draftRows,
      leagueDraftRows,
      rosterSettings,
      settings,
    }).label
  );
}

/*
 * Detailed historical version.
 *
 * Returns:
 *
 * {
 *   label,
 *   key,
 *   metrics
 * }
 */
export function createHistoricalDraftArchetypeDetails({
  draftRows,
  leagueDraftRows = [],
  rosterSettings = {},
  settings =
    HISTORICAL_DRAFT_ARCHETYPE_SETTINGS,
}) {
  const metrics =
    createHistoricalDraftMetrics({
      draftRows,
      leagueDraftRows,
      rosterSettings,
      settings,
    });

  if (
    metrics.draftedPlayers <
    settings.minimumDraftedPlayers
  ) {
    return {
      label:
        settings
          .formingIdentity
          .label,

      key:
        "formingIdentity",

      metrics,
    };
  }

  for (
    const archetypeKey
    of HISTORICAL_DRAFT_ARCHETYPE_PRIORITY
  ) {
    const evaluator =
      HISTORICAL_DRAFT_ARCHETYPE_EVALUATORS[
        archetypeKey
      ];

    if (!evaluator) {
      continue;
    }

    const label =
      evaluator({
        metrics,
        settings,
      });

    if (label) {
      return {
        label,
        key:
          archetypeKey,
        metrics,
      };
    }
  }

  return {
    label:
      settings
        .fallback
        .label,

    key:
      "fallback",

    metrics,
  };
}

/*
 * Historical archetype definitions.
 */
const HISTORICAL_DRAFT_ARCHETYPE_EVALUATORS = {
  /*
   * HERO RB
   *
   * - At least one RB exists.
   * - The lead RB receives a major investment.
   * - The second RB receives limited investment.
   * - At least two WRs are drafted.
   */
  heroRb: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.heroRb;

    const rbPlayers =
      metrics
        .playersByPosition
        .RB;

    const leadRbShare =
      metrics.totalSpend > 0
        ? historicalDraftRowCost(
            rbPlayers[0]
          ) /
          metrics.totalSpend
        : 0;

    const secondRbShare =
      metrics.totalSpend > 0
        ? historicalDraftRowCost(
            rbPlayers[1]
          ) /
          metrics.totalSpend
        : 0;

    const qualifies =
      metrics
        .positionCounts
        .RB >=
        rule.minimumRbCount &&
      leadRbShare >=
        rule
          .minimumLeadRbCostShare &&
      secondRbShare <=
        rule
          .maximumSecondRbCostShare &&
      metrics
        .positionCounts
        .WR >=
        rule.minimumWrCount;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * ZERO RB
   */
  zeroRb: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.zeroRb;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics
        .positionSpendShares
        .RB <=
        rule.maximumRbSpendShare &&
      metrics
        .positionSpendShares
        .WR >=
        rule.minimumWrSpendShare &&
      metrics
        .positionCounts
        .WR >=
        rule.minimumWrCount;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * ELITE QB BUILD
   */
  eliteQbBuild: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.eliteQbBuild;

    const qualifies =
      metrics
        .positionCounts
        .QB >=
        rule.minimumQbCount &&
      metrics
        .positionSpendShares
        .QB >=
        rule.minimumQbSpendShare &&
      metrics
        .leadPricePercentiles
        .QB >=
        rule
          .minimumLeadQbPricePercentile;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * ELITE TE BUILD
   */
  eliteTeBuild: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.eliteTeBuild;

    const qualifies =
      metrics
        .positionCounts
        .TE >=
        rule.minimumTeCount &&
      metrics
        .positionSpendShares
        .TE >=
        rule.minimumTeSpendShare &&
      metrics
        .leadPricePercentiles
        .TE >=
        rule
          .minimumLeadTePricePercentile;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * STARS AND SCRUBS
   */
  starsAndScrubs: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.starsAndScrubs;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics.topThreeSpendShare >=
        rule.minimumTopThreeSpendShare &&
      metrics.bottomHalfSpendShare <=
        rule.maximumBottomHalfSpendShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * TOP HEAVY
   */
  topHeavy: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.topHeavy;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics.topThreeSpendShare >=
        rule.minimumTopThreeSpendShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * AGGRESSIVE SPENDER
   */
  aggressiveSpender: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.aggressiveSpender;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics.earlySpendShare >=
        rule.minimumEarlySpendShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * BUDGET HOARDER
   */
  budgetHoarder: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.budgetHoarder;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics.earlySpendShare <=
        rule.maximumEarlySpendShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * RB HEAVY
   */
  rbHeavy: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.rbHeavy;

    const qualifies =
      metrics
        .positionCounts
        .RB >=
        rule.minimumRbCount &&
      metrics
        .positionSpendShares
        .RB >=
        rule.minimumRbSpendShare &&
      metrics
        .positionSpendShares
        .RB >=
        metrics
          .positionSpendShares
          .WR +
        rule.minimumLeadOverWr;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * WR HEAVY
   */
  wrHeavy: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.wrHeavy;

    const qualifies =
      metrics
        .positionCounts
        .WR >=
        rule.minimumWrCount &&
      metrics
        .positionSpendShares
        .WR >=
        rule.minimumWrSpendShare &&
      metrics
        .positionSpendShares
        .WR >=
        metrics
          .positionSpendShares
          .RB +
        rule.minimumLeadOverRb;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * VALUE HUNTER
   */
  valueHunter: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.valueHunter;

    const qualifies =
      metrics.rowsWithSurplus >=
        rule.minimumRowsWithSurplus &&
      metrics.positiveSurplusRate >=
        rule.minimumPositiveSurplusRate &&
      metrics.totalSurplus >=
        rule.minimumTotalSurplus;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * DEPTH COLLECTOR
   */
  depthCollector: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.depthCollector;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics.topThreeSpendShare <=
        rule.maximumTopThreeSpendShare &&
      metrics.middleRosterSpendShare >=
        rule.minimumMiddleRosterSpendShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * BALANCED BUILD
   */
  balancedBuild: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.balancedBuild;

    const qualifies =
      metrics.draftedPlayers >=
        rule.minimumDraftedPlayers &&
      metrics
        .positionCounts
        .RB >=
        rule.minimumRbCount &&
      metrics
        .positionCounts
        .WR >=
        rule.minimumWrCount &&
      metrics.rbWrSpendDifference <=
        rule.maximumRbWrSpendDifference &&
      metrics.largestPositionSpendShare <=
        rule
          .maximumSinglePositionSpendShare;

    return qualifies
      ? rule.label
      : null;
  },

  /*
   * POSITION FOCUSED
   */
  positionFocused: ({
    metrics,
    settings,
  }) => {
    const rule =
      settings.positionFocused;

    const strongestPosition =
      POSITIONS
        .map(
          (position) => ({
            position,

            share:
              metrics
                .positionSpendShares[
                  position
                ],
          })
        )
        .sort(
          (
            firstPosition,
            secondPosition
          ) =>
            secondPosition.share -
            firstPosition.share
        )[0];

    if (
      strongestPosition &&
      strongestPosition.share >=
        rule.minimumSpendShare
    ) {
      return (
        rule.labels[
          strongestPosition.position
        ]
      );
    }

    return null;
  },
};

/*
 * Build every metric used by the historical
 * draft archetype evaluators.
 */
function createHistoricalDraftMetrics({
  draftRows,
  leagueDraftRows,
  rosterSettings,
  settings,
}) {
  const normalizedRows =
    Array.isArray(
      draftRows
    )
      ? draftRows.filter(
          (row) =>
            normalizeHistoricalPosition(
              historicalDraftRowPosition(
                row
              )
            )
        )
      : [];

  const comparisonRows =
    Array.isArray(
      leagueDraftRows
    ) &&
    leagueDraftRows.length > 0
      ? leagueDraftRows.filter(
          (row) =>
            normalizeHistoricalPosition(
              historicalDraftRowPosition(
                row
              )
            )
        )
      : normalizedRows;

  const rowsByCost =
    [...normalizedRows]
      .sort(
        (
          firstRow,
          secondRow
        ) =>
          historicalDraftRowCost(
            secondRow
          ) -
          historicalDraftRowCost(
            firstRow
          )
      );

  const rowsBySequence =
    [...normalizedRows]
      .sort(
        (
          firstRow,
          secondRow
        ) =>
          historicalDraftRowSequence(
            firstRow
          ) -
          historicalDraftRowSequence(
            secondRow
          )
      );

  const draftedPlayers =
    normalizedRows.length;

  const totalSpend =
    normalizedRows.reduce(
      (
        total,
        row
      ) =>
        total +
        historicalDraftRowCost(
          row
        ),
      0
    );

  const positionCounts =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          normalizedRows.filter(
            (row) =>
              normalizeHistoricalPosition(
                historicalDraftRowPosition(
                  row
                )
              ) ===
              position
          ).length,
        ]
      )
    );

  const positionSpend =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          normalizedRows
            .filter(
              (row) =>
                normalizeHistoricalPosition(
                  historicalDraftRowPosition(
                    row
                  )
                ) ===
                position
            )
            .reduce(
              (
                total,
                row
              ) =>
                total +
                historicalDraftRowCost(
                  row
                ),
              0
            ),
        ]
      )
    );

  const positionSpendShares =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          totalSpend > 0
            ? positionSpend[
                position
              ] /
              totalSpend
            : 0,
        ]
      )
    );

  const playersByPosition =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          rowsByCost.filter(
            (row) =>
              normalizeHistoricalPosition(
                historicalDraftRowPosition(
                  row
                )
              ) ===
              position
          ),
        ]
      )
    );

  const leagueCostsByPosition =
    Object.fromEntries(
      POSITIONS.map(
        (position) => [
          position,

          comparisonRows
            .filter(
              (row) =>
                normalizeHistoricalPosition(
                  historicalDraftRowPosition(
                    row
                  )
                ) ===
                position
            )
            .map(
              historicalDraftRowCost
            )
            .filter(
              (cost) =>
                Number.isFinite(
                  cost
                )
            )
            .sort(
              (
                firstCost,
                secondCost
              ) =>
                firstCost -
                secondCost
            ),
        ]
      )
    );

  const leadPricePercentiles =
    Object.fromEntries(
      POSITIONS.map(
        (position) => {
          const leadPlayer =
            playersByPosition[
              position
            ][0];

          return [
            position,

            leadPlayer
              ? historicalPercentileRank(
                  leagueCostsByPosition[
                    position
                  ],

                  historicalDraftRowCost(
                    leadPlayer
                  )
                )
              : 0,
          ];
        }
      )
    );

  const topThreeSpend =
    rowsByCost
      .slice(
        0,
        3
      )
      .reduce(
        (
          total,
          row
        ) =>
          total +
          historicalDraftRowCost(
            row
          ),
        0
      );

  const bottomHalfStart =
    Math.floor(
      rowsByCost.length /
      2
    );

  const bottomHalfSpend =
    rowsByCost
      .slice(
        bottomHalfStart
      )
      .reduce(
        (
          total,
          row
        ) =>
          total +
          historicalDraftRowCost(
            row
          ),
        0
      );

  const middleStart =
    Math.floor(
      rowsByCost.length *
      0.25
    );

  const middleEnd =
    Math.ceil(
      rowsByCost.length *
      0.75
    );

  const middleRosterSpend =
    rowsByCost
      .slice(
        middleStart,
        middleEnd
      )
      .reduce(
        (
          total,
          row
        ) =>
          total +
          historicalDraftRowCost(
            row
          ),
        0
      );

  const earlyDraftFraction =
    settings
      .aggressiveSpender
      .earlyDraftFraction;

  const earlyCount =
    rowsBySequence.length >
    0
      ? Math.max(
          1,

          Math.ceil(
            rowsBySequence.length *
            earlyDraftFraction
          )
        )
      : 0;

  const earlySpend =
    rowsBySequence
      .slice(
        0,
        earlyCount
      )
      .reduce(
        (
          total,
          row
        ) =>
          total +
          historicalDraftRowCost(
            row
          ),
        0
      );

  const surplusValues =
    normalizedRows
      .map(
        historicalDraftRowSurplus
      )
      .filter(
        (value) =>
          value !== null
      );

  const starterRows =
    createHistoricalStarterRows({
      rows:
        normalizedRows,

      rosterSettings,
    });

  const starterRowSet =
    new Set(
      starterRows
    );

  const benchRows =
    normalizedRows.filter(
      (row) =>
        !starterRowSet.has(
          row
        )
    );

  const starterSpend =
    starterRows.reduce(
      (
        total,
        row
      ) =>
        total +
        historicalDraftRowCost(
          row
        ),
      0
    );

  const benchSpend =
    benchRows.reduce(
      (
        total,
        row
      ) =>
        total +
        historicalDraftRowCost(
          row
        ),
      0
    );

  const positiveSurplusCount =
    surplusValues.filter(
      (value) =>
        value > 0
    ).length;

  return {
    draftedPlayers,
    totalSpend,

    positionCounts,
    positionSpend,
    positionSpendShares,

    playersByPosition,
    leadPricePercentiles,

    topThreeSpendShare:
      totalSpend > 0
        ? topThreeSpend /
          totalSpend
        : 0,

    bottomHalfSpendShare:
      totalSpend > 0
        ? bottomHalfSpend /
          totalSpend
        : 0,

    middleRosterSpendShare:
      totalSpend > 0
        ? middleRosterSpend /
          totalSpend
        : 0,

    earlySpendShare:
      totalSpend > 0
        ? earlySpend /
          totalSpend
        : 0,

    rowsWithSurplus:
      surplusValues.length,

    totalSurplus:
      surplusValues.reduce(
        (
          total,
          value
        ) =>
          total +
          value,
        0
      ),

    averageSurplus:
      average(
        surplusValues
      ),

    positiveSurplusRate:
      surplusValues.length >
      0
        ? positiveSurplusCount /
          surplusValues.length
        : 0,

    starterCount:
      starterRows.length,

    benchCount:
      benchRows.length,

    starterSpend,
    benchSpend,

    starterSpendShare:
      totalSpend > 0
        ? starterSpend /
          totalSpend
        : 0,

    benchSpendShare:
      totalSpend > 0
        ? benchSpend /
          totalSpend
        : 0,

    rbWrSpendDifference:
      Math.abs(
        positionSpendShares.RB -
        positionSpendShares.WR
      ),

    largestPositionSpendShare:
      Math.max(
        ...POSITIONS.map(
          (position) =>
            positionSpendShares[
              position
            ]
        )
      ),
  };
}

/*
 * Determine historical starter rows.
 *
 * First preference:
 * use the recorded roster slot.
 *
 * Fallback:
 * use configured starter counts and select
 * the most expensive players at each position.
 */
function createHistoricalStarterRows({
  rows,
  rosterSettings,
}) {
  const rowsWithSlots =
    rows.filter(
      (row) =>
        historicalDraftRowRosterSlot(
          row
        )
    );

  if (
    rowsWithSlots.length >
    0
  ) {
    return rows.filter(
      (row) =>
        isHistoricalStartingSlot(
          historicalDraftRowRosterSlot(
            row
          )
        )
    );
  }

  const starters =
    [];

  POSITIONS.forEach(
    (position) => {
      const positionRows =
        rows
          .filter(
            (row) =>
              normalizeHistoricalPosition(
                historicalDraftRowPosition(
                  row
                )
              ) ===
              position
          )
          .sort(
            (
              firstRow,
              secondRow
            ) =>
              historicalDraftRowCost(
                secondRow
              ) -
              historicalDraftRowCost(
                firstRow
              )
          );

      const configuredCount =
        historicalStarterRequirement(
          rosterSettings,
          position
        );

      const countToUse =
        configuredCount > 0
          ? configuredCount
          : positionRows.length;

      starters.push(
        ...positionRows.slice(
          0,
          countToUse
        )
      );
    }
  );

  return starters;
}

function historicalStarterRequirement(
  rosterSettings,
  position
) {
  const lowerPosition =
    position
      .toLowerCase();

  return toSafeNumber(
    historicalValueOf(
      rosterSettings
        ?.starters,

      lowerPosition,
      position
    )
  );
}

function isHistoricalStartingSlot(
  slot
) {
  const normalizedSlot =
    String(
      slot ?? ""
    )
      .trim()
      .toUpperCase();

  if (!normalizedSlot) {
    return false;
  }

  const benchTokens = [
    "BN",
    "BENCH",
    "SBN",
    "ABN",
    "IR",
    "RES",
    "RESERVE",
    "TAXI",
  ];

  return !benchTokens.some(
    (token) =>
      normalizedSlot.includes(
        token
      )
  );
}

/*
 * ============================================================
 * HISTORICAL DRAFT ROW READERS
 * ============================================================
 */

function historicalDraftRowPosition(
  row
) {
  return historicalValueOf(
    row,
    "Position",
    "position",
    "POS",
    "pos",
    "Player_Position",
    "player_position",
    "Player Position",
    "player position"
  );
}

function historicalDraftRowCost(
  row
) {
  return toSafeNumber(
    historicalValueOf(
      row,
      "Cost",
      "cost",
      "Price",
      "price",
      "Draft_Cost",
      "draft_cost",
      "Auction_Value",
      "auction_value",
      "Auction Value",
      "auction value"
    )
  );
}

function historicalDraftRowSurplus(
  row
) {
  const value =
    historicalValueOf(
      row,
      "SV$",
      "SV",
      "sv",
      "surplus_value",
      "Surplus_Value",
      "surplusValue",
      "Surplus Value",
      "surplus value"
    );

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsedValue =
    Number(
      value
    );

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : null;
}

function historicalDraftRowSequence(
  row
) {
  const value =
    historicalValueOf(
      row,
      "Draft_Order",
      "draft_order",
      "Draft Order",
      "draft order",
      "Pick",
      "pick",
      "Pick_Number",
      "pick_number",
      "Pick Number",
      "pick number",
      "Nomination_Order",
      "nomination_order",
      "Nomination Order",
      "nomination order",
      "Overall_Pick",
      "overall_pick",
      "Overall Pick",
      "overall pick",
      "Roster_Slot_Number",
      "roster_slot_number",
      "Draft_Slot",
      "draft_slot",
      "Draft Slot",
      "draft slot"
    );

  const parsedValue =
    Number(
      value
    );

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : Number.MAX_SAFE_INTEGER;
}

function historicalDraftRowRosterSlot(
  row
) {
  return String(
    historicalValueOf(
      row,
      "Roster_Slot",
      "roster_slot",
      "Roster Slot",
      "roster slot",
      "Drafted_To",
      "drafted_to",
      "Drafted To",
      "drafted to",
      "Assigned_Slot",
      "assigned_slot",
      "Assigned Slot",
      "assigned slot",
      "Draft_Slot",
      "draft_slot",
      "Draft Slot",
      "draft slot",
      "Slot",
      "slot"
    ) ?? ""
  )
    .trim()
    .toUpperCase();
}

/*
 * ============================================================
 * SHARED HELPERS
 * ============================================================
 */

function normalizePosition(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();
}

function normalizeHistoricalPosition(
  value
) {
  const normalizedPosition =
    normalizePosition(
      value
    );

  return POSITIONS.includes(
    normalizedPosition
  )
    ? normalizedPosition
    : "";
}

function historicalPercentileRank(
  sortedValues,
  value
) {
  if (
    !Array.isArray(
      sortedValues
    ) ||
    sortedValues.length ===
      0 ||
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  if (
    sortedValues.length ===
    1
  ) {
    return 1;
  }

  let atOrBelowCount =
    0;

  sortedValues.forEach(
    (candidateValue) => {
      if (
        candidateValue <=
        value
      ) {
        atOrBelowCount +=
          1;
      }
    }
  );

  return (
    atOrBelowCount /
    sortedValues.length
  );
}

function average(
  values
) {
  if (
    !Array.isArray(
      values
    ) ||
    values.length ===
      0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (
        total,
        value
      ) =>
        total +
        toSafeNumber(
          value
        ),
      0
    ) /
    values.length
  );
}

function toSafeNumber(
  value
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function historicalValueOf(
  object,
  ...keys
) {
  for (
    const key
    of keys
  ) {
    if (
      object?.[key] !==
        undefined &&
      object?.[key] !==
        null
    ) {
      return object[
        key
      ];
    }
  }

  return null;
}