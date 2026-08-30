import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./DraftTicker.css";

import {
  getNFLTeam,
  getTeamLogo,
  getTeamGradient,
  getContrastColor,
} from "./styles/nflTeams";

const dummyDraftPicks = [
  {
    player_id: "dummy-1",
    player_name: "Justin Jefferson",
    manager_name: "Gridiron Kings",
    team: "CAR",
    cost: 61,
  },
  {
    player_id: "dummy-2",
    player_name: "Ja’Marr Chase",
    manager_name: "Sunday Legends",
    team: "BAL",
    cost: 58,
  },
  {
    player_id: "dummy-3",
    player_name: "Bijan Robinson",
    manager_name: "Fourth & Long",
    team: "ATL",
    cost: 111,
  },
  {
    player_id: "dummy-4",
    player_name: "CeeDee Lamb",
    manager_name: "Promise Land FC",
    team: "ARI",
    cost: 52,
  },
  {
    player_id: "dummy-5",
    player_name: "Josh Allen",
    manager_name: "Buffalo Soldiers",
    team: "BUF",
    cost: 47,
  },
  {
    player_id: "dummy-6",
    player_name: "Amon-Ra St. Brown",
    manager_name: "Motor City Miracles",
    team: "DET",
    cost: 49,
  },
];

const digitSegments = {
  0: [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ],

  1: [
    "b",
    "c",
  ],

  2: [
    "a",
    "b",
    "g",
    "e",
    "d",
  ],

  3: [
    "a",
    "b",
    "c",
    "d",
    "g",
  ],

  4: [
    "f",
    "g",
    "b",
    "c",
  ],

  5: [
    "a",
    "f",
    "g",
    "c",
    "d",
  ],

  6: [
    "a",
    "f",
    "g",
    "e",
    "c",
    "d",
  ],

  7: [
    "a",
    "b",
    "c",
  ],

  8: [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
  ],

  9: [
    "a",
    "b",
    "c",
    "d",
    "f",
    "g",
  ],
};

const SEGMENT_NAMES = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
];

const SevenSegmentDigit = ({
  digit,
}) => {
  const activeSegments =
    digitSegments[digit] ?? [];

  return (
    <span
      className="dt-seven-segment-digit"
      aria-hidden="true"
    >
      {SEGMENT_NAMES.map(
        (segment) => (
          <span
            key={segment}
            className={[
              "dt-segment",
              `dt-segment-${segment}`,

              activeSegments.includes(
                segment
              )
                ? "is-active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        )
      )}
    </span>
  );
};

const SevenSegmentNumber = ({
  value,
}) => {
  const digits =
    String(value).split("");

  return (
    <span
      className="dt-seven-segment-number"
      aria-label={`${value}`}
    >
      <span className="dt-seven-segment-digits">
        {digits.map(
          (
            digit,
            index
          ) => (
            <SevenSegmentDigit
              key={`${digit}-${index}`}
              digit={
                Number(digit)
              }
            />
          )
        )}
      </span>
    </span>
  );
};

const DraftTicker = ({
  recentDraftPicks = [],
  useDummyData = false,
  defaultMessage =
    "Welcome to the Promise Lands",
  maxPicks = 6,
  pixelsPerSecond = 55,
}) => {
  const tickerWrapperRef =
    useRef(null);

  const tickerGroupRef =
    useRef(null);

  const [
    tickerMetrics,
    setTickerMetrics,
  ] = useState({
    groupWidth: 0,
    copyCount: 2,
  });

  /*
   * Use actual recent draft picks when
   * available. Dummy picks are only used
   * when explicitly requested.
   */
  const picksToShow =
    useMemo(() => {
      const availablePicks =
        Array.isArray(
          recentDraftPicks
        ) &&
        recentDraftPicks.length >
          0
          ? recentDraftPicks
          : useDummyData
            ? dummyDraftPicks
            : [];

      return availablePicks.slice(
        0,
        maxPicks
      );
    }, [
      recentDraftPicks,
      useDummyData,
      maxPicks,
    ]);

  /*
   * Measure one complete ticker group.
   *
   * We use that width for:
   * - animation distance
   * - animation duration
   * - number of duplicate groups required
   *   to keep the ticker continuously filled
   */
  useLayoutEffect(() => {
    const wrapper =
      tickerWrapperRef.current;

    const group =
      tickerGroupRef.current;

    if (
      !wrapper ||
      !group ||
      picksToShow.length === 0
    ) {
      setTickerMetrics({
        groupWidth: 0,
        copyCount: 2,
      });

      return undefined;
    }

    let animationFrameId;

    const updateMetrics =
      () => {
        cancelAnimationFrame(
          animationFrameId
        );

        animationFrameId =
          requestAnimationFrame(
            () => {
              const groupWidth =
                group
                  .getBoundingClientRect()
                  .width;

              const viewportWidth =
                wrapper
                  .getBoundingClientRect()
                  .width;

              if (
                groupWidth <= 0 ||
                viewportWidth <= 0
              ) {
                return;
              }

              /*
               * Always render enough repeated
               * groups to fully cover the
               * visible ticker viewport.
               */
              const copyCount =
                Math.max(
                  3,
                  Math.ceil(
                    viewportWidth /
                      groupWidth
                  ) + 2
                );

              setTickerMetrics(
                (current) => {
                  const sameWidth =
                    Math.abs(
                      current.groupWidth -
                        groupWidth
                    ) < 0.5;

                  if (
                    sameWidth &&
                    current.copyCount ===
                      copyCount
                  ) {
                    return current;
                  }

                  return {
                    groupWidth,
                    copyCount,
                  };
                }
              );
            }
          );
      };

    updateMetrics();

    /*
     * Older-browser fallback.
     */
    if (
      typeof ResizeObserver ===
      "undefined"
    ) {
      window.addEventListener(
        "resize",
        updateMetrics
      );

      return () => {
        cancelAnimationFrame(
          animationFrameId
        );

        window.removeEventListener(
          "resize",
          updateMetrics
        );
      };
    }

    const resizeObserver =
      new ResizeObserver(
        updateMetrics
      );

    resizeObserver.observe(
      wrapper
    );

    resizeObserver.observe(
      group
    );

    return () => {
      cancelAnimationFrame(
        animationFrameId
      );

      resizeObserver.disconnect();
    };
  }, [picksToShow]);

  /*
   * No draft picks yet.
   */
  if (
    picksToShow.length === 0
  ) {
    return (
      <div
        ref={tickerWrapperRef}
        className="ticker-wrapper"
        aria-label={
          defaultMessage
        }
      >
        <div className="ticker-fallback">
          <span className="ticker-fallback__text">
            {defaultMessage}
          </span>
        </div>
      </div>
    );
  }

  const validPixelsPerSecond =
    Number.isFinite(
      pixelsPerSecond
    ) &&
    pixelsPerSecond > 0
      ? pixelsPerSecond
      : 55;

  const {
    groupWidth,
    copyCount,
  } = tickerMetrics;

  /*
   * Keep perceived ticker speed constant
   * regardless of the total group width.
   */
  const animationDuration =
    groupWidth > 0
      ? groupWidth /
        validPixelsPerSecond
      : 0;

  const renderTickerItems =
    (copyName) =>
      picksToShow.map(
        (
          pick,
          index
        ) => {
          const teamData =
            getNFLTeam(
              pick.team
            );

          const teamLogo =
            getTeamLogo(
              pick.team
            );

          const teamPrimary =
            teamData?.primary ??
            "#333333";

          const itemStyle = {
            "--team-primary":
              teamPrimary,

            "--team-text-color":
              getContrastColor(
                teamPrimary
              ),

            background:
              getTeamGradient(
                pick.team
              ),
          };

          const normalizedPlayerName =
            typeof pick.player_name ===
            "string"
              ? pick.player_name.trim()
              : "";

          const nameParts =
            normalizedPlayerName
              .split(/\s+/)
              .filter(Boolean);

          const firstName =
            nameParts[0] ??
            "";

          const lastName =
            nameParts
              .slice(1)
              .join(" ") ||
            firstName;

          const displayFirstName =
            nameParts.length > 1
              ? firstName
              : "";

          const safeTeam =
            String(
              pick.team ?? ""
            )
              .trim()
              .toUpperCase();

          const itemKey =
            pick.player_id ??
            `${pick.player_name}-${pick.team}-${index}`;

          return (
            <article
              key={`${copyName}-${itemKey}`}
              className="ticker-item"
              style={
                itemStyle
              }
              title={`${pick.player_name} drafted by ${pick.manager_name} for $${pick.cost}`}
            >
              <img
                className="dt-team-logo"
                src={
                  teamLogo ||
                  `/assets/nfl/${safeTeam.toLowerCase()}.png`
                }
                alt=""
                aria-hidden="true"
              />

              <div
                className="dt-card-shade"
                aria-hidden="true"
              />

              <div className="dt-scoreboard">
                <section className="dt-player-panel">
                  <div className="dt-player-name">
                    {displayFirstName && (
                      <span className="dt-player-first-name">
                        {
                          displayFirstName
                        }
                      </span>
                    )}

                    <span className="dt-player-last-name">
                      {
                        lastName
                      }
                    </span>
                  </div>

                  <span
                    className="dt-team-code"
                    aria-hidden="true"
                  >
                    {
                      safeTeam
                    }
                  </span>
                </section>

                <div
                  className="dt-panel-transition"
                  aria-hidden="true"
                >
                  <span className="dt-transition-line" />
                  <span className="dt-transition-line" />
                  <span className="dt-transition-line" />
                </div>

                <section className="dt-manager-panel">
                  <span
                    className="
                      dt-panel-fastener
                      dt-panel-fastener-left
                    "
                    aria-hidden="true"
                  />

                  <span
                    className="
                      dt-panel-fastener
                      dt-panel-fastener-right
                    "
                    aria-hidden="true"
                  />

                  <span className="dt-manager-label">
                    Drafted by
                  </span>

                  <span className="dt-manager-name">
                    {
                      pick.manager_name
                    }
                  </span>
                </section>

                <section className="dt-cost-panel">
                  <span className="dt-cost-label">
                    Cost
                  </span>

                  <SevenSegmentNumber
                    value={
                      pick.cost
                    }
                  />
                </section>
              </div>
            </article>
          );
        }
      );

  return (
    <div
      ref={
        tickerWrapperRef
      }
      className="ticker-wrapper"
      aria-label="Recent fantasy football draft picks"
    >
      <div
        className={[
          "ticker-track",

          groupWidth > 0
            ? "is-ready"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          "--ticker-duration":
            `${animationDuration}s`,

          "--ticker-distance":
            `${groupWidth}px`,
        }}
      >
        {Array.from(
          {
            length:
              copyCount,
          },

          (
            _,
            copyIndex
          ) => (
            <div
              key={`ticker-copy-${copyIndex}`}
              ref={
                copyIndex === 0
                  ? tickerGroupRef
                  : undefined
              }
              className="ticker-group"
              aria-hidden={
                copyIndex === 0
                  ? undefined
                  : "true"
              }
            >
              {renderTickerItems(
                `copy-${copyIndex}`
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DraftTicker;

