import MainLayout from "@/layouts/MainLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { NavAnimationProvider } from "@/contexts/NavAnimationContext";

const HomePage = lazy(() => import("../pages/HomePage"));
const UploadPage = lazy(() => import("../pages/UploadPage"));
const AlbumsPage = lazy(() => import("../pages/AlbumsPage"));
const AlbumDetailPage = lazy(() => import("../pages/AlbumDetailPage"));
const ExtractTextPage = lazy(() => import("../pages/ExtractTextPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const TranslatePage = lazy(() => import("../pages/TranslatePage"));

const createAppRouter = () => {
  const homePageElement = useMemo(() => <HomePage />, []);
  const uploadPageElement = useMemo(() => <UploadPage />, []);
  const albumsPageElement = useMemo(() => <AlbumsPage />, []);
  const albumDetailPageElement = useMemo(() => <AlbumDetailPage />, []);
  const extractTextPageElement = useMemo(() => <ExtractTextPage />, []);
  const settingsPageElement = useMemo(() => <SettingsPage />, []);
  const translatePageElement = useMemo(() => <TranslatePage />, []);

  return createBrowserRouter([
    {
      path: "/",
      element: (
        <NavAnimationProvider>
          <MainLayout />
        </NavAnimationProvider>
      ),
      children: [
        { index: true, element: homePageElement },
        { path: "Upload", element: uploadPageElement },
        { path: "albums", element: albumsPageElement },
        { path: "albums/:albumId", element: albumDetailPageElement },
        { path: "ocr", element: extractTextPageElement },
        { path: "translate", element: translatePageElement },
        { path: "settings", element: settingsPageElement },
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
        { index: true, element: homePageElement },
        { path: "Upload", element: uploadPageElement },
        { path: "albums", element: albumsPageElement },
        { path: "albums/:albumId", element: albumDetailPageElement },
        { path: "ocr", element: extractTextPageElement },
        { path: "translate", element: translatePageElement },
        { path: "settings", element: settingsPageElement },
      ],
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);
};

// Loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" /> Loading...
  </div>
);

export const AppRouter = () => {
  const router = useMemo(() => createAppRouter(), []);
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="overflow-y-scroll h-screen">
        <RouterProvider router={router} />
      </div>
    </Suspense>
  );
};
