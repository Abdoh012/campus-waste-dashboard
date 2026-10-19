import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import { Login } from "./features/auth/components/LoginForm";
import { I18nProvider } from "./shared/i18n/I18nProvider";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import { useTheme } from "./shared/theme/useTheme";

/** Keeps the notification stack in step with the active theme. */
function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} />;
}

export default function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <LoginPage />,
      action: Login,
    },
    {
      path: "/dashboard",
      element: <DashboardPage />,
    },
  ]);
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />

        <ThemedToaster />
      </I18nProvider>
    </ThemeProvider>
  );
}
