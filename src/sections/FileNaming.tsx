// src/components/FileNaming.tsx
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@radix-ui/react-label";
import React from "react";

interface FileNamingProps {
  albumName: string;
  setAlbumName: (name: string) => void;
  chapterNumber: string;
  setChapterNumber: (num: string) => void;
  customFileName: string;
  setCustomFileName: (name: string) => void;
  namingMethod: string;
  setNamingMethod: (method: string) => void;
  getFileName: () => string;
}

const FileNaming: React.FC<FileNamingProps> = ({
  albumName,
  setAlbumName,
  chapterNumber,
  setChapterNumber,
  customFileName,
  setCustomFileName,
  namingMethod,
  setNamingMethod,
  getFileName,
}) => {
  return (
    <>
      <h3 className="font-semibold text-lg mb-2">File Naming</h3>
      <Tabs
        value={namingMethod}
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
            <Label className="my-2" htmlFor="customFileName">
              File Name
            </Label>
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
    </>
  );
};
export default FileNaming;
