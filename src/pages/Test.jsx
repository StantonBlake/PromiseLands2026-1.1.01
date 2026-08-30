import { useState } from "react";
import FlipCard from "../components/FlipCard";
import SpecularButton from "../components/SpecularButton";
import ReactiveButton from "../components/ReactiveButton";
import ToggleBox from "../components/ToggleBox";
import FiveStarToggle from "../components/FiveStarToggle";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function ComponentTestSheet() {
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] =
  useState(false);
  const [rating, setRating] = useState(3);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });

      console.log("Saved");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="component-test-sheet">
      <header className="component-test-sheet__header">
        <p className="component-test-sheet__eyebrow">
          Component Library
        </p>

        <h1>React Component Test Sheet</h1>

        <p>
          Reusable components and their available configurations.
        </p>
      </header>

      <section className="component-section">
        <div className="component-section__heading">
          <div>
            <h2>Flip Cards</h2>
            <p>Hover over a card to reveal its reverse side.</p>
          </div>
        </div>

        <div className="component-grid">
          <FlipCard
            frontTitle="Basic Card"
            frontText="This content is passed through reusable props."
            backTitle="Back Side"
            backText="The component can be used anywhere in the application."
          />

          <FlipCard
            frontTitle="League History"
            frontText="View previous champions and season records."
            backTitle="Explore"
            backText="Open the complete historical league archive."
          />

          <FlipCard
            frontContent={
              <>
                <span
                  className="card-example-icon"
                  aria-hidden="true"
                >
                  🏆
                </span>

                <h3 className="flip-card-title">
                  Custom Content
                </h3>

                <p className="flip-card-description">
                  This card uses custom JSX instead of the standard props.
                </p>
              </>
            }
            backContent={
              <>
                <h3 className="flip-card-title">
                  Fully Composable
                </h3>

                <button
                  className="card-example-button"
                  type="button"
                  onClick={() => {
                    console.log("Card action clicked");
                  }}
                >
                  View Details
                </button>
              </>
            }
          />
        </div>
      </section>

      <section className="component-section">
        <div className="component-section__heading">
          <div>
            <h2>Specular Button</h2>
            <p>A reflective button that reacts to pointer movement.</p>
          </div>
        </div>

        <div className="button-demo__group">
          <SpecularButton
            size="lg"
            radius={18}
            tint="#ffffff"
            tintOpacity={0}
            blur={0}
            textColor="#f5f5f5"
            lineColor="#ffffff"
            baseColor="#525252"
            intensity={1}
            shineSize={10}
            shineFade={40}
            thickness={1}
            speed={0.35}
            followMouse
            proximity={250}
            autoAnimate={false}
            onClick={() => {
              console.log("Specular button clicked");
            }}
          >
            Get Started
          </SpecularButton>
        </div>
      </section>
      <section className="component-section">
        <div className="component-section__heading">
          <div>
            <h2>Reactive Buttons</h2>
            <p>
              Reusable buttons with sizes, states, and color variants.
            </p>
          </div>
        </div>

        <div className="button-demo__group">
          <ReactiveButton
            onClick={() => {
              console.log("Clicked");
            }}
          >
            Default
          </ReactiveButton>

          <ReactiveButton variant="ocean">
            Ocean
          </ReactiveButton>

          <ReactiveButton
            variant="sunset"
            size="large"
          >
            Sunset
          </ReactiveButton>

          <ReactiveButton
            variant="success"
            loading={isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving" : "Save changes"}
          </ReactiveButton>

          <ReactiveButton
            variant="danger"
            disabled
          >
            Disabled
          </ReactiveButton>

          <ReactiveButton
            href="/dashboard"
            variant="ocean"
            trailingIcon={<ArrowIcon />}
          >
            Dashboard
          </ReactiveButton>
        </div>
      </section>

      <section className="component-section">
        <div className="component-section__heading">
          <div>
            <h2>Toggle Boxes</h2>
            <p>
              Reusable checkbox controls with sizes, colors, and states.
            </p>
          </div>
        </div>

        <div className="toggle-box-demo">
          <ToggleBox
            label="Default toggle"
            defaultChecked
          />

          <ToggleBox
            label="Notifications"
            variant="ocean"
            checked={notificationsEnabled}
            onChange={(event) => {
              setNotificationsEnabled(event.target.checked);
            }}
          />

          <ToggleBox
            label="Success"
            variant="success"
            size="large"
          />

          <ToggleBox
            label="Danger"
            variant="danger"
          />

          <ToggleBox
            label="Purple"
            variant="purple"
            size="small"
          />

          <ToggleBox
            label="Label on the left"
            variant="dark"
            labelPosition="left"
          />

          <ToggleBox
            label="Disabled"
            variant="ocean"
            disabled
          />

          <ToggleBox
            label="Disabled and checked"
            variant="success"
            defaultChecked
            disabled
          />

          <ToggleBox
            variant="purple"
            aria-label="Enable compact mode"
          />
        </div>
      </section>

      <section className="component-section">
        <div className="component-section__heading">
          <div>
            <h2>Five Star Toggle</h2>
            <p>
              Interactive rating component with multiple themes.
            </p>
          </div>
        </div>

        <div className="button-demo__group">
          <FiveStarToggle
            value={rating}
            onChange={setRating}
            showValue
          />

          <FiveStarToggle
            defaultValue={5}
            variant="gold"
          />

          <FiveStarToggle
            defaultValue={4}
            variant="green"
            size="large"
          />

          <FiveStarToggle
            defaultValue={2}
            variant="blue"
          />

          <FiveStarToggle
            defaultValue={3}
            variant="red"
          />

          <FiveStarToggle
            defaultValue={5}
            variant="rainbow"
          />

          <FiveStarToggle
            defaultValue={1}
            size="small"
          />

          <FiveStarToggle
            disabled
            defaultValue={4}
          />
        </div>
      </section>
    </main>
  );
}