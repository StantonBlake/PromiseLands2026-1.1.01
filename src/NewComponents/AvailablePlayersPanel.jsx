import { useState } from "react";
import "./AvailablePlayersPanel.css";

const POSITION_ORDER = ["QB", "RB", "WR", "TE"];

const getPlayerId = (player) => player.player_id;

const AvailablePlayersPanel = ({
  players = [],
  onSelectPlayer,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] =
    useState(null);

  const availablePlayers = players.filter(
    (player) => player.drafted !== true
  );

  const playersByPosition = POSITION_ORDER.reduce(
    (groups, position) => {
      groups[position] = availablePlayers
        .filter((player) => player.position === position)
        .sort(
          (playerA, playerB) =>
            Number(
              playerB.projected_fantasy_points ?? 0
            ) -
            Number(
              playerA.projected_fantasy_points ?? 0
            )
        );

      return groups;
    },
    {}
  );

  const formatProjectedPoints = (value) => {
    const points = Number(value);

    return Number.isFinite(points)
      ? points.toFixed(1)
      : "0.0";
  };

  const formatPositionRank = (player) => {
    const position = player.position ?? "—";
    const rank = Number(
      player.projected_position_rank
    );

    if (!Number.isFinite(rank) || rank <= 0) {
      return position;
    }

    return `${position}${rank}`;
  };

  const handleSelectPlayer = (player) => {
    const playerId = getPlayerId(player);

    setSelectedPlayerId(playerId);
    onSelectPlayer?.(player);
  };

  return (
    <section
      className="available-players"
      aria-labelledby="available-players-title"
    >
      <header className="available-players__header">
        <div>
          <h2 id="available-players-title">
            Available Players
          </h2>

          <p>
            Select a player to view draft details.
          </p>
        </div>

        <span
          className="available-players__count"
          aria-label={`${availablePlayers.length} available players`}
        >
          {availablePlayers.length}
        </span>
      </header>

      <div className="available-players__grid">
        {POSITION_ORDER.map((position) => {
          const positionPlayers =
            playersByPosition[position] ?? [];

          return (
            <section
              key={position}
              className="available-player-group"
              aria-labelledby={`available-${position}`}
            >
              <header className="available-player-group__header">
                <h3 id={`available-${position}`}>
                  {position}
                </h3>

                <span
                  aria-label={`${positionPlayers.length} ${position} players`}
                >
                  {positionPlayers.length}
                </span>
              </header>

              <div
                className="available-player-group__table-header"
                aria-hidden="true"
              >
                <span>Player</span>
                <span>Proj</span>
                <span>Rank</span>
              </div>

              <div className="available-player-group__list">
                {positionPlayers.length > 0 ? (
                  positionPlayers.map((player) => {
                    const playerId =
                      getPlayerId(player);

                    const playerName =
                      player.player_name ??
                      "Unknown Player";

                    const isSelected =
                      String(playerId) ===
                      String(selectedPlayerId);

                    return (
                      <button
                        key={playerId}
                        type="button"
                        className={[
                          "available-player-row",
                          isSelected &&
                            "is-selected",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() =>
                          handleSelectPlayer(player)
                        }
                        aria-pressed={isSelected}
                        aria-label={`Select ${playerName}`}
                      >
                        <span className="available-player-row__identity">
                          <strong>
                            {playerName}
                          </strong>

                          <small>
                            {String(
                              player.team ?? "FA"
                            ).toUpperCase()}
                          </small>
                        </span>

                        <span className="available-player-row__points">
                          {formatProjectedPoints(
                            player.projected_fantasy_points
                          )}
                        </span>

                        <span className="available-player-row__rank">
                          {formatPositionRank(player)}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="available-player-group__empty">
                    No available players
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};

export default AvailablePlayersPanel;