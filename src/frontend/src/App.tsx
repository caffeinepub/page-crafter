import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import InvoiceGenerator from "./pages/InvoiceGenerator";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor",
  component: Editor,
});

const editorWithIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/$designId",
  component: Editor,
});

const invoiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoice",
  component: InvoiceGenerator,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  editorRoute,
  editorWithIdRoute,
  invoiceRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
