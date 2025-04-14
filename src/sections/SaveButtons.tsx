// src/components/SaveButtons.tsx
import React from "react";

import { Loader2, FileDown, Upload } from "lucide-react";
import { generateHtmlFile, uploadToIndexedDB } from "@/lib/db"; // Import functions
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface SaveButtonsProps {
  htmlContent: string;
  extractedLinks: string[];
  lazyLoad: boolean;
  fileName: string;
  albumName: string;
  chapterNumber: string;
  namingMethod: string;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  saveMessage: { type: "success" | "error"; text: string } | null;
  setSaveMessage: (
    message: { type: "success" | "error"; text: string } | null
  ) => void;
  setSavedFiles: (files: any[]) => void;
}

const SaveButtons: React.FC<SaveButtonsProps> = ({
  htmlContent,
  extractedLinks,
  lazyLoad,
  fileName,
  albumName,
  chapterNumber,
  namingMethod,
  saving,
  setSaving,
  saveMessage,
  setSaveMessage,
  setSavedFiles,
}) => {
  return (
    <>
      {/* Save Message Alert */}
      {saveMessage && (
        <Alert
          variant={saveMessage.type === "error" ? "destructive" : "default"}
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

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {/* Download Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() =>
                  generateHtmlFile(
                    extractedLinks,
                    htmlContent,
                    lazyLoad,
                    fileName
                  )
                }
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

        {/* Upload Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  uploadToIndexedDB(
                    albumName,
                    chapterNumber,
                    namingMethod,
                    fileName,
                    extractedLinks,
                    setSaving,
                    setSaveMessage,
                    setSavedFiles
                  )
                }
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
    </>
  );
};

export default SaveButtons;
