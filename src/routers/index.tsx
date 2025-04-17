import MainLayout from "@/layouts/MainLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy, useMemo, memo } from "react";
import { Loader2 } from "lucide-react";
import { NavAnimationProvider } from "@/contexts/NavAnimationContext";

// Lazy-loaded pages with memoization
const HomePage = memo(lazy(() => import("../pages/HomePage")));
const UploadPage = memo(lazy(() => import("../pages/UploadPage")));
const AlbumsPage = memo(lazy(() => import("../pages/AlbumsPage")));
const AlbumDetailPage = memo(lazy(() => import("../pages/AlbumDetailPage")));
const ExtractTextPage = memo(lazy(() => import("../pages/ExtractTextPage")));
const SettingsPage = memo(lazy(() => import("../pages/SettingsPage")));
const TranslatePage = memo(lazy(() => import("../pages/TranslatePage")));

// Add display names for better debugging
HomePage.displayName = 'HomePage';
UploadPage.displayName = 'UploadPage';
AlbumsPage.displayName = 'AlbumsPage';
AlbumDetailPage.displayName = 'AlbumDetailPage';
ExtractTextPage.displayName = 'ExtractTextPage';
SettingsPage.displayName = 'SettingsPage';
TranslatePage.displayName = 'TranslatePage';

// Memoize the router configuration
const createAppRouter = () => createBrowserRouter([
  {
    path: "/",
    element: (
      <NavAnimationProvider>
        <MainLayout />
      </NavAnimationProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "Upload", element: <UploadPage /> },
      { path: "albums", element: <AlbumsPage /> },
      { path: "albums/:albumId", element: <AlbumDetailPage /> },
      { path: "ocr", element: <ExtractTextPage /> },
      { path: "translate", element: <TranslatePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/Upload",
    element: (
      <NavAnimationProvider>
        <MainLayout />
      </NavAnimationProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "Upload", element: <UploadPage /> },
      { path: "albums", element: <AlbumsPage /> },
      { path: "albums/:albumId", element: <AlbumDetailPage /> },
      { path: "ocr", element: <ExtractTextPage /> },
      { path: "translate", element: <TranslatePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],

  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

// Memoized loading component
const LoadingFallback = memo(() => (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" /> Loading...
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

export const AppRouter = memo(() => {
  const router = useMemo(() => createAppRouter(), []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="overflow-y-scroll h-screen">
        <RouterProvider router={router} />
      </div>
    </Suspense>
  );
});
AppRouter.displayName = 'AppRouter';
