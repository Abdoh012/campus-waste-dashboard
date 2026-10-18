import { Form, redirect, useNavigation } from "react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { showError, showInfo } from "../../../shared/ui/notifications";
import TextField from "./TextField";

const EMAIL_ID = "operator-email";
const PASSWORD_ID = "operator-password";

const LINK =
  "cursor-pointer rounded text-xs font-medium text-primary-text transition-colors duration-200 enabled:hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

export default function LoginForm() {
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="mt-7" aria-label="Operator sign in">
      <div className="flex flex-col gap-5">
        <TextField
          id={EMAIL_ID}
          label="Operator email"
          type="email"
          name="email"
          autoComplete="username"
          placeholder="name@campus.edu"
          disabled={isSubmitting}
        />

        <TextField
          id={PASSWORD_ID}
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={isSubmitting}
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          className={`${LINK} py-1`}
          onClick={() =>
            showInfo("Password reset isn't available in this build")
          }
        >
          Forgot password?
        </button>
      </div>

      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-6 cursor-pointer flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-export-foreground transition-colors duration-200 enabled:hover:bg-foreground-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight
              className="h-4 w-4 text-export-accent"
              aria-hidden="true"
            />
          </>
        )}
      </button>
    </Form>
  );
}

export async function Login({ request }: { request: Request }) {
  const fd = await request.formData();
  const email = fd.get("email");
  const password = fd.get("password");

  if (!email || !password) {
    showError("Please fill in all the fields");
  }

  return redirect("/dashboard");
}
