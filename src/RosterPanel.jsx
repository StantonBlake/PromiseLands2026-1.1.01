import {
  useMemo,
} from "react";

import PropTypes from "prop-types";

import "./RosterPanel.css";

const RosterPanel = ({
  managers,
  draftEntries,
  leagueSettings,
}) => {
  const safeManagers =
    Array.isArray(managers)
      ? managers
      : [];

  const safeDraftEntries =
    Array.isArray(draftEntries)
      ? draftEntries
      : [];

  const sortedManagers =
    useMemo(() => {
      return [
        ...safeManagers,
      ].sort(
        (
          firstManager,
          secondManager
        ) =>
          getManagerName(
            firstManager
          ).localeCompare(
            getManagerName(
              secondManager
            )
          )
      );
    }, [
      safeManagers,
    ]);

  if (
    sortedManagers.length ===
    0
  ) {
    return (
      <div className="roster-panel__empty">
        No managers were found.
      </div>
    );
  }

  return (
    <div className="roster-panel">
      <div
        className="roster-panel__grid"
        aria-label="League rosters"
      >
        {sortedManagers.map(
          (manager) => (
            <RosterManagerCard
              key={
                getManagerId(
                  manager
                )
              }
              manager={
                manager
              }
              draftEntries={
                safeDraftEntries
              }
              leagueSettings={
                leagueSettings
              }
            />
          )
        )}
      </div>
    </div>
  );
};

const RosterManagerCard = ({
  manager,
  draftEntries,
  leagueSettings,
}) => {
  const managerId =
    getManagerId(
      manager
    );

  const playerAssignments =
    Array.isArray(
      manager
        .roster_assignments
    )
      ? manager
          .roster_assignments
      : [];

  const specialAssignments =
    getSpecialAssignments({
      managerId,
      draftEntries,
    });
    const rosterSlots =
    buildRosterSlots({
      assignments: [
        ...playerAssignments,
        ...specialAssignments,
      ],

      leagueSettings,
    });
    
  const filledSlots =
    rosterSlots.filter(
      (slot) =>
        Boolean(
          slot.assignment
        )
    ).length;

  const totalSlots =
    rosterSlots.length;

  const completionPercent =
    totalSlots > 0
      ? Math.round(
          (
            filledSlots /
            totalSlots
          ) *
            100
        )
      : 0;

  const leftSlots =
    rosterSlots.filter(
      (
        _,
        index
      ) =>
        index <
        Math.ceil(
          rosterSlots.length /
            2
        )
    );

  const rightSlots =
    rosterSlots.filter(
      (
        _,
        index
      ) =>
        index >=
        Math.ceil(
          rosterSlots.length /
            2
        )
    );

  return (
    <article className="roster-card">
      <header className="roster-card__header">
        <div className="roster-card__manager-block">
          <p className="roster-card__eyebrow">
            Manager
          </p>

          <h2
            className="roster-card__manager"
            title={
              getManagerName(
                manager
              )
            }
          >
            {
              getManagerName(
                manager
              )
            }
          </h2>
        </div>

        <div className="roster-card__completion">
          <strong>
            {filledSlots}
          </strong>

          <span>
            /{totalSlots}
          </span>
        </div>
      </header>

      <div className="roster-card__progress">
        <span
          style={{
            width:
              `${completionPercent}%`,
          }}
        />
      </div>

      <div className="roster-card__metrics">
        <RosterMetric
          label="Budget"
          value={formatCurrency(
            manager.available_budget
          )}
        />

        <RosterMetric
          label="Max"
          value={formatCurrency(
            manager.max_bid
          )}
        />

        <RosterMetric
          label="Spent"
          value={formatCurrency(
            manager.amount_spent
          )}
        />

        <RosterMetric
          label="Rank"
          value={
            manager.strength_rank
              ? `#${manager.strength_rank}`
              : "—"
          }
        />
      </div>

      <div className="roster-card__slot-columns">
        <div className="roster-card__slot-column">
          {leftSlots.map(
            (slot) => (
              <RosterSlot
                key={
                  slot.slot
                }
                slot={
                  slot
                }
              />
            )
          )}
        </div>

        <div className="roster-card__slot-column">
          {rightSlots.map(
            (slot) => (
              <RosterSlot
                key={
                  slot.slot
                }
                slot={
                  slot
                }
              />
            )
          )}
        </div>
      </div>

      <footer className="roster-card__footer">
        <span>
          Strength
        </span>

        <strong>
          {toSafeNumber(
            manager.strength_score
          ) > 0
            ? toSafeNumber(
                manager.strength_score
              ).toFixed(1)
            : "—"}
        </strong>

        <span className="roster-card__tier">
          {
            formatTier(
              manager.strength_tier
            )
          }
        </span>
      </footer>
    </article>
  );
};

const RosterMetric = ({
  label,
  value,
}) => (
  <div className="roster-metric">
    <span>
      {label}
    </span>

    <strong>
      {value}
    </strong>
  </div>
);

const RosterSlot = ({
  slot,
}) => {
  const assignment =
    slot.assignment;

  const slotGroup =
    getSlotGroup(
      slot.slot
    );

  const slotClassNames = [
    "roster-slot",

    assignment
      ? "roster-slot--filled"
      : "roster-slot--empty",

    `roster-slot--${slotGroup.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={
        slotClassNames
      }
    >
      <span className="roster-slot__label">
        {formatRosterSlotLabel(
          slot.slot
        )}
      </span>

      <span
        className="roster-slot__name"
        title={
          assignment
            ?.player_name ??
          "Open roster spot"
        }
      >
        {assignment
          ?.player_name ??
          "OPEN"}
      </span>

      {assignment
        ?.auction_value !=
        null ? (
        <span className="roster-slot__price">
          {formatCurrency(
            assignment
              .auction_value
          )}
        </span>
      ) : (
        <span
          className="
            roster-slot__price
            roster-slot__price--empty
          "
        >
          —
        </span>
      )}
    </div>
  );
};

function buildRosterSlots({
  assignments,
  leagueSettings,
}) {
  const slotNames = [
    ...createNumberedSlots(
      "QB",
      leagueSettings
        ?.starters?.qb
    ),

    ...createNumberedSlots(
      "RB",
      leagueSettings
        ?.starters?.rb
    ),

    ...createNumberedSlots(
      "WR",
      leagueSettings
        ?.starters?.wr
    ),

    ...createNumberedSlots(
      "TE",
      leagueSettings
        ?.starters?.te
    ),

    ...createNumberedSlots(
      "ABN",
      leagueSettings
        ?.starters?.abn
    ),

    ...createNumberedSlots(
      "SBN",
      leagueSettings
        ?.starters?.sbn
    ),

    "K1",
    "DEF1",
    
  ];

  const assignmentMap =
    new Map();

  assignments.forEach(
    (assignment) => {
      const slot =
        normalizeSlot(
          assignment
            .drafted_as ??
            assignment
              .draft_slot
        );

      if (!slot) {
        return;
      }

      assignmentMap.set(
        slot,
        assignment
      );
    }
  );

  return slotNames.map(
    (slot) => ({
      slot,

      assignment:
        assignmentMap.get(
          slot
        ) ?? null,
    })
  );
}


function getSlotGroup(
  slot
) {
  return String(
    slot ?? ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /\d+$/,
      ""
    );
}

function formatRosterSlotLabel(
  slot
) {
  const slotGroup =
    getSlotGroup(
      slot
    );

  if (
    slotGroup ===
      "ABN" ||
    slotGroup ===
      "SBN"
  ) {
    return "BN";
  }

  return (
    slotGroup ||
    "—"
  );
}


function getSpecialAssignments({
  managerId,
  draftEntries,
}) {
  return draftEntries
    .filter((entry) => {
      const entryType =
        String(
          entry.entry_type ??
            ""
        )
          .trim()
          .toUpperCase();

      return (
        String(
          entry.manager_id
        ) ===
          String(
            managerId
          ) &&
        [
          "K",
          "DEF",
        ].includes(
          entryType
        )
      );
    })
    .map((entry) => {
      const entryType =
        String(
          entry.entry_type ??
            ""
        )
          .trim()
          .toUpperCase();

      return {
        ...entry,

        player_name:
          entry.entry_label ??
          (
            entryType ===
            "K"
              ? "Kicker"
              : "Team Defense"
          ),

        position:
          entryType,

        drafted_as:
          entry.draft_slot ??
          `${entryType}1`,
      };
    });
}

function createNumberedSlots(
  prefix,
  amount
) {
  const count =
    Math.max(
      Math.floor(
        toSafeNumber(
          amount
        )
      ),
      0
    );

  return Array.from(
    {
      length: count,
    },
    (
      _,
      index
    ) =>
      `${prefix}${
        index + 1
      }`
  );
}

function getManagerId(
  manager
) {
  return (
    manager?.manager_id ??
    manager?.Manager_ID ??
    manager?.id
  );
}

function getManagerName(
  manager
) {
  return (
    manager?.manager_name ??
    manager?.Manager_Name ??
    manager?.name ??
    "Unknown Manager"
  );
}

function normalizeSlot(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();
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

function formatTier(
  value
) {
  const normalizedValue =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  if (!normalizedValue) {
    return "Unranked";
  }

  return (
    normalizedValue
      .charAt(0)
      .toUpperCase() +
    normalizedValue.slice(1)
  );
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

RosterPanel.propTypes = {
  managers:
    PropTypes.array,

  draftEntries:
    PropTypes.array,

  leagueSettings:
    PropTypes.object,
};

RosterManagerCard.propTypes = {
  manager:
    PropTypes.object
      .isRequired,

  draftEntries:
    PropTypes.array
      .isRequired,

  leagueSettings:
    PropTypes.object,
};

RosterMetric.propTypes = {
  label:
    PropTypes.string
      .isRequired,

  value:
    PropTypes.string
      .isRequired,
};

RosterSlot.propTypes = {
  slot:
    PropTypes.shape({
      slot:
        PropTypes.string
          .isRequired,

      assignment:
        PropTypes.object,
    }).isRequired,
};

export default RosterPanel;