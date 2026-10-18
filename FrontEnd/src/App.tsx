import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import { Login } from "./features/auth/components/LoginForm";
import { I18nProvider } from "./shared/i18n/I18nProvider";

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
    <I18nProvider>
      <RouterProvider router={router} />

      <Toaster />
    </I18nProvider>
  );
}
