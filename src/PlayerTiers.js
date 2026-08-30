const VALID_POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const TIER_LABELS = [
  {
    key: "elite",
    label: "Elite",
  },
  {
    key: "starter",
    label: "Starter",
  },
  {
    key: "bench",
    label: "Bench",
  },
  {
    key: "depth",
    label: "Depth",
  },
];

/*
 * Each tier boundary searches for the largest projection drop
 * inside a sensible positional range.
 *
 * A fallback rank is used only when no projection gap clears
 * the configured absolute or percentage threshold.
 *
 * Rank values are one-based.
 *
 * Example:
 *
 * startRank: 3
 * endRank: 14
 *
 * means:
 *
 * Search for the strongest projection drop after players
 * ranked 3 through 14.
 */
const PROJECTION_GAP_CONFIG = {
  QB: [
    {
      /*
       * Elite to Starter boundary.
       */
      startRank: 2,
      endRank: 8,

      fallbackRank: 5,

      minimumAbsoluteGap: 12,
      minimumPercentGap: 0.045,
    },
    {
      /*
       * Starter to Bench boundary.
       */
      startRank: 8,
      endRank: 18,

      fallbackRank: 12,

      minimumAbsoluteGap: 9,
      minimumPercentGap: 0.04,
    },
    {
      /*
       * Bench to Depth boundary.
       */
      startRank: 18,
      endRank: 32,

      fallbackRank: 24,

      minimumAbsoluteGap: 7,
      minimumPercentGap: 0.035,
    },
  ],

  RB: [
    {
      /*
       * Elite to Starter boundary.
       */
      startRank: 3,
      endRank: 14,

      fallbackRank: 8,

      minimumAbsoluteGap: 10,
      minimumPercentGap: 0.04,
    },
    {
      /*
       * Starter to Bench boundary.
       */
      startRank: 14,
      endRank: 36,

      fallbackRank: 24,

      minimumAbsoluteGap: 7,
      minimumPercentGap: 0.035,
    },
    {
      /*
       * Bench to Depth boundary.
       */
      startRank: 36,
      endRank: 64,

      fallbackRank: 48,

      minimumAbsoluteGap: 5,
      minimumPercentGap: 0.03,
    },
  ],

  WR: [
    {
      /*
       * Elite to Starter boundary.
       */
      startRank: 3,
      endRank: 16,

      fallbackRank: 10,

      minimumAbsoluteGap: 10,
      minimumPercentGap: 0.04,
    },
    {
      /*
       * Starter to Bench boundary.
       */
      startRank: 16,
      endRank: 44,

      fallbackRank: 30,

      minimumAbsoluteGap: 7,
      minimumPercentGap: 0.035,
    },
    {
      /*
       * Bench to Depth boundary.
       */
      startRank: 44,
      endRank: 76,

      fallbackRank: 60,

      minimumAbsoluteGap: 5,
      minimumPercentGap: 0.03,
    },
  ],

  TE: [
    {
      /*
       * Elite to Starter boundary.
       */
      startRank: 2,
      endRank: 9,

      fallbackRank: 5,

      minimumAbsoluteGap: 10,
      minimumPercentGap: 0.045,
    },
    {
      /*
       * Starter to Bench boundary.
       */
      startRank: 9,
      endRank: 21,

      fallbackRank: 12,

      minimumAbsoluteGap: 7,
      minimumPercentGap: 0.04,
    },
    {
      /*
       * Bench to Depth boundary.
       */
      startRank: 21,
      endRank: 38,

      fallbackRank: 24,

      minimumAbsoluteGap: 5,
      minimumPercentGap: 0.035,
    },
  ],
};

/*
 * Main exported function.
 *
 * Receives the complete player pool and returns:
 *
 * positionTiers:
 * {
 *   QB: [...],
 *   RB: [...],
 *   WR: [...],
 *   TE: [...]
 * }
 *
 * playerTierMap:
 * Map keyed by player ID.
 */
export function createProjectionGapTierModel(
  players
) {
  const safePlayers =
    Array.isArray(
      players
    )
      ? players
      : [];

  const positionTiers = {};

  const playerTierMap =
    new Map();

  VALID_POSITIONS.forEach(
    (position) => {
      /*
       * Build the complete projected ranking for this position.
       *
       * We intentionally use every player, including drafted players.
       * That prevents tier definitions from changing during the draft.
       */
      const positionPlayers =
        safePlayers
          .filter(
            (player) =>
              normalizePosition(
                player?.position
              ) ===
                position &&
              getPlayerId(
                player
              ) != null
          )
          .map(
            (player) => ({
              ...player,

              projected_fantasy_points:
                toSafeNumber(
                  player
                    ?.projected_fantasy_points
                ),
            })
          )
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              secondPlayer
                .projected_fantasy_points -
              firstPlayer
                .projected_fantasy_points
          );

      /*
       * Find the three boundaries that create:
       *
       * Elite
       * Starter
       * Bench
       * Depth
       */
      const boundaries =
        findTierBoundaries({
          players:
            positionPlayers,

          boundaryConfig:
            PROJECTION_GAP_CONFIG[
              position
            ],
        });

      const tiers =
        createPositionTiers({
          position,

          players:
            positionPlayers,

          boundaries,
        });

      positionTiers[
        position
      ] = tiers;

      /*
       * Create a direct player lookup.
       *
       * This lets the UI retrieve a selected player's tier without
       * repeatedly searching through all positional tier arrays.
       */
      tiers.forEach(
        (tier) => {
          tier.players.forEach(
            (
              player,
              index
            ) => {
              const playerId =
                getPlayerId(
                  player
                );

              playerTierMap.set(
                String(
                  playerId
                ),
                {
                  key:
                    tier.key,

                  label:
                    tier.label,

                  tierNumber:
                    tier.tierNumber,

                  position,

                  /*
                   * Overall rank within the player's natural position.
                   */
                  positionRank:
                    tier.startRank +
                    index,

                  /*
                   * Rank only among players inside this tier.
                   */
                  tierRank:
                    index + 1,

                  tierSize:
                    tier.players
                      .length,

                  startRank:
                    tier.startRank,

                  endRank:
                    tier.endRank,

                  upperProjection:
                    tier.upperProjection,

                  lowerProjection:
                    tier.lowerProjection,
                }
              );
            }
          );
        }
      );
    }
  );

  return {
    positionTiers,
    playerTierMap,
  };
}

/*
 * Finds the strongest projection gap for each tier boundary.
 */
function findTierBoundaries({
  players,
  boundaryConfig,
}) {
  if (
    players.length <= 1
  ) {
    return [];
  }

  const boundaries = [];

  let previousBoundary = 0;

  boundaryConfig.forEach(
    (config) => {
      /*
       * Do not allow this search window to overlap a boundary that
       * was already selected.
       */
      const minimumRank =
        Math.max(
          config.startRank,
          previousBoundary + 1
        );

      /*
       * A boundary cannot be placed after the final player because
       * there must be another player below the gap.
       */
      const maximumRank =
        Math.min(
          config.endRank,
          players.length - 1
        );

      let bestBoundary =
        null;

      for (
        let rank =
          minimumRank;
        rank <= maximumRank;
        rank += 1
      ) {
        /*
         * rank is one-based.
         *
         * rank 8 compares:
         *
         * players[7] = RB8
         * players[8] = RB9
         */
        const currentPlayer =
          players[
            rank - 1
          ];

        const nextPlayer =
          players[
            rank
          ];

        if (
          !currentPlayer ||
          !nextPlayer
        ) {
          continue;
        }

        const currentProjection =
          toSafeNumber(
            currentPlayer
              .projected_fantasy_points
          );

        const nextProjection =
          toSafeNumber(
            nextPlayer
              .projected_fantasy_points
          );

        const absoluteGap =
          Math.max(
            currentProjection -
              nextProjection,
            0
          );

        const percentGap =
          currentProjection > 0
            ? absoluteGap /
              currentProjection
            : 0;

        /*
         * A gap qualifies when it clears either:
         *
         * - the absolute projection threshold
         * - the percentage projection threshold
         */
        const qualifies =
          absoluteGap >=
            config
              .minimumAbsoluteGap ||
          percentGap >=
            config
              .minimumPercentGap;

        if (!qualifies) {
          continue;
        }

        /*
         * Normalize both measurements against their threshold.
         *
         * This lets absolute and percentage gaps contribute to one
         * comparable score.
         */
        const normalizedAbsolute =
          config
            .minimumAbsoluteGap >
          0
            ? absoluteGap /
              config
                .minimumAbsoluteGap
            : absoluteGap;

        const normalizedPercent =
          config
            .minimumPercentGap >
          0
            ? percentGap /
              config
                .minimumPercentGap
            : percentGap;

        const score =
          normalizedAbsolute +
          normalizedPercent;

        if (
          !bestBoundary ||
          score >
            bestBoundary
              .score
        ) {
          bestBoundary = {
            rank,

            score,

            absoluteGap,

            percentGap,
          };
        }
      }

      /*
       * Use the configured fallback only when no projection gap
       * qualified inside the search window.
       */
      const fallbackRank =
        Math.min(
          Math.max(
            config
              .fallbackRank,
            previousBoundary +
              1
          ),

          players.length -
            1
        );

      const selectedRank =
        bestBoundary
          ?.rank ??
        fallbackRank;

      if (
        selectedRank >
          previousBoundary &&
        selectedRank <
          players.length
      ) {
        boundaries.push(
          selectedRank
        );

        previousBoundary =
          selectedRank;
      }
    }
  );

  /*
   * Remove accidental duplicates and ensure numerical order.
   */
  return [
    ...new Set(
      boundaries
    ),
  ].sort(
    (
      firstBoundary,
      secondBoundary
    ) =>
      firstBoundary -
      secondBoundary
  );
}

/*
 * Converts boundary ranks into the four display tiers.
 *
 * Example boundaries:
 *
 * [8, 24, 48]
 *
 * Results:
 *
 * Elite   ranks 1-8
 * Starter ranks 9-24
 * Bench   ranks 25-48
 * Depth   ranks 49+
 */
function createPositionTiers({
  position,
  players,
  boundaries,
}) {
  const tierEnds = [
    ...boundaries,
    players.length,
  ];

  let startIndex = 0;

  return TIER_LABELS.map(
    (
      tierLabel,
      index
    ) => {
      const endIndex =
        tierEnds[
          index
        ] ??
        players.length;

      const tierPlayers =
        players.slice(
          startIndex,
          endIndex
        );

      const startRank =
        tierPlayers.length >
        0
          ? startIndex + 1
          : null;

      const endRank =
        tierPlayers.length >
        0
          ? endIndex
          : null;

      const tier = {
        ...tierLabel,

        position,

        tierNumber:
          index + 1,

        startRank,

        endRank,

        upperProjection:
          tierPlayers.length >
          0
            ? toSafeNumber(
                tierPlayers[0]
                  .projected_fantasy_points
              )
            : 0,

        lowerProjection:
          tierPlayers.length >
          0
            ? toSafeNumber(
                tierPlayers[
                  tierPlayers.length -
                    1
                ]
                  .projected_fantasy_points
              )
            : 0,

        players:
          tierPlayers,
      };

      startIndex =
        endIndex;

      return tier;
    }
  );
}

function normalizePosition(
  position
) {
  return String(
    position ?? ""
  )
    .trim()
    .toUpperCase();
}

function getPlayerId(
  player
) {
  return (
    player?.player_id ??
    player?.Player_ID ??
    player?.id ??
    null
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