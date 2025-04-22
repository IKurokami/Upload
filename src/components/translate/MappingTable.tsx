import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  FilePlus,
  Lightbulb,
  ArrowUp,
  FileDown,
  FileUp,
  Trash2,
  FileText,
  Text,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MappingEntry {
  term?: string;
  transcription?: string;
  type?: string;
  gender?: string;
  notes?: string;
}

interface MappingTableProps {
  mappingTable: MappingEntry[];
  collectionId: string;
  updateMappingEntry: (collectionId: string, index: number, field: keyof MappingEntry, value: string) => void;
  removeMappingEntry: (collectionId: string, index: number) => void;
  addMappingEntry: (collectionId: string, entries?: MappingEntry[]) => void;
  showImportArea: boolean;
  toggleImportArea: () => void;
  mappingMarkdown: string;
  setMappingMarkdown: (markdown: string) => void;
  revertImport: () => void;
  showRevertButton: boolean;
  exportMarkdownTable: () => void;
  importMarkdownTable: () => void;
  error: string | null;
  arcrylicBg?: boolean;
}

const MappingTable: React.FC<MappingTableProps> = ({
  mappingTable,
  collectionId,
  updateMappingEntry,
  removeMappingEntry,
  addMappingEntry,
  showImportArea,
  toggleImportArea,
  mappingMarkdown,
  setMappingMarkdown,
  revertImport,
  showRevertButton,
  exportMarkdownTable,
  importMarkdownTable,
  error,
}) => {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isTogglingImport, setIsTogglingImport] = useState(false);
  const [isShowingExample, setIsShowingExample] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [loadingEntryIndex, setLoadingEntryIndex] = useState<number | null>(null);

  const handleAddEntry = async () => {
    setIsAddingEntry(true);
    await addMappingEntry(collectionId);
    setIsAddingEntry(false);
  };

  const handleToggleImport = async () => {
    setIsTogglingImport(true);
    await toggleImportArea();
    setIsTogglingImport(false);
  };

  const handleShowExample = async () => {
    setIsShowingExample(true);
    const exampleMappingTable = `| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |\n|:----------- |:------------- |:------------------------- |:------------------ |:------ |\n| 事情是这样的 | Chuyện là thế này | Phrase | | Opening phrase |\n| 最近 | Gần đây | Time | | |\n| 师兄 | Sư huynh | Title/Relationship | Male | Elder martial brother |\n| 其实 | Thực ra | Adverb | | |`;
    setMappingMarkdown(exampleMappingTable);
    if (!showImportArea) await toggleImportArea();
    setIsShowingExample(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await exportMarkdownTable();
    setIsExporting(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    await importMarkdownTable();
    setIsImporting(false);
  };

  const handleRevert = async () => {
    setIsReverting(true);
    await revertImport();
    setIsReverting(false);
  };

  const handleRemoveEntry = async (index: number) => {
    setLoadingEntryIndex(index);
    await removeMappingEntry(collectionId, index);
    setLoadingEntryIndex(null);
  };
  
  return (
    <div>
      <div className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <div>
            <h2 className="text-xl flex items-center font-semibold">
              <Text className="h-5 w-5 mr-2 text-primary" />
              Mapping Table
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage term mappings and transcriptions
            </p>
          </div>
          <Badge variant="outline" className="h-6">
            {mappingTable?.length} {mappingTable?.length === 1 ? "Entry" : "Entries"}
          </Badge>
        </div>
      </div>

      <div className="p-4 pb-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between gap-2 sm:gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleAddEntry}
                    variant="default"
                    className="text-sm h-9 px-4 w-full md:w-auto"
                    disabled={isAddingEntry}
                  >
                    {isAddingEntry ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    <span className="md:inline">Add New Term</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Add a new term mapping entry</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex flex-wrap gap-2 justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showImportArea ? "destructive" : "outline"}
                      onClick={handleToggleImport}
                      size="sm"
                      className="h-9"
                      disabled={isTogglingImport}
                    >
                      {isTogglingImport ? (
                        <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                      ) : showImportArea ? (
                        <X className="h-4 w-4 md:mr-2" />
                      ) : (
                        <FilePlus className="h-4 w-4 md:mr-2" />
                      )}
                      <span className="hidden md:inline">
                        {showImportArea ? "Close Import/Export" : "Import/Export"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Import or export mapping data as markdown</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleShowExample}
                      size="sm"
                      className="h-9"
                      disabled={isShowingExample}
                    >
                      {isShowingExample ? (
                        <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                      ) : (
                        <Lightbulb className="h-4 w-4 md:mr-2" />
                      )}
                      <span className="hidden md:inline">Show Example</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Load a sample mapping table</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Import/Export Area */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showImportArea ? "h-[320px] opacity-100" : "h-0 opacity-0"
            )}
          >
            <div className="border border-dashed rounded-md">
              <div className="py-3 px-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-base font-medium">Import/Export Markdown</h3>
                  <div className="flex flex-row flex-wrap gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
                    {showRevertButton && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRevert}
                        className="text-xs h-8"
                        title="Revert to previous state (available for 1 minute)"
                        disabled={isReverting}
                      >
                        {isReverting ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Undo Import
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      title="Update markdown from current table"
                      className="text-xs h-8"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImport}
                      className="text-xs h-8"
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <FileUp className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Import
                    </Button>
                  </div>
                </div>
              </div>
              <div className="py-2 px-4">
                <Textarea
                  placeholder="Paste markdown table here..."
                  className="h-40 w-full text-sm font-mono"
                  value={mappingMarkdown}
                  onChange={(e) => setMappingMarkdown(e.target.value)}
                />
                {error && error.includes("import") && (
                  <div className="flex items-start mt-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full border-collapse min-w-max">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 text-sm font-medium whitespace-nowrap">Term / Name</th>
                    <th className="text-left py-2 px-3 text-sm font-medium whitespace-nowrap">Transcription</th>
                    <th className="text-left py-2 px-3 text-sm font-medium whitespace-nowrap">Type</th>
                    <th className="text-left py-2 px-3 text-sm font-medium whitespace-nowrap">Gender</th>
                    <th className="text-left py-2 px-3 text-sm font-medium whitespace-nowrap">Notes</th>
                    <th className="text-left py-2 px-3 text-sm font-medium whitespace-nowrap w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingTable?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center h-24 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-8 w-8 mb-2 text-muted-foreground/40" />
                          <p>No terms added yet</p>
                          <p className="text-xs mt-1">Add a new entry to begin</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    mappingTable.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-2">
                          <Input
                            value={entry.term}
                            onChange={(e) => updateMappingEntry(collectionId, index, "term", e.target.value)}
                            className="w-full text-sm px-3 py-1 h-8"
                            placeholder="Term or name"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={entry.transcription}
                            onChange={(e) => updateMappingEntry(collectionId, index, "transcription", e.target.value)}
                            className="w-full text-sm px-3 py-1 h-8"
                            placeholder="Transcription"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={entry.type}
                            onChange={(e) => updateMappingEntry(collectionId, index, "type", e.target.value)}
                            className="w-full text-sm px-3 py-1 h-8"
                            placeholder="Type"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={entry.gender}
                            onChange={(e) => updateMappingEntry(collectionId, index, "gender", e.target.value)}
                            className="w-full text-sm px-3 py-1 h-8"
                            placeholder="Gender"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={entry.notes}
                            onChange={(e) => updateMappingEntry(collectionId, index, "notes", e.target.value)}
                            className="w-full text-sm px-3 py-1 h-8"
                            placeholder="Additional notes"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveEntry(index)}
                                  className="w-full h-8"
                                  disabled={loadingEntryIndex === index}
                                >
                                  {loadingEntryIndex === index ? (
                                    <Loader2 className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                                  )}
                                  <span className="hidden sm:inline text-xs">Remove</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Delete this mapping entry</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingTable; 