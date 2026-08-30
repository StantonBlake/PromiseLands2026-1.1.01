
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import "./DraftModal.css";

export default function DraftModal({
  isOpen,
  player,
  managers = [],
  selectedManager = null,
  selectedManagerId = null,
  onClose,
  onDraft,
}) {
  const [
    managerId,
    setManagerId,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const playerId =
    getPlayerId(player);

  const playerName =
    getPlayerName(player);

  const playerPosition =
    getPlayerPosition(player);

  const playerTeam =
    getPlayerTeam(player);

  const playerHeadshot =
    getPlayerHeadshot(player);

  const normalizedManagers =
    useMemo(
      () =>
        managers
          .map((manager) => ({
            original:
              manager,

            id:
              getManagerId(
                manager
              ),

            name:
              getManagerName(
                manager
              ),
          }))
          .filter(
            (manager) =>
              hasValue(
                manager.id
              )
          ),
      [managers]
    );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isOpen,
    onClose,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setManagerId("");
      setAmount("");
      setError("");

      return;
    }

    const initialManagerId =
      selectedManagerId ??
      getManagerId(
        selectedManager
      );

    setManagerId(
      hasValue(
        initialManagerId
      )
        ? String(
            initialManagerId
          )
        : ""
    );

    setAmount("");
    setError("");
  }, [
    isOpen,
    selectedManager,
    selectedManagerId,
    playerId,
  ]);

  if (
    !isOpen ||
    !player
  ) {
    return null;
  }

  const handleAmountChange = (
    event
  ) => {
    const numericValue =
      event.target.value.replace(
        /\D/g,
        ""
      );

    setAmount(
      numericValue
    );

    setError("");
  };

  const handleManagerChange = (
    event
  ) => {
    setManagerId(
      event.target.value
    );

    setError("");
  };

  const handleOverlayClick = (
    event
  ) => {
    if (
      event.target ===
      event.currentTarget
    ) {
      onClose?.();
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!managerId) {
      setError(
        "Select a manager."
      );

      return;
    }

    if (!amount) {
      setError(
        "Enter a draft amount."
      );

      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount < 0
    ) {
      setError(
        "Enter a valid draft amount."
      );

      return;
    }

    const normalizedManager =
      normalizedManagers.find(
        (manager) =>
          String(
            manager.id
          ) ===
          String(
            managerId
          )
      );

    if (
      !normalizedManager
    ) {
      setError(
        "The selected manager could not be found."
      );

      return;
    }

    try {
      await onDraft?.({
        player,
        manager:
          normalizedManager.original,
        managerId:
          normalizedManager.id,
        amount:
          numericAmount,
      });

      onClose?.();
    } catch (draftError) {
      console.error(
        "Unable to draft player:",
        draftError
      );
    
      setError(
        draftError?.message ||
          "The draft could not be completed."
      );
    }
  };

  return createPortal(
    <div
      className="draft-modal-overlay"
      onMouseDown={
        handleOverlayClick
      }
    >
      <section
        className="draft-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-modal-title"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="draft-modal__close"
          onClick={
            onClose
          }
          aria-label="Close draft modal"
        >
          ×
        </button>

        <div className="draft-modal__header">
          <span className="draft-modal__eyebrow">
            Fantasy Draft
          </span>

          <h2
            id="draft-modal-title"
            className="draft-modal__title"
          >
            Draft {playerName}
          </h2>

          <p className="draft-modal__subtitle">
            Assign this player to a manager and enter the winning bid.
          </p>
        </div>

        <div className="draft-modal__player">
          <PlayerAvatar
            image={
              playerHeadshot
            }
            name={
              playerName
            }
          />

          <div className="draft-modal__player-details">
            <strong>
              {playerName}
            </strong>

            <span>
              {playerPosition}

              {playerTeam
                ? ` · ${playerTeam}`
                : ""}
            </span>
          </div>
        </div>

        <form
          className="draft-modal__form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="draft-modal__group">
            <span className="draft-modal__label">
              Manager
            </span>

            <div className="draft-modal__control">
              <svg
                className="draft-modal__control-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
              </svg>

              <select
                value={
                  managerId
                }
                onChange={
                  handleManagerChange
                }
                className="draft-modal__select"
              >
                <option value="">
                  Select a manager
                </option>

                {normalizedManagers.map(
                  (manager) => (
                    <option
                      key={
                        manager.id
                      }
                      value={
                        manager.id
                      }
                    >
                      {manager.name}
                    </option>
                  )
                )}
              </select>

              <svg
                className="draft-modal__chevron"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m7 10 5 5 5-5H7Z" />
              </svg>
            </div>
          </label>

          <label className="draft-modal__group">
            <span className="draft-modal__label">
              Winning bid
            </span>

            <div className="draft-modal__control">
              <span className="draft-modal__currency">
                $
              </span>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  amount
                }
                onChange={
                  handleAmountChange
                }
                placeholder="0"
                className="draft-modal__input"
                autoComplete="off"
              />
            </div>
          </label>

          {error && (
            <p
              className="draft-modal__error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="draft-modal__actions">
            <button
              type="button"
              className="
                draft-modal__button
                draft-modal__button--secondary
              "
              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                draft-modal__button
                draft-modal__button--primary
              "
            >
              Draft Player
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}

function PlayerAvatar({
  image,
  name,
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <div className="draft-modal__avatar">
      {image &&
      !imageFailed ? (
        <img
          src={image}
          alt={name}
          className="draft-modal__avatar-image"
          onError={() =>
            setImageFailed(
              true
            )
          }
        />
      ) : (
        <span>
          {getInitials(
            name
          )}
        </span>
      )}
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

function getPlayerTeam(
  player
) {
  return (
    player?.team ??
    player?.team_name ??
    player?.teamName ??
    ""
  );
}

function getPlayerHeadshot(
  player
) {
  const playerId =
    getPlayerId(player);

  if (
    hasValue(playerId)
  ) {
    return `/assets/nfl/${playerId}.jpg`;
  }

  return (
    player?.headshot ??
    player?.image ??
    player?.player_image ??
    null
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
  return (
    manager?.Manager_Name ??
    manager?.manager_name ??
    manager?.name ??
    "Unknown Manager"
  );
}

function getInitials(
  name = ""
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

function hasValue(
  value
) {
  return (
    value !== null &&
    value !== undefined &&
    value !== ""
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

    team_name:
      PropTypes.string,

    teamName:
      PropTypes.string,

    headshot:
      PropTypes.string,

    image:
      PropTypes.string,

    player_image:
      PropTypes.string,
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

DraftModal.propTypes = {
  isOpen:
    PropTypes.bool.isRequired,

  player:
    playerShape,

  managers:
    PropTypes.arrayOf(
      managerShape
    ),

  selectedManager:
    managerShape,

  selectedManagerId:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

  onClose:
    PropTypes.func,

  onDraft:
    PropTypes.func,
};

PlayerAvatar.propTypes = {
  image:
    PropTypes.string,

  name:
    PropTypes.string.isRequired,
};

