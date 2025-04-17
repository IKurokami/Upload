// src/components/AlbumsPage.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deleteAlbumFromDB, openEditorDB, renameAlbumInDB } from "@/lib/db";
import AlbumCard from "@/sections/AlbumCard";
import DeleteDialog from "@/sections/DeleteDialog";
import RenameDialog from "@/sections/RenameDialog";
import { SavedAlbum } from "@/types/SavedAlbum";
import { Eye, Loader2, Search, Upload } from "lucide-react";
import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface AlbumsPageProps { }

const AlbumsPage: React.FC<AlbumsPageProps> = () => {
  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredAlbums, setFilteredAlbums] = useState<SavedAlbum[]>([]);

  const loadSavedAlbums = async (): Promise<void> => {
    setLoading(true);
    try {
      const db = await openEditorDB();
      const transaction = db.transaction(["htmlFiles"], "readonly");
      const store = transaction.objectStore("htmlFiles");
      const getRequest: IDBRequest<SavedAlbum[]> = store.getAll();

      getRequest.onsuccess = () => {
        const albums = getRequest.result || [];
        setSavedAlbums(albums);
        setLoading(false);
      };

      getRequest.onerror = () => {
        console.error("Error loading albums from IndexedDB");
        setLoading(false);
        toast.error("Failed to load albums", {
          description: "Check the console for details."
        });
      };
    } catch (error) {
      console.error("IndexedDB error:", error);
      toast.error("Failed to access albums database", {
        description: "Check the console for details."
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedAlbums();
  }, []);

  useEffect(() => {
    // Filter albums based on search query and sort by createdAt desc
    const filtered = savedAlbums
      .filter((album) =>
        album.albumName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredAlbums(filtered);
  }, [searchQuery, savedAlbums]);

  const handleOpenRenameDialog = (albumId: number) => {
    const currentAlbum = savedAlbums.find((album) => album.id === albumId);
    if (currentAlbum) {
      // Set state before opening dialog
      setNewAlbumName(currentAlbum.albumName);
      setSelectedAlbumId(albumId);
      // Open dialog after states are set
      setTimeout(() => {
        setRenameDialogOpen(true);
      }, 0);
    }
  };

  const handleOpenDeleteDialog = (albumId: number) => {
    setSelectedAlbumId(albumId);
    setDeleteDialogOpen(true);
  };
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const handleDeleteAlbum = async () => {
    if (selectedAlbumId === null) return;

    try {
      await deleteAlbumFromDB(selectedAlbumId);
      await loadSavedAlbums(); // Reload albums after deletion
      setDeleteDialogOpen(false);
      toast.success("Album deleted successfully");
    } catch (error) {
      console.error("Error deleting album:", error);
      toast.error("Failed to delete album", {
        description: "Please check the console for details."
      });
      setDeleteDialogOpen(false);
    }
  };

  const handleCloseRenameDialog = () => {
    // First close the dialog
    setRenameDialogOpen(false);

    // Then reset state on next animation frame
    requestAnimationFrame(() => {
      setSelectedAlbumId(null);
      setNewAlbumName("");
    });
  };

  // Handle the rename operation
  const handleRenameSubmit = () => {
    // Run the rename operation on next animation frame to prevent UI blocking
    requestAnimationFrame(async () => {
      if (selectedAlbumId === null || !newAlbumName.trim()) {
        handleCloseRenameDialog();
        return;
      }

      const albumExists = savedAlbums.some(
        (album) =>
          album.albumName.toLowerCase() === newAlbumName.toLowerCase() &&
          album.id !== selectedAlbumId
      );

      if (albumExists) {
        toast.error("Album name already exists", {
          description: "Please choose a different name."
        });
        return;
      }

      // Store values before closing dialog
      const albumIdToUpdate = selectedAlbumId;
      const nameToUpdate = newAlbumName;

      // Close dialog before any async operations
      handleCloseRenameDialog();

      try {
        // Perform the database update
        await renameAlbumInDB(albumIdToUpdate, nameToUpdate);

        // Reload albums
        await loadSavedAlbums();

        // Show success message
        toast.success(`Album renamed to "${nameToUpdate}"`);
      } catch (error) {
        console.error("Error renaming album:", error);
        toast.error("Failed to rename album", {
          description: "Please check the console for details."
        });
      }
    });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye size={24} />
              Albums
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading albums...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-8xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye size={24} />
              Albums
            </CardTitle>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search albums..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
          <CardDescription>View and manage your saved albums.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="w-full h-[600px] rounded-md">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid-flow-row auto-rows-fr">
              {filteredAlbums?.length > 0 ? (
                filteredAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onRename={handleOpenRenameDialog}
                    onDelete={handleOpenDeleteDialog}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  No matching albums found.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Link to="/Upload/Upload">
            <Button variant="outline">
              <Upload size={16} className="mr-2" />
              Back to Uploader
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <RenameDialog
        isOpen={renameDialogOpen}
        onClose={handleCloseRenameDialog}
        albumName={newAlbumName}
        onRename={handleRenameSubmit}
        setAlbumName={setNewAlbumName}
      />

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={handleDeleteAlbum}
      />
    </div>
  );
};

export default AlbumsPage;
