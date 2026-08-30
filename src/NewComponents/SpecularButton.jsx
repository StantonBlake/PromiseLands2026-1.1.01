import { useRef } from "react";
import PropTypes from "prop-types";
import "./SpecularButton.css";

const SpecularButton = ({
  children,
  size = "sm",
  variant = "neutral",
  radius,
  disabled = false,
  loading = false,
  followMouse = true,
  fullWidth = false,
  type = "button",
  className = "",
  onClick,
  ...buttonProps
}) => {
  const buttonRef = useRef(null);

  const handlePointerMove = (event) => {
    if (!followMouse || disabled || loading) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    button.style.setProperty("--sb-pointer-x", `${x}px`);
    button.style.setProperty("--sb-pointer-y", `${y}px`);
  };

  const handlePointerLeave = () => {
    const button = buttonRef.current;
    if (!button) return;

    button.style.removeProperty("--sb-pointer-x");
    button.style.removeProperty("--sb-pointer-y");
  };

  const classes = [
    "specular-button",
    `specular-button--${size}`,
    `specular-button--${variant}`,
    fullWidth && "specular-button--full-width",
    loading && "specular-button--loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      style={{
        ...(radius !== undefined
          ? { "--sb-radius": `${radius}px` }
          : {}),
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      {...buttonProps}
    >
      <span className="specular-button__surface" aria-hidden="true" />

      <span className="specular-button__content">
        {loading && (
          <span
            className="specular-button__spinner"
            aria-hidden="true"
          />
        )}

        <span className="specular-button__label">
          {children}
        </span>
      </span>
    </button>
  );
};

SpecularButton.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
  variant: PropTypes.oneOf([
    "neutral",
    "primary",
    "success",
    "danger",
    "ghost",
  ]),
  radius: PropTypes.number,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  followMouse: PropTypes.bool,
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default SpecularButton;