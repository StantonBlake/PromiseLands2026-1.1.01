import {
  useLayoutEffect,
  useState,
} from "react";

import PropTypes from "prop-types";

import "./FlipCard.css";

export default function FlipCard({
  frontContent,
  backContent,
  className = "",
  ariaLabel = "Interactive flip card",
  defaultFlipped = false,
  dataDraftPlayerCard = false,
  resetKey = 0,
}) {
  const [
    isFlipped,
    setIsFlipped,
  ] = useState(
    defaultFlipped
  );

  /*
   * Whenever resetKey changes,
   * immediately return the card
   * to its front face.
   */
  useLayoutEffect(() => {
    /*
     * Disable the normal flip transition
     * while forcing the card to the front.
     */
    setIsResetting(true);
    setIsFlipped(false);
  
    const frameId =
      window.requestAnimationFrame(
        () => {
          setIsResetting(false);
        }
      );
  
    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [resetKey]);

  const [
    isResetting,
    setIsResetting,
  ] = useState(false);

  const cardClasses = [
    "flip-card",
    className,
  
    isFlipped
      ? "flip-card--flipped"
      : "",
  
    isResetting
      ? "flip-card--instant-reset"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const toggleCard = () => {
    setIsFlipped(
      (currentValue) =>
        !currentValue
    );
  };

  const handleCardClick = (
    event
  ) => {
    const interactiveElement =
      event.target.closest(
        "button, a, input, select, textarea, [data-no-flip]"
      );

    if (interactiveElement) {
      return;
    }

    toggleCard();
  };

  const handleKeyDown = (
    event
  ) => {
    if (
      event.target !==
      event.currentTarget
    ) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      toggleCard();
    }
  };

  return (
    <article
      className={cardClasses}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={isFlipped}
      data-draft-player-card={
        dataDraftPlayerCard
          ? "true"
          : undefined
      }
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flip-card-inner">
        <div
          className="
            flip-card-face
            flip-card-front
          "
          aria-hidden={isFlipped}
        >
          {frontContent}
        </div>

        <div
          className="
            flip-card-face
            flip-card-back
          "
          aria-hidden={!isFlipped}
        >
          {backContent}
        </div>
      </div>
    </article>
  );
}

FlipCard.propTypes = {
  frontContent:
    PropTypes.node.isRequired,

  backContent:
    PropTypes.node.isRequired,

  className:
    PropTypes.string,

  ariaLabel:
    PropTypes.string,

  defaultFlipped:
    PropTypes.bool,

  dataDraftPlayerCard:
    PropTypes.bool,

  resetKey:
    PropTypes.number,
};