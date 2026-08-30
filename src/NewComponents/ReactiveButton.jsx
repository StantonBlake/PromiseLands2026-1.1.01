import React from "react";
import "./ReactiveButton.css";

const ReactiveButton = ({
  children,
  variant = "aurora",
  size = "medium",
  type = "button",
  href,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  leadingIcon,
  trailingIcon,
  ...rest
}) => {
  const classes = [
    "reactive-button",
    `reactive-button--${variant}`,
    `reactive-button--${size}`,
    fullWidth ? "reactive-button--full-width" : "",
    loading ? "reactive-button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && (
        <span
          className="reactive-button__spinner"
          aria-hidden="true"
        />
      )}

      {!loading && leadingIcon && (
        <span
          className="reactive-button__icon"
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      )}

      <span className="reactive-button__label">{children}</span>

      {!loading && trailingIcon && (
        <span
          className="reactive-button__icon"
          aria-hidden="true"
        >
          {trailingIcon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        className={classes}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        tabIndex={disabled ? -1 : undefined}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {content}
    </button>
  );
};

export default ReactiveButton;