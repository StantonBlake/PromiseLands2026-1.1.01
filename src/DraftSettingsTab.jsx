import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "./supabaseClient";
import "./DraftSettingsTab.css";

const EMPTY_FORM = {
  draftEntryId: "",
  playerId: "",
  playerName: "",
  position: "",
  managerId: "",
  auctionValue: "",
  draftSlot: "",
};

export default function DraftSettingsTab() {
  const [entries, setEntries] = useState([]);
  const [managers, setManagers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [rosters, setRosters] = useState([]);

  const [query, setQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCurrentDraft = useCallback(async () => {
    setLoading(true);
    setError("");

    const [draftResult, managerResult, playerResult, rosterResult] =
      await Promise.all([
        supabase
          .from("draft_entries")
          .select(`
            draft_entry_id,
            player_id,
            manager_id,
            auction_value,
            draft_slot,
            entry_type,
            entry_label
          `)
          .eq("entry_type", "PLAYER")
          .order("draft_entry_id", { ascending: false }),

        supabase
          .from("active_managers")
          .select("manager_id, manager_name")
          .order("manager_name", { ascending: true }),

        supabase
          .from("player_data")
          .select("player_id, player_name, position, team"),

        supabase
          .from("Live_Rosters")
          .select("id, player_id, manager_id, drafted_as"),
      ]);

    const firstError = [
      draftResult.error,
      managerResult.error,
      playerResult.error,
      rosterResult.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError.message ?? "Unable to load current draft data.");
      setLoading(false);
      return;
    }

    setEntries(draftResult.data ?? []);
    setManagers(managerResult.data ?? []);
    setPlayers(playerResult.data ?? []);
    setRosters(rosterResult.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCurrentDraft();
  }, [loadCurrentDraft]);

  const managerMap = useMemo(
    () =>
      new Map(
        managers.map((manager) => [
          String(manager.manager_id),
          manager.manager_name,
        ])
      ),
    [managers]
  );

  const playerMap = useMemo(
    () =>
      new Map(
        players.map((player) => [String(player.player_id), player])
      ),
    [players]
  );

  const rosterMap = useMemo(
    () =>
      new Map(
        rosters.map((roster) => [String(roster.player_id), roster])
      ),
    [rosters]
  );

  const draftRows = useMemo(
    () =>
      entries.map((entry) => {
        const player = playerMap.get(String(entry.player_id));
        const roster = rosterMap.get(String(entry.player_id));

        return {
          ...entry,
          playerName:
            player?.player_name ?? entry.entry_label ?? "Unknown Player",
          position: player?.position ?? "—",
          nflTeam: player?.team ?? "—",
          managerName:
            managerMap.get(String(entry.manager_id)) ??
            `Manager ${entry.manager_id}`,
          rosterManagerId: roster?.manager_id ?? null,
          rosterSlot: roster?.drafted_as ?? entry.draft_slot ?? "—",
          synchronized:
            roster != null &&
            String(roster.manager_id) === String(entry.manager_id),
        };
      }),
    [entries, managerMap, playerMap, rosterMap]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return draftRows.filter((row) => {
      const matchesManager =
        managerFilter === "all" ||
        String(row.manager_id) === String(managerFilter);

      const matchesQuery =
        !normalizedQuery ||
        row.playerName.toLowerCase().includes(normalizedQuery) ||
        row.managerName.toLowerCase().includes(normalizedQuery) ||
        String(row.position).toLowerCase().includes(normalizedQuery) ||
        String(row.nflTeam).toLowerCase().includes(normalizedQuery);

      return matchesManager && matchesQuery;
    });
  }, [draftRows, managerFilter, query]);

  const totalSpent = useMemo(
    () =>
      draftRows.reduce(
        (sum, entry) => sum + Number(entry.auction_value ?? 0),
        0
      ),
    [draftRows]
  );

  const mismatches = useMemo(
    () => draftRows.filter((row) => !row.synchronized).length,
    [draftRows]
  );

  function openEditor(entry) {
    setNotice("");
    setError("");
    setSelectedEntry(entry);
    setForm({
      draftEntryId: String(entry.draft_entry_id),
      playerId: String(entry.player_id),
      playerName: entry.playerName,
      position: entry.position,
      managerId: String(entry.manager_id),
      auctionValue: String(entry.auction_value ?? ""),
      draftSlot: entry.rosterSlot,
    });
  }

  function closeEditor() {
    if (saving) return;
    setSelectedEntry(null);
    setForm(EMPTY_FORM);
  }

  async function saveCorrection(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const draftEntryId = Number(form.draftEntryId);
    const managerId = Number(form.managerId);
    const auctionValue = Number(form.auctionValue);

    if (!Number.isInteger(draftEntryId) || draftEntryId < 1) {
      setError("The selected draft entry is invalid.");
      return;
    }

    if (!Number.isInteger(managerId) || managerId < 1) {
      setError("Select a valid manager.");
      return;
    }

    if (!Number.isInteger(auctionValue) || auctionValue < 1) {
      setError("Auction value must be a whole dollar amount of at least $1.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.rpc(
      "update_current_draft_pick",
      {
        p_draft_entry_id: draftEntryId,
        p_manager_id: managerId,
        p_auction_value: auctionValue,
      }
    );

    if (updateError) {
      setError(
        updateError.code === "42501"
          ? "Your account is not authorized to edit draft picks."
          : updateError.message ?? "Unable to save the draft correction."
      );
      setSaving(false);
      return;
    }

    await loadCurrentDraft();
    setSaving(false);
    setSelectedEntry(null);
    setForm(EMPTY_FORM);
    setNotice(`${form.playerName} was updated successfully.`);
  }

  return (
    <section className="draft-settings">
      <header className="draft-settings__hero">
        <div>
          <span>Current Draft Administration</span>
          <h2>Draft Pick Corrections</h2>
          <p>
            Correct a player&apos;s auction value or manager assignment. Saving
            updates both the draft transaction and live roster.
          </p>
        </div>

        <button
          type="button"
          className="draft-settings__refresh"
          onClick={loadCurrentDraft}
          disabled={loading || saving}
        >
          Refresh Draft
        </button>
      </header>

      <div className="draft-settings__metrics">
        <Metric label="Drafted Players" value={draftRows.length} />
        <Metric label="Total Assigned" value={`$${totalSpent}`} />
        <Metric
          label="Roster Sync"
          value={mismatches === 0 ? "Healthy" : `${mismatches} issue${mismatches === 1 ? "" : "s"}`}
          tone={mismatches === 0 ? "good" : "warning"}
        />
      </div>

      <section className="draft-settings__panel">
        <header className="draft-settings__toolbar">
          <label>
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Player, manager, position..."
            />
          </label>

          <label>
            <span>Manager</span>
            <select
              value={managerFilter}
              onChange={(event) => setManagerFilter(event.target.value)}
            >
              <option value="all">All managers</option>
              {managers.map((manager) => (
                <option key={manager.manager_id} value={manager.manager_id}>
                  {manager.manager_name}
                </option>
              ))}
            </select>
          </label>

          <div className="draft-settings__result-count">
            <strong>{filteredRows.length}</strong>
            <span>visible picks</span>
          </div>
        </header>

        {notice && <div className="draft-settings__notice">{notice}</div>}
        {error && <div className="draft-settings__error">{error}</div>}

        <div className="draft-settings__table-wrap">
          {loading ? (
            <div className="draft-settings__state">Loading current draft…</div>
          ) : filteredRows.length === 0 ? (
            <div className="draft-settings__state">No matching draft picks.</div>
          ) : (
            <table className="draft-settings__table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Manager</th>
                  <th>Value</th>
                  <th>Slot</th>
                  <th>Sync</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((entry) => (
                  <tr key={entry.draft_entry_id}>
                    <td>
                      <strong>{entry.playerName}</strong>
                      <small>{entry.nflTeam}</small>
                    </td>
                    <td>{entry.position}</td>
                    <td>{entry.managerName}</td>
                    <td className="draft-settings__money">
                      ${entry.auction_value}
                    </td>
                    <td>{entry.rosterSlot}</td>
                    <td>
                      <span
                        className={`draft-settings__sync ${
                          entry.synchronized
                            ? "draft-settings__sync--good"
                            : "draft-settings__sync--bad"
                        }`}
                      >
                        {entry.synchronized ? "Matched" : "Mismatch"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="draft-settings__edit"
                        onClick={() => openEditor(entry)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedEntry && (
        <div
          className="draft-editor-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <form className="draft-editor" onSubmit={saveCorrection}>
            <header className="draft-editor__header">
              <div>
                <span>Edit Current Draft Pick</span>
                <h3>{form.playerName}</h3>
                <p>
                  {form.position} · {form.draftSlot}
                </p>
              </div>

              <button type="button" onClick={closeEditor} aria-label="Close">
                ×
              </button>
            </header>

            <div className="draft-editor__body">
              <label>
                <span>Assigned Manager</span>
                <select
                  value={form.managerId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      managerId: event.target.value,
                    }))
                  }
                  disabled={saving}
                >
                  {managers.map((manager) => (
                    <option key={manager.manager_id} value={manager.manager_id}>
                      {manager.manager_name}
                    </option>
                  ))}
                </select>
                <small>
                  This changes both draft_entries and Live_Rosters.
                </small>
              </label>

              <label>
                <span>Auction Value</span>
                <div className="draft-editor__currency">
                  <i>$</i>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.auctionValue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        auctionValue: event.target.value,
                      }))
                    }
                    disabled={saving}
                  />
                </div>
                <small>Whole-dollar values only; minimum value is $1.</small>
              </label>

              <div className="draft-editor__warning">
                <strong>Current draft only</strong>
                <p>
                  This does not change Draft_History. Historical data should be
                  written only after the draft is finalized.
                </p>
              </div>
            </div>

            {error && <div className="draft-editor__error">{error}</div>}

            <footer className="draft-editor__footer">
              <button type="button" onClick={closeEditor} disabled={saving}>
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Correction"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, tone = "default" }) {
  return (
    <article className={`draft-settings__metric draft-settings__metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}