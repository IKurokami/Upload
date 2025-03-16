// AlbumDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Import useParams and Link
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Eye, Save } from "lucide-react";

// Define types
interface SavedAlbum {
  id?: number;
  albumName: string;
  imageUrls: string[];
  createdAt: string;
}

interface SaveMessage {
  type: "success" | "error";
  text: string;
}

const AlbumDetailPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>(); // Use useParams to get albumId
  const [album, setAlbum] = useState<SavedAlbum | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [albumName, setAlbumName] = useState<string>("");
  const [imageUrlsText, setImageUrlsText] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);

  useEffect(() => {
    if (albumId) {
      const loadAlbumDetails = async (): Promise<void> => {
        setLoading(true);
        const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

        request.onsuccess = (event: Event) => {
          const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
          const transaction: IDBTransaction = db.transaction(
            ["htmlFiles"],
            "readonly"
          );
          const store: IDBObjectStore = transaction.objectStore("htmlFiles");
          const getRequest: IDBRequest<SavedAlbum> = store.get(parseInt(albumId, 10)); // albumId is already a string from useParams

          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result) {
              setAlbum(result);
              setAlbumName(result.albumName);
              setImageUrlsText(result.imageUrls.join("\n"));
            } else {
              console.error("Album not found");
              // Optionally redirect to albums page or display an error
            }
            setLoading(false);
          };

          getRequest.onerror = () => {
            console.error("Error loading album from IndexedDB");
            setLoading(false);
          };
        };

        request.onerror = (event: Event) => {
          console.error(
            "IndexedDB error:",
            (event.target as IDBOpenDBRequest).error
          );
          setLoading(false);
        };
      };
      loadAlbumDetails();
    }
  }, [albumId]);

  const handleSaveAlbum = async () => {
    setSaving(true);
    setSaveMessage(null);

    if (!album || !album.id) {
      setSaveMessage({ type: "error", text: "Album ID not found." });
      setSaving(false);
      return;
    }

    const updatedImageUrls = imageUrlsText.split("\n").filter(url => url.trim() !== '');

    const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["htmlFiles"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("htmlFiles");

      const updatedAlbum: SavedAlbum = {
        id: album.id,
        albumName: albumName,
        imageUrls: updatedImageUrls,
        createdAt: album.createdAt, // Keep original creation date
      };

      const putRequest: IDBRequest<IDBValidKey> = store.put(updatedAlbum);

      putRequest.onsuccess = () => {
        setSaving(false);
        setSaveMessage({ type: "success", text: "Album updated successfully!" });
        setAlbum(updatedAlbum); // Update local album state
        setTimeout(() => setSaveMessage(null), 3000);
      };

      putRequest.onerror = () => {
        setSaving(false);
        setSaveMessage({ type: "error", text: "Failed to update album." });
        setTimeout(() => setSaveMessage(null), 3000);
      };
    };

    request.onerror = (event: Event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      setSaving(false);
      setSaveMessage({ type: "error", text: "Failed to connect to database." });
      setTimeout(() => setSaveMessage(null), 3000);
    };
  };


  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye size={24} className="text-blue-600" />
              Album Detail
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin" /> Loading album details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye size={24} className="text-blue-600" />
              Album Detail
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Album not found.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <Link to="/albums"> {/* Use Link to navigate back to albums */}
              <Button variant="outline">
                <Eye size={16} className="mr-2" />
                Back to Albums
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Eye size={24} className="text-blue-600" />
            Album Detail
          </CardTitle>
          <CardDescription>
            View and update album details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="albumName">Album Name</Label>
            <Input
              id="albumName"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Album Name"
            />
          </div>
          <div>
            <Label htmlFor="imageUrls">Image URLs</Label>
            <Textarea
              id="imageUrls"
              value={imageUrlsText}
              onChange={(e) => setImageUrlsText(e.target.value)}
              placeholder="Enter image URLs, one per line"
              className="min-h-40 font-mono text-sm"
            />
          </div>

          {saveMessage && (
            <Alert
              variant={
                saveMessage.type === "error" ? "destructive" : "default"
              }
              className={
                saveMessage.type === "error" ? "bg-red-50" : "bg-blue-50"
              }
            >
              <AlertTitle>
                {saveMessage.type === "error" ? "Error" : "Success"}
              </AlertTitle>
              <AlertDescription>{saveMessage.text}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex justify-between p-4 border-t">
          <Link to="/albums"> {/* Use Link to navigate back to albums */}
            <Button variant="outline">
              <Eye size={16} className="mr-2" />
              Back to Albums
            </Button>
          </Link>
          <Button onClick={handleSaveAlbum} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
            Save Changes
          </Button>
        </CardFooter>
        <CardFooter className="p-4">
          <div className="text-sm text-gray-500">
            Created at: {album ? new Date(album.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AlbumDetailPage;