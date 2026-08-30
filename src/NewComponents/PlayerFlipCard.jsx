import {
  useEffect,
  useState,
} from "react";

import {
  getNFLTeam,
} from "./styles/nflTeams";

import PropTypes from "prop-types";

import FlipCard from "./FlipCard";
import ReactiveButton from "./ReactiveButton";

import "./PlayerFlipCard.css";

const DEFAULT_PRIMARY =
  "#2563eb";

const DEFAULT_SECONDARY =
  "#60a5fa";

const DEFAULT_ACCENT =
  "#f8fafc";

  export default function PlayerFlipCard({
    player,
    onDeselect,
    onDraftPlayer,
    draftDisabled = false,
    resetFlipKey = 0,
  }) {
  if (!player) {
    return (
      <div
        className="
          player-trading-card
          player-trading-card--empty
        "
      >
        <span
          className="player-trading-card__empty-symbol"
          aria-hidden="true"
        >
          +
        </span>

        <span className="player-trading-card__empty-title">
          Select Player
        </span>

        <span className="player-trading-card__empty-copy">
          Choose a player to preview
        </span>
      </div>
    );
  }

  const playerId =
    getPlayerId(player);

  const playerName =
    getPlayerName(player);

  const position =
    getPlayerPosition(player);

  const age =
    player.age ?? null;

  const experience =
    player.experience ?? null;

  const seasonHistory =
    buildSeasonHistory(player);

    const playerTeam =
    getPlayerTeamValue(
      player
    );
  
  const nflTeam =
    getNFLTeam(
      playerTeam
    );

  const primaryColor =
  nflTeam?.primary ||
  DEFAULT_PRIMARY;

const secondaryColor =
  nflTeam?.secondary ||
  DEFAULT_SECONDARY;

const accentColor =
  nflTeam?.accentColor ||
  DEFAULT_ACCENT;

const cardStyle = {
  "--player-primary":
    primaryColor,

  "--player-secondary":
    secondaryColor,

  "--player-accent":
    accentColor,
};

  const handleDraft = (
    event
  ) => {
    event.stopPropagation();

    if (draftDisabled) {
      return;
    }

    onDraftPlayer?.(player);
  };

  const handleDeselect = (
    event
  ) => {
    event.stopPropagation();

    onDeselect?.(
      playerId
    );
  };

  return (
    <FlipCard
  className="player-flip-card"
  dataDraftPlayerCard
  resetKey={resetFlipKey}
  ariaLabel={`${playerName} player card. Click to flip.`}
  defaultFlipped={false}
  frontContent={
    <PlayerCardFront
      player={player}
      cardStyle={cardStyle}
    />
  }
  backContent={
    <PlayerCardBack
      name={playerName}
      position={position}
      age={age}
      experience={experience}
      seasonHistory={
        seasonHistory
      }
      projectedFantasyPoints={
        player.projected_fantasy_points ??
        player.projectedFantasyPoints
      }
      previousPositionRank={
        player.previous_position_rank ??
        player.previousPositionRank
      }
      cardStyle={cardStyle}
      onDraft={
        handleDraft
      }
      onDeselect={
        handleDeselect
      }
      draftDisabled={
        draftDisabled
      }
    />
  }
/>
  );
}

function getPlayerHeadshot(player) {
  const playerId = getPlayerId(player);

  if (!playerId) {
    return null;
  }

  return `https://sleepercdn.com/content/nfl/players/${playerId}.jpg`;
}

function PlayerCardFront({
  player,
  cardStyle,
}) {
  const playerName =
    getPlayerName(player);

  const position =
    getPlayerPosition(player);

  const playerTeamValue =
    getPlayerTeamValue(player);

  const nflTeam =
    getNFLTeam(
      playerTeamValue
    );

  const team =
    nflTeam?.name ??
    player.team_name ??
    player.teamName ??
    player.team ??
    "Free Agent";

  const teamAbbreviation =
    nflTeam?.abbreviation ??
    player.team_abbreviation ??
    player.teamAbbreviation ??
    player.team_code ??
    player.teamCode ??
    null;

  const sleeperHeadshot =
    getPlayerHeadshot(player);

  const storedHeadshot =
    player.headshot ??
    player.image ??
    player.player_image ??
    null;

  const teamLogo =
    player.team_logo ??
    player.teamLogo ??
    getLocalTeamLogo(
      playerTeamValue
    );

  const jerseyNumber =
    player.jersey_number ??
    player.jerseyNumber ??
    null;

  const safeTeam =
    team || "Free Agent";

  const teamCode =
    getTeamCode(
      safeTeam,
      teamAbbreviation
    );

  const {
    teamCity,
    teamName,
  } = splitTeamDisplayName(
    safeTeam
  );

  const [
    imageSource,
    setImageSource,
  ] = useState(
    sleeperHeadshot ??
      storedHeadshot
  );

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const [
    teamLogoFailed,
    setTeamLogoFailed,
  ] = useState(false);

  useEffect(() => {
    setImageSource(
      sleeperHeadshot ??
        storedHeadshot
    );

    setImageFailed(false);
  }, [
    sleeperHeadshot,
    storedHeadshot,
  ]);

  useEffect(() => {
    setTeamLogoFailed(false);
  }, [teamLogo]);

  const initials =
    getInitials(
      playerName
    );

  const {
    firstName,
    lastName,
  } = splitPlayerName(
    playerName
  );

  const handleImageError =
    () => {
      const isSleeperImage =
        imageSource ===
        sleeperHeadshot;

      const hasStoredFallback =
        hasValue(
          storedHeadshot
        );

      if (
        isSleeperImage &&
        hasStoredFallback &&
        storedHeadshot !==
          sleeperHeadshot
      ) {
        setImageSource(
          storedHeadshot
        );

        return;
      }

      setImageFailed(true);
      setImageSource(null);
    };

  return (
    <article
      className="
        player-trading-card
        player-trading-card--front
        player-trading-card--tactical
      "
      style={cardStyle}
    >
      <div
        className="player-trading-card__foil"
        aria-hidden="true"
      />

      <div
        className="player-trading-card__edge-light"
        aria-hidden="true"
      />

      <div
        className="player-trading-card__inner-frame"
        aria-hidden="true"
      />

      <header className="player-trading-card__topbar">
        <div className="player-trading-card__brand">
          <span className="player-trading-card__brand-mark">
            FF
          </span>

          <div className="player-trading-card__brand-copy">
            <span>
              Fantasy
            </span>

            <strong>
              Draft Series
            </strong>
          </div>
        </div>

        <div className="player-trading-card__topbar-meta">
          {hasValue(
            jerseyNumber
          ) && (
            <span className="player-trading-card__jersey-number">
              #{jerseyNumber}
            </span>
          )}

          <span className="player-trading-card__position-badge">
            {position}
          </span>
        </div>
      </header>

      <div className="player-trading-card__portrait-zone">
        <div
          className="player-trading-card__portrait-background"
          aria-hidden="true"
        />

        <div
          className="player-trading-card__position-watermark"
          aria-hidden="true"
        >
          {position}
        </div>

        {teamLogo &&
!teamLogoFailed && (
  <img
    className="player-trading-card__logo-watermark"
    src={teamLogo}
    alt=""
    draggable="false"
    aria-hidden="true"
    onError={() =>
      setTeamLogoFailed(true)
    }
  />
)}

        <div
          className="player-trading-card__spotlight"
          aria-hidden="true"
        />

        <div className="player-trading-card__portrait">
          {imageSource &&
          !imageFailed ? (
            <img
              className="player-trading-card__portrait-image"
              src={
                imageSource
              }
              alt={
                playerName
              }
              draggable="false"
              onError={
                handleImageError
              }
            />
          ) : (
            <span className="player-trading-card__image-fallback">
              {initials}
            </span>
          )}
        </div>

        <div
          className="player-trading-card__portrait-fade"
          aria-hidden="true"
        />

        <div className="player-trading-card__team-chip">
          <span className="player-trading-card__team-chip-dot" />

          <span>
            {teamCode}
          </span>
        </div>
      </div>

      <footer className="player-trading-card__nameplate">
        <div
          className="player-trading-card__nameplate-shine"
          data-team-abbreviation={
            teamCode
          }
          aria-hidden="true"
        />

        <div className="player-trading-card__identity">
          {firstName && (
            <span className="player-trading-card__first-name">
              {firstName}
            </span>
          )}

          <span className="player-trading-card__last-name">
            {lastName}
          </span>

          <div className="player-trading-card__identity-meta">
            {teamCity && (
              <span className="player-trading-card__team-city">
                {teamCity}
              </span>
            )}

            <span className="player-trading-card__team-name">
              {teamName}
            </span>
          </div>
        </div>

        <div className="player-trading-card__team-logo">
  {teamLogo &&
  !teamLogoFailed ? (
    <img
      className="player-trading-card__team-logo-image"
      src={teamLogo}
      alt={`${safeTeam} logo`}
      draggable="false"
      onError={() =>
        setTeamLogoFailed(true)
      }
    />
  ) : (
    <span className="player-trading-card__team-logo-fallback">
      {teamCode}
    </span>
  )}
</div>
      </footer>

      <div className="player-trading-card__serial">
       
      </div>
    </article>
  );
}


function getLocalTeamLogo(
  team
) {
  const nflTeam =
    getNFLTeam(team);

  if (
    !nflTeam?.abbreviation
  ) {
    return null;
  }

  return `/assets/nfl/${nflTeam.abbreviation.toLowerCase()}.png`;
}


function PlayerCardBack({
  name,
  position,
  age,
  experience,
  seasonHistory,
  projectedFantasyPoints,
  previousPositionRank,
  cardStyle,
  onDraft,
  onDeselect,
  draftDisabled,
}) {
  const experienceText =
    formatExperience(
      experience
    );

  const projectionText =
    formatDecimal(
      projectedFantasyPoints
    );

  const rankText =
    hasValue(
      previousPositionRank
    )
      ? `#${previousPositionRank}`
      : "—";

  const latestSeason =
    seasonHistory?.[0] ??
    null;

  const latestPoints =
    latestSeason
      ? formatDecimal(
          latestSeason.points
        )
      : "—";

  const latestFinish =
    latestSeason &&
    hasValue(
      latestSeason.finish
    )
      ? latestSeason.finish
      : "—";

  return (
    <div
      className="
        player-trading-card
        player-trading-card--back
        player-trading-card--tactical
      "
      style={cardStyle}
    >
      <div
        className="player-trading-card__back-texture"
        aria-hidden="true"
      />

      <header className="player-trading-card__actions">
        <ReactiveButton
          type="button"
          variant="exit"
          size="small"
          className="
            player-trading-card__action-button
            player-trading-card__deselect
          "
          onClick={
            onDeselect
          }
          data-no-flip
          aria-label={`Deselect ${name}`}
          title="Deselect player"
        >
          ×
        </ReactiveButton>

        <ReactiveButton
          type="button"
          variant="accept"
          size="small"
          className="
            player-trading-card__action-button
            player-trading-card__draft
          "
          onClick={
            onDraft
          }
          disabled={
            draftDisabled
          }
          data-no-flip
        >
          Draft
        </ReactiveButton>
      </header>

      <section className="player-trading-card__back-identity">
        <span className="player-trading-card__back-eyebrow">
          Fantasy Player Profile
        </span>

        <div className="player-trading-card__back-title-row">
          <h3 className="player-trading-card__back-name">
            {name}
          </h3>

          <span className="player-trading-card__back-position">
            {position}
          </span>
        </div>
      </section>

      <section className="player-trading-card__back-feature">
        <div className="player-trading-card__projection-hero">
          <span className="player-trading-card__projection-label">
            Projected Fantasy Points
          </span>

          <strong className="player-trading-card__projection-value">
            {projectionText}
          </strong>

          <span className="player-trading-card__projection-unit">
            PTS
          </span>
        </div>

        <div className="player-trading-card__profile-metrics">
          <PlayerBioItem
            label="Age"
            value={
              age ?? "—"
            }
          />

          <PlayerBioItem
            label="Experience"
            value={
              experienceText
            }
          />

          <PlayerBioItem
            label="Prev Rank"
            value={
              rankText
            }
          />
        </div>
      </section>

      <section className="player-trading-card__season-summary">
        <div className="player-trading-card__season-summary-label">
          Previous Season
        </div>

        <div className="player-trading-card__season-summary-values">
          <div>
            <span>
              Points
            </span>

            <strong>
              {latestPoints}
            </strong>
          </div>

          <div>
            <span>
              Finish
            </span>

            <strong>
              {latestFinish}
            </strong>
          </div>
        </div>
      </section>

      <section className="player-trading-card__history">
        <div className="player-trading-card__history-header">
          <span>
            Season History
          </span>

          <small>
            Fantasy Record
          </small>
        </div>

        <div className="player-trading-card__history-columns">
          <span>
            YEAR
          </span>

          <span>
            FPTS
          </span>

          <span>
            FINISH
          </span>
        </div>

        <div className="player-trading-card__history-list">
          {seasonHistory.length >
          0 ? (
            seasonHistory.map(
              (
                season,
                index
              ) => (
                <SeasonRow
                  key={
                    season.year
                  }
                  season={
                    season
                  }
                  isLatest={
                    index === 0
                  }
                />
              )
            )
          ) : (
            <p className="player-trading-card__history-empty">
              No previous season data
            </p>
          )}
        </div>
      </section>

      <div
        className="player-trading-card__back-footer-line"
        aria-hidden="true"
      >
        <span>
          FF
        </span>

        <span>
          PLAYER SERIES
        </span>
      </div>
    </div>
  );
}

function PlayerBioItem({
  label,
  value,
}) {
  return (
    <div className="player-trading-card__bio-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function SeasonRow({
  season,
  isLatest = false,
}) {
  const points =
    formatDecimal(
      season.points
    );

  return (
    <div
      className={[
        "player-trading-card__season",
        isLatest
          ? "player-trading-card__season--latest"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="player-trading-card__season-year">
        {season.year}
      </span>

      <span className="player-trading-card__season-points">
        {points}
      </span>

      <span className="player-trading-card__season-finish">
        {hasValue(
          season.finish
        )
          ? season.finish
          : "—"}
      </span>
    </div>
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

function getPlayerName(
  player
) {
  return (
    player?.player_name ??
    player?.Player_Name ??
    player?.name ??
    "Unknown Player"
  );
}

function getPlayerPosition(
  player
) {
  return (
    player?.position
      ?.trim()
      ?.toUpperCase() ??
    "—"
  );
}

function buildSeasonHistory(
  player
) {
  if (
    Array.isArray(
      player.seasonHistory
    )
  ) {
    return player.seasonHistory.filter(
      (season) =>
        hasValue(
          season?.points
        )
    );
  }

  if (
    Array.isArray(
      player.season_history
    )
  ) {
    return player.season_history.filter(
      (season) =>
        hasValue(
          season?.points
        )
    );
  }

  return [
    {
      year: 2025,
      points:
        player.scoring_2025,
    },
    {
      year: 2024,
      points:
        player.scoring_2024,
    },
    {
      year: 2023,
      points:
        player.scoring_2023,
    },
    {
      year: 2022,
      points:
        player.scoring_2022,
    },
    {
      year: 2021,
      points:
        player.scoring_2021,
    },
  ].filter(
    (season) =>
      hasValue(
        season.points
      )
  );
}

function getTeamCode(
  team,
  abbreviation
) {
  if (
    abbreviation &&
    abbreviation.trim()
  ) {
    return abbreviation
      .trim()
      .slice(0, 3)
      .toUpperCase();
  }

  if (
    !team ||
    team === "Free Agent"
  ) {
    return "FA";
  }

  if (
    team.trim().length <= 3
  ) {
    return team
      .trim()
      .toUpperCase();
  }

  return team
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.charAt(0)
    )
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function splitTeamDisplayName(
  team
) {
  const normalizedTeam =
    String(
      team ?? ""
    )
      .trim()
      .replace(/\s+/g, " ");

  if (
    !normalizedTeam ||
    normalizedTeam ===
      "Free Agent"
  ) {
    return {
      teamCity: "",
      teamName:
        normalizedTeam ||
        "Free Agent",
    };
  }

  const parts =
    normalizedTeam.split(" ");

  if (
    parts.length === 1
  ) {
    return {
      teamCity: "",
      teamName:
        parts[0],
    };
  }

  return {
    teamCity:
      parts
        .slice(0, -1)
        .join(" "),

    teamName:
      parts[
        parts.length - 1
      ],
  };
}

function getInitials(
  name
) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function splitPlayerName(
  name
) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return {
      firstName: "",
      lastName:
        "Unknown Player",
    };
  }

  if (
    parts.length === 1
  ) {
    return {
      firstName: "",
      lastName:
        parts[0],
    };
  }

  return {
    firstName:
      parts
        .slice(0, -1)
        .join(" "),

    lastName:
      parts[
        parts.length - 1
      ],
  };
}

function formatExperience(
  experience
) {
  if (
    !hasValue(
      experience
    )
  ) {
    return "Rookie";
  }

  const numericExperience =
    Number(experience);

  if (
    !Number.isFinite(
      numericExperience
    ) ||
    numericExperience <= 0
  ) {
    return "Rookie";
  }

  if (
    numericExperience === 1
  ) {
    return "1 year";
  }

  return `${numericExperience} years`;
}

function formatDecimal(
  value
) {
  if (
    !hasValue(value)
  ) {
    return "—";
  }

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return String(value);
  }

  return numericValue.toFixed(
    1
  );
}

function hasValue(
  value
) {
  return (
    value !== null &&
    value !== undefined &&
    value !== ""
  );
}

const seasonHistoryShape =
  PropTypes.shape({
    year:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]).isRequired,

    points:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]).isRequired,

    finish:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
  });

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

    team:
      PropTypes.string,

    team_name:
      PropTypes.string,

    teamName:
      PropTypes.string,

    team_abbreviation:
      PropTypes.string,

    teamAbbreviation:
      PropTypes.string,

    team_code:
      PropTypes.string,

    teamCode:
      PropTypes.string,

    position:
      PropTypes.string,

    headshot:
      PropTypes.string,

    image:
      PropTypes.string,

    player_image:
      PropTypes.string,

    team_logo:
      PropTypes.string,

    teamLogo:
      PropTypes.string,

    jersey_number:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    jerseyNumber:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

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

    projected_fantasy_points:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    projectedFantasyPoints:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    previous_position_rank:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    previousPositionRank:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    teamColors:
      PropTypes.shape({
        primary:
          PropTypes.string,

        secondary:
          PropTypes.string,

        accent:
          PropTypes.string,
      }),

    team_colors:
      PropTypes.shape({
        primary:
          PropTypes.string,

        secondary:
          PropTypes.string,

        accent:
          PropTypes.string,
      }),

    seasonHistory:
      PropTypes.arrayOf(
        seasonHistoryShape
      ),

    season_history:
      PropTypes.arrayOf(
        seasonHistoryShape
      ),
  });

PlayerFlipCard.propTypes = {
  player:
    playerShape,

  onDeselect:
    PropTypes.func,

  onDraftPlayer:
    PropTypes.func,

  draftDisabled:
    PropTypes.bool,
  resetFlipKey:
    PropTypes.number,
};

PlayerCardFront.propTypes = {
  player:
    playerShape.isRequired,

  cardStyle:
    PropTypes.object.isRequired,
};

PlayerCardBack.propTypes = {
  name:
    PropTypes.string.isRequired,

  position:
    PropTypes.string.isRequired,

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

  seasonHistory:
    PropTypes.arrayOf(
      seasonHistoryShape
    ).isRequired,

  projectedFantasyPoints:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

  previousPositionRank:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

  cardStyle:
    PropTypes.object.isRequired,

  onDraft:
    PropTypes.func,

  onDeselect:
    PropTypes.func,

  draftDisabled:
    PropTypes.bool,
};

function getPlayerTeamValue(
  player
) {
  return (
    player?.team_abbreviation ??
    player?.teamAbbreviation ??
    player?.team_code ??
    player?.teamCode ??
    player?.team ??
    null
  );
}

PlayerBioItem.propTypes = {
  label:
    PropTypes.string.isRequired,

  value:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
};

SeasonRow.propTypes = {
  season:
    seasonHistoryShape.isRequired,

  isLatest:
    PropTypes.bool,
};

