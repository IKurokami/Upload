import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import {
  Loader2,
  Eye,
  Save,
  Download,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Separator } from "@/components/ui/separator";
import { SortableItem } from "@/components/common/sortable-item";

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
  const { albumId } = useParams<{ albumId: string }>();
  const [album, setAlbum] = useState<SavedAlbum | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [albumName, setAlbumName] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Use array directly
  const [imageUrlsText, setImageUrlsText] = useState<string>(""); //For Edit
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [activeId, setActiveId] = useState<string | number | null>(null); // For drag and drop

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (albumId) {
      const loadAlbumDetails = async (): Promise<void> => {
        setLoading(true);
        const request = indexedDB.open("htmlEditorDB", 1);

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(["htmlFiles"], "readonly");
          const store = transaction.objectStore("htmlFiles");
          const getRequest = store.get(parseInt(albumId, 10));

          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result) {
              setAlbum(result);
              setAlbumName(result.albumName);
              setImageUrls(result.imageUrls); // Set array directly
              setImageUrlsText(result.imageUrls.join("\n")); // For textarea
            } else {
              console.error("Album not found");
            }
            setLoading(false);
          };
          getRequest.onerror = () => {
            console.error("Error loading album from IndexedDB");
            setLoading(false);
          };
        };
        request.onerror = (event) => {
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

    const updatedImageUrls = editMode
      ? imageUrls
      : imageUrlsText.split("\n").filter((url) => url.trim() !== "");
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
        createdAt: album.createdAt,
      };

      const putRequest = store.put(updatedAlbum);
      putRequest.onsuccess = () => {
        setSaving(false);
        setSaveMessage({
          type: "success",
          text: "Album updated successfully!",
        });
        setAlbum(updatedAlbum);

        // Update the imageUrls and imageUrlsText state with the saved data
        setImageUrls(updatedImageUrls);
        setImageUrlsText(updatedImageUrls.join("\n"));

        setTimeout(() => setSaveMessage(null), 3000);

        if (editMode) setEditMode(false); // Exit edit mode on successful save
      };

      putRequest.onerror = () => {
        setSaving(false);
        setSaveMessage({ type: "error", text: "Failed to update album." });
        setTimeout(() => setSaveMessage(null), 3000);
      };
    };
    request.onerror = (event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      setSaving(false);
      setSaveMessage({
        type: "error",
        text: "Failed to connect to database.",
      });
      setTimeout(() => setSaveMessage(null), 3000);
    };
  };

  const generateHtmlFile = (): void => {
    const linksHtml = imageUrls
      .map((link) => `<img src="${link}" alt="" >`) //removed loading lazy, since it may cause display issue
      .join("\n");

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${albumName}</title>
    <style>
        body { background: #f2f2f2; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center;}
        img { max-width: 100%; height: auto; margin-bottom: 10px;}
    </style>
</head>
<body>
   ${linksHtml}
</body>
</html>`;

    const blob: Blob = new Blob([fullHtml], { type: "text/html" });
    const url: string = URL.createObjectURL(blob);

    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = `${albumName}.html`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setImageUrls((items) => {
        const oldIndex = items.findIndex((item) => item === active.id);
        const newIndex = items.findIndex((item) => item === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const toggleEditMode = () => {
    if (editMode) {
      // If exiting edit mode, update imageUrlsText based on imageUrls.
      setImageUrlsText(imageUrls.join("\n"));
    }
    setEditMode(!editMode);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Album Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-6 w-6 animate-spin" /> Loading album
            details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Album Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Album not found.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link to="/albums">
              <Button variant="outline">
                <Eye className="mr-2" />
                Back to Albums
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Eye size={24} className="text-blue-600" />
            Album Detail - {albumName}
          </CardTitle>
          <CardDescription>View and update album details.</CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {!editMode && (
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className="flex flex-col items-center">
                {imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="max-w-1/2 h-auto rounded-md" // Keep existing styles
                  />
                ))}
              </div>
            </ScrollArea>
          )}
          {editMode && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="my-2" htmlFor="imageUrls">
                    Image URLs
                  </Label>
                  <Textarea
                    id="imageUrls"
                    value={imageUrlsText}
                    onChange={(e) => setImageUrlsText(e.target.value)}
                    placeholder="Enter image URLs, one per line"
                    className="max-h-[400px] font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="my-2">Preview & Reorder</Label>
                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <SortableContext
                        items={imageUrls}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col items-center">
                          {imageUrls.map((url, index) => (
                            <SortableItem
                              key={url}
                              id={url}
                              url={url}
                              index={index}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </ScrollArea>
                    <DragOverlay>
                      {activeId ? (
                        <img
                          src={activeId as string}
                          alt="Dragging"
                          className="h-20 w-auto border rounded-md"
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>
              <Separator className="my-4" />
            </>
          )}

          <div>
            <Label className="my-2" htmlFor="albumName">
              Album Name
            </Label>
            <Input
              id="albumName"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Album Name"
              disabled={!editMode}
            />
          </div>

          {saveMessage && (
            <Alert
              variant={saveMessage.type === "error" ? "destructive" : "default"}
            >
              <AlertTitle>
                {saveMessage.type === "error" ? "Error" : "Success"}
              </AlertTitle>
              <AlertDescription>{saveMessage.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
          <div className="flex gap-2">
            <Link to="/albums">
              <Button variant="outline">
                <ChevronLeft size={16} className="mr-2" />
                Back to Albums
              </Button>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" onClick={generateHtmlFile}>
                    <Download size={16} className="mr-2" /> Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download HTML file</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant={editMode ? "destructive" : "secondary"}
              onClick={toggleEditMode}
            >
              {editMode ? (
                <>
                  <ChevronRight size={16} className="mr-2" />
                  Exit Edit Mode
                </>
              ) : (
                <>
                  <Edit size={16} className="mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>

          <Button onClick={handleSaveAlbum} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Changes
          </Button>
        </CardFooter>

        <CardFooter className="p-4">
          <div className="text-sm text-gray-500">
            Created at:{" "}
            {album ? new Date(album.createdAt).toLocaleDateString() : "N/A"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AlbumDetailPage;
