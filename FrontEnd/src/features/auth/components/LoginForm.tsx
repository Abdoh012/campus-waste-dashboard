import { Form, redirect, useNavigation } from "react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { showError } from "../../../shared/ui/notifications";
import { translateNow } from "../../../shared/i18n/catalog";
import { useI18n } from "../../../shared/i18n/useI18n";
import { ApiError, setAuthToken } from "../../../services/apiClient";
import { login } from "../../../services/authApi";
import TextField from "./TextField";

const EMAIL_ID = "operator-email";
const PASSWORD_ID = "operator-password";

export default function LoginForm() {
  const navigation = useNavigation();
  const { t } = useI18n();

  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="mt-7" aria-label={t("auth.formAria")}>
      <div className="flex flex-col gap-5">
        <TextField
          id={EMAIL_ID}
          label={t("auth.email.label")}
          type="email"
          name="email"
          autoComplete="username"
          placeholder={t("auth.email.placeholder")}
          disabled={isSubmitting}
        />

        <TextField
          id={PASSWORD_ID}
          label={t("auth.password.label")}
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder={t("auth.password.placeholder")}
          disabled={isSubmitting}
        />
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
            {t("auth.submitting")}
          </>
        ) : (
          <>
            {t("auth.submit")}
            <ArrowRight
              className="h-4 w-4 text-export-accent rtl:rotate-180"
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

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password === ""
  ) {
    showError(translateNow("auth.toast.missingFields"));
    return null;
  }

  try {
    const result = await login(email.trim(), password);
    setAuthToken(result.token);
    return redirect("/dashboard");
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      showError(translateNow("auth.toast.invalidCredentials"));
    } else if (cause instanceof ApiError && cause.status === 0) {
      showError(translateNow("auth.toast.networkError"));
    } else {
      showError(translateNow("auth.toast.loginFailed"));
    }
    return null;
  }
}
