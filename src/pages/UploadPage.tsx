import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Eye, Download, Code, FileDown, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const UploadPage: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  // const [orderedLinks, setOrderedLinks] = useState<string[]>([]); // Removed orderedLinks state
  const [albumName, setAlbumName] = useState<string>("Album");
  const [chapterNumber, setChapterNumber] = useState<string>("1");
  const [customFileName, setCustomFileName] = useState<string>("my-file.html");
  const [namingMethod, setNamingMethod] = useState<string>("chapter");
  const [savedFiles, setSavedFiles] = useState<SavedAlbum[]>([]); // Updated type to SavedAlbum[]
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [lazyLoad, setLazyLoad] = useState<boolean>(false); // State for lazy loading toggle

  // Auto-detect image HTML and extract links
  useEffect(() => {
    if (htmlContent.trim()) {
      // Check if content contains img tags
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      const links: string[] = [];

      while ((match = imgRegex.exec(htmlContent)) !== null) {
        links.push(match[1]);
      }

      if (links.length > 0) {
        setExtractedLinks(links);
        // setOrderedLinks(links); // Initialize orderedLinks with extractedLinks - Removed
      } else {
        // If no img tags found, check if content contains direct URLs
        const urlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/gi;
        const directLinks = htmlContent.match(urlRegex) || [];
        setExtractedLinks(directLinks);
        // setOrderedLinks(directLinks); // Initialize orderedLinks with directLinks - Removed
      }
    } else {
      setExtractedLinks([]);
      // setOrderedLinks([]); // Clear orderedLinks when htmlContent is empty - Removed
    }
  }, [htmlContent]);

  // Get final filename based on selected naming method
  const getFileName = (): string => {
    if (namingMethod === "chapter") {
      return `${chapterNumber} - ${albumName}.html`;
    } else {
      return customFileName;
    }
  };

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async (): Promise<void> => {
      // Open a connection to IndexedDB
      const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

      request.onerror = (event: Event) => {
        console.error(
          "IndexedDB error:",
          (event.target as IDBOpenDBRequest).error
        );
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        // Create an object store if it doesn't exist
        if (!db.objectStoreNames.contains("htmlFiles")) {
          db.createObjectStore("htmlFiles", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = (event: Event) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        // Load saved files
        loadSavedFiles(db);
      };
    };

    initDB();
  }, []);

  // Load saved files from IndexedDB
  const loadSavedFiles = (db: IDBDatabase): void => {
    const transaction: IDBTransaction = db.transaction(
      ["htmlFiles"],
      "readonly"
    );
    const store: IDBObjectStore = transaction.objectStore("htmlFiles");
    const request: IDBRequest<SavedAlbum[]> = store.getAll(); // Updated type to SavedAlbum[]

    request.onsuccess = () => {
      setSavedFiles(request.result);
    };
  };

  // Save HTML content to IndexedDB
  const uploadToIndexedDB = (): void => {
    setSaving(true);

    const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["htmlFiles"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("htmlFiles");

      // Determine the album name to save based on naming method
      const albumNameToSave =
        namingMethod === "chapter"
          ? `${chapterNumber} - ${albumName}`
          : albumName;

      // Check if album name already exists
      const existingAlbumRequest: IDBRequest<SavedAlbum[]> = store.getAll();
      existingAlbumRequest.onsuccess = () => {
        const existingAlbums: SavedAlbum[] = existingAlbumRequest.result;
        const albumExists = existingAlbums.some(
          (album) => album.albumName === albumNameToSave
        );

        if (albumExists) {
          setSaving(false);
          setSaveMessage({
            type: "error",
            text: "Album name already exists. Please choose a different name.",
          });
          setTimeout(() => setSaveMessage(null), 3000);
          return; // Exit the function if album exists
        }

        // Get the content to save (image URLs from extractedLinks)
        const contentToSave = extractedLinks;

        // Create album entry
        const entry: SavedAlbum = {
          albumName: albumNameToSave, // Use the constructed album name here
          imageUrls: contentToSave,
          createdAt: new Date().toISOString(),
        };

        const addRequest: IDBRequest<IDBValidKey> = store.add(entry);

        addRequest.onsuccess = () => {
          setSaving(false);
          setSaveMessage({
            type: "success",
            text: "Album saved successfully!",
          });

          // Refresh the list of saved files (albums)
          loadSavedFiles(db);

          // Clear message after 3 seconds
          setTimeout(() => setSaveMessage(null), 3000);
        };

        addRequest.onerror = () => {
          setSaving(false);
          setSaveMessage({ type: "error", text: "Failed to save album." });
          setTimeout(() => setSaveMessage(null), 3000);
        };
      };
    };
  };

  // Generate HTML file for download
  const generateHtmlFile = (): void => {
    // Generate HTML based on extracted links or original content
    const linksHtml =
      extractedLinks.length > 0 // Changed to extractedLinks
        ? extractedLinks
            .map(
              (link) =>
                `<img src="${link}" alt="" border="0" ${
                  lazyLoad ? 'loading="lazy"' : ""
                }>`
            )
            .join("\n")
        : htmlContent;

    const fullHtml = `<style>
  body {
    background: #f2f2f2;
    margin: 0;
    padding: 20px;
  }
  img {
    max-width: 100%;
    height: auto;
    background: white;
    object-fit: contain;
    object-position: top center;
    display: block; /* Remove default inline spacing */
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .image-wrapper {
    margin-bottom: 0px; /* Remove bottom margin between images */
  }
</style>
<body class="container">
  ${linksHtml
    .split("\n")
    .map((imgTag) => `<div class="image-wrapper">${imgTag}</div>`)
    .join("\n")}
</body>`;

    const blob: Blob = new Blob([fullHtml], { type: "text/html" });
    const url: string = URL.createObjectURL(blob);

    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Render the content for preview
  const renderPreviewContent = () => {
    if (extractedLinks.length > 0) {
      return (
        <div className="flex flex-col">
          {extractedLinks.map((link, index) => (
            <div key={link}>
              <img
                src={link}
                alt={`Image ${index + 1}`}
                className="max-w-full h-auto"
              />
              {/* block to remove spacing */}
            </div>
          ))}
        </div>
      );
    } else {
      return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    }
  };


  return (
    <div className="container mx-auto p-4 max-w-4xl flex">
      {" "}
      {/* Flex container for main content and sidebar */}
      <div className="w-full">
        {" "}
        {/* Main content area */}
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Upload size={24} className="text-blue-600" />
              Uploader
            </CardTitle>
          </CardHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid grid-cols-2 mx-4 mt-4">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Code size={16} /> Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye size={16} /> Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="p-4">
              <div className="space-y-4">
                <Textarea
                  className="min-h-80 font-mono text-sm"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Paste your HTML or image links here..."
                />

                <div className="p-4 rounded-lg border">
                  <Tabs defaultValue="chapter" onValueChange={setNamingMethod}>
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="chapter">Chapter + Album</TabsTrigger>
                      <TabsTrigger value="custom">Custom Name</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chapter" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chapterNumber">Chapter Number</Label>
                          <Input
                            id="chapterNumber"
                            value={chapterNumber}
                            onChange={(e) => setChapterNumber(e.target.value)}
                            placeholder="Enter chapter number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="albumName">Album Name</Label>
                          <Input
                            id="albumName"
                            value={albumName}
                            onChange={(e) => setAlbumName(e.target.value)}
                            placeholder="Enter album name"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        File will be named as: {getFileName()}
                      </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="customFileName">File Name</Label>
                        <Input
                          id="customFileName"
                          value={customFileName}
                          onChange={(e) => setCustomFileName(e.target.value)}
                          placeholder="Enter file name"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lazy-load"
                    checked={lazyLoad}
                    onCheckedChange={(checked) => setLazyLoad(!!checked)}
                  />
                  <Label htmlFor="lazy-load">
                    Enable Lazy Loading for Images
                  </Label>
                </div>

                {extractedLinks.length > 0 && (
                  <Alert className="border-green-200">
                    <AlertTitle className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      Image Detection
                    </AlertTitle>
                    <AlertDescription>
                      Detected {extractedLinks.length} image link(s). Only the
                      image URLs will be processed.
                    </AlertDescription>
                  </Alert>
                )}

                {saveMessage && (
                  <Alert
                    variant={
                      saveMessage.type === "error" ? "destructive" : "default"
                    }
                    className={
                      saveMessage.type === "error" ? "bg-red-50" : ""
                    }
                  >
                    <AlertTitle>
                      {saveMessage.type === "error" ? "Error" : "Success"}
                    </AlertTitle>
                    <AlertDescription>{saveMessage.text}</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="border-t">
              <div className="p-4 rounded-md min-h-80 overflow-auto flex">
                {" "}
                {/* Flex container for preview and sidebar */}
                <div className="w-full rounded-md shadow-sm mr-0"> {/* Removed mr-4 */}
                  {" "}
                  {/* Preview area takes full width and margin to separate from sidebar */}
                  {renderPreviewContent()}
                </div>
                {/* {orderedLinks.length > 0 && ( // Removed Sidebar
                  <div className="w-64 border rounded-md p-2 hidden md:block">
                    <div className="font-bold mb-2">Reorder Images</div>
                    <ScrollArea className="h-[calc(100vh-200px)]">
                      {orderedLinks.map((link, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-2 rounded-md cursor-grab"
                        >
                          <span>{index + 1}.</span>
                          <img
                            src={link}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-8 w-8 rounded object-cover"
                          />
                          <span className="text-xs truncate">{link}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )} */}
              </div>
            </TabsContent>
          </Tabs>

          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-gray-500">
              {savedFiles.length} file(s) saved in browser storage
            </div>
            <div className="flex space-x-2">
              {" "}
              {/* Flex container for buttons */}
              <Button
                variant="outline"
                onClick={generateHtmlFile}
                disabled={!htmlContent.trim()}
                className="flex items-center gap-2 w-24 justify-center" // Added w-24 and justify-center for same width
              >
                <FileDown size={16} />
                Download
              </Button>
              <Button
                onClick={uploadToIndexedDB}
                disabled={saving || !htmlContent.trim()}
                className="flex items-center gap-2 w-24 justify-center" // Added w-24 and justify-center for same width
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Upload
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;