import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Layout } from "./components/Layout";
import AiAgent from "./pages/AiAgent";
import BotCommands from "./pages/BotCommands";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import SeriesDetail from "./pages/SeriesDetail";
import Settings from "./pages/Settings";
import Watchlist from "./pages/Watchlist";

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <Layout>
        <Outlet />
      </Layout>
    </ThemeProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const discoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/discover",
  component: Discover,
});

const seriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/series/$mangaDexId",
  component: SeriesDetail,
});

const botRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bot",
  component: BotCommands,
});

const aiAgentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-agent",
  component: AiAgent,
});

const watchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watchlist",
  component: Watchlist,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  discoverRoute,
  seriesRoute,
  botRoute,
  aiAgentRoute,
  watchlistRoute,
  settingsRoute,
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
