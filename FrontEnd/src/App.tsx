import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import { Login } from "./features/auth/components/LoginForm";

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
    <>
      <RouterProvider router={router} />

      <Toaster />
    </>
  );
}
