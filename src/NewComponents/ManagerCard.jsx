import PropTypes from "prop-types";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ManagerCard.css";

const TOOLTIP_POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const TOOLTIP_OPEN_DELAY = 300;
const TOOLTIP_CLOSE_DELAY = 100;

const VALID_AUCTION_STATUSES =
  new Set([
    "required",
    "optional",
    "closed",
  ]);

const VALID_MANAGER_STATUSES =
  new Set([
    "active",
    "warning",
    "inactive",
  ]);

const VALID_STRENGTH_TIERS =
  new Set([
    "elite",
    "strong",
    "average",
    "developing",
    "provisional",
    "unranked",
  ]);

const AutoFitText = ({
  children,
  className = "",
  minimumSize = 8,
  maximumSize = 16,
}) => {
  const containerRef =
    useRef(null);

  const [
    fontSize,
    setFontSize,
  ] = useState(
    maximumSize
  );

  useEffect(() => {
    const element =
      containerRef.current;

    if (!element) {
      return undefined;
    }

    const fitText = () => {
      let nextSize =
        maximumSize;

      element.style.fontSize =
        `${nextSize}px`;

      while (
        element.scrollWidth >
          element.clientWidth &&
        nextSize >
          minimumSize
      ) {
        nextSize -= 0.5;

        element.style.fontSize =
          `${nextSize}px`;
      }

      setFontSize(
        nextSize
      );
    };

    fitText();

    if (
      typeof ResizeObserver ===
      "undefined"
    ) {
      window.addEventListener(
        "resize",
        fitText
      );

      return () => {
        window.removeEventListener(
          "resize",
          fitText
        );
      };
    }

    const resizeObserver =
      new ResizeObserver(
        fitText
      );

    resizeObserver.observe(
      element
    );

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    children,
    minimumSize,
    maximumSize,
  ]);

  return (
    <span
      ref={containerRef}
      className={className}
      style={{
        fontSize:
          `${fontSize}px`,
      }}
    >
      {children}
    </span>
  );
};

AutoFitText.propTypes = {
  children:
    PropTypes.node
      .isRequired,

  className:
    PropTypes.string,

  minimumSize:
    PropTypes.number,

  maximumSize:
    PropTypes.number,
};

const ManagerCard = ({
  manager,
  isSelected = false,
  isTooltipOpen = false,
  onTooltipOpen,
  onTooltipClose,
  tooltipPlacement = "above",
  onClick,
}) => {
  const tooltipId =
    useId();

  const openTimerRef =
    useRef(null);

  const closeTimerRef =
    useRef(null);

  const {
    manager_id,

    manager_name =
      "Unknown Manager",

    available_budget = 0,
    max_bid = 0,

    roster_count = 0,
    roster_capacity = 0,

    roster_makeup = [],

    last_pick_player_name = null,
    last_pick_price = null,
    last_pick_estimated_value = null,
    last_pick_value = null,

    team_archetype =
      "Forming Identity",

    strength_rank = null,
    strength_field_size = 0,
    strength_score = 0,
    strength_filled_slots = 0,

    strength_tier =
      "unranked",

    strength_total_projected_points = 0,
    strength_position_breakdown = {},

    status = "active",
  } = manager ?? {};

  const normalizedStatus =
    VALID_MANAGER_STATUSES.has(
      status
    )
      ? status
      : "active";

  const normalizedStrengthTier =
    VALID_STRENGTH_TIERS.has(
      strength_tier
    )
      ? strength_tier
      : "unranked";

  const safeRosterMakeup =
    useMemo(
      () =>
        Array.isArray(
          roster_makeup
        )
          ? roster_makeup
          : [],
      [roster_makeup]
    );

  const safeStrengthPositionBreakdown =
    strength_position_breakdown &&
    typeof strength_position_breakdown ===
      "object" &&
    !Array.isArray(
      strength_position_breakdown
    )
      ? strength_position_breakdown
      : {};

  const safeAvailableBudget =
    toSafeNumber(
      available_budget
    );

  const safeMaxBid =
    toSafeNumber(
      max_bid
    );

  const safeRosterCount =
    toSafeNumber(
      roster_count
    );

  const safeRosterCapacity =
    toSafeNumber(
      roster_capacity
    );

  const safeStrengthScore =
    toSafeNumber(
      strength_score
    );

  const safeProjectedPoints =
    toSafeNumber(
      strength_total_projected_points
    );

  const safeStrengthFilledSlots =
    toSafeNumber(
      strength_filled_slots
    );

  const safeStrengthFieldSize =
    toSafeNumber(
      strength_field_size
    );

  const isRosterFull =
    safeRosterCapacity > 0 &&
    safeRosterCount >=
      safeRosterCapacity;

  const hasMeaningfulStrength =
    safeStrengthFilledSlots >=
    3;

  const strengthRankNumber =
    strength_rank == null
      ? null
      : toSafeNumber(
          strength_rank
        );

  const hasStrengthRank =
    strengthRankNumber != null &&
    strengthRankNumber > 0 &&
    safeStrengthFieldSize > 0;

  const strengthRankLabel =
    hasStrengthRank
      ? `#${strengthRankNumber}`
      : "—";

  const classNames = [
    "manager-card",

    isSelected &&
      "manager-card--selected",

    `manager-card--${normalizedStatus}`,

    `manager-card--strength-${normalizedStrengthTier}`,

    isRosterFull &&
      "manager-card--locked",
  ]
    .filter(Boolean)
    .join(" ");

  const hasLastPickValue =
    last_pick_value !==
      null &&
    last_pick_value !==
      undefined &&
    last_pick_value !== "";

  const safeLastPickValue =
    hasLastPickValue
      ? toSafeNumber(
          last_pick_value
        )
      : null;

  const lastPickValueDirection =
    !hasLastPickValue
      ? "empty"
      : safeLastPickValue > 0
        ? "positive"
        : safeLastPickValue < 0
          ? "negative"
          : "even";

  const lastPickValueLabel =
    !hasLastPickValue
      ? "No pick yet"
      : safeLastPickValue === 0
        ? "Even Value"
        : `${
            safeLastPickValue >
            0
              ? "+"
              : "−"
          }$${Math.abs(
            safeLastPickValue
          ).toFixed(0)}`;

  const lastPickTitle =
    hasLastPickValue
      ? `${
          last_pick_player_name ??
          "Last pick"
        }: valued at $${toSafeNumber(
          last_pick_estimated_value
        ).toFixed(
          0
        )}, drafted for $${toSafeNumber(
          last_pick_price
        ).toFixed(
          0
        )}`
      : "No player has been drafted yet";

  const tooltipPositions =
    TOOLTIP_POSITIONS.map(
      (position) => {
        const positionData =
          safeStrengthPositionBreakdown[
            position
          ] ?? {};

        const rank =
          positionData.rank == null
            ? null
            : toSafeNumber(
                positionData.rank
              );

        return {
          position,

          playerCount:
            toSafeNumber(
              positionData.playerCount
            ),

          projectedPoints:
            toSafeNumber(
              positionData.projectedPoints
            ),

          averagePercentile:
            toSafeNumber(
              positionData.averagePercentile
            ),

          rank:
            rank && rank > 0
              ? rank
              : null,

          fieldSize:
            toSafeNumber(
              positionData.fieldSize
            ),
        };
      }
    );

  const clearTooltipTimers =
    useCallback(() => {
      if (
        openTimerRef.current !=
        null
      ) {
        window.clearTimeout(
          openTimerRef.current
        );

        openTimerRef.current =
          null;
      }

      if (
        closeTimerRef.current !=
        null
      ) {
        window.clearTimeout(
          closeTimerRef.current
        );

        closeTimerRef.current =
          null;
      }
    }, []);

  const handleTooltipEnter =
    useCallback(() => {
      clearTooltipTimers();

      openTimerRef.current =
        window.setTimeout(
          () => {
            openTimerRef.current =
              null;

            onTooltipOpen?.();
          },
          TOOLTIP_OPEN_DELAY
        );
    }, [
      clearTooltipTimers,
      onTooltipOpen,
    ]);

  const handleTooltipLeave =
    useCallback(() => {
      clearTooltipTimers();

      closeTimerRef.current =
        window.setTimeout(
          () => {
            closeTimerRef.current =
              null;

            onTooltipClose?.();
          },
          TOOLTIP_CLOSE_DELAY
        );
    }, [
      clearTooltipTimers,
      onTooltipClose,
    ]);

  const handleCardClick =
    useCallback(() => {
      clearTooltipTimers();

      onTooltipClose?.();
      onClick?.(
        manager_id
      );
    }, [
      clearTooltipTimers,
      manager_id,
      onClick,
      onTooltipClose,
    ]);

  useEffect(() => {
    return () => {
      clearTooltipTimers();
    };
  }, [
    clearTooltipTimers,
  ]);

  return (
    <span
      className={[
        "manager-card-shell",

        isTooltipOpen &&
          "manager-card-shell--tooltip-open",

        `manager-card-shell--tooltip-${tooltipPlacement}`,
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={
        handleTooltipEnter
      }
      onMouseLeave={
        handleTooltipLeave
      }
      onFocus={
        handleTooltipEnter
      }
      onBlur={
        handleTooltipLeave
      }
    >
      <button
        type="button"
        className={
          classNames
        }
        data-manager-card={manager_id}
        data-strength-rank={
          isRosterFull &&
          hasStrengthRank
            ? strengthRankLabel
            : ""
        }
        onClick={
          handleCardClick
        }
        aria-pressed={
          isSelected
        }
        aria-describedby={
          isTooltipOpen
            ? tooltipId
            : undefined
        }
      >
        <span
          className="manager-card__texture"
          aria-hidden="true"
        />

        <span className="manager-card__main">
          <span className="manager-card__roster">
            <span className="manager-card__section-label">
              Roster
            </span>

            <span className="manager-card__roster-list">
              {safeRosterMakeup.map(
                (
                  slot,
                  index
                ) => {
                  const position =
                    normalizeUppercase(
                      slot?.position
                    );

                  const count =
                    toSafeNumber(
                      slot?.count
                    );

                  const required =
                    toSafeNumber(
                      slot?.required
                    );

                  const limit =
                    toSafeNumber(
                      slot?.limit
                    );

                  const auctionStatus =
                    VALID_AUCTION_STATUSES.has(
                      slot?.auctionStatus
                    )
                      ? slot.auctionStatus
                      : "required";

                  const startersRemaining =
                    Math.max(
                      required -
                        count,
                      0
                    );

                  const statusLabel =
                    auctionStatus ===
                    "closed"
                      ? "Position filled"
                      : auctionStatus ===
                          "optional"
                        ? "Optional position"
                        : `${startersRemaining} starter${
                            startersRemaining ===
                            1
                              ? ""
                              : "s"
                          } required`;

                  return (
                    <span
                      key={
                        position ||
                        `slot-${index}`
                      }
                      className={[
                        "manager-card__roster-slot",
                        `manager-card__roster-slot--${auctionStatus}`,
                      ].join(
                        " "
                      )}
                      title={
                        statusLabel
                      }
                      data-position={
                        position
                      }
                      data-status={
                        auctionStatus
                      }
                    >
                      <span className="manager-card__roster-position">
                        {
                          position ||
                          "—"
                        }
                      </span>

                      <span className="manager-card__roster-value">
                        {count}/
                        {limit}
                      </span>
                    </span>
                  );
                }
              )}
            </span>

          </span>

          <span className="manager-card__center">
            <span className="manager-card__budget">
              <span className="manager-card__budget-label">
                Max Bid
              </span>

              <span className="manager-card__budget-value">
                $
                {safeMaxBid.toFixed(
                  0
                )}
              </span>

              <span className="manager-card__budget-details">
                <span className="manager-card__budget-detail">
                  <span className="manager-card__budget-detail-label">
                    Budget
                  </span>

                  <span className="manager-card__budget-detail-value">
                    $
                    {safeAvailableBudget.toFixed(
                      0
                    )}
                  </span>
                </span>

                <span className="manager-card__budget-detail manager-card__budget-detail--players">
                  <span className="manager-card__budget-detail-label">
                    Players
                  </span>

                  <span className="manager-card__budget-detail-value">
                    {safeRosterCount}/
                    {safeRosterCapacity}
                  </span>
                </span>
              </span>
            </span>

            <span className="manager-card__identity">
              <span
                className="manager-card__identity-texture"
                aria-hidden="true"
              />

              <AutoFitText
                className="manager-card__name"
                minimumSize={8}
                maximumSize={16}
              >
                {
                  manager_name
                }
              </AutoFitText>
            </span>
          </span>

          <span className="manager-card__strength">
            <span className="manager-card__strength-archetype">
              <span className="manager-card__strength-archetype-label">
                Archetype
              </span>

              <AutoFitText
                className="manager-card__strength-archetype-value"
                minimumSize={9}
                maximumSize={11}
              >
                {
                  team_archetype
                }
              </AutoFitText>
            </span>

            <span className="manager-card__strength-ranking">
              <span className="manager-card__strength-ranking-label">
                Strength Rank
              </span>

              <strong className="manager-card__strength-rank">
                {
                  strengthRankLabel
                }
              </strong>
            </span>

            <span
              className={[
                "manager-card__pick-value",
                `manager-card__pick-value--${lastPickValueDirection}`,
              ].join(
                " "
              )}
              title={
                lastPickTitle
              }
            >
              <span className="manager-card__pick-value-label">
                Last Pick
              </span>

              <strong className="manager-card__pick-value-amount">
                {
                  lastPickValueLabel
                }
              </strong>
            </span>
          </span>
        </span>
      </button>

      <span
        id={
          tooltipId
        }
        className="manager-card-tooltip"
        role="tooltip"
        aria-hidden={
          !isTooltipOpen
        }
      >
        <span className="manager-card-tooltip__header">
          <span className="manager-card-tooltip__eyebrow">
            Projected Total
          </span>

          <span className="manager-card-tooltip__total">
            {safeProjectedPoints.toFixed(
              1
            )}
          </span>

          <span className="manager-card-tooltip__total-label">
            fantasy points
          </span>
        </span>

        <span className="manager-card-tooltip__summary">
          <span className="manager-card-tooltip__summary-item">
            <span className="manager-card-tooltip__summary-label">
              Team Grade
            </span>

            <strong className="manager-card-tooltip__summary-value">
              {hasMeaningfulStrength
                ? safeStrengthScore.toFixed(
                    1
                  )
                : "Building"}
            </strong>
          </span>

          <span className="manager-card-tooltip__summary-item">
            <span className="manager-card-tooltip__summary-label">
              Overall
            </span>

            <strong className="manager-card-tooltip__summary-value">
              {
                strengthRankLabel
              }
            </strong>
          </span>

          <span className="manager-card-tooltip__summary-item">
            <span className="manager-card-tooltip__summary-label">
              Drafted
            </span>

            <strong className="manager-card-tooltip__summary-value">
              {safeRosterCount}/
              {safeRosterCapacity}
            </strong>
          </span>
        </span>

        <span className="manager-card-tooltip__divider" />

        <span className="manager-card-tooltip__table-header">
          <span>
            Position
          </span>

          <span>
            Points
          </span>

          <span>
            Rank
          </span>
        </span>

        <span className="manager-card-tooltip__positions">
          {tooltipPositions.map(
            (
              positionData
            ) => (
              <span
                key={
                  positionData.position
                }
                className="manager-card-tooltip__position-row"
              >
                <span className="manager-card-tooltip__position-name">
                  <strong>
                    {
                      positionData.position
                    }
                  </strong>

                  <small>
                    {
                      positionData.playerCount
                    }
                  </small>
                </span>

                <span className="manager-card-tooltip__position-points">
                  {positionData.projectedPoints.toFixed(
                    1
                  )}
                </span>

                <span className="manager-card-tooltip__position-rank">
                  {positionData.rank
                    ? `#${positionData.rank}`
                    : "—"}
                </span>
              </span>
            )
          )}
        </span>

        <span className="manager-card-tooltip__footer">
          Starters and active bench players
        </span>
      </span>
    </span>
  );
};

function normalizeUppercase(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();
}

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

const numberOrString =
  PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]);

ManagerCard.propTypes = {
  manager:
    PropTypes.shape({
      manager_id:
        numberOrString
          .isRequired,

      manager_name:
        PropTypes.string
          .isRequired,

      available_budget:
        numberOrString,

      max_bid:
        numberOrString,

      roster_count:
        numberOrString,

      roster_capacity:
        numberOrString,

      roster_makeup:
        PropTypes.arrayOf(
          PropTypes.shape({
            position:
              PropTypes.string
                .isRequired,

            count:
              numberOrString
                .isRequired,

            required:
              numberOrString,

            limit:
              numberOrString
                .isRequired,

            auctionStatus:
              PropTypes.oneOf([
                "required",
                "optional",
                "closed",
              ]),

            activeBenchFilled:
              numberOrString,

            activeBenchLimit:
              numberOrString,
          })
        ),

      last_pick_player_name:
        PropTypes.string,

      last_pick_price:
        numberOrString,

      last_pick_estimated_value:
        numberOrString,

      last_pick_value:
        numberOrString,

      team_archetype:
        PropTypes.string,

      strength_rank:
        numberOrString,

      strength_field_size:
        numberOrString,

      strength_score:
        numberOrString,

      strength_filled_slots:
        numberOrString,

      strength_total_slots:
        numberOrString,

      strength_is_provisional:
        PropTypes.bool,

      strength_total_projected_points:
        numberOrString,

      strength_position_breakdown:
        PropTypes.objectOf(
          PropTypes.shape({
            position:
              PropTypes.string,

            playerCount:
              numberOrString,

            projectedPoints:
              numberOrString,

            averagePercentile:
              numberOrString,

            rank:
              numberOrString,

            fieldSize:
              numberOrString,
          })
        ),

      strength_tier:
        PropTypes.oneOf([
          "elite",
          "strong",
          "average",
          "developing",
          "provisional",
          "unranked",
        ]),

      status:
        PropTypes.oneOf([
          "active",
          "warning",
          "inactive",
        ]),
    }).isRequired,

  isSelected:
    PropTypes.bool,

  isTooltipOpen:
    PropTypes.bool,

  onTooltipOpen:
    PropTypes.func,

  onTooltipClose:
    PropTypes.func,

  tooltipPlacement:
    PropTypes.oneOf([
      "above",
      "below",
    ]),

  onClick:
    PropTypes.func,
};

export default ManagerCard;