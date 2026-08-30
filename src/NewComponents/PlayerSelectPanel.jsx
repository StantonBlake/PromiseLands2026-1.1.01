import {
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";

import PlayerFlipCard from "../NewComponents/PlayerFlipCard";
import DraftModal from "./DraftModal";
import SpecularButton from "../NewComponents/SpecularButton";
import {
  playDraftCardAnimation,
} from "./DraftCardAnimation";
import "./PlayerSelectPanel.css";

const VALID_POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const DISPLAY_TIERS = [
  "elite",
  "starter",
  "bench",
  "depth",
];

const positionStatConfig = {
  QB: {
    left: [
      {
        label: "PASS ATT",
        key: "passing_attempts",
      },
      {
        label: "PASS YDS",
        key: "passing_yards",
      },
      {
        label: "PASS TD'S",
        key: "passing_touchdowns",
      },
      {
        label: "2025 PTS",
        key: "scoring_2025",
      },
    ],

    right: [
     
      {
        label: "RUSH ATT",
        key: "rushing_attempts",
      },
      {
        label: "RUSH YDS",
        key: "rushing_yards",
      },
      {
        label: "RUSH TD'S",
        key: "rushing_touchdowns",
      },
      
      {
        label: "PROJ. PPG",
        key: "projected_points_per_game",
      },
    ],
  },

  RB: {
    left: [
      {
        label: "RUSH ATT",
        key: "rushing_attempts",
      },
      {
        label: "RUSH YDS",
        key: "rushing_yards",
      },
      {
        label: "RUSH TD'S",
        key: "rushing_touchdowns",
      },
      {
        label: "2025 PTS",
        key: "scoring_2025",
      },
    ],

    right: [
      {
        label: "REC",
        key: "receptions",
      },
      {
        label: "REC YDS",
        key: "receiving_yards",
      },
      {
        label: "REC TD'S",
        key: "receiving_touchdowns",
      },
      {
        label: "PROJ. PPG",
        key: "projected_points_per_game",
      },
    ],
  },

  WR: {
    left: [
      {
        label: "REC",
        key: "receptions",
      },
      {
        label: "REC YDS",
        key: "receiving_yards",
      },
      {
        label: "REC TD'S",
        key: "receiving_touchdowns",
      },
      {
        label: "2025 PTS",
        key: "scoring_2025",
      },
    ],

    right: [
      {
        label: "RUSH ATT",
        key: "rushing_attempts",
      },
      {
        label: "RUSH YDS",
        key: "rushing_yards",
      },
      {
        label: "PROJ PTS",
        key: "projected_fantasy_points",
      },
      {
        label: "PROJ. PPG",
        key: "projected_points_per_game",
      },
    ],
  },

  TE: {
    left: [
      {
        label: "REC",
        key: "receptions",
      },
      {
        label: "REC YDS",
        key: "receiving_yards",
      },
      {
        label: "REC TD'S",
        key: "receiving_touchdowns",
      },
      {
        label: "2025 PTS",
        key: "scoring_2025",
      },
    ],

    right: [
      {
        label: "PROJ PTS",
        key: "projected_fantasy_points",
      },
      {
        label: "PREV PTS",
        key: "previous_total_fantasy_points",
      },
      {
        label: "PREV RANK",
        key: "previous_position_rank",
      },
      {
        label: "PROJ. PPG",
        key: "projected_points_per_game",
      },
    ],
  },
};

const PlayerSelectPanel = ({
  player,
  players,
  allPlayers,
  draftEntries,
  playerDraftHistory,
  marketData,
  specialPlayers = [],
  managers,
  selectedManagerId,
  onSelectPlayer,
  onDeselectPlayer,
  onDraftPlayer,
}) => {
  const [
    playerSearch,
    setPlayerSearch,
  ] = useState("");

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false);

  
  

  const [
    playerCardResetKey,
    setPlayerCardResetKey,
  ] = useState(0);
  const [
    isDraftModalOpen,
    setIsDraftModalOpen,
  ] = useState(false);

  const [
    modalPlayer,
    setModalPlayer,
  ] = useState(null);

  const selectedManager =
  useMemo(() => {
    if (
      selectedManagerId === null ||
      selectedManagerId === undefined ||
      selectedManagerId === ""
    ) {
      return null;
    }

    return (
      (Array.isArray(managers)
        ? managers
        : []
      ).find(
        (manager) =>
          String(
            getManagerId(
              manager
            )
          ) ===
          String(
            selectedManagerId
          )
      ) ?? null
    );
  }, [
    managers,
    selectedManagerId,
  ]);

  const position =
    normalizePosition(
      player?.position
    );

  const positionStats =
    positionStatConfig[
      position
    ] ?? {
      left: [],
      right: [],
    };

  const normalizedPlayerSearch =
    playerSearch
      .trim()
      .toLowerCase();

  const playerSearchResults =
    useMemo(() => {
      if (
        normalizedPlayerSearch.length <
        2
      ) {
        return [];
      }

      return players
        .filter(
          (
            availablePlayer
          ) => {
            const name =
              getPlayerName(
                availablePlayer
              ).toLowerCase();

            return name.includes(
              normalizedPlayerSearch
            );
          }
        )
        .sort(
          (
            playerA,
            playerB
          ) => {
            const nameA =
              getPlayerName(
                playerA
              ).toLowerCase();

            const nameB =
              getPlayerName(
                playerB
              ).toLowerCase();

            const aStartsWith =
              nameA.startsWith(
                normalizedPlayerSearch
              );

            const bStartsWith =
              nameB.startsWith(
                normalizedPlayerSearch
              );

            if (
              aStartsWith !==
              bStartsWith
            ) {
              return aStartsWith
                ? -1
                : 1;
            }

            const projectedPointsA =
              getProjectedFantasyPoints(
                playerA
              );

            const projectedPointsB =
              getProjectedFantasyPoints(
                playerB
              );

            if (
              projectedPointsA !==
              projectedPointsB
            ) {
              return (
                projectedPointsB -
                projectedPointsA
              );
            }

            return nameA.localeCompare(
              nameB
            );
          }
        )
        .slice(
          0,
          8
        );
    }, [
      players,
      normalizedPlayerSearch,
    ]);

  const selectedPlayerTier =
    useMemo(() => {
      const playerId =
        getPlayerId(
          player
        );

      if (
        playerId === null ||
        playerId === undefined
      ) {
        return null;
      }

      return (
        marketData
          ?.playerTierMap
          ?.get(
            String(
              playerId
            )
          ) ??
        null
      );
    }, [
      player,
      marketData,
    ]);

  const selectedPositionSpending =
    useMemo(() => {
      if (
        !VALID_POSITIONS.includes(
          position
        )
      ) {
        return null;
      }

      return (
        marketData
          ?.positionSpending
          ?.[position] ??
        null
      );
    }, [
      marketData,
      position,
    ]);

  const selectedPositionTalent =
    useMemo(() => {
      if (
        !VALID_POSITIONS.includes(
          position
        )
      ) {
        return null;
      }

      return (
        marketData
          ?.remainingTalentByPosition
          ?.[position] ??
        null
      );
    }, [
      marketData,
      position,
    ]);

  const selectedTierRemaining =
    useMemo(() => {
      if (
        !selectedPlayerTier ||
        !selectedPositionTalent
      ) {
        return 0;
      }

      const matchingTier =
        selectedPositionTalent
          .tiers
          ?.find(
            (tier) =>
              tier.key ===
              selectedPlayerTier.key
          );

      return (
        matchingTier
          ?.remainingCount ??
        0
      );
    }, [
      selectedPlayerTier,
      selectedPositionTalent,
    ]);

    const selectedPlayerHistory =
    useMemo(() => {
      const playerId =
        getPlayerId(
          player
        );
  
      if (
        playerId === null ||
        playerId === undefined
      ) {
        return [];
      }
  
      return (
        Array.isArray(
          playerDraftHistory
        )
          ? playerDraftHistory
          : []
      )
        .filter(
          (historyEntry) =>
            String(
              historyEntry
                .Player_ID
            ) ===
            String(
              playerId
            )
        )
        .sort(
          (
            firstEntry,
            secondEntry
          ) =>
            toSafeNumber(
              secondEntry.Year
            ) -
            toSafeNumber(
              firstEntry.Year
            )
        );
    }, [
      player,
      playerDraftHistory,
    ]);

    const playerHistorySummary =
  useMemo(() => {
    if (
      selectedPlayerHistory.length ===
      0
    ) {
      return null;
    }

    const validCosts =
      selectedPlayerHistory
        .map(
          (entry) =>
            toSafeNumber(
              entry.Cost
            )
        )
        .filter(
          (cost) =>
            cost > 0
        );

    const averageCost =
      validCosts.length > 0
        ? validCosts.reduce(
            (
              total,
              cost
            ) =>
              total +
              cost,
            0
          ) /
          validCosts.length
        : 0;

    return {
      seasons:
        selectedPlayerHistory.length,

      averageCost,

      highestCost:
        validCosts.length > 0
          ? Math.max(
              ...validCosts
            )
          : 0,

      lowestCost:
        validCosts.length > 0
          ? Math.min(
              ...validCosts
            )
          : 0,

      latest:
        selectedPlayerHistory[
          0
        ],
    };
  }, [
    selectedPlayerHistory,
  ]);



  const positionSpendingRows =
    useMemo(
      () =>
        VALID_POSITIONS.map(
          (rowPosition) => {
            const spending =
              marketData
                ?.positionSpending
                ?.[rowPosition] ??
              {
                position:
                  rowPosition,
                playerCount: 0,
                totalSpent: 0,
                averagePrice: 0,
                highestPrice: 0,
                lowestPrice: 0,
              };

            return spending;
          }
        ),
      [
        marketData,
      ]
    );

  const maximumPositionSpend =
    useMemo(
      () =>
        Math.max(
          ...positionSpendingRows.map(
            (spending) =>
              toSafeNumber(
                spending.totalSpent
              )
          ),
          1
        ),
      [
        positionSpendingRows,
      ]
    );

  const talentRows =
    useMemo(() => {
      const sourceTiers =
        selectedPositionTalent
          ?.tiers ??
        [];

      const tierMap =
        new Map(
          sourceTiers.map(
            (tier) => [
              tier.key,
              tier,
            ]
          )
        );

      return DISPLAY_TIERS.map(
        (tierKey) => {
          const tier =
            tierMap.get(
              tierKey
            );

          return (
            tier ?? {
              key:
                tierKey,
              label:
                capitalize(
                  tierKey
                ),
              tierNumber: null,
              totalPlayers: 0,
              remainingCount: 0,
              remainingPlayers: [],
            }
          );
        }
      );
    }, [
      selectedPositionTalent,
    ]);

  const maximumTierRemaining =
    useMemo(
      () =>
        Math.max(
          ...talentRows.map(
            (tier) =>
              toSafeNumber(
                tier.remainingCount
              )
          ),
          1
        ),
      [
        talentRows,
      ]
    );

  const playerName =
    getPlayerName(
      player
    );

  const estimatedAuctionValue =
    getEstimatedAuctionValue(
      player
    );

  const projectedFantasyPoints =
    getProjectedFantasyPoints(
      player
    );

  const handleSearchChange = (
    event
  ) => {
    setPlayerSearch(
      event.target.value
    );

    setIsSearchOpen(
      true
    );
  };

  const handleSearchFocus =
    () => {
      setIsSearchOpen(
        true
      );
    };

  const handleSearchBlur =
    () => {
      window.setTimeout(
        () => {
          setIsSearchOpen(
            false
          );
        },
        120
      );
    };

  const handleSearchPlayerSelect = (
    selectedPlayer
  ) => {
    if (!selectedPlayer) {
      return;
    }

    if (
      typeof onSelectPlayer !==
      "function"
    ) {
      console.error(
        "Player search selection is not connected to NewMain."
      );

      return;
    }

    onSelectPlayer(
      selectedPlayer
    );

    setPlayerSearch("");
    setIsSearchOpen(
      false
    );
  };

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    const firstResult =
      playerSearchResults[0];

    if (firstResult) {
      handleSearchPlayerSelect(
        firstResult
      );
    }
  };

  const handleDeselect = (
    playerId
  ) => {
    setIsDraftModalOpen(
      false
    );

    setModalPlayer(
      null
    );

    setPlayerSearch("");

    setIsSearchOpen(
      false
    );

    onDeselectPlayer(
      playerId
    );
  };

  const handleOpenDraftModal = (
    selectedPlayer
  ) => {
    const draftPlayer =
      selectedPlayer ??
      player;

    if (!draftPlayer) {
      console.error(
        "No player is selected."
      );

      return;
    }

    if (!selectedManager) {
      console.error(
        "No manager is selected."
      );

      return;
    }

    setModalPlayer(
      draftPlayer
    );

    setIsDraftModalOpen(
      true
    );
  };

  const handleCloseDraftModal =
    () => {
      setIsDraftModalOpen(
        false
      );

      setModalPlayer(
        null
      );
    };

    const handleDraftComplete =
  async (
    draftPayload
  ) => {
    if (
      typeof onDraftPlayer !==
      "function"
    ) {
      throw new Error(
        "The draft handler has not been connected in NewMain."
      );
    }

    /*
     * Perform the actual database draft.
     */
    const draftResult =
      await onDraftPlayer(
        draftPayload
      );

    const draftedPlayer =
      modalPlayer ??
      player;

    const draftedPlayerId =
      getPlayerId(
        draftedPlayer
      );

    const resolvedManagerId =
      draftPayload?.managerId ??
      draftPayload?.manager_id ??
      getManagerId(
        selectedManager
      );

    const isBudgetOnly =
      draftedPlayer
        ?.isBudgetOnly === true;

    /*
     * Close modal first.
     */
    setIsDraftModalOpen(
      false
    );

    setModalPlayer(
      null
    );

    /*
     * Instantly snap player card
     * to its front face.
     */
    setPlayerCardResetKey(
      (currentKey) =>
        currentKey + 1
    );

    /*
     * Give React/browser enough time
     * to:
     *
     * - remove modal
     * - apply front side
     * - disable/reset flip transition
     */
    await waitForNextPaint();

    /*
     * Clone + hide original + fly clone
     * into manager card.
     */
    if (
      !isBudgetOnly &&
      resolvedManagerId != null
    ) {
      await playDraftCardAnimation({
        managerId:
          resolvedManagerId,
      
        position:
          draftedPlayer?.position,
      });
    }

    /*
     * Now remove the real selected player.
     * It is already hidden, so there is no
     * visual pop after animation.
     */
    if (
      typeof onDeselectPlayer ===
        "function" &&
      draftedPlayerId != null
    ) {
      onDeselectPlayer(
        draftedPlayerId
      );
    }

    return draftResult;
  };

  return (
    <section
      className="player-select-panel"
      aria-labelledby="player-select-title"
    >
      <header className="player-select-panel__header">
        <div className="player-select-panel__header-actions">
          <div className="player-select-panel__special-actions">
            {specialPlayers.map(
              (
                specialPlayer
              ) => (
                <SpecularButton
                  key={
                    specialPlayer.id
                  }
                  type="button"
                  size="xs"
                  variant="neutral"
                  onClick={() =>
                    onSelectPlayer(
                      specialPlayer
                    )
                  }
                >
                  {
                    specialPlayer.position
                  }
                </SpecularButton>
              )
            )}
          </div>

          <form
            className="player-search"
            role="search"
            onSubmit={
              handleSearchSubmit
            }
          >
            <div className="player-search__control">
              <span
                className="player-search__icon"
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                type="search"
                className="player-search__input"
                value={
                  playerSearch
                }
                placeholder="Search player"
                aria-label="Search available players"
                autoComplete="off"
                onChange={
                  handleSearchChange
                }
                onFocus={
                  handleSearchFocus
                }
                onBlur={
                  handleSearchBlur
                }
              />

              {playerSearch && (
                <button
                  type="button"
                  className="player-search__clear"
                  aria-label="Clear player search"
                  onMouseDown={(
                    event
                  ) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    setPlayerSearch("");

                    setIsSearchOpen(
                      false
                    );
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {isSearchOpen &&
              normalizedPlayerSearch.length >=
                2 && (
                <div
                  className="player-search__results"
                  role="listbox"
                  aria-label="Player search results"
                >
                  {playerSearchResults.length >
                  0 ? (
                    playerSearchResults.map(
                      (
                        searchPlayer
                      ) => {
                        const searchPlayerId =
                          getPlayerId(
                            searchPlayer
                          );

                        const searchPlayerName =
                          getPlayerName(
                            searchPlayer
                          );

                        const searchPosition =
                          normalizePosition(
                            searchPlayer
                              .position
                          ) ||
                          "—";

                        const searchTeam =
                          getPlayerTeam(
                            searchPlayer
                          );

                        const searchProjectedPoints =
                          getProjectedFantasyPoints(
                            searchPlayer
                          );

                        const isSelected =
                          String(
                            searchPlayerId
                          ) ===
                          String(
                            getPlayerId(
                              player
                            )
                          );

                        return (
                          <button
                            key={
                              searchPlayerId ??
                              searchPlayerName
                            }
                            type="button"
                            className={`
                              player-search__result
                              ${
                                isSelected
                                  ? "player-search__result--selected"
                                  : ""
                              }
                            `}
                            role="option"
                            aria-selected={
                              isSelected
                            }
                            onMouseDown={(
                              event
                            ) => {
                              event.preventDefault();
                            }}
                            onClick={() =>
                              handleSearchPlayerSelect(
                                searchPlayer
                              )
                            }
                          >
                            <span className="player-search__result-main">
                              <strong>
                                {
                                  searchPlayerName
                                }
                              </strong>

                              <small>
                                {
                                  searchTeam
                                }
                              </small>
                            </span>

                            <span className="player-search__result-meta">
                              <span className="player-search__result-position">
                                {
                                  searchPosition
                                }
                              </span>

                              <span className="player-search__result-points">
                                {
                                  searchProjectedPoints.toFixed(
                                    1
                                  )
                                }
                              </span>
                            </span>
                          </button>
                        );
                      }
                    )
                  ) : (
                    <div className="player-search__empty">
                      No available players found
                    </div>
                  )}
                </div>
              )}
          </form>

          {player && (
            <SpecularButton
              size="xs"
              variant="neutral"
              onClick={() =>
                handleDeselect(
                  getPlayerId(
                    player
                  )
                )
              }
            >
              Clear Player
            </SpecularButton>
          )}
        </div>
      </header>

      <div className="player-select-panel__frame">
        <div className="player-select-panel__top-row">
          <div className="player-select-panel__stats">
            {positionStats.left.map(
              (
                stat
              ) => (
                <PlayerStat
                  key={
                    stat.key
                  }
                  label={
                    stat.label
                  }
                  value={
                    getPlayerStatValue(
                      player,
                      stat.key
                    )
                  }
                />
              )
            )}
          </div>

          <div className="player-select-panel__card-slot">
            <PlayerFlipCard
              key={
                getPlayerId(
                  player
                ) ??
                "empty-player-card"
              }
              player={
                player
              }
              resetFlipKey={
                playerCardResetKey
              }
              onDeselect={
                handleDeselect
              }
              onDraftPlayer={
                handleOpenDraftModal
              }
              draftDisabled={
                !player ||
                !selectedManager
              }
            />
          </div>

          <div className="player-select-panel__stats">
            {positionStats.right.map(
              (
                stat
              ) => (
                <PlayerStat
                  key={
                    stat.key
                  }
                  label={
                    stat.label
                  }
                  value={
                    getPlayerStatValue(
                      player,
                      stat.key
                    )
                  }
                />
              )
            )}
          </div>
        </div>

        <div className="player-select-panel__bottom-grid">
          <PlayerDetailBox
            label="Estimated Value"
            value={
              player
                ? formatCurrency(
                    estimatedAuctionValue
                  )
                : "—"
            }
            detail={
              player
                ? `${
                    position ||
                    "Unknown"
                  } market estimate`
                : "Select a player to view value."
            }
          />

          <PlayerDetailBox
            label="Projected Points"
            value={
              player
                ? projectedFantasyPoints.toFixed(
                    1
                  )
                : "—"
            }
            detail={
              player
                ? `${playerName} season projection`
                : "Select a player to view projection."
            }
            emphasized
          />

          <PlayerDetailBox
            label="Player Tier"
            value={
              selectedPlayerTier
                ?.label ??
              "—"
            }
            detail={
              selectedPlayerTier
                ? `${selectedTierRemaining} of ${selectedPlayerTier.tierSize} remaining`
                : player
                  ? "Tier unavailable for this selection."
                  : "Select a player to view tier."
            }
          />
        </div>
      </div>

      <section
        className="market-intelligence"
        aria-labelledby="market-intelligence-title"
      >
        <header className="market-intelligence__header">
          <div>
            <h3 id="market-intelligence-title">
              Market Intelligence
            </h3>

            <p>
              Live spending, remaining positional talent,
              and player-specific draft context.
            </p>
          </div>
        </header>

        <div className="market-intelligence__grid">
        <article className="market-panel market-panel--spending">
  <header className="market-panel__header">
    <div>
      <span className="market-panel__eyebrow">
        Live Auction Market
      </span>

      <h4>
        Position Spending
      </h4>
    </div>

    <strong className="market-panel__headline">
      {selectedPositionSpending
        ? formatCurrency(
            selectedPositionSpending.totalSpent
          )
        : formatCurrency(0)}
    </strong>
  </header>

  <div className="market-spending-list">
    {positionSpendingRows.map(
      (spending) => {
        const totalSpent =
          toSafeNumber(
            spending.totalSpent
          );

        const width =
          Math.max(
            (
              totalSpent /
              maximumPositionSpend
            ) *
              100,
            0
          );

        const rowPosition =
          spending.position ??
          "—";

        const isActivePosition =
          rowPosition ===
          position;

        return (
          <div
            key={
              rowPosition
            }
            className={`
              market-spending-row
              ${
                isActivePosition
                  ? "market-spending-row--active"
                  : ""
              }
            `}
          >
            <div className="market-spending-row__meta">
              <strong>
                {rowPosition}
              </strong>

              <span>
                {formatCurrency(
                  totalSpent
                )}
              </span>
            </div>

            <div className="market-bar">
              <span
                className="market-bar__fill"
                style={{
                  width:
                    `${width}%`,
                }}
              />
            </div>

            <div className="market-spending-row__detail">
              <span>
                {toSafeNumber(
                  spending.playerCount
                )} drafted
              </span>

              <span>
                Avg{" "}
                {formatCurrency(
                  spending.averagePrice
                )}
              </span>
            </div>
          </div>
        );
      }
    )}
  </div>
</article>

          <article className="market-panel market-panel--history">
  <header className="market-panel__header">
    <div>
      <span className="market-panel__eyebrow">
        Historical Market
      </span>

      <h4>
        Player Auction History
      </h4>
    </div>

    <strong className="market-panel__headline">
      {playerHistorySummary
        ? formatCurrency(
            playerHistorySummary
              .averageCost
          )
        : "—"}
    </strong>
  </header>

  {player ? (
    selectedPlayerHistory.length >
    0 ? (
      <>
        <div className="player-history-summary">
          <div className="player-history-summary__item">
            <span>
              Average
            </span>

            <strong>
              {formatCurrency(
                playerHistorySummary
                  .averageCost
              )}
            </strong>
          </div>

          <div className="player-history-summary__item">
            <span>
              High
            </span>

            <strong>
              {formatCurrency(
                playerHistorySummary
                  .highestCost
              )}
            </strong>
          </div>

          <div className="player-history-summary__item">
            <span>
              Low
            </span>

            <strong>
              {formatCurrency(
                playerHistorySummary
                  .lowestCost
              )}
            </strong>
          </div>
        </div>

        <div className="player-history-list">
          {selectedPlayerHistory
            .slice(
              0,
              5
            )
            .map(
              (
                historyEntry
              ) => (
                <div
                  key={
                    historyEntry.Id ??
                    `${historyEntry.Player_ID}-${historyEntry.Year}`
                  }
                  className="player-history-entry"
                >
                  <div className="player-history-entry__main">
                    <strong>
                      {
                        historyEntry.Year
                      }
                    </strong>

                    <span>
                      {
                        historyEntry.Manager_Name ??
                        getManagerNameById(
                          managers,
                          historyEntry.Manager_ID
                        )
                      }
                    </span>
                  </div>

                  <div className="player-history-entry__meta">
                  <strong
  className={
    isKeeper(historyEntry)
      ? "player-history-entry__cost player-history-entry__cost--keeper"
      : "player-history-entry__cost"
  }
>
  {formatCurrency(
    historyEntry.Cost
  )}
</strong>

                    <span>
                      {formatHistoryDetail(
                        historyEntry
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
        </div>
      </>
    ) : (
      <MarketEmptyState
        title="No previous auction history"
        detail="This player has not appeared in the Draft_History table."
      />
    )
  ) : (
    <MarketEmptyState
      title="No player selected"
      detail="Select a player to view previous auction prices and owners."
    />
  )}
</article>

          <article className="market-panel market-panel--talent">
            <header className="market-panel__header">
              <div>
                <span className="market-panel__eyebrow">
                  {
                    position ||
                    "Position"
                  } Pool
                </span>

                <h4>
                  Remaining Talent
                </h4>
              </div>

              <strong className="market-panel__headline">
                {
                  selectedPositionTalent
                    ?.totalRemaining ??
                  0
                }
              </strong>
            </header>

            {VALID_POSITIONS.includes(
              position
            ) ? (
              <div className="remaining-talent-list">
                {talentRows.map(
                  (
                    tier
                  ) => {
                    const width =
                      Math.max(
                        (
                          toSafeNumber(
                            tier.remainingCount
                          ) /
                          maximumTierRemaining
                        ) *
                          100,
                        0
                      );

                    const isSelectedTier =
                      tier.key ===
                      selectedPlayerTier
                        ?.key;

                    return (
                      <div
                        key={
                          tier.key
                        }
                        className={`
                          remaining-talent-row
                          ${
                            isSelectedTier
                              ? "remaining-talent-row--active"
                              : ""
                          }
                        `}
                      >
                        <div className="remaining-talent-row__meta">
                          <strong>
                            {
                              tier.label
                            }
                          </strong>

                          <span>
                            {
                              tier.remainingCount
                            }
                          </span>
                        </div>

                        <div className="market-bar">
                          <span
                            className="market-bar__fill"
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />
                        </div>

                        <div className="remaining-talent-row__detail">
                          <span>
                            {
                              tier.remainingCount
                            } remaining
                          </span>

                          <span>
                            {
                              tier.totalPlayers
                            } original
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <MarketEmptyState
                title="No position selected"
                detail="Select a QB, RB, WR, or TE to view the remaining tier pool."
              />
            )}
          </article>

          
        </div>
      </section>

      <DraftModal
        isOpen={
          isDraftModalOpen
        }
        player={
          modalPlayer ??
          player
        }
        managers={
          managers
        }
        selectedManager={
          selectedManager
        }
        selectedManagerId={
          selectedManagerId
        }
        onClose={
          handleCloseDraftModal
        }
        onDraft={
          handleDraftComplete
        }
      />
    </section>
  );
};

const PlayerStat = ({
  label,
  value,
}) => (
  <div className="player-stat">
    <span className="player-stat__label">
      {label}
    </span>

    <span className="player-stat__value">
      {value}
    </span>
  </div>
);

const PlayerDetailBox = ({
  label,
  value,
  detail,
  emphasized,
}) => (
  <article
    className={`
      player-detail-box
      ${
        emphasized
          ? "player-detail-box--emphasized"
          : ""
      }
    `}
  >
    <span className="player-detail-box__label">
      {label}
    </span>

    <strong className="player-detail-box__value">
      {value}
    </strong>

    <p className="player-detail-box__detail">
      {detail}
    </p>
  </article>
);

const MarketEmptyState = ({
  title,
  detail,
}) => (
  <div className="market-empty-state">
    <strong>
      {title}
    </strong>

    <p>
      {detail}
    </p>
  </div>
);

function getProjectedFantasyPoints(
  player
) {
  if (!player) {
    return 0;
  }

  return toSafeNumber(
    player
      .projected_fantasy_points ??
    player.stats
      ?.projected_fantasy_points ??
    player.stats
      ?.projectedFantasyPoints
  );
}

function getEstimatedAuctionValue(
  player
) {
  if (!player) {
    return 0;
  }

  return toSafeNumber(
    player
      .estimated_auction_value ??
    player
      .estimatedAuctionValue ??
    player.stats
      ?.estimated_auction_value ??
    player.stats
      ?.estimatedAuctionValue
  );
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

function isKeeper(
  historyEntry
) {
  const keeperStatus =
    historyEntry?.[
      "Keeper Status"
    ];

  return (
    keeperStatus === true ||
    String(
      keeperStatus
    )
      .trim()
      .toLowerCase() ===
      "true"
  );
}

function getPlayerTeam(
  player
) {
  if (!player) {
    return "Free Agent";
  }

  return (
    player.team_abbreviation ??
    player.teamAbbreviation ??
    player.team_code ??
    player.teamCode ??
    player.team ??
    player.team_name ??
    player.teamName ??
    "Free Agent"
  );
}

function getPlayerName(
  player
) {
  if (!player) {
    return "";
  }

  return (
    player.player_name ??
    player.Player_Name ??
    player.name ??
    `Player ${
      getPlayerId(
        player
      ) ??
      "—"
    }`
  );
}

function getManagerId(
  manager
) {
  return (
    manager?.Manager_ID ??
    manager?.manager_id ??
    manager?.id ??
    null
  );
}

function getManagerName(
  manager
) {
  if (!manager) {
    return "";
  }

  return (
    manager.Manager_Name ??
    manager.manager_name ??
    manager.name ??
    `Manager ${
      getManagerId(
        manager
      ) ??
      "—"
    }`
  );
}

function getManagerNameById(
  managers,
  managerId
) {
  const safeManagers =
    Array.isArray(
      managers
    )
      ? managers
      : [];

  const manager =
    safeManagers.find(
      (candidate) =>
        String(
          getManagerId(
            candidate
          )
        ) ===
        String(
          managerId
        )
    );

  return (
    getManagerName(
      manager
    ) ||
    "Unknown Manager"
  );
}

function getPlayerStatValue(
  player,
  key
) {
  if (!player) {
    return "—";
  }
  if (
    key ===
    "projected_points_per_game"
  ) {
    const projectedPoints =
      getProjectedFantasyPoints(
        player
      );
  
    return projectedPoints > 0
      ? (
          projectedPoints /
          17
        ).toFixed(1)
      : "—";
  }
  const directValue =
    player[key];

  const nestedValue =
    player.stats?.[key];

  const camelCaseKey =
    snakeToCamel(
      key
    );

  const camelCaseValue =
    player.stats?.[
      camelCaseKey
    ];

  const value =
    directValue ??
    nestedValue ??
    camelCaseValue;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    key ===
      "projected_fantasy_points" ||
    key.startsWith(
      "scoring_"
    ) ||
    key ===
      "previous_total_fantasy_points"
  ) {
    const numericValue =
      Number(
        value
      );

    return Number.isFinite(
      numericValue
    )
      ? numericValue.toFixed(
          1
        )
      : value;
  }

  if (
    key ===
    "previous_position_rank"
  ) {
    return `#${value}`;
  }

  return value;
}

function normalizePosition(
  position
) {
  return String(
    position ??
    ""
  )
    .trim()
    .toUpperCase();
}

function snakeToCamel(
  value
) {
  return value.replace(
    /_([a-z])/g,
    (
      _,
      letter
    ) =>
      letter.toUpperCase()
  );
}

function formatCurrency(
  value
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(
    toSafeNumber(
      value
    )
  );
}

function formatDraftTime(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    date
  );
}

function capitalize(
  value
) {
  const text =
    String(
      value ??
      ""
    );

  return text
    ? text.charAt(
        0
      ).toUpperCase() +
        text.slice(
          1
        )
    : "";
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



function formatHistoryDetail(
  historyEntry
) {
  const details = [];

  const positionRank =
    historyEntry?.[
      "Position Rank"
    ];

  const draftSlot =
    historyEntry
      ?.Draft_Slot;

  const keeperStatus =
    historyEntry?.[
      "Keeper Status"
    ];

  if (
    positionRank !== null &&
    positionRank !== undefined &&
    positionRank !== ""
  ) {
    details.push(
      `#${positionRank}`
    );
  }

  if (draftSlot) {
    details.push(
      draftSlot
    );
  }

  if (
    keeperStatus === true ||
    String(
      keeperStatus
    )
      .trim()
      .toLowerCase() ===
      "true"
  ) {
    details.push(
      "Keeper"
    );
  }

  return (
    details.join(
      " · "
    ) ||
    "Auction purchase"
  );
}

const playerShape =
  PropTypes.shape({
    player_id:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Player_ID:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    id:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    player_name:
      PropTypes.string,

    Player_Name:
      PropTypes.string,

    name:
      PropTypes.string,

    position:
      PropTypes.string,

    team:
      PropTypes.string,

    age:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    experience:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    headshot:
      PropTypes.string,

    projected_fantasy_points:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    estimated_auction_value:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    previous_position_rank:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    scoring_2021:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    scoring_2022:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    scoring_2023:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    scoring_2024:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    scoring_2025:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    stats:
      PropTypes.object,
  });

const managerShape =
  PropTypes.shape({
    Manager_ID:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    manager_id:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    id:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Manager_Name:
      PropTypes.string,

    manager_name:
      PropTypes.string,

    name:
      PropTypes.string,
  });

const draftHistoryShape =
  PropTypes.shape({
    Id:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Player_ID:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Manager_ID:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Year:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Player_Name:
      PropTypes.string,

    Position:
      PropTypes.string,

    Cost:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    FPTS:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    "Keeper Status":
      PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string,
      ]),

    "Position Rank":
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    "SV$":
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Manager_Name:
      PropTypes.string,

    "True Value":
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    Draft_Slot:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
  });

PlayerSelectPanel.propTypes = {
  player:
    playerShape,

  players:
    PropTypes.arrayOf(
      playerShape
    ),

  allPlayers:
    PropTypes.arrayOf(
      playerShape
    ),

  draftEntries:
    PropTypes.arrayOf(
      PropTypes.object
    ),

  playerDraftHistory:
    PropTypes.arrayOf(
      draftHistoryShape
    ),

  marketData:
    PropTypes.shape({
      draftedPlayers:
        PropTypes.arrayOf(
          PropTypes.object
        ),

      positionSpending:
        PropTypes.object,

      remainingTalentByPosition:
        PropTypes.object,

      playerTierMap:
        PropTypes.instanceOf(
          Map
        ),

      positionTiers:
        PropTypes.object,
    }),

  specialPlayers:
    PropTypes.arrayOf(
      playerShape
    ),

  managers:
    PropTypes.arrayOf(
      managerShape
    ),

  selectedManagerId:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

  onSelectPlayer:
    PropTypes.func,

  onDeselectPlayer:
    PropTypes.func.isRequired,

  onDraftPlayer:
    PropTypes.func,
};

PlayerSelectPanel.defaultProps = {
  player: null,
  players: [],
  allPlayers: [],
  draftEntries: [],
  playerDraftHistory: [],
  marketData: null,
  specialPlayers: [],
  managers: [],
  selectedManagerId: null,
  onSelectPlayer: null,
  onDraftPlayer: null,
};

PlayerStat.propTypes = {
  label:
    PropTypes.string.isRequired,

  value:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
};

PlayerDetailBox.propTypes = {
  label:
    PropTypes.string.isRequired,

  value:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,

  detail:
    PropTypes.string.isRequired,

  emphasized:
    PropTypes.bool,
};

PlayerDetailBox.defaultProps = {
  emphasized: false,
};

MarketEmptyState.propTypes = {
  title:
    PropTypes.string.isRequired,

  detail:
    PropTypes.string.isRequired,
};

export default PlayerSelectPanel;

function waitForNextPaint() {
  return new Promise(
    (resolve) => {
      window.requestAnimationFrame(
        () => {
          window.requestAnimationFrame(
            resolve
          );
        }
      );
    }
  );
}