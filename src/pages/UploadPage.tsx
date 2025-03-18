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
import {
  Loader2,
  Eye,
  Code,
  FileDown,
  Upload,
  ImagePlus,
  ListChecks,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  const [albumName, setAlbumName] = useState<string>("Album");
  const [chapterNumber, setChapterNumber] = useState<string>("1");
  const [customFileName, setCustomFileName] = useState<string>("my-file.html");
  const [namingMethod, setNamingMethod] = useState<string>("chapter");
  const [savedFiles, setSavedFiles] = useState<SavedAlbum[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [lazyLoad, setLazyLoad] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<string>("code"); // "code" or "visual"

  useEffect(() => {
    if (htmlContent.trim()) {
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      const links: string[] = [];

      while ((match = imgRegex.exec(htmlContent)) !== null) {
        links.push(match[1]);
      }

      if (links.length > 0) {
        setExtractedLinks(links);
      } else {
        const urlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/gi;
        const directLinks = htmlContent.match(urlRegex) || [];
        setExtractedLinks(directLinks);
      }
    } else {
      setExtractedLinks([]);
    }
  }, [htmlContent]);

  const getFileName = (): string => {
    if (namingMethod === "chapter") {
      return `${chapterNumber} - ${albumName}.html`;
    } else {
      return customFileName;
    }
  };

  useEffect(() => {
    const initDB = async (): Promise<void> => {
      const request: IDBOpenDBRequest = indexedDB.open("htmlEditorDB", 1);

      request.onerror = (event: Event) => {
        console.error(
          "IndexedDB error:",
          (event.target as IDBOpenDBRequest).error
        );
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("htmlFiles")) {
          db.createObjectStore("htmlFiles", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = (event: Event) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        loadSavedFiles(db);
      };
    };

    initDB();
  }, []);

  const loadSavedFiles = (db: IDBDatabase): void => {
    const transaction: IDBTransaction = db.transaction(
      ["htmlFiles"],
      "readonly"
    );
    const store: IDBObjectStore = transaction.objectStore("htmlFiles");
    const request: IDBRequest<SavedAlbum[]> = store.getAll();

    request.onsuccess = () => {
      setSavedFiles(request.result);
    };
  };

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

      const albumNameToSave =
        namingMethod === "chapter"
          ? `${chapterNumber} - ${albumName}`
          : albumName;

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
          return;
        }

        const contentToSave = extractedLinks;

        const entry: SavedAlbum = {
          albumName: albumNameToSave,
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

          loadSavedFiles(db);
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

  const generateHtmlFile = (): void => {
    const linksHtml =
      extractedLinks.length > 0
        ? extractedLinks
            .map(
              (link) =>
                `<img src="${link}" alt="" ${lazyLoad ? 'loading="lazy"' : ""}>`
            )
            .join("\n")
        : htmlContent;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getFileName()}</title>
    <style>
        body { background: #f2f2f2; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        img { max-width: 100%; height: auto; } /* Added margin for spacing */
        .image-wrapper { margin-bottom: 0px; } /* Remove extra margin */
    </style>
</head>
<body>
    ${linksHtml
      .split("\n")
      .map((imgTag) => `<div class="image-wrapper">${imgTag}</div>`)
      .join("\n")}
</body>
</html>`;

    const blob: Blob = new Blob([fullHtml], { type: "text/html" });
    const url: string = URL.createObjectURL(blob);

    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const renderPreviewContent = () => {
    if (previewTab === "visual") {
      if (extractedLinks.length > 0) {
        return (
          <div className="flex flex-col items-center">
            {extractedLinks.map((link, index) => (
              <img
                key={link}
                src={link}
                alt={`Image ${index + 1}`}
                className="max-w-full h-auto"
              />
            ))}
          </div>
        );
      } else {
        return (
          <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className="prose dark:prose-invert max-w-none"
          />
        );
      }
    } else {
      // Code Preview
      const codeToRender =
        extractedLinks.length > 0
          ? extractedLinks
              .map(
                (link) =>
                  `<img src="${link}" alt="" ${
                    lazyLoad ? 'loading="lazy"' : ""
                  }>`
              )
              .join("\n")
          : htmlContent;
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
          <code className="text-sm font-mono">{codeToRender}</code>
        </pre>
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ImagePlus size={24} className="text-blue-600" />
            HTML Image Uploader
          </CardTitle>
          <p className="text-gray-500 dark:text-gray-400">
            Create HTML files from image links or HTML content.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="edit" className="w-full space-y-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Code size={16} /> Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye size={16} /> Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <Textarea
                className="min-h-[150px] font-mono text-sm"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Paste your HTML or image links here..."
              />

              <div className="flex items-center space-x-2 my-4">
                <Checkbox
                  id="lazy-load"
                  checked={lazyLoad}
                  onCheckedChange={(checked) => setLazyLoad(!!checked)}
                />
                <Label htmlFor="lazy-load">
                  Enable Lazy Loading for Images
                </Label>
              </div>

              <Separator className="my-4" />

              <h3 className="font-semibold text-lg mb-2">File Naming</h3>
              <Tabs
                defaultValue="chapter"
                onValueChange={setNamingMethod}
                className="mb-4"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="chapter">Chapter + Album</TabsTrigger>
                  <TabsTrigger value="custom">Custom Name</TabsTrigger>
                </TabsList>

                <TabsContent value="chapter" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="my-2" htmlFor="chapterNumber">
                        Chapter Number
                      </Label>
                      <Input
                        id="chapterNumber"
                        value={chapterNumber}
                        onChange={(e) => setChapterNumber(e.target.value)}
                        placeholder="Enter chapter number"
                      />
                    </div>
                    <div>
                      <Label className="my-2" htmlFor="albumName">
                        Album Name
                      </Label>
                      <Input
                        id="albumName"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                        placeholder="Enter album name"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div>
                    <Label  className="my-2" htmlFor="customFileName">File Name</Label>
                    <Input
                      id="customFileName"
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      placeholder="Enter file name"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                File will be named as:{" "}
                <Badge variant="secondary">{getFileName()}</Badge>
              </div>

              {extractedLinks.length > 0 && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400">
                  <AlertTitle className="flex items-center gap-2">
                    <ListChecks className="text-green-600 dark:text-green-300" />
                    Image Detection
                  </AlertTitle>
                  <AlertDescription>
                    Detected {extractedLinks.length} image link(s). Only the
                    image URLs will be processed.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="preview">
              <Tabs defaultValue="visual" className="w-full space-y-4">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger
                    value="visual"
                    onClick={() => setPreviewTab("visual")}
                  >
                    Visual Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    onClick={() => setPreviewTab("code")}
                  >
                    Code Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="visual">
                  {renderPreviewContent()}
                </TabsContent>
                <TabsContent value="code">{renderPreviewContent()}</TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {savedFiles.length} file(s) saved in browser storage.{" "}
            <Link to="/albums" className="text-blue-500 hover:underline">
              View Albums
            </Link>
          </div>
          <div>
            {saveMessage && (
              <Alert
                variant={
                  saveMessage.type === "error" ? "destructive" : "default"
                }
                className={`mb-4 ${
                  saveMessage.type === "error"
                    ? "bg-red-50 dark:bg-red-900"
                    : "bg-green-50 dark:bg-green-900"
                }`}
              >
                <AlertTitle>
                  {saveMessage.type === "error" ? "Error" : "Success"}
                </AlertTitle>
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </Alert>
            )}
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={generateHtmlFile}
                      disabled={!htmlContent.trim()}
                      className="w-32"
                    >
                      <FileDown size={16} className="mr-2" />
                      Download
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download the generated HTML file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={uploadToIndexedDB}
                      disabled={saving || !htmlContent.trim()}
                      className="w-32"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload size={16} className="mr-2" />
                      )}
                      Upload
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save the album to browser storage</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UploadPage;
