import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  createHistoricalDraftArchetype,
} from "./TeamArchetypes";

import { supabase } from "./supabaseClient";
import "./DataDashboard.css";

const TABS = [
  ["players", "Players", "Draft History"],
  ["economy", "Economy", "League Spending"],
  ["managers", "Manager Analytics", "Manager Performance"],
  ["history", "League History", "Records & Legacy"],
  ["archetypes", "Archetypes", "Roster Construction"],
];

const POSITIONS = [
  ["QB", "spending_qb", "Spending QB", "career_qb_spending_percentage"],
  ["RB", "spending_rb", "Spending RB", "career_rb_spending_percentage"],
  ["WR", "spending_wr", "Spending WR", "career_wr_spending_percentage"],
  ["TE", "spending_te", "Spending TE", "career_te_spending_percentage"],
  ["ABN", "spending_abn", "Spending ABN", "career_abn_spending_percentage"],
];

const POSITION_COLORS = {
  QB: "#a78bfa",
  RB: "#22c55e",
  WR: "#38bdf8",
  TE: "#f59e0b",
  ABN: "#94a3b8",
};

const LEGACY_PARTS = [
  ["season_success_rating", "Season Success", "#38bdf8"],
  ["championship_rating", "Championship", "#facc15"],
  ["drafting_rating", "Drafting", "#22c55e"],
  ["team_building_rating", "Team Building", "#a78bfa"],
  ["historical_achievement_rating", "Historical", "#f97316"],
];

const TOOLTIP_STYLE = {
  background: "rgba(7, 12, 22, 0.98)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: 8,
  color: "#f8fafc",
  fontSize: "0.68rem",
};

export default function DataDashboard() {
  const [activeTab, setActiveTab] = useState("players");
  const [draftHistory, setDraftHistory] = useState([]);
  const [economyRows, setEconomyRows] = useState([]);
  const [managerSeasons, setManagerSeasons] = useState([]);
  const [leagueHistory, setLeagueHistory] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      const [draft, economy, seasons, history] = await Promise.all([
        supabase.from("Draft_History").select("*"),
        supabase.from("yearly_economical_breakdown").select("*").order("Year"),
        supabase.from("analytics_manager_seasons").select("*").order("season"),
        supabase
          .from("analytics_league_history")
          .select("*")
          .order("legacy_score", { ascending: false, nullsFirst: false }),
      ]);

      const firstError = [draft, economy, seasons, history].find((item) => item.error)?.error;

      if (!mounted) return;

      if (firstError) {
        setError(firstError.message || "Unable to load analytics data.");
        setLoading(false);
        return;
      }

      setDraftHistory(draft.data ?? []);
      setEconomyRows(economy.data ?? []);
      setManagerSeasons(seasons.data ?? []);
      setLeagueHistory(history.data ?? []);
      setSelectedManagerId((current) => current || String(history.data?.[0]?.manager_id ?? ""));
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const managerOptions = useMemo(
    () =>
      leagueHistory.map((manager) => ({
        manager_id: manager.manager_id,
        manager_name: manager.manager_name,
      })),
    [leagueHistory]
  );

  const selectedManager = useMemo(
    () =>
      leagueHistory.find(
        (manager) => String(manager.manager_id) === String(selectedManagerId)
      ) ?? null,
    [leagueHistory, selectedManagerId]
  );

  const selectedSeasons = useMemo(
    () =>
      managerSeasons.filter(
        (season) => String(season.manager_id) === String(selectedManagerId)
      ),
    [managerSeasons, selectedManagerId]
  );

  const tab = TABS.find(([id]) => id === activeTab) ?? TABS[0];

  return (
    <main className="data-dashboard">
      <aside className="data-dashboard__sidebar">
        <div className="data-dashboard__brand">
          <span>League Intelligence</span>
          <h1>Data Center</h1>
        </div>

        <nav className="data-dashboard__nav" aria-label="Analytics navigation">
          {TABS.map(([id, label, eyebrow]) => (
            <button
              key={id}
              type="button"
              className={`data-dashboard__nav-button ${
                activeTab === id ? "data-dashboard__nav-button--active" : ""
              }`}
              onClick={() => setActiveTab(id)}
            >
              <i />
              <span>
                <small>{eyebrow}</small>
                <strong>{label}</strong>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="data-dashboard__workspace">
        <header className="data-dashboard__header">
          <div>
            <span>{tab[2]}</span>
            <h2>{tab[1]}</h2>
          </div>

          {activeTab === "managers" && (
            <label className="manager-selector">
              <span>Manager</span>
              <select
                value={selectedManagerId}
                onChange={(event) => setSelectedManagerId(event.target.value)}
              >
                {managerOptions.map((manager) => (
                  <option key={manager.manager_id} value={manager.manager_id}>
                    {manager.manager_name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </header>

        <div className="data-dashboard__content">
          {loading ? (
            <DashboardState title="Loading analytics" message="Gathering league data." />
          ) : error ? (
            <DashboardState title="Dashboard unavailable" message={error} error />
          ) : (
            <>
              {activeTab === "players" && <PlayersTab rows={draftHistory} />}
              {activeTab === "economy" && (
                <EconomyTab rows={economyRows} managers={managerOptions} />
              )}
              {activeTab === "managers" && (
                <ManagerTab manager={selectedManager} seasons={selectedSeasons} />
              )}
              {activeTab === "history" && <HistoryTab rows={leagueHistory} />}
              {activeTab === "archetypes" && (
  <ArchetypesTab
    managers={managerOptions}
    seasons={managerSeasons}
    draftHistory={draftHistory}
  />
)}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PlayersTab({ rows }) {
  const bestValues = useMemo(
    () =>
      [...rows]
        .filter((row) => nullableNumber(valueOf(row, "SV$", "SV", "surplus_value")) !== null)
        .sort(
          (a, b) =>
            number(valueOf(b, "SV$", "SV", "surplus_value")) -
            number(valueOf(a, "SV$", "SV", "surplus_value"))
        )
        .slice(0, 7)
        .map((row) => ({
          label: playerLabel(row),
          value: number(valueOf(row, "SV$", "SV", "surplus_value")),
        })),
    [rows]
  );

  const expensive = useMemo(
    () =>
      [...rows]
        .sort((a, b) => draftCost(b) - draftCost(a))
        .slice(0, 7)
        .map((row) => ({ label: playerLabel(row), cost: draftCost(row) })),
    [rows]
  );

  const keeperData = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const year = number(valueOf(row, "Year", "year"));
      if (!year) return;
      if (!map.has(year)) map.set(year, { year, keepers: 0 });
      if (isKeeper(row)) map.get(year).keepers += 1;
    });
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [rows]);

  const totalKeepers = keeperData.reduce((sum, row) => sum + row.keepers, 0);

  return (
    <div className="data-tab data-tab--players">
      <SummaryGrid>
        <Metric label="Draft Entries" value={integer(rows.length)} detail="Historical selections" />
        <Metric
          label="Best Recorded SV$"
          value={bestValues[0] ? signedCurrency(bestValues[0].value) : "No Data"}
          detail={bestValues[0]?.label ?? "No recorded value"}
        />
        <Metric
          label="Highest Purchase"
          value={expensive[0] ? currency(expensive[0].cost) : "No Data"}
          detail={expensive[0]?.label ?? "No recorded purchase"}
        />
        <Metric label="Total Keepers" value={integer(totalKeepers)} detail="Across all seasons" />
      </SummaryGrid>

      <div className="players-chart-grid">
        <Panel title="Greatest Draft Values" subtitle="Highest recorded surplus values">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bestValues} layout="vertical" margin={{ left: 8, right: 18 }}>
              <CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={118}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#cbd5e1", fontSize: 9 }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => signedCurrency(value)} />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Most Expensive Players" subtitle="Highest recorded auction prices">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expensive} layout="vertical" margin={{ left: 8, right: 18 }}>
              <CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={118}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#cbd5e1", fontSize: 9 }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => currency(value)} />
              <Bar dataKey="cost" fill="#38bdf8" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel className="players-keeper-panel" title="Keepers by Season" subtitle="Keeper count by year">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={keeperData} margin={{ top: 8, right: 12, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false} />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [integer(value), "Keepers"]} />
            <Bar dataKey="keepers" fill="#facc15" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function EconomyTab({ rows, managers }) {
  const leagueData = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const year = number(row.Year);
      if (!year) return;
      if (!map.has(year)) map.set(year, { year, QB: 0, RB: 0, WR: 0, TE: 0, ABN: 0 });
      POSITIONS.forEach(([position, , sourceKey]) => {
        map.get(year)[position] += number(row[sourceKey]);
      });
    });
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [rows]);

  const profiles = useMemo(() => createEconomyProfiles(rows, managers), [rows, managers]);

  return (
    <div className="data-tab data-tab--economy">
      <Panel title="League Position Spending" subtitle="Historical auction spending by position">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={leagueData} margin={{ top: 8, right: 14, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false} />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => currency(value)} />
            <Legend wrapperStyle={{ fontSize: ".6rem" }} />
            {POSITIONS.map(([position]) => (
              <Line
                key={position}
                type="linear"
                dataKey={position}
                stroke={POSITION_COLORS[position]}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <section className="economy-profile-grid">
        {profiles.map((profile) => (
          <article className="economy-profile-card" key={profile.manager_id}>
            <header>
              <div>
                <span>Investment Profile</span>
                <h3>{profile.manager_name}</h3>
              </div>
              <div>
                <small>Dominant</small>
                <strong>{profile.dominant}</strong>
              </div>
            </header>

            <div className="economy-profile-card__positions">
              {profile.positions.map((position) => (
                <IndexRow key={position.position} position={position} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ManagerTab({ manager, seasons }) {
  if (!manager) {
    return <DashboardState title="No manager selected" message="Choose a manager to view analytics." />;
  }

  const projectionSeasons = seasons
    .filter((season) => number(season.weeks_with_projection) > 0)
    .map((season) => ({
      season: season.season,
      actual: number(season.total_points),
      projected: number(season.total_projected_points),
    }));

  const radar = POSITIONS.map(([position, , , careerKey]) => ({
    position,
    percentage: number(manager[careerKey]),
  }));

  const hasProjectionData = number(manager.career_weeks_with_projection) > 0;

  return (
    <div className="data-tab data-tab--manager">
      <section className="manager-profile-header">
        <div>
          <span>Manager Profile</span>
          <h3>{manager.manager_name}</h3>
          <p>
            {manager.first_season} – {manager.most_recent_season}
          </p>
        </div>
        <div>
          <strong>
            {integer(manager.total_wins)}–{integer(manager.total_losses)}
          </strong>
          <span>{percentage(manager.career_win_percentage)} career win rate</span>
        </div>
      </section>

      <SummaryGrid>
        <Metric label="Championships" value={integer(manager.championships)} detail={`${integer(manager.playoff_appearances)} playoffs`} />
        <Metric label="Average Finish" value={decimal(manager.average_finish, 1)} detail={`${integer(manager.seasons_played)} seasons`} />
        <Metric label="Highest Weekly Score" value={optionalDecimal(manager.highest_weekly_score)} detail={manager.highest_weekly_score_season ? `Season ${manager.highest_weekly_score_season}` : "No weekly data"} />
        <Metric label="Dominant Spend" value={manager.career_dominant_spending_category ?? "No Data"} detail="Career allocation" />
      </SummaryGrid>

      <div className="manager-primary-grid">
        <Panel title="Actual vs Projected" subtitle="Only seasons with source projection data">
          {projectionSeasons.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionSeasons} margin={{ top: 8, right: 12, left: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false} />
                <XAxis dataKey="season" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => decimal(value)} />
                <Legend wrapperStyle={{ fontSize: ".6rem" }} />
                <Line type="linear" dataKey="actual" name="Actual" stroke="#38bdf8" strokeWidth={2.25} />
                <Line type="linear" dataKey="projected" name="Projected" stroke="#94a3b8" strokeDasharray="5 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyPanel text="No projection rows are present in Weekly_Results for this manager." />
          )}
        </Panel>

        <Panel title="Career Spending Fingerprint" subtitle="Percentage of career auction spending">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="rgba(148,163,184,.16)" />
              <PolarAngleAxis dataKey="position" tick={{ fill: "#cbd5e1", fontSize: 9 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => percentage(value)} />
              <Radar dataKey="percentage" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Manager Tendencies" subtitle="Career performance indicators">
        <div className="manager-tendency-grid">
          <Tendency label="Projection Performance" value={hasProjectionData ? manager.career_projection_label : "No Data"} detail={hasProjectionData ? `${signedPercentage(manager.career_projection_performance_percentage)} vs projection` : "No source projection rows"} />
          <Tendency label="Career Point Differential" value={optionalSigned(manager.career_point_differential)} detail="Points scored minus allowed" />
          <Tendency label="Highest Weekly Score" value={optionalDecimal(manager.highest_weekly_score)} detail={manager.highest_weekly_score_season ? `Season ${manager.highest_weekly_score_season}` : "No weekly data"} />
          <Tendency label="Highest Season Score" value={optionalDecimal(manager.highest_season_score)} detail={manager.highest_scoring_season ? `Season ${manager.highest_scoring_season}` : "No season data"} />
          <Tendency label="Average Weekly Score" value={optionalDecimal(manager.career_average_weekly_points)} detail="Career scoring average" />
        </div>
      </Panel>

      <Panel className="manager-season-table-panel" title="Season History" subtitle="Year-by-year manager results">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Season</th><th>Record</th><th>Finish</th><th>Points</th><th>Against</th><th>Point Diff.</th><th>Projection Diff.</th><th>Dominant Spend</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.season}>
                  <td><strong>{season.season}</strong></td>
                  <td>{integer(season.wins)}–{integer(season.losses)}</td>
                  <td>{ordinal(season.finish_position)}</td>
                  <td>{optionalDecimal(season.total_points)}</td>
                  <td>{optionalDecimal(season.total_points_against)}</td>
                  <td className={signClass(season.season_point_differential)}>{optionalSigned(season.season_point_differential)}</td>
                  <td className={signClass(season.total_projection_difference)}>{number(season.weeks_with_projection) > 0 ? optionalSigned(season.total_projection_difference) : "No Data"}</td>
                  <td>{season.dominant_spending_category ?? "No Data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function HistoryTab({ rows }) {
  const sorted = [...rows].sort((a, b) => number(b.legacy_score) - number(a.legacy_score));
  const highestWeek = [...rows].filter((row) => nullableNumber(row.highest_weekly_score) !== null).sort((a, b) => number(b.highest_weekly_score) - number(a.highest_weekly_score))[0];
  const mostAgainst = [...rows].filter((row) => nullableNumber(row.career_points_against) !== null).sort((a, b) => number(b.career_points_against) - number(a.career_points_against))[0];
  const mostWins = [...rows].sort((a, b) => number(b.total_wins) - number(a.total_wins))[0];

  const chartData = sorted.map((manager) => ({
    manager: manager.manager_name,
    ...Object.fromEntries(LEGACY_PARTS.map(([key]) => [key, number(manager[key])])),
  }));

  return (
    <div className="data-tab data-tab--history">
      <SummaryGrid>
        <Metric label="Legacy Leader" value={sorted[0]?.manager_name ?? "No Data"} detail={sorted[0] ? `${decimal(sorted[0].legacy_score)} legacy score` : "No legacy data"} />
        <Metric label="Most Wins" value={mostWins?.manager_name ?? "No Data"} detail={mostWins ? `${integer(mostWins.total_wins)} career wins` : "No record data"} />
        <Metric label="Highest Week" value={highestWeek ? decimal(highestWeek.highest_weekly_score) : "No Data"} detail={highestWeek?.manager_name ?? "No weekly data"} />
        <Metric label="Most Points Against" value={mostAgainst ? decimal(mostAgainst.career_points_against) : "No Data"} detail={mostAgainst?.manager_name ?? "No matchup data"} />
      </SummaryGrid>

      <div className="league-history-primary-grid">
        <Panel title="Legacy Scoreboard" subtitle="All-time manager ranking">
          <div className="legacy-scoreboard">
            {sorted.map((manager, index) => (
              <article key={manager.manager_id} className="legacy-scoreboard__row">
                <span>{index + 1}</span>
                <div><strong>{manager.manager_name}</strong><small>{integer(manager.total_wins)}–{integer(manager.total_losses)} · {integer(manager.championships)} titles</small></div>
                <strong>{decimal(manager.legacy_score)}</strong>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Legacy Score Composition" subtitle="Contribution of each rating category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 12 }}>
              <CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="manager" width={105} axisLine={false} tickLine={false} tick={{ fill: "#cbd5e1", fontSize: 8 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: ".54rem" }} />
              {LEGACY_PARTS.map(([key, label, color]) => <Bar key={key} dataKey={key} name={label} stackId="legacy" fill={color} />)}
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="All-Time Manager Records" subtitle="Career performance and scoring records">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Manager</th><th>Record</th><th>Win %</th><th>Titles</th><th>Playoffs</th><th>Highest Week</th><th>Highest Season</th><th>Career Points</th><th>Points Against</th></tr></thead>
            <tbody>{sorted.map((manager) => <tr key={manager.manager_id}><td><strong>{manager.manager_name}</strong></td><td>{integer(manager.total_wins)}–{integer(manager.total_losses)}</td><td>{percentage(manager.career_win_percentage)}</td><td>{integer(manager.championships)}</td><td>{integer(manager.playoff_appearances)}</td><td>{optionalDecimal(manager.highest_weekly_score)}</td><td>{optionalDecimal(manager.highest_season_score)}</td><td>{optionalDecimal(manager.career_points)}</td><td>{optionalDecimal(manager.career_points_against)}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ArchetypesTab({
  managers,
  seasons,
  draftHistory,
}) {
  /*
   * Use the five most recent seasons represented in either:
   *
   * - analytics_manager_seasons
   * - Draft_History
   *
   * Including both sources prevents a valid draft season from disappearing
   * merely because the analytics view does not contain a matching row.
   */
  const years = useMemo(() => {
    const seasonYears =
      seasons
        .map((row) =>
          number(
            valueOf(
              row,
              "season",
              "Season",
              "year",
              "Year"
            )
          )
        )
        .filter(Boolean);

    const draftYears =
      draftHistory
        .map((row) =>
          number(
            valueOf(
              row,
              "Year",
              "year",
              "Season",
              "season"
            )
          )
        )
        .filter(Boolean);

    return [
      ...new Set([
        ...seasonYears,
        ...draftYears,
      ]),
    ]
      .sort(
        (firstYear, secondYear) =>
          secondYear - firstYear
      )
      .slice(0, 5)
      .sort(
        (firstYear, secondYear) =>
          firstYear - secondYear
      );
  }, [
    seasons,
    draftHistory,
  ]);

  /*
   * These averages are still used for the position index bars underneath
   * each historical archetype label.
   */
  const averages =
    useMemo(
      () =>
        seasonAverages(
          seasons
        ),
      [seasons]
    );

  /*
   * Group every Draft_History row by season once.
   *
   * The complete season group is passed to archetype.js as leagueDraftRows,
   * allowing QB/TE price percentile comparisons against the entire league.
   */
  const leagueDraftRowsByYear =
    useMemo(() => {
      const groups =
        new Map();

      draftHistory.forEach(
        (row) => {
          const year =
            draftHistoryYear(
              row
            );

          if (!year) {
            return;
          }

          if (
            !groups.has(
              year
            )
          ) {
            groups.set(
              year,
              []
            );
          }

          groups
            .get(year)
            .push(row);
        }
      );

      return groups;
    }, [
      draftHistory,
    ]);

  /*
   * Group one manager's Draft_History rows by manager and season.
   *
   * The nested structure is:
   *
   * manager ID
   *   -> season
   *      -> draft rows
   */
  const managerDraftRows =
    useMemo(() => {
      const managerGroups =
        new Map();

      draftHistory.forEach(
        (row) => {
          const managerId =
            draftHistoryManagerId(
              row
            );

          const year =
            draftHistoryYear(
              row
            );

          if (
            managerId === "" ||
            !year
          ) {
            return;
          }

          if (
            !managerGroups.has(
              managerId
            )
          ) {
            managerGroups.set(
              managerId,
              new Map()
            );
          }

          const seasonGroups =
            managerGroups.get(
              managerId
            );

          if (
            !seasonGroups.has(
              year
            )
          ) {
            seasonGroups.set(
              year,
              []
            );
          }

          seasonGroups
            .get(year)
            .push(row);
        }
      );

      return managerGroups;
    }, [
      draftHistory,
    ]);

  const profiles =
    useMemo(
      () =>
        managers
          .slice(0, 10)
          .map(
            (manager) => {
              const managerId =
                String(
                  manager
                    .manager_id ??
                  ""
                );

              const managerSeasonDrafts =
                managerDraftRows.get(
                  managerId
                );

              const seasonRows =
                years.map(
                  (year) => {
                    /*
                     * The analytics season row is retained for the position
                     * spending index bars.
                     */
                    const source =
                      seasons.find(
                        (row) =>
                          String(
                            valueOf(
                              row,
                              "manager_id",
                              "Manager_ID",
                              "managerId"
                            ) ??
                            ""
                          ) ===
                            managerId &&
                          number(
                            valueOf(
                              row,
                              "season",
                              "Season",
                              "year",
                              "Year"
                            )
                          ) ===
                            year
                      );

                    const indexes =
                      source
                        ? positionIndexes(
                            source,
                            averages[
                              year
                            ]
                          )
                        : emptyIndexes();

                    const draftRows =
                      managerSeasonDrafts
                        ?.get(year) ??
                      [];

                    const leagueDraftRows =
                      leagueDraftRowsByYear
                        .get(year) ??
                      [];

                    /*
                     * The historical archetype is now sourced from
                     * archetype.js rather than tendencyLabel().
                     */
                    const label =
                      draftRows.length > 0
                        ? createHistoricalDraftArchetype({
                            draftRows,

                            leagueDraftRows,

                            /*
                             * Leave this empty unless historical roster
                             * settings are available for each season.
                             *
                             * Recorded roster-slot fields in Draft_History
                             * will still be used automatically.
                             */
                            rosterSettings:
                              {},
                          })
                        : "No Data";

                    return {
                      year,
                      label,
                      indexes,
                      draftCount:
                        draftRows.length,
                    };
                  }
                );

              return {
                ...manager,

                primary:
                  mostCommon(
                    seasonRows.map(
                      (row) =>
                        row.label
                    )
                  ),

                seasonRows,
              };
            }
          ),
      [
        managers,
        years,
        seasons,
        averages,
        managerDraftRows,
        leagueDraftRowsByYear,
      ]
    );

  return (
    <div className="data-tab data-tab--archetypes">
      <section className="roster-tendency-grid">
        {profiles.map(
          (manager) => (
            <article
              className="roster-tendency-card"
              key={
                manager.manager_id
              }
            >
              <header>
                <div>
                  <span>
                    Roster Construction
                  </span>

                  <h3>
                    {
                      manager.manager_name
                    }
                  </h3>
                </div>

                <div>
                  <small>
                    Primary
                  </small>

                  <strong>
                    {
                      manager.primary
                    }
                  </strong>
                </div>
              </header>

              <div className="roster-tendency-card__seasons">
                {manager
                  .seasonRows
                  .map(
                    (season) => (
                      <section
                        className={`roster-tendency-season ${
                          season.label ===
                          "No Data"
                            ? "roster-tendency-season--empty"
                            : ""
                        }`}
                        key={
                          season.year
                        }
                      >
                        <div className="roster-tendency-season__title">
                          <strong>
                            {
                              season.year
                            }
                          </strong>

                          <span>
                            {
                              season.label
                            }
                          </span>
                        </div>

                        <div className="roster-tendency-season__positions">
                          {season
                            .indexes
                            .map(
                              (
                                position
                              ) => (
                                <MiniIndex
                                  key={
                                    position.position
                                  }
                                  position={
                                    position
                                  }
                                />
                              )
                            )}
                        </div>
                      </section>
                    )
                  )}
              </div>
            </article>
          )
        )}
      </section>
    </div>
  );
}

function Panel({ title, subtitle, className = "", children }) {
  return <section className={`dashboard-panel ${className}`}><header><h3>{title}</h3><p>{subtitle}</p></header><div>{children}</div></section>;
}
function SummaryGrid({ children }) { return <div className="data-tab__summary-grid">{children}</div>; }
function Metric({ label, value, detail }) { return <article className="summary-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function Tendency({ label, value, detail }) { return <article className="manager-tendency"><strong>{value}</strong><span>{label}</span><small>{detail}</small></article>; }
function EmptyPanel({ text }) { return <div className="empty-panel">{text}</div>; }
function DashboardState({ title, message, error = false }) { return <div className={`dashboard-state ${error ? "dashboard-state--error" : ""}`}><h3>{title}</h3><p>{message}</p></div>; }

function IndexRow({ position }) {
  return <div className="economy-index-row"><span>{position.position}</span><div><i style={{ width: `${Math.min(position.index, 200) / 2}%`, background: POSITION_COLORS[position.position] }} /></div><strong>{integer(position.index)}</strong></div>;
}
function MiniIndex({ position }) {
  return <div className="roster-position-index"><span>{position.position === "ABN" ? "BN" : position.position}</span><div><b /><i style={{ width: `${Math.min(position.index, 175) / 1.75}%`, background: POSITION_COLORS[position.position] }} /></div><strong>{position.index ? integer(position.index) : "—"}</strong></div>;
}

function createEconomyProfiles(rows, managers) {
  const totals = Object.fromEntries(POSITIONS.map(([position]) => [position, 0]));
  rows.forEach((row) => POSITIONS.forEach(([position, , sourceKey]) => { totals[position] += number(row[sourceKey]); }));
  const leagueAverage = Object.fromEntries(POSITIONS.map(([position]) => [position, totals[position] / Math.max(rows.length, 1)]));

  return managers.slice(0, 10).map((manager) => {
    const managerRows = rows.filter((row) => String(row.Manager_ID) === String(manager.manager_id));
    const positions = POSITIONS.map(([position, , sourceKey]) => {
      const average = managerRows.reduce((sum, row) => sum + number(row[sourceKey]), 0) / Math.max(managerRows.length, 1);
      return { position, average, index: leagueAverage[position] ? (average / leagueAverage[position]) * 100 : 0 };
    });
    return { ...manager, positions, dominant: [...positions].sort((a, b) => b.index - a.index)[0]?.position ?? "No Data" };
  });
}

function seasonAverages(rows) {
  const groups = {};
  rows.forEach((row) => { const year = number(row.season); if (!groups[year]) groups[year] = []; groups[year].push(row); });
  return Object.fromEntries(Object.entries(groups).map(([year, group]) => [year, Object.fromEntries(POSITIONS.map(([position, seasonKey]) => [position, group.reduce((sum, row) => sum + number(row[seasonKey]), 0) / Math.max(group.length, 1)]))]));
}
function positionIndexes(row, averages) { return POSITIONS.map(([position, seasonKey]) => ({ position, index: number(averages?.[position]) ? (number(row[seasonKey]) / number(averages[position])) * 100 : 0 })); }
function emptyIndexes() { return POSITIONS.map(([position]) => ({ position, index: 0 })); }

function mostCommon(labels) {
  const counts = {};
  labels.filter((label) => label !== "No Data").forEach((label) => { counts[label] = (counts[label] ?? 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No Data";
}

function draftHistoryManagerId(
  row
) {
  const value =
    valueOf(
      row,
      "Manager_ID",
      "manager_id",
      "Manager ID",
      "managerId"
    );

  return value ===
    null ||
    value ===
    undefined
    ? ""
    : String(value);
}

function draftHistoryYear(
  row
) {
  return number(
    valueOf(
      row,
      "Year",
      "year",
      "Season",
      "season"
    )
  );
}
function valueOf(object, ...keys) { for (const key of keys) if (object?.[key] !== undefined && object?.[key] !== null) return object[key]; return null; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function nullableNumber(value) { if (value === null || value === undefined || value === "") return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function playerName(row) { return valueOf(row, "Player_Name", "player_name", "Name", "name") ?? "Unknown Player"; }
function playerLabel(row) { const year = valueOf(row, "Year", "year"); return year ? `${playerName(row)} (${year})` : playerName(row); }
function draftCost(row) { return number(valueOf(row, "Cost", "cost")); }
function isKeeper(row) { return [true, 1, "1", "true", "yes", "y", "keeper"].includes(String(valueOf(row, "Keeper Status", "Keeper_Status", "keeper_status", "is_keeper")).toLowerCase()); }
function integer(value) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(number(value)); }
function decimal(value, digits = 2) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(number(value)); }
function currency(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(number(value)); }
function signedCurrency(value) { const n = number(value); return `${n > 0 ? "+" : n < 0 ? "-" : ""}${currency(Math.abs(n))}`; }
function percentage(value) { return `${decimal(value, 1)}%`; }
function signedPercentage(value) { const n = number(value); return `${n > 0 ? "+" : ""}${decimal(n, 1)}%`; }
function optionalDecimal(value) { const n = nullableNumber(value); return n === null ? "No Data" : decimal(n); }
function optionalSigned(value) { const n = nullableNumber(value); return n === null ? "No Data" : `${n > 0 ? "+" : ""}${decimal(n)}`; }
function signClass(value) { const n = nullableNumber(value); return n > 0 ? "data-table__positive" : n < 0 ? "data-table__negative" : ""; }
function ordinal(value) { const n = number(value); if (!n) return "—"; const mod100 = n % 100; if (mod100 >= 11 && mod100 <= 13) return `${n}th`; return `${n}${n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"}`; }