import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Upload, MoreVertical, Trash2, Edit, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { Badge } from "@/components/ui/badge";

interface SavedAlbum {
  id?: number;
  albumName: string;
  imageUrls: string[];
  createdAt: string;
}

const AlbumsPage: React.FC = () => {
  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>(""); // State for search query
  const [filteredAlbums, setFilteredAlbums] = useState<SavedAlbum[]>([]); // State for filtered albums


  const loadSavedAlbums = async (): Promise<void> => {
    setLoading(true);
    const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["htmlFiles"],
        "readonly"
      );
      const store: IDBObjectStore = transaction.objectStore("htmlFiles");
      const getRequest: IDBRequest<SavedAlbum[]> = store.getAll();

      getRequest.onsuccess = () => {
        setSavedAlbums(getRequest.result);
        setLoading(false);
      };

      getRequest.onerror = () => {
        console.error("Error loading albums from IndexedDB");
        setLoading(false);
        alert("Failed to load albums. Please check console for details.");
      };
    };

    request.onerror = (event: Event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      setLoading(false);
      alert(
        "Failed to access albums database. Please check console for details."
      );
    };
  };

  useEffect(() => {
    loadSavedAlbums();
  }, []);


    useEffect(() => {
    // Filter albums based on search query
    const filtered = savedAlbums.filter((album) =>
      album.albumName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAlbums(filtered);
  }, [searchQuery, savedAlbums]);



  const handleOpenRenameDialog = (albumId: number) => {
    const currentAlbum = savedAlbums.find((album) => album.id === albumId);
    if (currentAlbum) {
      setNewAlbumName(currentAlbum.albumName);
      setSelectedAlbumId(albumId);
      setRenameDialogOpen(true);
    }
  };

  const handleOpenDeleteDialog = (albumId: number) => {
    setSelectedAlbumId(albumId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAlbum = () => {
    if (selectedAlbumId === null) return;

    const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["htmlFiles"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("htmlFiles");
      const deleteRequest: IDBRequest = store.delete(selectedAlbumId);

      deleteRequest.onsuccess = () => {
        console.log(`Album ${selectedAlbumId} deleted successfully.`);
        loadSavedAlbums();
        setDeleteDialogOpen(false);
      };

      deleteRequest.onerror = () => {
        console.error("Error deleting album from IndexedDB");
        alert("Failed to delete album. Please check console for details.");
        setDeleteDialogOpen(false);
      };
    };

    request.onerror = (event: Event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      alert(
        "Failed to access albums database. Please check console for details."
      );
      setDeleteDialogOpen(false);
    };
  };

  const handleRenameAlbum = () => {
    if (selectedAlbumId === null || !newAlbumName.trim()) return;

    const albumExists = savedAlbums.some(
      (album) =>
        album.albumName.toLowerCase() === newAlbumName.toLowerCase() &&
        album.id !== selectedAlbumId
    );

    if (albumExists) {
      alert("Album name already exists. Please choose a different name.");
      return;
    }

    const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["htmlFiles"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("htmlFiles");
      const getRequest: IDBRequest<SavedAlbum> = store.get(selectedAlbumId);

      getRequest.onsuccess = () => {
        const albumToUpdate = getRequest.result;
        if (albumToUpdate) {
          albumToUpdate.albumName = newAlbumName;
          const putRequest: IDBRequest = store.put(albumToUpdate);

          putRequest.onsuccess = () => {
            console.log(
              `Album ${selectedAlbumId} renamed to ${newAlbumName} successfully.`
            );
            loadSavedAlbums();
            setRenameDialogOpen(false);
          };

          putRequest.onerror = () => {
            console.error("Error renaming album in IndexedDB");
            alert("Failed to rename album. Please check console for details.");
            setRenameDialogOpen(false);
          };
        } else {
          console.error("Album not found in IndexedDB for renaming.");
          alert("Album not found for renaming.");
          setRenameDialogOpen(false);
        }
      };

      getRequest.onerror = () => {
        console.error("Error getting album from IndexedDB for renaming");
        alert(
          "Failed to access album data for renaming. Please check console for details."
        );
        setRenameDialogOpen(false);
      };
    };

    request.onerror = (event: Event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      alert(
        "Failed to access albums database. Please check console for details."
      );
      setRenameDialogOpen(false);
    };
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
    <div className="container mx-auto p-4 max-w-4xl">
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
                    className="pr-10" // Add padding for the search icon
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
           </div>
          <CardDescription>View and manage your saved albums.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
           <ScrollArea className="w-full h-[500px] rounded-md">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAlbums.length > 0 ? (
                filteredAlbums.map((album) => (
                  <div key={album.id} className="relative group">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex flex-col">
                          <CardTitle className="text-lg">
                            {album.albumName}
                          </CardTitle>
                          <CardDescription>
                            Created at:{" "}
                            {new Date(album.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                         <p className="text-sm flex items-center">
                            <Badge variant="secondary" className="mr-1">{album.imageUrls.length}</Badge> images
                         </p>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between items-center">
                        <Link
                          to={`/albums/${album.id}`}
                          className="flex-1 mr-2"
                        >
                          <InteractiveHoverButton className="w-full">
                            View Album
                          </InteractiveHoverButton>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleOpenRenameDialog(album.id as number)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleOpenDeleteDialog(album.id as number)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  </div>
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
          <Link to="/upload">
            <Button variant="outline">
              <Upload size={16} className="mr-2" />
              Back to Uploader
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Album</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Enter new album name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameAlbum}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              album and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAlbum}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AlbumsPage;