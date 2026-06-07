"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {
  error: null,
  email: ""
};

export function LoginForm({
  locale,
  redirectTo
}: {
  locale: string;
  redirectTo?: string;
}) {
  const [state, action] = useFormState(signInAction, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <label className="grid gap-2 text-sm font-medium text-ink">
        Email
        <input
          className="focus-ring rounded border border-line px-3 py-2 text-base font-normal"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-ink">
        Password
        <input
          className="focus-ring rounded border border-line px-3 py-2 text-base font-normal"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="focus-ring rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
