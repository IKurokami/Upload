// src/components/UploadPage.tsx
import React, { useState, useEffect } from "react";

import { Eye, Code, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initDB } from "@/lib/db";
import FileNaming from "@/sections/FileNaming";
import HtmlEditor from "@/sections/HtmlEditor";
import ImageDetectionAlert from "@/sections/ImageDetectionAlert";
import PreviewContent from "@/sections/PreviewContent";
import SaveButtons from "@/sections/SaveButtons";
import { SavedAlbum } from "@/types/SavedAlbum";

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

  const [lastSavedAlbumId, setLastSavedAlbumId] = useState<number | null>(null);

  const [lazyLoad, setLazyLoad] = useState<boolean>(true);
  const [previewTab, setPreviewTab] = useState<string>("visual");

  // --- Effects ---
  useEffect(() => {
    if (htmlContent.trim()) {
      // Match <img ... src="..." ...> or <img ... src='...' ...>
      const imgRegex = /<img[^>]+src\s*=\s*(['"])(.*?)\1/gi;
      let match;
      const links: string[] = [];

      while ((match = imgRegex.exec(htmlContent)) !== null) {
        links.push(match[2]);
      }

      // Also match data URLs in img src
      const dataUrlRegex = /<img[^>]+src\s*=\s*(['"])(data:image\/[a-zA-Z0-9+]+;base64,[^'"]+)\1/gi;
      while ((match = dataUrlRegex.exec(htmlContent)) !== null) {
        links.push(match[2]);
      }

      // Match CSS background-image: url(...)
      const cssUrlRegex = /background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/gi;
      while ((match = cssUrlRegex.exec(htmlContent)) !== null) {
        links.push(match[2]);
      }

      // Match direct image links (expanded extensions, allow query/hash after extension)
      if (links.length === 0) {
        const urlRegex =
          /https?:\/\/[^\s'"]+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|avif|jfif|pjpeg|pjp)(\?[^'"\s]*)?(\#[^'"\s]*)?/gi;
        const directLinks = htmlContent.match(urlRegex) || [];
        links.push(...directLinks);
      }
      setExtractedLinks(links);
    } else {
      setExtractedLinks([]);
    }
  }, [htmlContent]);

  useEffect(() => {
    initDB((files) => {
      setSavedFiles(files);
    });
  }, []);

  // Track last saved album ID after successful save
  useEffect(() => {
    if (saveMessage?.type === "success" && savedFiles.length > 0) {
      const last = savedFiles[savedFiles.length - 1];
      if (last && typeof last.id === "number") {
        setLastSavedAlbumId(last.id);
      }
    }
  }, [saveMessage, savedFiles]);

  const getFileName = (): string => {
    return namingMethod === "chapter"
      ? `${chapterNumber} - ${albumName}.html`
      : customFileName;
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
              <HtmlEditor
                htmlContent={htmlContent}
                setHtmlContent={setHtmlContent}
                lazyLoad={lazyLoad}
                setLazyLoad={setLazyLoad}
              />
              <FileNaming
                albumName={albumName}
                setAlbumName={setAlbumName}
                chapterNumber={chapterNumber}
                setChapterNumber={setChapterNumber}
                customFileName={customFileName}
                setCustomFileName={setCustomFileName}
                namingMethod={namingMethod}
                setNamingMethod={setNamingMethod}
                getFileName={getFileName}
              />

              <ImageDetectionAlert extractedLinks={extractedLinks} />
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
                  <PreviewContent
                    previewTab={previewTab}
                    extractedLinks={extractedLinks}
                    htmlContent={htmlContent}
                    lazyLoad={lazyLoad}
                  />
                </TabsContent>
                <TabsContent value="code">
                  <PreviewContent
                    previewTab={previewTab}
                    extractedLinks={extractedLinks}
                    htmlContent={htmlContent}
                    lazyLoad={lazyLoad}
                  />
                </TabsContent>
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
            {lastSavedAlbumId !== null && saveMessage?.type === "success" && (
              <>
                {" | "}
                <Link
                  to={`/albums/${lastSavedAlbumId}`}
                  className="text-green-600 hover:underline font-semibold"
                >
                  Go to Album
                </Link>
              </>
            )}
          </div>
          <SaveButtons
            htmlContent={htmlContent}
            extractedLinks={extractedLinks}
            lazyLoad={lazyLoad}
            fileName={getFileName()}
            albumName={albumName}
            chapterNumber={chapterNumber}
            namingMethod={namingMethod}
            saving={saving}
            setSaving={setSaving}
            saveMessage={saveMessage}
            setSaveMessage={setSaveMessage}
            setSavedFiles={setSavedFiles}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default UploadPage;
