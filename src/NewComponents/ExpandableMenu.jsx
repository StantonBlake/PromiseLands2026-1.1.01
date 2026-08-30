import React from "react";
import PropTypes from "prop-types";
import "./ExpandableMenu.css";

/**
 * Reusable expanding navigation menu.
 *
 * Link item:
 * {
 *   id: string,
 *   label: string,
 *   href: string,
 *   icon: ReactNode
 * }
 *
 * Tab/button item:
 * {
 *   id: string,
 *   label: string,
 *   icon: ReactNode,
 *   active?: boolean,
 *   disabled?: boolean,
 *   onClick?: function
 * }
 */
const ExpandableMenu = ({
  items,
  variant = "light",
  orientation = "horizontal",
  size = "medium",
  ariaLabel = "Main navigation",
  className = "",
}) => {
  const menuClassNames = [
    "expandable-menu",
    `expandable-menu--${variant}`,
    `expandable-menu--${orientation}`,
    `expandable-menu--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleItemClick = (
    event,
    item
  ) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    /*
     * Items without an href behave as local
     * buttons/tabs instead of navigation links.
     */
    if (!item.href) {
      event.preventDefault();
    }

    item.onClick?.(
      event,
      item
    );
  };

  return (
    <nav
      className={
        menuClassNames
      }
      aria-label={
        ariaLabel
      }
    >
      {items.map(
        (item) => {
          const itemClassNames = [
            "expandable-menu__link",
            item.active &&
              "expandable-menu__link--active",
            item.disabled &&
              "expandable-menu__link--disabled",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <>
              <span
                className="expandable-menu__icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span className="expandable-menu__title">
                {item.label}
              </span>
            </>
          );

          /*
           * Real navigation item.
           */
          if (item.href) {
            return (
              <a
                key={
                  item.id
                }
                href={
                  item.disabled
                    ? undefined
                    : item.href
                }
                className={
                  itemClassNames
                }
                aria-current={
                  item.active
                    ? "page"
                    : undefined
                }
                aria-disabled={
                  item.disabled ||
                  undefined
                }
                tabIndex={
                  item.disabled
                    ? -1
                    : 0
                }
                onClick={(
                  event
                ) =>
                  handleItemClick(
                    event,
                    item
                  )
                }
              >
                {content}
              </a>
            );
          }

          /*
           * Local tab/button item.
           */
          return (
            <button
              key={
                item.id
              }
              type="button"
              className={
                itemClassNames
              }
              aria-current={
                item.active
                  ? "page"
                  : undefined
              }
              aria-pressed={
                item.active
              }
              disabled={
                item.disabled
              }
              onClick={(
                event
              ) =>
                handleItemClick(
                  event,
                  item
                )
              }
            >
              {content}
            </button>
          );
        }
      )}
    </nav>
  );
};

ExpandableMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id:
        PropTypes.string
          .isRequired,

      label:
        PropTypes.string
          .isRequired,

      href:
        PropTypes.string,

      icon:
        PropTypes.node
          .isRequired,

      active:
        PropTypes.bool,

      disabled:
        PropTypes.bool,

      onClick:
        PropTypes.func,
    })
  ).isRequired,

  variant:
    PropTypes.oneOf([
      "light",
      "dark",
      "primary",
      "minimal",
    ]),

  orientation:
    PropTypes.oneOf([
      "horizontal",
      "vertical",
    ]),

  size:
    PropTypes.oneOf([
      "small",
      "medium",
      "large",
    ]),

  ariaLabel:
    PropTypes.string,

  className:
    PropTypes.string,
};

export default ExpandableMenu;