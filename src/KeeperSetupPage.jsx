
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "./supabaseClient";

import "./KeeperSetupPage.css";

export default function KeeperSetupPage({
  season,
  keeperIncrease = 10,
  onDraftActivated,
  onSignOut,
}) {
  const [
    candidates,
    setCandidates,
  ] = useState([]);

  const [
    managers,
    setManagers,
  ] = useState([]);

  const [
    players,
    setPlayers,
  ] = useState([]);

  const [
    startingBudget,
    setStartingBudget,
  ] = useState(0);

  const [
    rosterCapacity,
    setRosterCapacity,
  ] = useState(0);

  const [
    rosterSlotLimits,
    setRosterSlotLimits,
  ] = useState({
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    ABN: 0,
    SBN: 0,
  });

  const [
    selectedCandidateIds,
    setSelectedCandidateIds,
  ] = useState(
    () => new Set()
  );

  const [
    focusedManagerId,
    setFocusedManagerId,
  ] = useState(null);

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    reviewOpen,
    setReviewOpen,
  ] = useState(false);

  const normalizedSeason =
    toNullableNumber(
      season
    );

  const normalizedKeeperIncrease =
    toNumber(
      keeperIncrease
    );

  /*
   * =========================================================
   * INITIAL DATA LOAD
   * =========================================================
   */

  useEffect(() => {
    let isMounted =
      true;

    async function loadKeeperSetup() {
      if (
        !normalizedSeason
      ) {
        setLoadError(
          "No valid keeper season was provided."
        );

        setLoading(
          false
        );

        return;
      }

      setLoading(
        true
      );

      setLoadError(
        ""
      );

      try {
        const [
          candidateResult,
          managerResult,
          playerResult,
          leagueSettingsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "keepers"
              )
              .select(`
                keeper_candidate_id,
                season,
                player_id,
                manager_id,
                previous_cost,
                keeper_cost,
                previous_draft_slot,
                is_selected,
                selected_at,
                selected_by,
                player_name
              `)
              .eq(
                "season",
                normalizedSeason
              )
              .order(
                "manager_id",
                {
                  ascending:
                    true,
                }
              )
              .order(
                "keeper_cost",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "active_managers"
              )
              .select(`
                manager_id,
                manager_name
              `)
              .order(
                "manager_name",
                {
                  ascending:
                    true,
                }
              ),

            supabase
              .from(
                "player_data"
              )
              .select(`
                player_id,
                player_name,
                position,
                team,
                projected_fantasy_points,
                projected_position_rank,
                estimated_auction_value,
                headshot
              `),

            supabase
              .from(
                "League Settings"
              )
              .select(`
                Id,
                Budget,
                "Keeper Increase",
                QB,
                RB,
                WR,
                TE,
                ABN,
                SBN,
                DEF,
                K
              `)
              .limit(1)
              .maybeSingle(),
          ]);

        const resultErrors = [
          {
            source:
              "keepers",

            error:
              candidateResult.error,
          },
          {
            source:
              "active_managers",

            error:
              managerResult.error,
          },
          {
            source:
              "player_data",

            error:
              playerResult.error,
          },
          {
            source:
              "League Settings",

            error:
              leagueSettingsResult.error,
          },
        ].filter(
          (result) =>
            Boolean(
              result.error
            )
        );

        if (
          resultErrors.length >
          0
        ) {
          const firstFailure =
            resultErrors[0];

          throw new Error(
            `${
              firstFailure.source
            }: ${
              firstFailure.error
                ?.message ??
              "Unknown Supabase error."
            }`
          );
        }

        if (
          !isMounted
        ) {
          return;
        }

        const nextCandidates =
          Array.isArray(
            candidateResult.data
          )
            ? candidateResult.data
            : [];

        const nextManagers =
          Array.isArray(
            managerResult.data
          )
            ? managerResult.data
            : [];

        const nextPlayers =
          Array.isArray(
            playerResult.data
          )
            ? playerResult.data
            : [];

        const settings =
          leagueSettingsResult.data;



        const calculatedRosterCapacity =
          toNumber(
            settings?.QB
          ) +
          toNumber(
            settings?.RB
          ) +
          toNumber(
            settings?.WR
          ) +
          toNumber(
            settings?.TE
          ) +
          toNumber(
            settings?.ABN
          ) +
          toNumber(
            settings?.SBN
          ) +
          toNumber(
            settings?.DEF
          ) +
          toNumber(
            settings?.K
          );

        console.log(
          "Keeper setup load:",
          {
            requestedSeason:
              normalizedSeason,

            candidateCount:
              nextCandidates.length,

            managerCount:
              nextManagers.length,

            playerCount:
              nextPlayers.length,

            leagueSettings:
              settings ??
              null,
          }
        );

        setCandidates(
          nextCandidates
        );

        setManagers(
          nextManagers
        );

        setPlayers(
          nextPlayers
        );

        setStartingBudget(
          toNumber(
            settings?.Budget
          )
        );

        setRosterCapacity(
          calculatedRosterCapacity
        );

        setRosterSlotLimits({
          QB:
            toNumber(
              settings?.QB
            ),

          RB:
            toNumber(
              settings?.RB
            ),

          WR:
            toNumber(
              settings?.WR
            ),

          TE:
            toNumber(
              settings?.TE
            ),

          ABN:
            toNumber(
              settings?.ABN
            ),

          SBN:
            toNumber(
              settings?.SBN
            ),
        });

        setSelectedCandidateIds(
          new Set(
            nextCandidates
              .filter(
                (
                  candidate
                ) =>
                  candidate
                    .is_selected ===
                  true
              )
              .map(
                (
                  candidate
                ) =>
                  String(
                    candidate
                      .keeper_candidate_id
                  )
              )
          )
        );

        setFocusedManagerId(
          null
        );
      } catch (
        error
      ) {
        console.error(
          "Unable to load keeper setup:",
          error
        );

        if (
          isMounted
        ) {
          setLoadError(
            error?.message ??
              "Unable to load keeper candidates."
          );
        }
      } finally {
        if (
          isMounted
        ) {
          setLoading(
            false
          );
        }
      }
    }

    loadKeeperSetup();

    return () => {
      isMounted =
        false;
    };
  }, [
    normalizedSeason,
  ]);

  /*
   * Close focused manager with Escape.
   */
  useEffect(() => {
    if (
      !focusedManagerId
    ) {
      return undefined;
    }

    const handleKeyDown =
      (
        event
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          setFocusedManagerId(
            null
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    focusedManagerId,
  ]);

  /*
   * =========================================================
   * LOOKUP MAPS
   * =========================================================
   */

  const playerById =
    useMemo(() => {
      return new Map(
        players
          .filter(
            (
              player
            ) =>
              player
                ?.player_id !==
                null &&
              player
                ?.player_id !==
                undefined
          )
          .map(
            (
              player
            ) => [
              String(
                player.player_id
              ),

              player,
            ]
          )
      );
    }, [
      players,
    ]);

  const managerById =
    useMemo(() => {
      return new Map(
        managers
          .filter(
            (
              manager
            ) =>
              manager
                ?.manager_id !==
                null &&
              manager
                ?.manager_id !==
                undefined
          )
          .map(
            (
              manager
            ) => [
              String(
                manager.manager_id
              ),

              manager,
            ]
          )
      );
    }, [
      managers,
    ]);

  /*
   * =========================================================
   * ENRICH KEEPER CANDIDATES
   * =========================================================
   */

  const enrichedCandidates =
    useMemo(() => {
      return candidates
        .filter(
          (
            candidate
          ) =>
            candidate
              ?.keeper_candidate_id !==
              null &&
            candidate
              ?.keeper_candidate_id !==
              undefined &&
            candidate
              ?.player_id !==
              null &&
            candidate
              ?.player_id !==
              undefined &&
            candidate
              ?.manager_id !==
              null &&
            candidate
              ?.manager_id !==
              undefined
        )
        .map(
          (
            candidate
          ) => {
            const player =
              playerById.get(
                String(
                  candidate
                    .player_id
                )
              ) ??
              null;

            const manager =
              managerById.get(
                String(
                  candidate
                    .manager_id
                )
              ) ??
              null;

            const previousCost =
              toNumber(
                candidate
                  .previous_cost
              );

            const storedKeeperCost =
              toNullableNumber(
                candidate
                  .keeper_cost
              );

            return {
              ...candidate,

              player,
              manager,

              player_name:
                player
                  ?.player_name ??
                candidate
                  .player_name ??
                `Player ${
                  candidate
                    .player_id
                }`,

              position:
                normalizePosition(
                  player
                    ?.position
                ),

              team:
                player
                  ?.team ??
                "FA",

              manager_name:
                manager
                  ?.manager_name ??
                `Manager ${
                  candidate
                    .manager_id
                }`,

              previous_cost:
                previousCost,

              keeper_cost:
                storedKeeperCost ??
                (
                  previousCost +
                  normalizedKeeperIncrease
                ),
            };
          }
        );
    }, [
      candidates,
      managerById,
      normalizedKeeperIncrease,
      playerById,
    ]);

  /*
   * =========================================================
   * GROUP CANDIDATES BY MANAGER
   * =========================================================
   */

  const managerGroups =
    useMemo(() => {
      const groups =
        new Map();

      managers.forEach(
        (
          manager
        ) => {
          const managerId =
            manager
              ?.manager_id;

          if (
            managerId ===
              null ||
            managerId ===
              undefined
          ) {
            return;
          }

          groups.set(
            String(
              managerId
            ),
            {
              manager,
              candidates: [],
            }
          );
        }
      );

      enrichedCandidates.forEach(
        (
          candidate
        ) => {
          const managerKey =
            String(
              candidate
                .manager_id
            );

          if (
            !groups.has(
              managerKey
            )
          ) {
            groups.set(
              managerKey,
              {
                manager: {
                  manager_id:
                    candidate
                      .manager_id,

                  manager_name:
                    candidate
                      .manager_name,
                },

                candidates: [],
              }
            );
          }

          groups
            .get(
              managerKey
            )
            .candidates.push(
              candidate
            );
        }
      );

      const normalizedSearch =
        searchValue
          .trim()
          .toLowerCase();

      return Array.from(
        groups.values()
      )
        .map(
          (
            group
          ) => {
            const allCandidates =
              [
                ...group
                  .candidates,
              ].sort(
                (
                  first,
                  second
                ) =>
                  second
                    .keeper_cost -
                    first
                      .keeper_cost ||
                  first
                    .player_name
                    .localeCompare(
                      second
                        .player_name
                    )
              );

            const filteredCandidates =
              allCandidates.filter(
                (
                  candidate
                ) => {
                  if (
                    !normalizedSearch
                  ) {
                    return true;
                  }

                  return [
                    candidate
                      .player_name,

                    candidate
                      .position,

                    candidate
                      .team,

                    candidate
                      .manager_name,
                  ]
                    .join(
                      " "
                    )
                    .toLowerCase()
                    .includes(
                      normalizedSearch
                    );
                }
              );

            const selectedCandidates =
              allCandidates.filter(
                (
                  candidate
                ) =>
                  selectedCandidateIds.has(
                    String(
                      candidate
                        .keeper_candidate_id
                    )
                  )
              );

            const committedCost =
              selectedCandidates.reduce(
                (
                  total,
                  candidate
                ) =>
                  total +
                  candidate
                    .keeper_cost,
                0
              );

            const selectedCount =
              selectedCandidates.length;

            const remainingRosterSpots =
              Math.max(
                rosterCapacity -
                  selectedCount,
                0
              );

            const requiredReserve =
              remainingRosterSpots;

            const budgetRemaining =
              startingBudget -
              committedCost;

            const keeperBudgetValid =
              budgetRemaining >=
              requiredReserve;

            const budgetOverage =
              keeperBudgetValid
                ? 0
                : requiredReserve -
                  budgetRemaining;

            return {
              manager:
                group.manager,

              candidates:
                filteredCandidates,

              allCandidates,

              selectedCandidates,

              selectedCount,

              committedCost,

              budgetRemaining,

              remainingRosterSpots,

              requiredReserve,

              keeperBudgetValid,

              budgetOverage,
            };
          }
        )
        .filter(
          (
            group
          ) =>
            !normalizedSearch ||
            group
              .candidates
              .length >
              0
        )
        .sort(
          (
            first,
            second
          ) =>
            String(
              first
                .manager
                ?.manager_name ??
                ""
            ).localeCompare(
              String(
                second
                  .manager
                  ?.manager_name ??
                  ""
              )
            )
        );
    }, [
      enrichedCandidates,
      managers,
      searchValue,
      selectedCandidateIds,
      startingBudget,
      rosterCapacity,
    ]);

  /*
   * =========================================================
   * GLOBAL SELECTION SUMMARY
   * =========================================================
   */

  const selectedCandidates =
    useMemo(() => {
      return enrichedCandidates.filter(
        (
          candidate
        ) =>
          selectedCandidateIds.has(
            String(
              candidate
                .keeper_candidate_id
            )
          )
      );
    }, [
      enrichedCandidates,
      selectedCandidateIds,
    ]);

  const selectedManagerCount =
    useMemo(() => {
      return new Set(
        selectedCandidates.map(
          (
            candidate
          ) =>
            String(
              candidate
                .manager_id
            )
        )
      ).size;
    }, [
      selectedCandidates,
    ]);

  const totalCommitted =
    selectedCandidates.reduce(
      (
        total,
        candidate
      ) =>
        total +
        candidate
          .keeper_cost,
      0
    );

  const averageKeeperCost =
    selectedCandidates.length >
    0
      ? totalCommitted /
        selectedCandidates.length
      : 0;

  /*
   * =========================================================
   * SELECTION ACTIONS
   * =========================================================
   */

  const toggleCandidate =
    (
      candidateId
    ) => {
      const candidateKey =
        String(
          candidateId
        );

      setSubmitError(
        ""
      );

      setSelectedCandidateIds(
        (
          currentSelection
        ) => {
          const nextSelection =
            new Set(
              currentSelection
            );

          if (
            nextSelection.has(
              candidateKey
            )
          ) {
            nextSelection.delete(
              candidateKey
            );
          } else {
            nextSelection.add(
              candidateKey
            );
          }

          return nextSelection;
        }
      );
    };

  const toggleFocusedManager =
    (
      managerId
    ) => {
      const managerKey =
        String(
          managerId
        );

      setFocusedManagerId(
        (
          currentManagerId
        ) =>
          currentManagerId ===
          managerKey
            ? null
            : managerKey
      );
    };

  const closeFocusedManager =
    () => {
      setFocusedManagerId(
        null
      );
    };

  const selectAllForManager =
    (
      managerCandidates
    ) => {
      setSelectedCandidateIds(
        (
          currentSelection
        ) => {
          const nextSelection =
            new Set(
              currentSelection
            );

          managerCandidates.forEach(
            (
              candidate
            ) => {
              nextSelection.add(
                String(
                  candidate
                    .keeper_candidate_id
                )
              );
            }
          );

          return nextSelection;
        }
      );
    };

  const clearManagerSelections =
    (
      managerCandidates
    ) => {
      setSelectedCandidateIds(
        (
          currentSelection
        ) => {
          const nextSelection =
            new Set(
              currentSelection
            );

          managerCandidates.forEach(
            (
              candidate
            ) => {
              nextSelection.delete(
                String(
                  candidate
                    .keeper_candidate_id
                )
              );
            }
          );

          return nextSelection;
        }
      );
    };

  /*
   * =========================================================
   * REVIEW / FINALIZE
   * =========================================================
   */

  const openReview =
    () => {
      setSubmitError(
        ""
      );

      setReviewOpen(
        true
      );
    };

  const closeReview =
    () => {
      if (
        !submitting
      ) {
        setReviewOpen(
          false
        );
      }
    };

  const finalizeKeepers =
    async () => {
      setSubmitting(
        true
      );

      setSubmitError(
        ""
      );

      try {
        const keeperSlotAssignments =
          buildKeeperSlotAssignments({
            selectedCandidates,
            rosterSlotLimits,
          });

        const selectedIds =
          keeperSlotAssignments.map(
            (
              assignment
            ) =>
              toNumber(
                assignment
                  .keeper_candidate_id
              )
          );

        const keeperAssignmentsPayload =
          keeperSlotAssignments.map(
            (
              assignment
            ) => ({
              keeper_candidate_id:
                toNumber(
                  assignment
                    .keeper_candidate_id
                ),

              drafted_as:
                assignment
                  .drafted_as,
            })
          );

        const {
          data,
          error,
        } =
          await supabase.rpc(
            "finalize_keepers_and_start_draft",
            {
              p_season:
                normalizedSeason,

              p_selected_candidate_ids:
                selectedIds,

              p_keeper_assignments:
                keeperAssignmentsPayload,
            }
          );

        if (
          error
        ) {
          throw error;
        }

        setReviewOpen(
          false
        );

        if (
          typeof onDraftActivated ===
          "function"
        ) {
          await onDraftActivated({
            rpcResult:
              data,

            keeperSlotAssignments,
          });
        }
      } catch (
        error
      ) {
        console.error(
          "Unable to finalize keepers:",
          error
        );

        setSubmitError(
          error?.message ??
            "Unable to finalize keeper selections."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /*
   * =========================================================
   * PAGE STATES
   * =========================================================
   */

  if (
    loading
  ) {
    return (
      <KeeperPageState
        title="Loading Keeper Setup"
        message={`Preparing ${
          normalizedSeason ??
          ""
        } keeper candidates.`}
        loading
      />
    );
  }

  if (
    loadError
  ) {
    return (
      <KeeperPageState
        title="Keeper Setup Unavailable"
        message={
          loadError
        }
        error
        actionLabel="Sign Out"
        onAction={
          onSignOut
        }
      />
    );
  }

  if (
    candidates.length ===
    0
  ) {
    return (
      <KeeperPageState
        title="No Keeper Candidates"
        message={`No visible rows were returned from keepers for season ${normalizedSeason}. Confirm the season value and the keepers SELECT RLS policy.`}
        error
        actionLabel="Sign Out"
        onAction={
          onSignOut
        }
      />
    );
  }

  /*
   * =========================================================
   * MAIN PAGE
   * =========================================================
   */

  return (
    <main className="keeper-setup">
      <header className="keeper-setup__header">
        <div className="keeper-setup__identity">
          <span className="keeper-setup__eyebrow">
            Promise Lands
          </span>

          <h1>
            {normalizedSeason} Keeper Setup
          </h1>

          <p>
            Select each retained player.
            Keeper prices include a{" "}
            <strong>
              {formatCurrency(
                normalizedKeeperIncrease
              )}
            </strong>{" "}
            increase.
          </p>
        </div>

        <div className="keeper-setup__header-actions">
          <button
            type="button"
            className="
              keeper-button
              keeper-button--ghost
            "
            onClick={
              onSignOut
            }
          >
            Sign Out
          </button>

          <button
            type="button"
            className="
              keeper-button
              keeper-button--primary
            "
            onClick={
              openReview
            }
          >
            Review Keepers
          </button>
        </div>
      </header>

      <section className="keeper-summary">
        <KeeperSummaryCard
          label="Selected Keepers"
          value={
            formatInteger(
              selectedCandidates.length
            )
          }
          detail={`${formatInteger(
            enrichedCandidates.length
          )} eligible players`}
        />

        <KeeperSummaryCard
          label="Managers Represented"
          value={
            formatInteger(
              selectedManagerCount
            )
          }
          detail={`${formatInteger(
            managerGroups.length
          )} managers with candidates`}
        />

        <KeeperSummaryCard
          label="Committed Budget"
          value={
            formatCurrency(
              totalCommitted
            )
          }
          detail="Across all selected keepers"
        />

        <KeeperSummaryCard
          label="Average Keeper Cost"
          value={
            formatCurrency(
              averageKeeperCost
            )
          }
          detail="Per retained player"
        />
      </section>

      <section className="keeper-toolbar">
        <label className="keeper-search">
          <span>
            Search Candidates
          </span>

          <input
            type="search"
            value={
              searchValue
            }
            onChange={(
              event
            ) =>
              setSearchValue(
                event
                  .target
                  .value
              )
            }
            placeholder="Player, manager, position, or team..."
          />
        </label>

        <div className="keeper-toolbar__legend">
          <span>
            Previous Cost
          </span>

          <span>
            Keeper Cost
          </span>

          <strong>
            +
            {formatCurrency(
              normalizedKeeperIncrease
            )}
          </strong>
        </div>
      </section>

      {submitError && (
        <div
          className="keeper-submit-error"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <section
        className={[
          "keeper-manager-grid",

          focusedManagerId
            ? "keeper-manager-grid--focused"
            : "",
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )}
      >
        {managerGroups.map(
  (
    group
  ) => {
    const managerId =
      String(
        group
          .manager
          ?.manager_id
      );

    const hasBudgetFailure =
      !group
        .keeperBudgetValid;

    const isFocused =
      focusedManagerId ===
      managerId;

    /*
     * Split candidates into two
     * centered rows.
     *
     * Odd-numbered candidate sets
     * put the extra card in the
     * top row.
     */
    const topRowCount =
      Math.ceil(
        group
          .candidates
          .length / 2
      );

    const topRowCandidates =
      group
        .candidates
        .slice(
          0,
          topRowCount
        );

    const bottomRowCandidates =
      group
        .candidates
        .slice(
          topRowCount
        );

    const isBackgroundCard =
      Boolean(
        focusedManagerId
      ) &&
      !isFocused;



            const cardClassName = [
              "keeper-manager",

              isFocused
                ? "keeper-manager--focused"
                : "keeper-manager--overview",

              isBackgroundCard
                ? "keeper-manager--background"
                : "",

              group.selectedCount >
              0
                ? "keeper-manager--selected"
                : "",

              hasBudgetFailure
                ? "keeper-manager--invalid"
                : "",
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              );

            return (
              <article
                key={
                  managerId
                }
                className={
                  cardClassName
                }
                aria-hidden={
                  isBackgroundCard
                    ? "true"
                    : undefined
                }
              >
                <header className="keeper-manager__header">
                  <button
                    type="button"
                    className="keeper-manager__header-button"
                    onClick={() =>
                      toggleFocusedManager(
                        managerId
                      )
                    }
                    aria-expanded={
                      isFocused
                    }
                    aria-controls={
                      `keeper-manager-body-${managerId}`
                    }
                  >
                    <div className="keeper-manager__identity">
                      <span className="keeper-manager__chevron">
                        {isFocused
                          ? "×"
                          : "+"}
                      </span>

                      <div className="keeper-manager__identity-copy">
                        <span>
                          Manager
                        </span>

                        <h2>
                          {group
                            .manager
                            ?.manager_name ??
                            `Manager ${managerId}`}
                        </h2>

                        <p>
                          {group
                            .keeperBudgetValid
                            ? `${
                                group
                                  .selectedCount
                              } keepers selected · ${formatCurrency(
                                group
                                  .requiredReserve
                              )} minimum reserve`
                            : `${formatCurrency(
                                group
                                  .budgetOverage
                              )} over the safe keeper limit`}
                        </p>
                      </div>
                    </div>

                    <div className="keeper-manager__metrics">
                      <KeeperManagerMetric
                        label="Reserve Needed"
                        value={
                          formatCurrency(
                            group
                              .requiredReserve
                          )
                        }
                        tone={
                          group
                            .keeperBudgetValid
                            ? "default"
                            : "red"
                        }
                      />

                      <KeeperManagerMetric
                        label="Selected"
                        value={
                          group
                            .selectedCount
                        }
                        tone="green"
                      />

                      <KeeperManagerMetric
                        label="Committed"
                        value={
                          formatCurrency(
                            group
                              .committedCost
                          )
                        }
                        emphasized
                        tone="gold"
                      />

                      <KeeperManagerMetric
                        label="Remaining"
                        value={
                          formatCurrency(
                            group
                              .budgetRemaining
                          )
                        }
                        emphasized
                        tone="green"
                      />
                    </div>

                    <span className="keeper-manager__expand-label">
                      {isFocused
                        ? "Close"
                        : "Open"}
                    </span>
                  </button>
                </header>

                {isFocused && (
                  <div
                    id={
                      `keeper-manager-body-${managerId}`
                    }
                    className="keeper-manager__body"
                  >
                    <div className="keeper-manager__body-header">
                      <div className="keeper-manager__body-title">
                        <span>
                          Keeper Candidates
                        </span>

                        <strong>
                          {
                            group
                              .candidates
                              .length
                          }{" "}
                          players shown
                        </strong>
                      </div>

                      <div className="keeper-manager__actions">
                        <button
                          type="button"
                          className="
                            keeper-manager__action-button
                            keeper-manager__action-button--select
                          "
                          onClick={() =>
                            selectAllForManager(
                              group
                                .allCandidates
                            )
                          }
                          disabled={
                            group
                              .allCandidates
                              .length ===
                            0
                          }
                        >
                          Select All
                        </button>

                        <button
                          type="button"
                          className="
                            keeper-manager__action-button
                            keeper-manager__action-button--clear
                          "
                          onClick={() =>
                            clearManagerSelections(
                              group
                                .allCandidates
                            )
                          }
                          disabled={
                            group
                              .selectedCount ===
                            0
                          }
                        >
                          Clear Selections
                        </button>

                        <button
                          type="button"
                          className="
                            keeper-manager__action-button
                            keeper-manager__action-button--close
                            keeper-manager__close-button
                          "
                          onClick={
                            closeFocusedManager
                          }
                        >
                          Close Manager
                        </button>
                      </div>
                    </div>

                    {group
                      .candidates
                      .length ===
                    0 ? (
                      <div className="keeper-manager__empty">
                        No matching keeper candidates.
                      </div>
                    ) : (
                      <div className="keeper-candidate-grid">
  <div
    className="keeper-candidate-row"
    style={{
      "--keeper-row-count":
        topRowCandidates.length,
    }}
  >
    {topRowCandidates.map(
      (candidate) => {
        const selected =
          selectedCandidateIds.has(
            String(
              candidate
                .keeper_candidate_id
            )
          );

        return (
          <KeeperCandidateCard
            key={
              candidate
                .keeper_candidate_id
            }
            candidate={
              candidate
            }
            selected={
              selected
            }
            onToggle={() =>
              toggleCandidate(
                candidate
                  .keeper_candidate_id
              )
            }
          />
        );
      }
    )}
  </div>

  {bottomRowCandidates.length >
    0 && (
    <div
      className="keeper-candidate-row"
      style={{
        "--keeper-row-count":
          bottomRowCandidates.length,
      }}
    >
      {bottomRowCandidates.map(
        (candidate) => {
          const selected =
            selectedCandidateIds.has(
              String(
                candidate
                  .keeper_candidate_id
              )
            );

          return (
            <KeeperCandidateCard
              key={
                candidate
                  .keeper_candidate_id
              }
              candidate={
                candidate
              }
              selected={
                selected
              }
              onToggle={() =>
                toggleCandidate(
                  candidate
                    .keeper_candidate_id
                )
              }
            />
          );
        }
      )}
    </div>
  )}
</div>
                    )}
                  </div>
                )}
              </article>
            );
          }
        )}
      </section>

      <footer className="keeper-footer">
        <div className="keeper-footer__summary">
          <span>
            Draft Preparation
          </span>

          <strong>
            {formatInteger(
              selectedCandidates.length
            )}{" "}
            keepers ·{" "}
            {formatCurrency(
              totalCommitted
            )}{" "}
            committed
          </strong>
        </div>

        <button
          type="button"
          className="
            keeper-button
            keeper-button--primary
            keeper-button--large
          "
          onClick={
            openReview
          }
        >
          Review & Start Draft
        </button>
      </footer>

      {reviewOpen && (
        <KeeperReviewModal
          season={
            normalizedSeason
          }
          selectedCandidates={
            selectedCandidates
          }
          totalCommitted={
            totalCommitted
          }
          submitting={
            submitting
          }
          submitError={
            submitError
          }
          onClose={
            closeReview
          }
          onConfirm={
            finalizeKeepers
          }
        />
      )}
    </main>
  );
}

/*
 * =========================================================
 * MANAGER METRIC
 * =========================================================
 */

function KeeperManagerMetric({
  label,
  value,
  emphasized = false,
  tone = "default",
}) {
  const className = [
    "keeper-manager-metric",

    emphasized
      ? "keeper-manager-metric--emphasized"
      : "",

    tone !==
    "default"
      ? `keeper-manager-metric--${tone}`
      : "",
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    );

  return (
    <div
      className={
        className
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/*
 * =========================================================
 * KEEPER PLAYER CARD
 * =========================================================
 *
 * This replaces the old oversized horizontal row.
 *
 * The entire card is the selection button.
 *
 * CSS will handle:
 * - grayscale / muted when NOT selected
 * - full team/player color when selected
 * - selected glow / border
 * - compact card dimensions
 */

function KeeperCandidateCard({
  candidate,
  selected,
  onToggle,
}) {
  const player =
    candidate.player ??
    {};

  const projectedPoints =
    toNumber(
      player
        .projected_fantasy_points
    );

  const projectedRank =
    toNullableNumber(
      player
        .projected_position_rank
    );

  const estimatedValue =
    toNumber(
      player
        .estimated_auction_value
    );

  const headshot =
    getPlayerHeadshot(
      player
    );

  const [
    headshotFailed,
    setHeadshotFailed,
  ] = useState(false);

  useEffect(() => {
    setHeadshotFailed(
      false
    );
  }, [headshot]);

  const position =
    normalizePosition(
      candidate.position
    );

  const team =
    String(
      candidate.team ??
      "FA"
    )
      .trim()
      .toUpperCase();

  const candidateClassName = [
    "keeper-player-card",

    selected
      ? "keeper-player-card--selected"
      : "keeper-player-card--unselected",

    `keeper-player-card--${position.toLowerCase()}`,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    );

  return (
    <button
      type="button"
      className={
        candidateClassName
      }
      onClick={
        onToggle
      }
      aria-pressed={
        selected
      }
      aria-label={`${
        selected
          ? "Remove"
          : "Select"
      } ${candidate.player_name} as a keeper`}
      data-position={
        position
      }
      data-team={
        team
      }
    >
      <div className="keeper-player-card__visual">
        <div
          className="keeper-player-card__background"
          aria-hidden="true"
        />

        <div
          className="keeper-player-card__texture"
          aria-hidden="true"
        />

        <div className="keeper-player-card__topbar">
          <span className="keeper-player-card__position">
            {position}
          </span>

          <span className="keeper-player-card__team">
            {team}
          </span>
        </div>

        <div className="keeper-player-card__image-area">
          {headshot &&
          !headshotFailed ? (
            <img
              className="keeper-player-card__headshot"
              src={headshot}
              alt=""
              draggable="false"
              aria-hidden="true"
              onError={() =>
                setHeadshotFailed(
                  true
                )
              }
            />
          ) : (
            <div
              className="keeper-player-card__headshot-placeholder"
              aria-hidden="true"
            >
              {getInitials(
                candidate.player_name
              )}
            </div>
          )}

          <span
            className="keeper-player-card__selection-badge"
            aria-hidden="true"
          >
            {selected
              ? "KEEPER"
              : "AVAILABLE"}
          </span>
        </div>

        <div className="keeper-player-card__identity">
          <strong>
            {
              candidate
                .player_name
            }
          </strong>

          <span>
            {position}
            {" · "}
            {team}
          </span>
        </div>

        <div className="keeper-player-card__stats">
          <KeeperCardStat
            label="Proj"
            value={
              projectedPoints >
              0
                ? formatDecimal(
                    projectedPoints,
                    1
                  )
                : "—"
            }
          />

          <KeeperCardStat
            label="Rank"
            value={
              projectedRank
                ? `${position}${projectedRank}`
                : "—"
            }
          />

          <KeeperCardStat
            label="Value"
            value={
              estimatedValue >
              0
                ? formatCurrency(
                    estimatedValue
                  )
                : "—"
            }
          />
        </div>
      </div>

      <div className="keeper-player-card__keeper-strip">
        <div className="keeper-player-card__cost-block">
          <span>
            Previous
          </span>

          <strong>
            {formatCurrency(
              candidate
                .previous_cost
            )}
          </strong>
        </div>

        <span
          className="keeper-player-card__cost-arrow"
          aria-hidden="true"
        >
          →
        </span>

        <div className="
          keeper-player-card__cost-block
          keeper-player-card__cost-block--keeper
        ">
          <span>
            Keeper
          </span>

          <strong>
            {formatCurrency(
              candidate
                .keeper_cost
            )}
          </strong>
        </div>
      </div>

      {candidate
        .previous_draft_slot && (
        <div className="keeper-player-card__previous-slot">
          Previous slot{" "}
          <strong>
            {
              candidate
                .previous_draft_slot
            }
          </strong>
        </div>
      )}

      <div
        className="keeper-player-card__selected-indicator"
        aria-hidden="true"
      >
        {selected
          ? "✓"
          : ""}
      </div>
    </button>
  );
}

/*
 * =========================================================
 * SMALL CARD STAT
 * =========================================================
 */

function KeeperCardStat({
  label,
  value,
}) {
  return (
    <div className="keeper-player-card__stat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/*
 * =========================================================
 * REVIEW MODAL
 * =========================================================
 */

function KeeperReviewModal({
  season,
  selectedCandidates,
  totalCommitted,
  submitting,
  submitError,
  onClose,
  onConfirm,
}) {
  const groupedCandidates =
    useMemo(() => {
      const groups =
        new Map();

      selectedCandidates.forEach(
        (
          candidate
        ) => {
          const managerKey =
            String(
              candidate
                .manager_id
            );

          if (
            !groups.has(
              managerKey
            )
          ) {
            groups.set(
              managerKey,
              {
                manager_name:
                  candidate
                    .manager_name,

                candidates:
                  [],

                totalCost:
                  0,
              }
            );
          }

          const group =
            groups.get(
              managerKey
            );

          group
            .candidates
            .push(
              candidate
            );

          group.totalCost +=
            candidate
              .keeper_cost;
        }
      );

      return Array.from(
        groups.values()
      ).sort(
        (
          first,
          second
        ) =>
          first
            .manager_name
            .localeCompare(
              second
                .manager_name
            )
      );
    }, [
      selectedCandidates,
    ]);

  return (
    <div
      className="keeper-review"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keeper-review-title"
    >
      <button
        type="button"
        className="keeper-review__backdrop"
        onClick={
          onClose
        }
        aria-label="Close keeper review"
      />

      <section className="keeper-review__modal">
        <header className="keeper-review__header">
          <div>
            <span>
              Final Review
            </span>

            <h2 id="keeper-review-title">
              {season} Keepers
            </h2>

            <p>
              Finalizing creates the keeper
              draft entries, rebuilds the live
              rosters, and activates the draft.
            </p>
          </div>

          <button
            type="button"
            className="keeper-review__close"
            onClick={
              onClose
            }
            disabled={
              submitting
            }
            aria-label="Close keeper review"
          >
            ×
          </button>
        </header>

        <div className="keeper-review__summary">
          <div>
            <span>
              Keepers
            </span>

            <strong>
              {formatInteger(
                selectedCandidates.length
              )}
            </strong>
          </div>

          <div>
            <span>
              Managers
            </span>

            <strong>
              {formatInteger(
                groupedCandidates.length
              )}
            </strong>
          </div>

          <div>
            <span>
              Committed
            </span>

            <strong>
              {formatCurrency(
                totalCommitted
              )}
            </strong>
          </div>
        </div>

        <div className="keeper-review__managers">
          {groupedCandidates.length ===
          0 ? (
            <div className="keeper-review__empty">
              No keepers have been selected.
              You may still start the draft
              without keepers.
            </div>
          ) : (
            groupedCandidates.map(
              (
                group
              ) => (
                <article
                  key={
                    group
                      .manager_name
                  }
                  className="keeper-review-manager"
                >
                  <header>
                    <strong>
                      {
                        group
                          .manager_name
                      }
                    </strong>

                    <span>
                      {formatInteger(
                        group
                          .candidates
                          .length
                      )}{" "}
                      keepers ·{" "}
                      {formatCurrency(
                        group
                          .totalCost
                      )}
                    </span>
                  </header>

                  <div>
                    {group.candidates.map(
                      (
                        candidate
                      ) => (
                        <span
                          key={
                            candidate
                              .keeper_candidate_id
                          }
                        >
                          <strong>
                            {
                              candidate
                                .player_name
                            }
                          </strong>

                          <small>
                            {
                              candidate
                                .position
                            }
                            {" · "}
                            {formatCurrency(
                              candidate
                                .keeper_cost
                            )}
                          </small>
                        </span>
                      )
                    )}
                  </div>
                </article>
              )
            )
          )}
        </div>

        {submitError && (
          <div
            className="keeper-review__error"
            role="alert"
          >
            {submitError}
          </div>
        )}

        <footer className="keeper-review__footer">
          <button
            type="button"
            className="
              keeper-button
              keeper-button--ghost
            "
            onClick={
              onClose
            }
            disabled={
              submitting
            }
          >
            Return to Selection
          </button>

          <button
            type="button"
            className="
              keeper-button
              keeper-button--primary
            "
            onClick={
              onConfirm
            }
            disabled={
              submitting
            }
          >
            {submitting
              ? "Finalizing Keepers..."
              : "Finalize & Start Draft"}
          </button>
        </footer>
      </section>
    </div>
  );
}

/*
 * =========================================================
 * SUMMARY CARD
 * =========================================================
 */

function KeeperSummaryCard({
  label,
  value,
  detail,
}) {
  return (
    <article className="keeper-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>
    </article>
  );
}

/*
 * =========================================================
 * PAGE STATE
 * =========================================================
 */

function KeeperPageState({
  title,
  message,
  loading = false,
  error = false,
  actionLabel,
  onAction,
}) {
  return (
    <main className="keeper-page-state">
      <section
        className={
          error
            ? "keeper-page-state__card keeper-page-state__card--error"
            : "keeper-page-state__card"
        }
      >
        {loading && (
          <div className="keeper-page-state__spinner" />
        )}

        <h1>
          {title}
        </h1>

        <p>
          {message}
        </p>

        {actionLabel &&
          onAction && (
            <button
              type="button"
              onClick={
                onAction
              }
            >
              {
                actionLabel
              }
            </button>
          )}
      </section>
    </main>
  );
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */


/*
 * =========================================================
 * KEEPER SLOT ASSIGNMENT
 * =========================================================
 *
 * Internal slot keys remain numbered:
 *
 * QB1
 * RB1
 * RB2
 * WR1
 * WR2
 * WR3
 * TE1
 * ABN1
 * ABN2
 * ...
 * SBN1
 * ...
 *
 * These are stored in:
 *
 * Live_Rosters.drafted_as
 * draft_entries.draft_slot
 *
 * The visible RosterPanel may still show simply:
 *
 * QB / RB / WR / TE / BN
 */

function buildKeeperSlotAssignments({
  selectedCandidates,
  rosterSlotLimits,
}) {
  const safeCandidates =
    Array.isArray(
      selectedCandidates
    )
      ? selectedCandidates
      : [];

  const limits = {
    QB:
      normalizeSlotCount(
        rosterSlotLimits?.QB
      ),

    RB:
      normalizeSlotCount(
        rosterSlotLimits?.RB
      ),

    WR:
      normalizeSlotCount(
        rosterSlotLimits?.WR
      ),

    TE:
      normalizeSlotCount(
        rosterSlotLimits?.TE
      ),

    ABN:
      normalizeSlotCount(
        rosterSlotLimits?.ABN
      ),

    SBN:
      normalizeSlotCount(
        rosterSlotLimits?.SBN
      ),
  };

  const candidatesByManager =
    new Map();

  safeCandidates.forEach(
    (
      candidate
    ) => {
      const managerId =
        candidate
          ?.manager_id;

      if (
        managerId ===
          null ||
        managerId ===
          undefined
      ) {
        throw new Error(
          `${
            candidate
              ?.player_name ??
            "Keeper"
          } is missing a manager_id.`
        );
      }

      const managerKey =
        String(
          managerId
        );

      if (
        !candidatesByManager.has(
          managerKey
        )
      ) {
        candidatesByManager.set(
          managerKey,
          []
        );
      }

      candidatesByManager
        .get(
          managerKey
        )
        .push(
          candidate
        );
    }
  );

  const assignments =
    [];

  candidatesByManager.forEach(
    (
      managerCandidates,
      managerKey
    ) => {
      const assignedIds =
        new Set();

      /*
       * PASS 1:
       * Fill natural positional starters first.
       */
      [
        "QB",
        "RB",
        "WR",
        "TE",
      ].forEach(
        (
          position
        ) => {
          const positionalKeepers =
            managerCandidates
              .filter(
                (
                  candidate
                ) =>
                  normalizePosition(
                    candidate
                      .position
                  ) ===
                  position
              )
              .sort(
                compareKeeperSlotOrder
              );

          positionalKeepers
            .slice(
              0,
              limits[
                position
              ]
            )
            .forEach(
              (
                candidate,
                index
              ) => {
                assignments.push(
                  createKeeperSlotAssignment({
                    candidate,

                    draftedAs:
                      `${position}${
                        index +
                        1
                      }`,
                  })
                );

                assignedIds.add(
                  String(
                    candidate
                      .keeper_candidate_id
                  )
                );
              }
            );
        }
      );

      /*
       * PASS 2:
       * Overflow moves to ABN first,
       * then SBN.
       */
      const overflowKeepers =
        managerCandidates
          .filter(
            (
              candidate
            ) =>
              !assignedIds.has(
                String(
                  candidate
                    .keeper_candidate_id
                )
              )
          )
          .sort(
            compareKeeperSlotOrder
          );

      const overflowSlots = [
        ...createRosterSlotNames(
          "ABN",
          limits.ABN
        ),

        ...createRosterSlotNames(
          "SBN",
          limits.SBN
        ),
      ];

      if (
        overflowKeepers.length >
        overflowSlots.length
      ) {
        const managerName =
          managerCandidates[0]
            ?.manager_name ??
          `Manager ${managerKey}`;

        throw new Error(
          `${managerName} has ${
            overflowKeepers.length
          } keeper players that need bench slots, but only ${
            overflowSlots.length
          } ABN/SBN slots are available.`
        );
      }

      overflowKeepers.forEach(
        (
          candidate,
          index
        ) => {
          assignments.push(
            createKeeperSlotAssignment({
              candidate,

              draftedAs:
                overflowSlots[
                  index
                ],
            })
          );
        }
      );
    }
  );

  return assignments;
}


function createKeeperSlotAssignment({
  candidate,
  draftedAs,
}) {
  return {
    keeper_candidate_id:
      candidate
        .keeper_candidate_id,

    player_id:
      candidate
        .player_id,

    manager_id:
      candidate
        .manager_id,

    player_name:
      candidate
        .player_name,

    position:
      normalizePosition(
        candidate
          .position
      ),

    keeper_cost:
      toNumber(
        candidate
          .keeper_cost
      ),

    previous_draft_slot:
      candidate
        .previous_draft_slot ??
      null,

    drafted_as:
      draftedAs,
  };
}


function compareKeeperSlotOrder(
  first,
  second
) {
  /*
   * Deterministic numbering only.
   *
   * Higher keeper cost gets the earlier slot,
   * then name and player_id break ties.
   *
   * RB1/RB2 are internal unique slot keys;
   * they do not represent a depth-chart ranking.
   */
  const costDifference =
    toNumber(
      second
        ?.keeper_cost
    ) -
    toNumber(
      first
        ?.keeper_cost
    );

  if (
    costDifference !==
    0
  ) {
    return costDifference;
  }

  const nameDifference =
    String(
      first
        ?.player_name ??
      ""
    ).localeCompare(
      String(
        second
          ?.player_name ??
        ""
      )
    );

  if (
    nameDifference !==
    0
  ) {
    return nameDifference;
  }

  return String(
    first
      ?.player_id ??
    ""
  ).localeCompare(
    String(
      second
        ?.player_id ??
      ""
    )
  );
}


function normalizeSlotCount(
  value
) {
  return Math.max(
    Math.floor(
      toNumber(
        value
      )
    ),
    0
  );
}


function createRosterSlotNames(
  prefix,
  amount
) {
  return Array.from(
    {
      length:
        normalizeSlotCount(
          amount
        ),
    },
    (
      _,
      index
    ) =>
      `${prefix}${
        index +
        1
      }`
  );
}


function getPlayerHeadshot(
  player
) {
  const playerId =
    player?.player_id ??
    player?.Player_ID ??
    player?.id ??
    null;

  if (
    playerId === null ||
    playerId === undefined ||
    playerId === ""
  ) {
    return null;
  }

  return `https://sleepercdn.com/content/nfl/players/${playerId}.jpg`;
}

function normalizePosition(
  value
) {
  const position =
    String(
      value ??
      ""
    )
      .trim()
      .toUpperCase();

  return (
    position ||
    "—"
  );
}

function getInitials(
  value
) {
  const parts =
    String(
      value ??
      ""
    )
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  if (
    parts.length ===
    0
  ) {
    return "?";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return (
    `${
      parts[0][0] ??
      ""
    }${
      parts[
        parts.length -
        1
      ][0] ??
      ""
    }`
  ).toUpperCase();
}

function toNumber(
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

function toNullableNumber(
  value
) {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function formatCurrency(
  value
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",

      maximumFractionDigits:
        0,
    }
  ).format(
    toNumber(
      value
    )
  );
}

function formatInteger(
  value
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits:
        0,
    }
  ).format(
    toNumber(
      value
    )
  );
}

function formatDecimal(
  value,
  digits = 1
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits:
        digits,
    }
  ).format(
    toNumber(
      value
    )
  );
}

