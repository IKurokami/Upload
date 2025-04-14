import MainLayout from "@/layouts/MainLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const HomePage = lazy(() => import("../pages/HomePage"));
const UploadPage = lazy(() => import("../pages/UploadPage"));
const AlbumsPage = lazy(() => import("../pages/AlbumsPage"));
const AlbumDetailPage = lazy(() => import("../pages/AlbumDetailPage"));
const ExtractTextPage = lazy(() => import("../pages/ExtractTextPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "Upload", element: <UploadPage /> },
      { path: "albums", element: <AlbumsPage /> },
      { path: "albums/:albumId", element: <AlbumDetailPage /> },
      { path: "ocr", element: <ExtractTextPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export const AppRouter = () => (
  <Suspense
    fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" /> Loading...
      </div>
    }
  >
    <div className="overflow-y-scroll h-screen">
      <RouterProvider router={router} />
    </div>
  </Suspense>
);
