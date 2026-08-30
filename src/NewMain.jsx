import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DraftTicker from "./NewComponents/DraftTicker";
import ExpandableMenu from "./NewComponents/ExpandableMenu";
import SpecularButton from "./NewComponents/SpecularButton";
import ManagerCard from "./NewComponents/ManagerCard";
import PlayerSelectPanel from "./NewComponents/PlayerSelectPanel";
import AvailablePlayersPanel from "./NewComponents/AvailablePlayersPanel";
import RosterPanel from "./RosterPanel";
import DraftSettingsTab from "./DraftSettingsTab";
import LoginModal from "./LoginModal";
import DataDashboard from "./DataDashboard";
import KeeperSetupPage from "./KeeperSetupPage";

import {
  playDraftCardAnimation,
} from "./NewComponents/DraftCardAnimation";

import { supabase } from "./supabaseClient";

import {
  createTeamArchetype,
} from "./TeamArchetypes";

import {
  createProjectionGapTierModel,
} from "./PlayerTiers";

import {
  HomeIcon,
  RostersIcon,
  DataIcon,
  SettingsIcon,
} from "./NewComponents/MenuIcons";

import "./NewMain.css";


const BYPASS_AUTH_AND_KEEPERS = false;

const specialDraftSelections = [
  {
    id: "budget-k",
    player_id: "budget-k",
    player_name: "Kicker",
    name: "Kicker",
    position: "K",
    team: "Special",
    special_type: "KICKER",
    special_purpose: "BUDGET",
    isBudgetOnly: true,
    budgetEntryType: "K",
    description:
      "Budget-only kicker selection",
  },
  {
    id: "budget-def",
    player_id: "budget-def",
    player_name: "Team Defense",
    name: "Team Defense",
    position: "DEF",
    team: "Special",
    special_type: "DEFENSE",
    special_purpose: "BUDGET",
    isBudgetOnly: true,
    budgetEntryType: "DEF",
    description:
      "Budget-only team defense selection",
  },
];

const menuItems = [
  {
    id: "home",
    label: "Home",
    icon: <HomeIcon />,
  },
  {
    id: "rosters",
    label: "Rosters",
    icon: <RostersIcon />,
  },
  {
    id: "data",
    label: "Data",
    icon: <DataIcon />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <SettingsIcon />,
  },
];

const NewMain = () => {
  

  const [
    authSession,
    setAuthSession,
  ] = useState(null);
  
  const [
    authUser,
    setAuthUser,
  ] = useState(null);
  
  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);
  
  const [
    isLeagueAdmin,
    setIsLeagueAdmin,
  ] = useState(false);
  
  const [
    adminCheckLoading,
    setAdminCheckLoading,
  ] = useState(true);
  
  const [
    authError,
    setAuthError,
  ] = useState("");
  const [
    draftControl,
    setDraftControl,
  ] = useState(null);
  
  const [
    draftControlLoading,
    setDraftControlLoading,
  ] = useState(true);
  
  const [
    draftControlError,
    setDraftControlError,
  ] = useState("");
  
  const draftPhase =
    draftControl?.draft_phase ??
    null;
  
  const currentSeason =
    draftControl?.season ??
    null;

    const effectiveAuthSession =
  BYPASS_AUTH_AND_KEEPERS
    ? {
        user: {
          id: "dev-admin",
          email: "dev@local.test",
        },
      }
    : authSession;

const effectiveAuthUser =
  BYPASS_AUTH_AND_KEEPERS
    ? effectiveAuthSession.user
    : authUser;

const effectiveIsLeagueAdmin =
  BYPASS_AUTH_AND_KEEPERS
    ? true
    : isLeagueAdmin;

const effectiveDraftPhase =
  BYPASS_AUTH_AND_KEEPERS
    ? "active"
    : draftPhase;


  const checkLeagueAdmin =
  async (session) => {
    if (!session?.user) {
      setIsLeagueAdmin(false);
      setAdminCheckLoading(false);

      return false;
    }

    setAdminCheckLoading(true);
    setAuthError("");

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "is_league_admin"
      );

      if (error) {
        throw error;
      }

      const authorized =
        data === true;

      setIsLeagueAdmin(
        authorized
      );

      if (!authorized) {
        setAuthError(
          "This account is authenticated but is not authorized as a league administrator."
        );
      }

      return authorized;
    } catch (error) {
      console.error(
        "Unable to verify administrator access:",
        error
      );

      setIsLeagueAdmin(false);

      setAuthError(
        error?.message ??
          "Unable to verify administrator access."
      );

      return false;
    } finally {
      setAdminCheckLoading(
        false
      );
    }
  };

  const handleSignOut =
  async () => {
    try {
      const {
        error,
      } = await supabase
        .auth
        .signOut();

      if (error) {
        throw error;
      }

      setActiveItem(
        "home"
      );

      setSelectedPlayer(
        null
      );
    } catch (error) {
      console.error(
        "Unable to sign out:",
        error
      );

      setAuthError(
        error?.message ??
          "Unable to sign out."
      );
    }
  };
  
  const [
    activeItem,
    setActiveItem,
  ] = useState("home");

  const [
    managers,
    setManagers,
  ] = useState([]);

  const [
    selectedManagerId,
    setSelectedManagerId,
  ] = useState(null);

  const [
    activeManagerTooltipId,
    setActiveManagerTooltipId,
  ] = useState(null);

  const [
    rosterEntries,
    setRosterEntries,
  ] = useState([]);

  const [
    draftEntries,
    setDraftEntries,
  ] = useState([]);

  const [
    playerDraftHistory,
    setPlayerDraftHistory,
  ] = useState([]);

  /*
   * Player details used to calculate:
   * - natural position counts
   * - projected fantasy point totals
   * - relative team strength
   */
  const [
    rosterPlayerData,
    setRosterPlayerData,
  ] = useState([]);

  const [
    leagueSettings,
    setLeagueSettings,
  ] = useState(null);

  const [
    leagueSettingsLoading,
    setLeagueSettingsLoading,
  ] = useState(true);

  const [
    leagueSettingsError,
    setLeagueSettingsError,
  ] = useState(null);

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] = useState(null);

  const [
    availablePlayers,
    setAvailablePlayers,
  ] = useState([]);

  const [
    playersLoading,
    setPlayersLoading,
  ] = useState(true);

  const [
    playersError,
    setPlayersError,
  ] = useState(null);

  const [
    isFullscreen,
    setIsFullscreen,
  ] = useState(() => {
    if (
      typeof document ===
      "undefined"
    ) {
      return false;
    }

    return Boolean(
      document.fullscreenElement
    );
  });

  const fetchManagers =
    async () => {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("active_managers")
          .select("*")
          .order(
            "manager_name",
            {
              ascending: true,
            }
          );

        if (error) {
          throw error;
        }

        const managerRows =
          data ?? [];

        setManagers(
          managerRows
        );

        if (
          managerRows.length >
          0
        ) {
          setSelectedManagerId(
            (
              currentManagerId
            ) =>
              currentManagerId ??
              managerRows[0]
                .manager_id
          );
        }
      } catch (error) {
        console.error(
          "Unable to load managers:",
          error
        );

        setManagers([]);
      }
    };

    const fetchDraftControl =
  async () => {
    setDraftControlLoading(
      true
    );

    setDraftControlError("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("draft_control")
        .select(`
          id,
          season,
          draft_phase,
          keeper_cost_increase,
          keepers_submitted
        `)
        .order("season", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "No draft control record was found."
        );
      }

      setDraftControl(data);
    } catch (error) {
      console.error(
        "Unable to load draft control:",
        error
      );

      setDraftControl(null);

      setDraftControlError(
        error?.message ??
          "Unable to load the draft phase."
      );
    } finally {
      setDraftControlLoading(
        false
      );
    }
  };

  const fetchLeagueSettings =
    async () => {
      setLeagueSettingsLoading(
        true
      );

      setLeagueSettingsError(
        null
      );

      try {
        const {
          data,
          error,
        } = await supabase
          .from("League Settings")
          .select(`
            Id,
            "Keeper Increase",
            Budget,
            QB,
            RB,
            WR,
            TE,
            ABN,
            SBN,
            Max_QB,
            Max_RB,
            Max_WR,
            Max_TE,
            Max_AB,
            Max_SBN
          `)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "No League Settings row was found."
          );
        }

        const normalizedSettings = {
          id:
            data.Id,

          keeperIncrease:
            toSafeNumber(
              data[
                "Keeper Increase"
              ]
            ),

          startingBudget:
            toSafeNumber(
              data.Budget
            ),

          starters: {
            qb:
              toSafeNumber(
                data.QB
              ),

            rb:
              toSafeNumber(
                data.RB
              ),

            wr:
              toSafeNumber(
                data.WR
              ),

            te:
              toSafeNumber(
                data.TE
              ),

            abn:
              toSafeNumber(
                data.ABN
              ),

            sbn:
              toSafeNumber(
                data.SBN
              ),
          },

          maximums: {
            qb:
              toSafeNumber(
                data.Max_QB
              ),

            rb:
              toSafeNumber(
                data.Max_RB
              ),

            wr:
              toSafeNumber(
                data.Max_WR
              ),

            te:
              toSafeNumber(
                data.Max_TE
              ),

            ab:
              toSafeNumber(
                data.Max_AB
              ),

            sbn:
              toSafeNumber(
                data.Max_SBN
              ),
          },
        };

        console.log(
          "League Settings:",
          normalizedSettings
        );

        setLeagueSettings(
          normalizedSettings
        );
      } catch (error) {
        console.error(
          "Unable to load league settings:",
          error
        );

        setLeagueSettingsError(
          error?.message ??
            "Unable to load league settings."
        );

        setLeagueSettings(
          null
        );
      } finally {
        setLeagueSettingsLoading(
          false
        );
      }
    };

    

  /*
   * This loads all data needed by the manager cards.
   */
  const fetchManagerDraftData =
    async () => {
      try {
        const [
          rosterResult,
          draftResult,
          playerResult,
        ] = await Promise.all([
          supabase
            .from("Live_Rosters")
            .select(`
              id,
              player_id,
              manager_id,
              drafted_as
            `),

          supabase
            .from("draft_entries")
            .select("*"),

          supabase
            .from("player_data")
            .select("*"),
        ]);

        if (
          rosterResult.error
        ) {
          throw rosterResult.error;
        }

        if (
          draftResult.error
        ) {
          throw draftResult.error;
        }

        if (
          playerResult.error
        ) {
          throw playerResult.error;
        }

        setRosterEntries(
          rosterResult.data ??
            []
        );

        setDraftEntries(
          draftResult.data ??
            []
        );

        setRosterPlayerData(
          playerResult.data ??
            []
        );
      } catch (error) {
        console.error(
          "Unable to load manager draft data:",
          error
        );

        setRosterEntries([]);
        setDraftEntries([]);
        setRosterPlayerData([]);
      }
    };

  const fetchAvailablePlayers =
    async () => {
      setPlayersLoading(
        true
      );

      setPlayersError(
        null
      );

      try {
        const {
          data,
          error,
        } = await supabase
          .from("player_data")
          .select("*")
          .eq(
            "drafted",
            false
          )
          .in(
            "position",
            [
              "QB",
              "RB",
              "WR",
              "TE",
            ]
          )
          .order(
            "position",
            {
              ascending: true,
            }
          )
          .order(
            "projected_fantasy_points",
            {
              ascending: false,
              nullsFirst: false,
            }
          );

        if (error) {
          throw error;
        }

        setAvailablePlayers(
          data ?? []
        );
      } catch (error) {
        console.error(
          "Unable to load players:",
          error
        );

        setPlayersError(
          error?.message ??
            "Unable to load players."
        );

        setAvailablePlayers(
          []
        );
      } finally {
        setPlayersLoading(
          false
        );
      }
    };


    const fetchPlayerDraftHistory =
  async () => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("Draft_History")
        .select(`
          Id,
          Player_ID,
          Manager_ID,
          Year,
          Player_Name,
          Position,
          Cost,
          FPTS,
          "Keeper Status",
          "Position Rank",
          "SV$",
          Manager_Name,
          "True Value",
          Draft_Slot
        `)
        .order(
          "Year",
          {
            ascending: true,
          }
        );

      if (error) {
        throw error;
      }

      setPlayerDraftHistory(
        data ?? []
      );
    } catch (error) {
      console.error(
        "Unable to load player draft history:",
        error
      );

      setPlayerDraftHistory(
        []
      );
    }
  };
useEffect(() => {
  let isMounted = true;

  const initializeAuth =
    async () => {
      setAuthLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .auth
          .getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const session =
          data?.session ??
          null;

        setAuthSession(
          session
        );

        setAuthUser(
          session?.user ??
          null
        );

        if (session) {
          await checkLeagueAdmin(
            session
          );
        } else {
          setIsLeagueAdmin(
            false
          );

          setAdminCheckLoading(
            false
          );
        }
      } catch (error) {
        console.error(
          "Unable to initialize authentication:",
          error
        );

        if (isMounted) {
          setAuthError(
            error?.message ??
              "Unable to initialize authentication."
          );

          setAuthSession(null);
          setAuthUser(null);
          setIsLeagueAdmin(
            false
          );

          setAdminCheckLoading(
            false
          );
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

  initializeAuth();

  const {
    data: {
      subscription,
    },
  } = supabase
    .auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {
        if (!isMounted) {
          return;
        }

        setAuthSession(
          session
        );

        setAuthUser(
          session?.user ??
          null
        );

        if (
          event ===
          "SIGNED_OUT"
        ) {
          setIsLeagueAdmin(
            false
          );

          setAdminCheckLoading(
            false
          );

          setAuthError("");

          return;
        }

        if (session) {
          /*
           * Avoid making an async Supabase call directly
           * inside the auth callback.
           */
          window.setTimeout(
            () => {
              checkLeagueAdmin(
                session
              );
            },
            0
          );
        }
      }
    );

  return () => {
    isMounted = false;

    subscription.unsubscribe();
  };
}, []);

useEffect(() => {
  if (
    !effectiveAuthSession ||
    !effectiveAuthUser
  ) {
    return;
  }

  if (
    !authSession ||
    !isLeagueAdmin
  ) {
    return;
  }
fetchDraftControl();
  fetchAvailablePlayers();
  fetchManagers();
  fetchLeagueSettings();
  fetchManagerDraftData();
  fetchPlayerDraftHistory();
}, [
  authLoading,
  adminCheckLoading,
  authSession,
  isLeagueAdmin,
]);

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setIsFullscreen(
          Boolean(
            document
              .fullscreenElement
          )
        );
      };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  /*
   * Build all manager-card values in two stages.
   *
   * Stage 1:
   * Calculate each manager's raw roster and projection totals.
   *
   * Stage 2:
   * Compare completed position groups between managers.
   */
  const managerCardData = useMemo(() => {
    const safeManagers = Array.isArray(managers)
      ? managers
      : [];

    const safeRosterEntries = Array.isArray(rosterEntries)
      ? rosterEntries
      : [];

    const safeDraftEntries = Array.isArray(draftEntries)
      ? draftEntries
      : [];

    const safeRosterPlayerData = Array.isArray(rosterPlayerData)
      ? rosterPlayerData
      : [];

    const startingBudget = toSafeNumber(
      leagueSettings?.startingBudget
    );

    const rosterCapacity = getTotalRosterCapacity(
      leagueSettings
    );

    const playerById = new Map(
      safeRosterPlayerData.map((player) => [
        String(player.player_id),
        player,
      ])
    );

    const positionPercentileMap =
      createPositionPercentileMap(
        safeRosterPlayerData
      );

    const rawManagerData = safeManagers.map(
      (manager) => {
        const managerId =
          manager.manager_id ??
          manager.Manager_ID ??
          manager.id;

        const managerRoster =
          safeRosterEntries.filter(
            (entry) =>
              String(entry.manager_id) ===
              String(managerId)
          );

        const managerDraftEntries =
          safeDraftEntries.filter(
            (entry) =>
              String(entry.manager_id) ===
              String(managerId)
          );

          const managerDraftEntryByPlayerId =
  new Map(
    managerDraftEntries
      .filter(
        (entry) =>
          entry.player_id !=
          null
      )
      .map(
        (entry) => [
          String(
            entry.player_id
          ),
          entry,
        ]
      )
  );

          const latestPlayerDraftEntry =
          managerDraftEntries
            .filter((entry) => {
              const entryType =
                String(
                  entry.entry_type ?? ""
                )
                  .trim()
                  .toUpperCase();
        
              return (
                entryType === "PLAYER" &&
                entry.player_id != null
              );
            })
            .sort(
              (
                firstEntry,
                secondEntry
              ) =>
                toSafeNumber(
                  secondEntry.draft_entry_id
                ) -
                toSafeNumber(
                  firstEntry.draft_entry_id
                )
            )[0] ?? null;

        const latestDraftedPlayer =
          latestPlayerDraftEntry
            ? playerById.get(
                String(
                  latestPlayerDraftEntry.player_id
                )
              )
            : null;

        const latestPickPrice =
          latestPlayerDraftEntry
            ? toSafeNumber(
                latestPlayerDraftEntry.auction_value
              )
            : null;

        const latestPickEstimatedValue =
          latestDraftedPlayer
            ? toSafeNumber(
                latestDraftedPlayer.estimated_auction_value
              )
            : null;

        const latestPickValue =
          latestPlayerDraftEntry &&
          latestDraftedPlayer
            ? latestPickEstimatedValue -
              latestPickPrice
            : null;

        const amountSpent =
          managerDraftEntries.reduce(
            (total, entry) =>
              total +
              toSafeNumber(entry.auction_value),
            0
          );

        const rosterPlayers = managerRoster
          .map((entry) => {
            const player = playerById.get(
              String(entry.player_id)
            );

            if (!player) {
              return null;
            }

            return {
              ...player,
              drafted_as: entry.drafted_as,
            };
          })
          .filter(Boolean);

        const specialEntryTypes = new Set(
          managerDraftEntries.map((entry) =>
            String(entry.entry_type ?? "")
              .trim()
              .toUpperCase()
          )
        );

        const specialRosterCount =
          Number(specialEntryTypes.has("K")) +
          Number(specialEntryTypes.has("DEF"));

        const rosterCount =
          managerRoster.length +
          specialRosterCount;

        const availableBudget = Math.max(
          startingBudget - amountSpent,
          0
        );

        const remainingRosterSpots = Math.max(
          rosterCapacity - rosterCount,
          0
        );

        const requiredReserve = Math.max(
          remainingRosterSpots - 1,
          0
        );

        const maxBid = Math.max(
          availableBudget - requiredReserve,
          0
        );

        const rosterMakeup = createRosterMakeup({
          rosterPlayers,
          leagueSettings,
        });

        const teamStrength =
          createNormalizedTeamStrength({
            rosterPlayers,
            leagueSettings,
            playerPercentileMap:
              positionPercentileMap,
          });

        return {
          ...manager,
          manager_id: managerId,
          starting_budget: startingBudget,
          available_budget: availableBudget,
          max_bid: maxBid,
          amount_spent: amountSpent,
          roster_count: rosterCount,
          roster_capacity: rosterCapacity,
          remaining_roster_spots:
            remainingRosterSpots,
          roster_makeup: rosterMakeup,
          roster_assignments:
  rosterPlayers.map(
    (player) => {
      const playerDraftEntry =
        managerDraftEntryByPlayerId.get(
          String(
            player.player_id
          )
        );

      return {
        player_id:
          player.player_id,

        player_name:
          player.player_name ??
          "Unknown Player",

        position:
          String(
            player.position ??
              ""
          )
            .trim()
            .toUpperCase(),

        team:
          player.team ??
          "",

        drafted_as:
          player.drafted_as ??
          playerDraftEntry
            ?.draft_slot ??
          null,

        auction_value:
          playerDraftEntry
            ?.auction_value ??
          null,

        estimated_auction_value:
          toSafeNumber(
            player
              .estimated_auction_value
          ),

        projected_fantasy_points:
          toSafeNumber(
            player
              .projected_fantasy_points
          ),
      };
    }
  ),
          last_pick_player_name:
            latestDraftedPlayer?.player_name ??
            latestPlayerDraftEntry?.entry_label ??
            null,
          last_pick_price: latestPickPrice,
          last_pick_estimated_value:
            latestPickEstimatedValue,
          last_pick_value: latestPickValue,
          strength_score: teamStrength.score,
          strength_raw_score:
            teamStrength.rawAverage,
          strength_coverage:
            teamStrength.coverage,
          strength_filled_slots:
            teamStrength.countedPlayerCount,
          strength_total_slots:
            teamStrength.expectedPlayerCount,
          strength_total_projected_points:
            teamStrength.totalProjectedPoints,
          strength_position_breakdown:
            teamStrength.positionBreakdown,
          strength_counted_players:
            teamStrength.countedPlayers,
          strength_is_provisional:
            teamStrength.coverage < 1,
          status: getManagerStatus({
            availableBudget,
            remainingRosterSpots,
            rosterCount,
            rosterCapacity,
          }),
        };
      }
    );

    const rankedManagers = [
      ...rawManagerData,
    ]
      .filter(
        (manager) =>
          toSafeNumber(
            manager.strength_filled_slots
          ) > 0
      )
      .sort(
        (firstManager, secondManager) =>
          toSafeNumber(
            secondManager.strength_score
          ) -
          toSafeNumber(
            firstManager.strength_score
          )
      );

    const overallRankMap = new Map(
      rankedManagers.map((manager, index) => [
        String(manager.manager_id),
        index + 1,
      ])
    );

    const positions = ["QB", "RB", "WR", "TE"];

    const positionRankMaps =
      Object.fromEntries(
        positions.map((position) => {
          const rankedPositionManagers = [
            ...rawManagerData,
          ]
            .filter(
              (manager) =>
                toSafeNumber(
                  manager
                    .strength_position_breakdown?.[
                    position
                  ]?.playerCount
                ) > 0
            )
            .sort(
              (firstManager, secondManager) =>
                toSafeNumber(
                  secondManager
                    .strength_position_breakdown?.[
                    position
                  ]?.projectedPoints
                ) -
                toSafeNumber(
                  firstManager
                    .strength_position_breakdown?.[
                    position
                  ]?.projectedPoints
                )
            );

          return [
            position,
            {
              fieldSize:
                rankedPositionManagers.length,
              rankMap: new Map(
                rankedPositionManagers.map(
                  (manager, index) => [
                    String(manager.manager_id),
                    index + 1,
                  ]
                )
              ),
            },
          ];
        })
      );

    return rawManagerData.map(
      (manager) => {
        const managerId =
          String(
            manager.manager_id
          );

        const strengthRank =
          overallRankMap.get(
            managerId
          ) ?? null;

        const rankedPositionBreakdown =
          Object.fromEntries(
            positions.map(
              (position) => {
                const currentPositionData =
                  manager
                    .strength_position_breakdown?.[
                    position
                  ] ?? {
                    position,
                    playerCount: 0,
                    projectedPoints: 0,
                    averagePercentile: 0,
                  };

                return [
                  position,
                  {
                    ...currentPositionData,

                    rank:
                      positionRankMaps[
                        position
                      ].rankMap.get(
                        managerId
                      ) ?? null,

                    fieldSize:
                      positionRankMaps[
                        position
                      ].fieldSize,
                  },
                ];
              }
            )
          );

        const finalizedManager = {
          ...manager,

          strength_rank:
            strengthRank,

          strength_field_size:
            rankedManagers.length,

          strength_position_breakdown:
            rankedPositionBreakdown,

          strength_tier:
            getStrengthTier({
              rank:
                strengthRank,

              fieldSize:
                rankedManagers.length,

              coverage:
                manager
                  .strength_coverage,
            }),
        };

        return {
          ...finalizedManager,

          team_archetype:
            createTeamArchetype({
              manager:
                finalizedManager,

              leagueSettings,
            }),
        };
      }
    );

  }, [
    managers,
    rosterEntries,
    draftEntries,
    rosterPlayerData,
    leagueSettings,
  ]);

  /*
   * Draft-wide market intelligence.
   *
   * Tiers are created once from the complete player pool so a player's
   * tier does not change merely because another player was drafted.
   * Remaining counts are then calculated from availablePlayers.
   */
  const draftMarketData = useMemo(() => {
    const positions = [
      "QB",
      "RB",
      "WR",
      "TE",
    ];

    const safePlayerData =
      Array.isArray(rosterPlayerData)
        ? rosterPlayerData
        : [];

    const safeAvailablePlayers =
      Array.isArray(availablePlayers)
        ? availablePlayers
        : [];

    const safeDraftEntries =
      Array.isArray(draftEntries)
        ? draftEntries
        : [];

    const playerById = new Map(
      safePlayerData.map((player) => [
        String(getPlayerId(player)),
        player,
      ])
    );

    const tierModel =
      createProjectionGapTierModel(
        safePlayerData
      );

    const draftedPlayers =
      safeDraftEntries
        .filter((entry) => {
          const entryType = String(
            entry.entry_type ?? ""
          )
            .trim()
            .toUpperCase();

          return (
            entryType === "PLAYER" &&
            entry.player_id != null
          );
        })
        .map((entry) => {
          const player = playerById.get(
            String(entry.player_id)
          );

          const position = String(
            player?.position ?? ""
          )
            .trim()
            .toUpperCase();

          const tier =
            tierModel.playerTierMap.get(
              String(entry.player_id)
            ) ?? null;

          return {
            ...entry,
            player: player ?? null,
            player_name:
              player?.player_name ??
              entry.entry_label ??
              "Unknown Player",
            position,
            projected_fantasy_points:
              toSafeNumber(
                player?.projected_fantasy_points
              ),
            estimated_auction_value:
              toSafeNumber(
                player?.estimated_auction_value
              ),
            tier,
          };
        });

    const positionSpending =
      Object.fromEntries(
        positions.map((position) => {
          const purchases =
            draftedPlayers.filter(
              (entry) =>
                entry.position === position
            );

          const totalSpent =
            purchases.reduce(
              (total, entry) =>
                total +
                toSafeNumber(
                  entry.auction_value
                ),
              0
            );

          const prices = purchases
            .map((entry) =>
              toSafeNumber(
                entry.auction_value
              )
            )
            .filter((price) => price > 0);

          return [
            position,
            {
              position,
              playerCount: purchases.length,
              totalSpent,
              averagePrice:
                prices.length > 0
                  ? totalSpent /
                    prices.length
                  : 0,
              highestPrice:
                prices.length > 0
                  ? Math.max(...prices)
                  : 0,
              lowestPrice:
                prices.length > 0
                  ? Math.min(...prices)
                  : 0,
            },
          ];
        })
      );

    const availablePlayerIds = new Set(
      safeAvailablePlayers
        .map((player) =>
          getPlayerId(player)
        )
        .filter(
          (playerId) =>
            playerId != null
        )
        .map(String)
    );

    const remainingTalentByPosition =
      Object.fromEntries(
        positions.map((position) => {
          const positionTiers =
            tierModel.positionTiers[
              position
            ] ?? [];

          const tiers = positionTiers.map(
            (tier) => {
              const remainingPlayers =
                tier.players.filter(
                  (player) =>
                    availablePlayerIds.has(
                      String(
                        getPlayerId(player)
                      )
                    )
                );

              return {
                key: tier.key,
                label: tier.label,
                tierNumber:
                  tier.tierNumber,
                totalPlayers:
                  tier.players.length,
                remainingCount:
                  remainingPlayers.length,
                remainingPlayers,
              };
            }
          );

          return [
            position,
            {
              position,
              totalRemaining: tiers.reduce(
                (total, tier) =>
                  total +
                  tier.remainingCount,
                0
              ),
              tiers,
            },
          ];
        })
      );

    return {
      draftedPlayers,
      positionSpending,
      remainingTalentByPosition,
      playerTierMap:
        tierModel.playerTierMap,
      positionTiers:
        tierModel.positionTiers,
    };
  }, [
    rosterPlayerData,
    availablePlayers,
    draftEntries,
  ]);

   const recentDraftPicks =
  useMemo(() => {
    const safeDraftEntries =
      Array.isArray(draftEntries)
        ? draftEntries
        : [];

    const playerMap =
      new Map(
        rosterPlayerData.map(
          (player) => [
            String(
              player.player_id
            ),
            player,
          ]
        )
      );

    const managerMap =
      new Map(
        managers.map(
          (manager) => [
            String(
              manager.manager_id ??
                manager.Manager_ID ??
                manager.id
            ),
            manager,
          ]
        )
      );

    return safeDraftEntries
      .filter((entry) => {
        const entryType =
          String(
            entry.entry_type ?? ""
          )
            .trim()
            .toUpperCase();

        return (
          entryType === "PLAYER" &&
          entry.player_id != null
        );
      })
      .sort(
        (
          firstEntry,
          secondEntry
        ) =>
          toSafeNumber(
            secondEntry.draft_entry_id
          ) -
          toSafeNumber(
            firstEntry.draft_entry_id
          )
      )
      .slice(0, 5)
      .map((entry) => {
        const player =
          playerMap.get(
            String(
              entry.player_id
            )
          );

        const manager =
          managerMap.get(
            String(
              entry.manager_id
            )
          );

        return {
          draft_entry_id:
            entry.draft_entry_id,

          player_id:
            entry.player_id,

          player_name:
            player?.player_name ??
            entry.entry_label ??
            "Unknown Player",

          manager_id:
            entry.manager_id,

          manager_name:
            manager?.manager_name ??
            "Unknown Manager",

          position:
            player?.position ??
            "",

          team:
            player?.team ??
            "",

          cost:
            toSafeNumber(
              entry.auction_value
            ),

          drafted_at:
            entry.drafted_at ??
            null,
        };
      });
  }, [
    draftEntries,
    rosterPlayerData,
    managers,
  ]);

  const itemsWithActiveState =
    menuItems.map(
      (item) => ({
        ...item,

        active:
          item.id ===
          activeItem,

        onClick: () => {
          setActiveItem(
            item.id
          );
        },
      })
    );

    const handleRefresh =
    async () => {
      await Promise.all([
        fetchDraftControl(),
        fetchAvailablePlayers(),
        fetchManagers(),
        fetchLeagueSettings(),
        fetchManagerDraftData(),
        fetchPlayerDraftHistory(),
      ]);
    };

    const handleDraftActivated =
  async () => {
    await fetchDraftControl();
    await fetchAvailablePlayers();
    await fetchManagers();
    await fetchLeagueSettings();
    await fetchManagerDraftData();
    await fetchPlayerDraftHistory();

    setActiveItem("home");
  };
  const handleFullscreen =
    async () => {
      try {
        if (
          !document
            .fullscreenElement
        ) {
          await document
            .documentElement
            .requestFullscreen();
        } else {
          await document
            .exitFullscreen();
        }
      } catch (error) {
        console.error(
          "Unable to toggle fullscreen:",
          error
        );
      }
    };

  const handleStartDraft =
    () => {
      console.log(
        "Start Draft clicked"
      );
    };

  const handleSelectPlayer = (
    player
  ) => {
    if (!player) {
      return;
    }

    setSelectedPlayer(
      player
    );
  };

  const handleDeselectPlayer =
    () => {
      setSelectedPlayer(
        null
      );
    };

    const [
      playerCardResetKey,
      setPlayerCardResetKey,
    ] = useState(0);
    
    const [
      pendingDraftAnimation,
      setPendingDraftAnimation,
    ] = useState(null);

  const handleDraftPlayer =
    async ({
      player,
      manager,
      managerId,
      amount,
    }) => {
      const isBudgetOnly =
        player?.isBudgetOnly ===
        true;

      const budgetEntryType =
        String(
          player
            ?.budgetEntryType ??
            ""
        )
          .trim()
          .toUpperCase();

      const playerId =
        isBudgetOnly
          ? null
          : getPlayerId(
              player
            );

      const resolvedManagerId =
        managerId ??
        manager?.manager_id ??
        manager?.Manager_ID ??
        manager?.id;

      const playerPosition =
        String(
          player?.position ??
            ""
        )
          .trim()
          .toUpperCase();

      const auctionValue =
        Number(amount);

      if (
        !isBudgetOnly &&
        !playerId
      ) {
        throw new Error(
          "The selected player has no player ID."
        );
      }

      if (
        isBudgetOnly &&
        ![
          "K",
          "DEF",
        ].includes(
          budgetEntryType
        )
      ) {
        throw new Error(
          "Invalid budget-only draft selection."
        );
      }

      if (
        !resolvedManagerId
      ) {
        throw new Error(
          "The selected manager has no manager ID."
        );
      }

      if (
        !playerPosition
      ) {
        throw new Error(
          "The selected player has no position."
        );
      }

      if (
        !Number.isInteger(
          auctionValue
        ) ||
        auctionValue < 1
      ) {
        throw new Error(
          "Enter a whole-dollar auction value of at least $1."
        );
      }

      if (!leagueSettings) {
        throw new Error(
          "League settings have not loaded."
        );
      }

      /*
       * Always validate against fresh database values immediately
       * before assigning the draft pick. This prevents stale manager-card
       * totals from allowing an illegal bid.
       */
      const budgetValidation =
        await validateManagerDraftBudget({
          managerId:
            resolvedManagerId,

          auctionValue,

          leagueSettings,
        });

      if (isBudgetOnly) {
        const entryLabel =
          budgetEntryType ===
          "K"
            ? "Kicker"
            : "Team Defense";

        const draftSlot =
          `${budgetEntryType}1`;

        const {
          data:
            specialDraftEntry,
          error:
            specialDraftError,
        } = await supabase
          .from("draft_entries")
          .insert({
            player_id:
              null,

            manager_id:
              Number(
                resolvedManagerId
              ),

            auction_value:
              auctionValue,

            draft_slot:
              draftSlot,

            entry_type:
              budgetEntryType,

            entry_label:
              entryLabel,
          })
          .select()
          .single();

        if (
          specialDraftError
        ) {
          if (
            specialDraftError
              .code ===
            "42501"
          ) {
            throw new Error(
              "Your current Supabase user is not authorized to submit draft entries."
            );
          }

          if (
            specialDraftError
              .code ===
            "23505"
          ) {
            throw new Error(
              `${entryLabel} has already been purchased for this manager.`
            );
          }

          throw specialDraftError;
        }

        await fetchManagerDraftData();

        setSelectedPlayer(
          null
        );

        return {
          draftEntry:
            specialDraftEntry,

          rosterEntry:
            null,

          draftSlot,

          budgetOnly:
            true,

          entryType:
            budgetEntryType,
        };
      }

      const draftSlot =
        findNextDraftSlot({
          position:
            playerPosition,

          roster:
            budgetValidation.roster,

          leagueSettings,
        });

      const {
        data:
          draftEntry,
        error:
          draftError,
      } = await supabase
        .from("draft_entries")
        .insert({
          player_id:
            Number(
              playerId
            ),

          manager_id:
            Number(
              resolvedManagerId
            ),

          auction_value:
            auctionValue,

          draft_slot:
            draftSlot,

          entry_type:
            "PLAYER",

          entry_label:
            player?.player_name ??
            player?.Player_Name ??
            player?.name ??
            null,
        })
        .select()
        .single();

      if (draftError) {
        if (
          draftError.code ===
          "42501"
        ) {
          throw new Error(
            "Your current Supabase user is not authorized to submit draft entries."
          );
        }

        if (
          draftError.code ===
          "23505"
        ) {
          throw new Error(
            "This player has already been drafted."
          );
        }

        throw draftError;
      }

      const {
        data:
          rosterEntry,
        error:
          rosterInsertError,
      } = await supabase
        .from("Live_Rosters")
        .insert({
          player_id:
            Number(
              playerId
            ),

          manager_id:
            Number(
              resolvedManagerId
            ),

          keeper_status:
            false,

          is_drafted:
            true,

          drafted_as:
            draftSlot,
        })
        .select()
        .single();

      if (
        rosterInsertError
      ) {
        await supabase
          .from("draft_entries")
          .delete()
          .eq(
            "draft_entry_id",
            draftEntry
              .draft_entry_id
          );

        throw rosterInsertError;
      }

      setAvailablePlayers(
        (
          currentPlayers
        ) =>
          currentPlayers.filter(
            (
              availablePlayer
            ) =>
              String(
                getPlayerId(
                  availablePlayer
                )
              ) !==
              String(
                playerId
              )
          )
      );
      
      await fetchManagerDraftData();
      
      return {
        draftEntry,
        rosterEntry,
        draftSlot,
        budgetOnly:
          false,
        entryType:
          "PLAYER",
      };
    };

    if (
  !BYPASS_AUTH_AND_KEEPERS &&
  (
    authLoading ||
    adminCheckLoading ||
    (
      authSession &&
      isLeagueAdmin &&
      draftControlLoading
    )
  )
) {
      return (
        <div className="auth-loading-screen">
          <div className="auth-loading-screen__spinner" />
    
          <strong>
            Loading Draft Room
          </strong>
    
          <span>
            Verifying the current draft phase...
          </span>
        </div>
      );
    }
    
    if (
      authSession &&
      isLeagueAdmin &&
      draftControlError
    ) {
      return (
        <div className="unauthorized-screen">
          <section className="unauthorized-screen__card">
            <span>
              Draft Setup Error
            </span>
    
            <h1>
              Unable to Load Draft Status
            </h1>
    
            <p>
              {draftControlError}
            </p>
    
            <button
              type="button"
              onClick={
                fetchDraftControl
              }
            >
              Try Again
            </button>
          </section>
        </div>
      );
    }

    if (
      !authSession ||
      !authUser
    ) {
      return (
        <LoginModal
          authError={
            authError
          }
        />
      );
    }
    
    if (!effectiveIsLeagueAdmin) {
      return (
        <div className="unauthorized-screen">
          <section className="unauthorized-screen__card">
            <span>
              Access Denied
            </span>
    
            <h1>
              Administrator Required
            </h1>
    
            <p>
              The account{" "}
              <strong>
                {authUser.email}
              </strong>{" "}
              is signed in, but it is not
              listed as a league administrator.
            </p>
    
            <button
              type="button"
              onClick={
                handleSignOut
              }
            >
              Sign Out
            </button>
          </section>
        </div>
      );
    }

    

    if (
      effectiveDraftPhase ===
      "keeper_setup"
    ) {
      return (
        <KeeperSetupPage
          season={currentSeason}
          keeperIncrease={
            toSafeNumber(
              draftControl
                ?.keeper_cost_increase
            )
          }
          onDraftActivated={
            handleDraftActivated
          }
          onSignOut={
            handleSignOut
          }
        />
      );
    }

    const handleDraftModalClosed =
    async () => {
      if (
        !pendingDraftAnimation
      ) {
        return;
      }
  
      /*
       * First force the actual card
       * back to its front face.
       */
      setPlayerCardResetKey(
        (currentKey) =>
          currentKey + 1
      );
  
      /*
       * Give React one rendered frame
       * to remove the flipped class
       * before cloning the card.
       */
      await new Promise(
        (resolve) => {
          requestAnimationFrame(
            () => {
              requestAnimationFrame(
                resolve
              );
            }
          );
        }
      );
  
      /*
       * Modal is gone and the source
       * card is now showing its front.
       */
      
  
      setPendingDraftAnimation(
        null
      );
  
      
    };

    
  return (
    <main className="new-main">
      <DraftTicker
  recentDraftPicks={
    recentDraftPicks
  }
  maxPicks={6}
  useDummyData={false}
  defaultMessage="WELCOME TO THE PROMISE LANDS FANTASY FOOTBALL DRAFT"
 />

      <section
        className="dashboard-toolbar"
        aria-label="Dashboard controls"
      >
        <div
          className="dashboard-toolbar__left"
          aria-hidden="true"
        />

        <div className="dashboard-toolbar__center">
          <ExpandableMenu
            items={
              itemsWithActiveState
            }
            variant="dark"
            orientation="horizontal"
            size="small"
            ariaLabel="Dashboard navigation"
          />
        </div>

        <div className="dashboard-toolbar__right">
        <SpecularButton
  size="sm"
  variant="neutral"
  onClick={
    handleSignOut
  }
>
  Sign Out
</SpecularButton>
          <SpecularButton
            size="sm"
            variant="neutral"
            onClick={
              handleFullscreen
            }
          >
            {isFullscreen
              ? "Exit Fullscreen"
              : "Fullscreen"}
          </SpecularButton>

          <SpecularButton
            size="sm"
            variant="neutral"
            onClick={
              handleRefresh
            }
          >
            Refresh
          </SpecularButton>

          <SpecularButton
            size="sm"
            variant="primary"
            onClick={
              handleStartDraft
            }
          >
            Start Draft
          </SpecularButton>
        </div>
      </section>

      
      {activeItem === "home" && (
        <section className="dashboard-layout">
          <aside
            className="
              dashboard-column
              dashboard-column--left
            "
            aria-labelledby="manager-rosters-title"
          >
            <div className="dashboard-section-header">
            </div>

            <div className="manager-grid">
              {managerCardData.map(
                (
                  manager,
                  index
                ) => {
                  /*
                   * Two cards per row:
                   *
                   * index 0–1 = first row
                   * index 2–3 = second row
                   * index 4–5 = third row
                   * index 6–7 = fourth row
                   * index 8–9 = fifth row
                   *
                   * Cards near the bottom open upward.
                   * Cards near the top open downward.
                   */
                  const tooltipPlacement =
                    index > 3
                      ? "above"
                      : "below";

                  return (
                    <ManagerCard
                      key={
                        manager.manager_id
                      }
                      manager={
                        manager
                      }
                      tooltipPlacement={
                        tooltipPlacement
                      }
                      isSelected={
                        String(
                          selectedManagerId
                        ) ===
                        String(
                          manager.manager_id
                        )
                      }
                      isTooltipOpen={
                        String(
                          activeManagerTooltipId
                        ) ===
                        String(
                          manager.manager_id
                        )
                      }
                      onTooltipOpen={() => {
                        setActiveManagerTooltipId(
                          manager.manager_id
                        );
                      }}
                      onTooltipClose={() => {
                        setActiveManagerTooltipId(
                          (
                            currentTooltipId
                          ) =>
                            String(
                              currentTooltipId
                            ) ===
                            String(
                              manager.manager_id
                            )
                              ? null
                              : currentTooltipId
                        );
                      }}
                      onClick={
                        setSelectedManagerId
                      }
                    />
                  );
                }
              )}
            </div>
          </aside>

          <section
            className="
              dashboard-column
              dashboard-column--middle
            "
          >
            {leagueSettingsLoading &&
              !leagueSettings && (
                <div className="dashboard-data-message">
                  Loading league
                  settings...
                </div>
              )}

            {leagueSettingsError && (
              <div
                className="
                  dashboard-data-message
                  dashboard-data-message--error
                "
              >
                <strong>
                  Unable to load league
                  settings
                </strong>

                <p>
                  {
                    leagueSettingsError
                  }
                </p>
              </div>
            )}

            <PlayerSelectPanel
              player={
                selectedPlayer
              }
              playerCardResetKey={
                playerCardResetKey
              }
              onDraftModalClosed={
                handleDraftModalClosed
              }
              players={
                availablePlayers
              }
              allPlayers={
                rosterPlayerData
              }
              draftEntries={
                draftEntries
              }
              playerDraftHistory={
                playerDraftHistory
              }
              marketData={
                draftMarketData
              }
              specialPlayers={
                specialDraftSelections
              }
              managers={
                managerCardData
              }
              selectedManagerId={
                selectedManagerId
              }
              onSelectPlayer={
                handleSelectPlayer
              }
              onDeselectPlayer={
                handleDeselectPlayer
              }
              onDraftPlayer={
                handleDraftPlayer
              }
            />
          </section>

          <aside
            className="
              dashboard-column
              dashboard-column--right
            "
          >
            {playersLoading ? (
              <div className="dashboard-data-message">
                Loading players...
              </div>
            ) : playersError ? (
              <div
                className="
                  dashboard-data-message
                  dashboard-data-message--error
                "
              >
                <strong>
                  Unable to load
                  players
                </strong>

                <p>
                  {playersError}
                </p>
              </div>
            ) : (
              <AvailablePlayersPanel
                players={
                  availablePlayers
                }
                onSelectPlayer={
                  handleSelectPlayer
                }
              />
            )}
          </aside>
        </section>
      )}

{activeItem === "rosters" && (
  <section
    className="rosters-tab"
    aria-label="League rosters"
  >
    <div className="rosters-tab__body">
      {leagueSettingsLoading &&
      !leagueSettings ? (
        <div className="dashboard-data-message">
          Loading rosters...
        </div>
      ) : leagueSettingsError ? (
        <div
          className="
            dashboard-data-message
            dashboard-data-message--error
          "
        >
          <strong>
            Unable to load rosters
          </strong>

          <p>{leagueSettingsError}</p>
        </div>
      ) : (
        <RosterPanel
          managers={managerCardData}
          draftEntries={draftEntries}
          leagueSettings={leagueSettings}
        />
      )}
    </div>
  </section>
)}

{activeItem === "data" && (
  <DataDashboard />
)}



{activeItem === "settings" && (
  <DraftSettingsTab />
)}
    </main>
  );
};



function toSafeNumber(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
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



function getTotalRosterCapacity(
  leagueSettings
) {
  if (!leagueSettings) {
    return 0;
  }

  return (
    toSafeNumber(
      leagueSettings
        .starters?.qb
    ) +
    toSafeNumber(
      leagueSettings
        .starters?.rb
    ) +
    toSafeNumber(
      leagueSettings
        .starters?.wr
    ) +
    toSafeNumber(
      leagueSettings
        .starters?.te
    ) +
    toSafeNumber(
      leagueSettings
        .starters?.abn
    ) +
    toSafeNumber(
      leagueSettings
        .starters?.sbn
    ) +
    4
  );
}

function createRosterMakeup({
  rosterPlayers,
  leagueSettings,
}) {
  const positions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  const positionCounts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  };

  let activeBenchFilled = 0;

  rosterPlayers.forEach(
    (player) => {
      const position =
        String(
          player.position ??
            ""
        )
          .trim()
          .toUpperCase();

      const draftedSlot =
        String(
          player.drafted_as ??
            ""
        )
          .trim()
          .toUpperCase();

      if (
        Object.hasOwn(
          positionCounts,
          position
        )
      ) {
        positionCounts[
          position
        ] += 1;
      }

      if (
        draftedSlot.startsWith(
          "ABN"
        )
      ) {
        activeBenchFilled +=
          1;
      }
    }
  );

  const activeBenchLimit =
    toSafeNumber(
      leagueSettings
        ?.starters?.abn
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

  const positionLimits = {
    QB:
      toSafeNumber(
        leagueSettings
          ?.maximums?.qb
      ),

    RB:
      toSafeNumber(
        leagueSettings
          ?.maximums?.rb
      ),

    WR:
      toSafeNumber(
        leagueSettings
          ?.maximums?.wr
      ),

    TE:
      toSafeNumber(
        leagueSettings
          ?.maximums?.te
      ),
  };

  return positions.map(
    (position) => {
      const count =
        positionCounts[
          position
        ];

      const required =
        starterRequirements[
          position
        ];

      const limit =
        positionLimits[
          position
        ];

      let auctionStatus =
        "required";

      /*
       * Green:
       * Required auction starters
       * have not been filled.
       */
      if (
        count < required
      ) {
        auctionStatus =
          "required";
      }

      /*
       * Red:
       * Position is at its total limit,
       * or all active bench slots are full.
       */
      else if (
        (
          limit > 0 &&
          count >= limit
        ) ||
        (
          activeBenchLimit >
            0 &&
          activeBenchFilled >=
            activeBenchLimit
        )
      ) {
        auctionStatus =
          "closed";
      }

      /*
       * Yellow:
       * Required starters are filled,
       * but active bench space remains.
       */
      else {
        auctionStatus =
          "optional";
      }

      return {
        position,
        count,
        required,
        limit,

        auctionStatus,

        activeBenchFilled,
        activeBenchLimit,
      };
    }
  );
}

function createPositionPercentileMap(
  players
) {
  const validPositions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  const percentileMap =
    new Map();

  validPositions.forEach(
    (position) => {
      const positionPlayers =
        players
          .filter(
            (player) =>
              String(
                player.position ??
                  ""
              )
                .trim()
                .toUpperCase() ===
              position
          )
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              toSafeNumber(
                secondPlayer
                  .projected_fantasy_points
              ) -
              toSafeNumber(
                firstPlayer
                  .projected_fantasy_points
              )
          );

      const playerCount =
        positionPlayers.length;

      positionPlayers.forEach(
        (
          player,
          index
        ) => {
          /*
           * Best player = 100.
           *
           * Worst player approaches zero.
           */
          const percentile =
            playerCount <= 1
              ? 100
              : 100 -
                (
                  index /
                  (
                    playerCount -
                    1
                  )
                ) *
                  100;

          percentileMap.set(
            String(
              player.player_id
            ),
            percentile
          );
        }
      );
    }
  );

  return percentileMap;
}

function createNormalizedTeamStrength({
  rosterPlayers,
  leagueSettings,
  playerPercentileMap,
  
}) {
  const positions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

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

  const activeBenchLimit =
    toSafeNumber(
      leagueSettings
        ?.starters?.abn
    );

    const eligiblePlayers =
    rosterPlayers
      .filter((player) => {
        const position =
          String(
            player.position ??
              ""
          )
            .trim()
            .toUpperCase();
  
        return positions.includes(
          position
        );
      })
      .map((player) => {
        const position =
          String(
            player.position ??
              ""
          )
            .trim()
            .toUpperCase();
  
        const playerId =
          player.player_id;
  
        const projectedPoints =
          toSafeNumber(
            player.projected_fantasy_points
          );
  
        const percentile =
          toSafeNumber(
            playerPercentileMap?.get(
              String(
                playerId
              )
            )
          );
  
        return {
          ...player,
  
          position,
          projectedPoints,
          percentile,
        };
      });

  const countedPlayers = [];
  const remainingPlayers = [
    ...eligiblePlayers,
  ];

  /*
   * Fill required starters first.
   */
  positions.forEach(
    (position) => {
      const required =
        starterRequirements[
          position
        ];

      const positionPlayers =
        remainingPlayers
          .filter(
            (player) =>
              player.position ===
              position
          )
          .sort(
            (playerA, playerB) =>
              playerB.percentile -
              playerA.percentile
          );

      const selectedStarters =
        positionPlayers.slice(
          0,
          required
        );

      selectedStarters.forEach(
        (player) => {
          countedPlayers.push({
            ...player,
            strengthSlot:
              "starter",
          });

          const playerIndex =
            remainingPlayers.findIndex(
              (
                remainingPlayer
              ) =>
                remainingPlayer.player_id ===
                player.player_id
            );

          if (
            playerIndex !== -1
          ) {
            remainingPlayers.splice(
              playerIndex,
              1
            );
          }
        }
      );
    }
  );

  /*
   * Fill ABN with the best remaining
   * normalized players, regardless
   * of position.
   */
  const activeBenchPlayers =
    remainingPlayers
      .sort(
        (playerA, playerB) =>
          playerB.percentile -
          playerA.percentile
      )
      .slice(
        0,
        activeBenchLimit
      );

  activeBenchPlayers.forEach(
    (player) => {
      countedPlayers.push({
        ...player,
        strengthSlot: "ABN",
      });
    }
  );

  const expectedPlayerCount =
    Object.values(
      starterRequirements
    ).reduce(
      (total, count) =>
        total + count,
      0
    ) +
    activeBenchLimit;

  const countedPlayerCount =
    countedPlayers.length;

  const coverage =
    expectedPlayerCount > 0
      ? countedPlayerCount /
        expectedPlayerCount
      : 0;

  const percentileTotal =
    countedPlayers.reduce(
      (total, player) =>
        total +
        player.percentile,
      0
    );

  const rawAverage =
    countedPlayerCount > 0
      ? percentileTotal /
        countedPlayerCount
      : 0;

  const strengthScore =
    rawAverage *
    (
      0.7 +
      coverage * 0.3
    );

  const totalProjectedPoints =
    countedPlayers.reduce(
      (total, player) =>
        total +
        player.projectedPoints,
      0
    );

  const positionBreakdown =
    Object.fromEntries(
      positions.map(
        (position) => {
          const players =
            countedPlayers.filter(
              (player) =>
                player.position ===
                position
            );

          const projectedPoints =
            players.reduce(
              (
                total,
                player
              ) =>
                total +
                player.projectedPoints,
              0
            );

          const averagePercentile =
            players.length > 0
              ? players.reduce(
                  (
                    total,
                    player
                  ) =>
                    total +
                    player.percentile,
                  0
                ) /
                players.length
              : 0;

          return [
            position,
            {
              position,
              playerCount:
                players.length,
              projectedPoints,
              averagePercentile,
              rank: null,
            },
          ];
        }
      )
    );

  return {
    score:
      strengthScore,

    rawAverage,

    coverage,

    totalProjectedPoints,

    countedPlayerCount,

    expectedPlayerCount,

    countedPlayers,

    positionBreakdown,
  };
}

function addStrengthRankings(
  managers
) {
  const positions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  const rankedManagers =
    managers.map(
      (manager) => ({
        ...manager,

        strength: {
          ...manager.strength,

          positionBreakdown:
            Object.fromEntries(
              positions.map(
                (position) => [
                  position,
                  {
                    ...manager
                      .strength
                      .positionBreakdown[
                      position
                    ],
                  },
                ]
              )
            ),
        },
      })
    );

  /*
   * Overall strength ranking.
   */
  [...rankedManagers]
    .sort(
      (managerA, managerB) =>
        managerB.strength
          .score -
        managerA.strength
          .score
    )
    .forEach(
      (manager, index) => {
        manager.strength.rank =
          index + 1;
      }
    );

  /*
   * Positional rankings.
   */
  positions.forEach(
    (position) => {
      [...rankedManagers]
        .sort(
          (
            managerA,
            managerB
          ) =>
            managerB.strength
              .positionBreakdown[
              position
            ].projectedPoints -
            managerA.strength
              .positionBreakdown[
              position
            ].projectedPoints
        )
        .forEach(
          (
            manager,
            index
          ) => {
            manager.strength
              .positionBreakdown[
              position
            ].rank =
              index + 1;
          }
        );
    }
  );

  return rankedManagers;
}



function createPositionStrength({
  rosterPlayers,
  leagueSettings,
}) {
  const positions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  return Object.fromEntries(
    positions.map(
      (position) => {
        const positionPlayers =
          rosterPlayers.filter(
            (player) =>
              String(
                player.position ??
                  ""
              )
                .trim()
                .toUpperCase() ===
              position
          );

        const points =
          positionPlayers.reduce(
            (
              total,
              player
            ) =>
              total +
              toSafeNumber(
                player
                  .projected_fantasy_points
              ),
            0
          );

        const required =
          toSafeNumber(
            leagueSettings
              ?.starters?.[
                position.toLowerCase()
              ]
          );

        return [
          position,
          {
            count:
              positionPlayers.length,

            required,

            points,

            average:
              positionPlayers.length >
              0
                ? points /
                  positionPlayers.length
                : 0,

            isComplete:
              required > 0 &&
              positionPlayers.length >=
                required,
          },
        ];
      }
    )
  );
}

function getManagerStatus({
  availableBudget,
  remainingRosterSpots,
  rosterCount,
  rosterCapacity,
}) {
  if (
    rosterCapacity > 0 &&
    rosterCount >=
      rosterCapacity
  ) {
    return "inactive";
  }

  if (
    availableBudget <
    remainingRosterSpots
  ) {
    return "warning";
  }

  return "active";
}

function getStrengthTier({
  rank,
  fieldSize,
  coverage,
}) {
  if (
    !rank ||
    fieldSize <= 0 ||
    coverage <= 0
  ) {
    return "unranked";
  }

  if (coverage < 0.5) {
    return "provisional";
  }

  const rankPercent =
    rank / fieldSize;

  if (
    rankPercent <= 0.25
  ) {
    return "elite";
  }

  if (
    rankPercent <= 0.5
  ) {
    return "strong";
  }

  if (
    rankPercent <= 0.75
  ) {
    return "average";
  }

  return "developing";
}

async function validateManagerDraftBudget({
  managerId,
  auctionValue,
  leagueSettings,
}) {
  const startingBudget =
    toSafeNumber(
      leagueSettings
        ?.startingBudget
    );

  const rosterCapacity =
    getTotalRosterCapacity(
      leagueSettings
    );

  if (
    startingBudget <= 0
  ) {
    throw new Error(
      "The league starting budget is invalid."
    );
  }

  if (
    rosterCapacity <= 0
  ) {
    throw new Error(
      "The league roster capacity is invalid."
    );
  }

  const [
    rosterResult,
    draftResult,
  ] = await Promise.all([
    supabase
      .from("Live_Rosters")
      .select(`
        id,
        player_id,
        manager_id,
        drafted_as
      `)
      .eq(
        "manager_id",
        managerId
      ),

    supabase
      .from("draft_entries")
      .select(`
        draft_entry_id,
        player_id,
        manager_id,
        auction_value,
        entry_type
      `)
      .eq(
        "manager_id",
        managerId
      ),
  ]);

  if (rosterResult.error) {
    throw rosterResult.error;
  }

  if (draftResult.error) {
    throw draftResult.error;
  }

  const roster =
    rosterResult.data ?? [];

  const managerDraftEntries =
    draftResult.data ?? [];

  const amountSpent =
    managerDraftEntries.reduce(
      (total, entry) =>
        total +
        toSafeNumber(
          entry.auction_value
        ),
      0
    );

  const specialEntryTypes =
    new Set(
      managerDraftEntries
        .map((entry) =>
          String(
            entry.entry_type ?? ""
          )
            .trim()
            .toUpperCase()
        )
        .filter((entryType) =>
          [
            "K",
            "DEF",
          ].includes(
            entryType
          )
        )
    );

  const specialRosterCount =
    Number(
      specialEntryTypes.has(
        "K"
      )
    ) +
    Number(
      specialEntryTypes.has(
        "DEF"
      )
    );

  const rosterCount =
    roster.length +
    specialRosterCount;

  const remainingRosterSpots =
    Math.max(
      rosterCapacity -
        rosterCount,
      0
    );

  const availableBudget =
    startingBudget -
    amountSpent;

  const requiredReserve =
    Math.max(
      remainingRosterSpots -
        1,
      0
    );

  const maxBid =
    availableBudget -
    requiredReserve;

  if (
    remainingRosterSpots <= 0
  ) {
    throw new Error(
      "This manager's roster is already full."
    );
  }

  if (
    availableBudget < 0
  ) {
    throw new Error(
      "This manager's budget is already below zero. The draft cannot continue until the data is corrected."
    );
  }

  if (
    auctionValue >
    availableBudget
  ) {
    throw new Error(
      `Draft assignment failed: this manager has only $${availableBudget} available.`
    );
  }

  if (
    auctionValue >
    maxBid
  ) {
    throw new Error(
      `Draft assignment failed: the current maximum bid is $${maxBid}. $${requiredReserve} must remain for ${remainingRosterSpots - 1} remaining roster spot${remainingRosterSpots - 1 === 1 ? "" : "s"}.`
    );
  }

  return {
    roster,
    managerDraftEntries,
    startingBudget,
    amountSpent,
    availableBudget,
    rosterCapacity,
    rosterCount,
    remainingRosterSpots,
    requiredReserve,
    maxBid,
  };
}


function findNextDraftSlot({
  position,
  roster,
  leagueSettings,
}) {
  const normalizedPosition =
    String(position)
      .trim()
      .toUpperCase();

  const validPositions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  if (
    !validPositions.includes(
      normalizedPosition
    )
  ) {
    throw new Error(
      `Unsupported position: ${normalizedPosition}`
    );
  }

  const occupiedSlots =
    roster
      .map(
        (entry) =>
          entry.drafted_as
      )
      .filter(Boolean)
      .map((slot) =>
        String(slot)
          .trim()
          .toUpperCase()
      );

  const countSlotGroup = (
    slotGroup
  ) =>
    occupiedSlots.filter(
      (slot) =>
        slot.replace(
          /\d+$/,
          ""
        ) === slotGroup
    ).length;

  const nextAvailableSlot = (
    slotGroup,
    capacity
  ) => {
    const limit =
      toSafeNumber(
        capacity
      );

    const used =
      countSlotGroup(
        slotGroup
      );

    if (
      limit <= 0 ||
      used >= limit
    ) {
      return null;
    }

    return `${slotGroup}${
      used + 1
    }`;
  };

  const starterLimits = {
    QB:
      leagueSettings
        .starters?.qb ?? 0,

    RB:
      leagueSettings
        .starters?.rb ?? 0,

    WR:
      leagueSettings
        .starters?.wr ?? 0,

    TE:
      leagueSettings
        .starters?.te ?? 0,
  };

  const naturalSlot =
    nextAvailableSlot(
      normalizedPosition,
      starterLimits[
        normalizedPosition
      ]
    );

  if (naturalSlot) {
    return naturalSlot;
  }

  const activeBenchSlot =
    nextAvailableSlot(
      "ABN",
      leagueSettings
        .starters?.abn
    );

  if (activeBenchSlot) {
    return activeBenchSlot;
  }

  const secondaryBenchSlot =
    nextAvailableSlot(
      "SBN",
      leagueSettings
        .starters?.sbn
    );

  if (
    secondaryBenchSlot
  ) {
    return secondaryBenchSlot;
  }

  throw new Error(
    "This manager's roster is full."
  );
}

export default NewMain;