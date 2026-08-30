const POSITION_COLORS = {
  QB: {
    color: "#C4696C",
    rgb: "196, 105, 108",
  },

  RB: {
    color: "#65A57E",
    rgb: "101, 165, 126",
  },

  WR: {
    color: "#648BC0",
    rgb: "100, 139, 192",
  },

  TE: {
    color: "#B58F5B",
    rgb: "181, 143, 91",
  },
};

const DEFAULT_POSITION_COLOR = {
  color: "#60a5fa",
  rgb: "147, 116, 181",
};

export const playDraftCardAnimation = ({
  managerId,
  position,

  /*
   * Small pause after the draft modal closes.
   */
  startDelay = 225,

  /*
   * Flight duration.
   */
  approachDuration = 1500,

  /*
   * Pause after the card lands above
   * the manager card.
   */
  pauseDuration = 350,

  /*
   * Wallet insertion duration.
   */
  insertDuration = 500,
}) => {
  return new Promise((resolve) => {
    const sourceElement =
      document.querySelector(
        '[data-draft-player-card="true"]'
      );

    const targetElement =
      document.querySelector(
        `[data-manager-card="${managerId}"]`
      );

    if (
      !sourceElement ||
      !targetElement
    ) {
      resolve();
      return;
    }

    /*
     * =====================================================
     * CURRENT SCREEN POSITIONS
     * =====================================================
     */

    const sourceRect =
      sourceElement.getBoundingClientRect();

    const targetRect =
      targetElement.getBoundingClientRect();

    const normalizedPosition =
      String(
        position ?? ""
      )
        .trim()
        .toUpperCase();

    const positionColor =
      POSITION_COLORS[
        normalizedPosition
      ] ??
      DEFAULT_POSITION_COLOR;

    /*
     * =====================================================
     * CLONE PLAYER CARD
     * =====================================================
     */

    const clone =
      sourceElement.cloneNode(true);

    clone.removeAttribute(
      "role"
    );

    clone.removeAttribute(
      "tabindex"
    );

    clone.removeAttribute(
      "aria-pressed"
    );

    clone
      .querySelectorAll(
        "button, a, input, select, textarea"
      )
      .forEach(
        (element) => {
          element.setAttribute(
            "tabindex",
            "-1"
          );
        }
      );

    clone.classList.add(
      "draft-card-flight"
    );

    /*
     * Clone starts exactly over the real card.
     */
    Object.assign(
      clone.style,
      {
        position:
          "absolute",

        left:
          `${sourceRect.left}px`,

        top:
          `${sourceRect.top}px`,

        width:
          `${sourceRect.width}px`,

        height:
          `${sourceRect.height}px`,

        margin:
          "0",

        pointerEvents:
          "none",

        transformOrigin:
          "center center",

        visibility:
          "visible",

        willChange:
          "transform, opacity, filter",
      }
    );

    /*
     * =====================================================
     * UNRESTRICTED FLIGHT LAYER
     * =====================================================
     *
     * No clipping is allowed while the
     * card is actually flying.
     */

    const flightLayer =
      document.createElement(
        "div"
      );

    flightLayer.className =
      "draft-card-flight-layer";

    Object.assign(
      flightLayer.style,
      {
        position:
          "fixed",

        inset:
          "0",

        width:
          "100vw",

        height:
          "100vh",

        overflow:
          "visible",

        pointerEvents:
          "none",

        zIndex:
          "99999",
      }
    );

    document.body.appendChild(
      flightLayer
    );

    flightLayer.appendChild(
      clone
    );

    /*
     * =====================================================
     * HIDE ORIGINAL CARD
     * =====================================================
     */

    const previousVisibility =
      sourceElement.style.visibility;

    sourceElement.style.visibility =
      "hidden";

    /*
     * =====================================================
     * TARGET SCALE
     * =====================================================
     */

    const targetScale =
      Math.min(
        0.58,

        Math.max(
          0.46,

          (
            targetRect.width /
            sourceRect.width
          ) *
            0.52
        )
      );

    const scaledHeight =
      sourceRect.height *
      targetScale;

    /*
     * =====================================================
     * ALIGNMENT
     * =====================================================
     */

    const sourceCenterX =
      sourceRect.left +
      sourceRect.width / 2;

    const sourceCenterY =
      sourceRect.top +
      sourceRect.height / 2;

    const destinationCenterX =
      targetRect.left +
      targetRect.width / 2;

    /*
     * Card bottom aligns with manager-card top.
     */
    const destinationCenterY =
      targetRect.top -
      scaledHeight / 2;

    const deltaX =
      destinationCenterX -
      sourceCenterX;

    const deltaY =
      destinationCenterY -
      sourceCenterY;

    /*
     * =====================================================
     * FLIGHT SETTINGS
     * =====================================================
     */

    /*
     * Stronger lob.
     *
     * Long flights get a larger arc.
     */
    const arcHeight =
      Math.min(
        180,

        Math.max(
          80,

          Math.abs(
            deltaX
          ) *
            0.14
        )
      );

    /*
     * Mirror the card bank depending on
     * travel direction.
     */
    const flightDirection =
      deltaX >= 0
        ? 1
        : -1;

    /*
     * =====================================================
     * CLEANUP HELPERS
     * =====================================================
     */

    const restoreSource =
      () => {
        sourceElement.style.visibility =
          previousVisibility;
      };

    const removeFlightLayer =
      () => {
        if (
          flightLayer.isConnected
        ) {
          flightLayer.remove();
        }
      };

    /*
     * =====================================================
     * START DELAY
     * =====================================================
     */

    window.setTimeout(
      () => {
        /*
         * =================================================
         * TRUE FLIGHT CURVE
         * =================================================
         */

        /*
         * Quadratic Bézier control point.
         */
        const controlX =
          deltaX *
          0.5;

        const controlY =
          Math.min(
            0,
            deltaY
          ) -
          arcHeight;

        /*
         * More samples produce a smoother
         * continuous arc.
         */
        const FLIGHT_SAMPLES =
          28;

        const flightKeyframes =
          Array.from(
            {
              length:
                FLIGHT_SAMPLES +
                1,
            },

            (
              _,
              index
            ) => {
              /*
               * Raw animation-time position.
               */
              const t =
                index /
                FLIGHT_SAMPLES;

              /*
               * =========================================
               * SPEED MAPPING
               * =========================================
               *
               * We deliberately alter how quickly
               * the card progresses along the curve.
               *
               * Launch:
               * fast
               *
               * Apex:
               * slow / hanging
               *
               * Descent:
               * accelerating
               */

              const apexTime =
  0.54;

const upwardSlowdown =
  1.15;

const downwardAcceleration =
  1.1;

let motionT;

if (t < apexTime) {
  const localT =
    t / apexTime;

  motionT =
    0.5 *
    (
      1 -
      Math.pow(
        1 - localT,
        upwardSlowdown
      )
    );
} else {
  const localT =
    (
      t -
      apexTime
    ) /
    (
      1 -
      apexTime
    );

  motionT =
    0.5 +
    0.5 *
    Math.pow(
      localT,
      downwardAcceleration
    );
}

              const inverseT =
                1 -
                motionT;

              /*
               * =========================================
               * QUADRATIC BÉZIER
               * =========================================
               */

              const x =
                2 *
                  inverseT *
                  motionT *
                  controlX +
                motionT *
                  motionT *
                  deltaX;

              const y =
                2 *
                  inverseT *
                  motionT *
                  controlY +
                motionT *
                  motionT *
                  deltaY;

              /*
               * =========================================
               * AIRBORNE AMOUNT
               * =========================================
               *
               * 0 at beginning
               * 1 around apex
               * 0 at landing
               */

              const airborne =
                Math.sin(
                  Math.PI *
                  motionT
                );

              /*
               * =========================================
               * SCALE / DEPTH
               * =========================================
               *
               * Base scale transitions naturally
               * from player-card size down toward
               * manager-card landing size.
               */

              const baseScale =
                1 +
                (
                  targetScale -
                  1
                ) *
                  motionT;

              /*
               * Stronger lob.
               *
               * At apex the card becomes noticeably
               * larger, giving the illusion that it
               * has risen toward the viewer.
               */
              const lobScale =
                airborne *
                0.22;

              const scale =
                baseScale +
                lobScale;

              /*
               * =========================================
               * ROTATION / BANK
               * =========================================
               *
               * Slightly angled on launch,
               * banks through the air,
               * then flattens near landing.
               */

              const rotation =
                flightDirection *
                (
                  -1.8 *
                    (
                      1 -
                      motionT
                    ) +
                  Math.sin(
                    Math.PI *
                    motionT
                  ) *
                    3.2
                );

              /*
               * =========================================
               * SHADOW / HEIGHT
               * =========================================
               */

              const shadowY =
                3 +
                airborne *
                  20;

              const shadowBlur =
                5 +
                airborne *
                  24;

              const shadowOpacity =
                0.08 +
                airborne *
                  0.23;

              const brightness =
                1 +
                airborne *
                  0.07;

              return {
                /*
                 * Raw timeline offset.
                 *
                 * motionT controls the real
                 * physical progression.
                 */
                offset:
                  t,

                transform: `
                  translate3d(
                    ${x}px,
                    ${y}px,
                    0
                  )

                  rotateZ(
                    ${rotation}deg
                  )

                  scale(
                    ${scale}
                  )
                `,

                opacity:
                  1,

                filter: `
                  brightness(
                    ${brightness}
                  )

                  drop-shadow(
                    0
                    ${shadowY}px
                    ${shadowBlur}px
                    rgba(
                      0,
                      0,
                      0,
                      ${shadowOpacity}
                    )
                  )
                `,
              };
            }
          );

        /*
         * =================================================
         * APPROACH ANIMATION
         * =================================================
         *
         * IMPORTANT:
         *
         * Speed manipulation is already built
         * directly into motionT.
         *
         * Therefore animation easing stays linear.
         */

        const approachAnimation =
          clone.animate(
            flightKeyframes,

            {
              duration:
                approachDuration,

              easing:
                "linear",

              fill:
                "forwards",
            }
          );

        /*
         * =================================================
         * APPROACH COMPLETE
         * =================================================
         */

        approachAnimation.onfinish =
          () => {
            /*
             * Pause while card is seated
             * above manager.
             */

            window.setTimeout(
              () => {
                /*
                 * =========================================
                 * CREATE WALLET MASK
                 * =========================================
                 *
                 * Clipping starts ONLY after
                 * flight is completely finished.
                 */

                const insertionMask =
                  document.createElement(
                    "div"
                  );

                insertionMask.className =
                  "draft-card-insertion-mask";

                Object.assign(
                  insertionMask.style,
                  {
                    position:
                      "fixed",

                    left:
                      "0",

                    top:
                      "0",

                    width:
                      "100vw",

                    /*
                     * Wallet edge.
                     */
                    height:
                      `${Math.max(
                        targetRect.top,
                        0
                      )}px`,

                    overflow:
                      "hidden",

                    clipPath:
                      "inset(0)",

                    pointerEvents:
                      "none",

                    zIndex:
                      "99999",

                    contain:
                      "paint",
                  }
                );

                document.body.appendChild(
                  insertionMask
                );

                /*
                 * Reparenting does not visually move
                 * the clone because both temporary
                 * containers use viewport origin.
                 */

                insertionMask.appendChild(
                  clone
                );

                removeFlightLayer();

                /*
                 * =========================================
                 * WALLET INSERTION
                 * =========================================
                 */

                const insertionDistance =
                  scaledHeight +
                  2;

                const insertAnimation =
                  clone.animate(
                    [
                      /*
                       * Seated.
                       */
                      {
                        transform: `
                          translate3d(
                            ${deltaX}px,
                            ${deltaY}px,
                            0
                          )

                          rotateZ(0deg)

                          scale(
                            ${targetScale}
                          )
                        `,
                      },

                      /*
                       * Tiny initial catch.
                       */
                      {
                        offset:
                          0.12,

                        transform: `
                          translate3d(
                            ${deltaX}px,

                            ${
                              deltaY +
                              insertionDistance *
                                0.035
                            }px,

                            0
                          )

                          rotateZ(0deg)

                          scale(
                            ${targetScale}
                          )
                        `,
                      },

                      /*
                       * Mostly inserted.
                       */
                      {
                        offset:
                          0.78,

                        transform: `
                          translate3d(
                            ${deltaX}px,

                            ${
                              deltaY +
                              insertionDistance *
                                0.78
                            }px,

                            0
                          )

                          rotateZ(0deg)

                          scale(
                            ${targetScale}
                          )
                        `,
                      },

                      /*
                       * Completely hidden.
                       */
                      {
                        offset:
                          1,

                        transform: `
                          translate3d(
                            ${deltaX}px,

                            ${
                              deltaY +
                              insertionDistance
                            }px,

                            0
                          )

                          rotateZ(0deg)

                          scale(
                            ${targetScale}
                          )
                        `,
                      },
                    ],

                    {
                      duration:
                        insertDuration,

                      easing:
                        "cubic-bezier(0.38, 0, 0.18, 1)",

                      fill:
                        "forwards",
                    }
                  );

                /*
                 * =========================================
                 * INSERTION COMPLETE
                 * =========================================
                 */

                insertAnimation.onfinish =
                  () => {
                    if (
                      insertionMask.isConnected
                    ) {
                      insertionMask.remove();
                    }

                    triggerManagerPositionPulse({
                      targetElement,
                      positionColor,
                    });

                    resolve();
                  };

                /*
                 * =========================================
                 * INSERTION CANCELLED
                 * =========================================
                 */

                insertAnimation.oncancel =
                  () => {
                    if (
                      insertionMask.isConnected
                    ) {
                      insertionMask.remove();
                    }

                    restoreSource();

                    resolve();
                  };
              },

              pauseDuration
            );
          };

        /*
         * =================================================
         * APPROACH CANCELLED
         * =================================================
         */

        approachAnimation.oncancel =
          () => {
            removeFlightLayer();

            restoreSource();

            resolve();
          };
      },

      startDelay
    );
  });
};


/*
 * =========================================================
 * MANAGER POSITION PULSE
 * =========================================================
 */

function triggerManagerPositionPulse({
  targetElement,
  positionColor,
}) {
  if (
    !targetElement
  ) {
    return;
  }

  targetElement.classList.remove(
    "manager-card--draft-position-pulse"
  );

  targetElement.style.setProperty(
    "--draft-position-color",
    positionColor.color
  );

  targetElement.style.setProperty(
    "--draft-position-rgb",
    positionColor.rgb
  );

  /*
   * Force animation restart.
   */
  void targetElement.offsetWidth;

  targetElement.classList.add(
    "manager-card--draft-position-pulse"
  );

  window.setTimeout(
    () => {
      targetElement.classList.remove(
        "manager-card--draft-position-pulse"
      );

      targetElement.style.removeProperty(
        "--draft-position-color"
      );

      targetElement.style.removeProperty(
        "--draft-position-rgb"
      );
    },

    1650
  );
}