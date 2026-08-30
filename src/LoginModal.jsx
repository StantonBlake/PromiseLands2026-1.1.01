import {
  useState,
} from "react";

import { supabase } from "./supabaseClient";

import "./LoginModal.css";

export default function LoginModal({
  authError = "",
}) {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState("");

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setLocalError("");
      setIsSubmitting(true);

      try {
        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        if (!normalizedEmail) {
          throw new Error(
            "Enter your email address."
          );
        }

        if (!password) {
          throw new Error(
            "Enter your password."
          );
        }

        const {
          error,
        } = await supabase
          .auth
          .signInWithPassword({
            email:
              normalizedEmail,

            password,
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error(
          "Unable to sign in:",
          error
        );

        setLocalError(
          error?.message ??
            "Unable to sign in."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const displayError =
    localError ||
    authError;

  return (
    <div
      className="login-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-gate-title"
    >
      <div className="login-gate__backdrop" />

      <section className="login-modal">
        <div className="login-modal__accent" />

        <header className="login-modal__header">
          <span className="login-modal__eyebrow">
            Promise Lands
          </span>

          <h1 id="login-gate-title">
            Draft Room Login
          </h1>

          <p>
            Sign in with an authorized
            league administrator account.
          </p>
        </header>

        <form
          className="login-modal__form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="login-modal__field">
            <span>
              Email
            </span>

            <input
              type="email"
              value={email}
              onChange={(
                event
              ) => {
                setEmail(
                  event.target.value
                );

                setLocalError("");
              }}
              autoComplete="email"
              placeholder="commissioner@example.com"
              disabled={
                isSubmitting
              }
            />
          </label>

          <label className="login-modal__field">
            <span>
              Password
            </span>

            <input
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) => {
                setPassword(
                  event.target.value
                );

                setLocalError("");
              }}
              autoComplete="current-password"
              placeholder="Enter password"
              disabled={
                isSubmitting
              }
            />
          </label>

          {displayError && (
            <div
              className="login-modal__error"
              role="alert"
            >
              {displayError}
            </div>
          )}

          <button
            type="submit"
            className="login-modal__submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Signing In..."
              : "Enter Draft Room"}
          </button>
        </form>

        <footer className="login-modal__footer">
          Draft corrections and assignments
          require commissioner authorization.
        </footer>
      </section>
    </div>
  );
}