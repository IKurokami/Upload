import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, FilePlus, Lightbulb, ArrowUp, FileDown, FileUp, Trash2 } from "lucide-react";
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
  updateMappingEntry: (index: number, field: keyof MappingEntry, value: string) => void;
  removeMappingEntry: (index: number) => void;
  addMappingEntry: () => void;
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
  arcrylicBg,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between gap-2 sm:gap-4">
        <Button
          onClick={addMappingEntry}
          variant="default"
          className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          Add New Entry
        </Button>
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-end">
          <Button
            variant={showImportArea ? "default" : "outline"}
            onClick={toggleImportArea}
            className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
          >
            {showImportArea ? (
              <>
                <X className="h-4 w-4 mr-1 sm:mr-2" />
                Close
              </>
            ) : (
              <>
                <FilePlus className="h-4 w-4 mr-1 sm:mr-2" />
                Import/Export
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const exampleMappingTable = `| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |\n|:----------- |:------------- |:------------------------- |:------------------ |:------ |\n| 事情是这样的 | Chuyện là thế này | Phrase | | Opening phrase |\n| 最近 | Gần đây | Time | | |\n| 师兄 | Sư huynh | Title/Relationship | Male | Elder martial brother |\n| 其实 | Thực ra | Adverb | | |`;
              setMappingMarkdown(exampleMappingTable);
              if (!showImportArea) toggleImportArea();
            }}
            className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
          >
            <Lightbulb className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Sample</span>
          </Button>
        </div>
      </div>

      {/* Import/Export Area */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          showImportArea ? "h-[280px] sm:h-[320px] opacity-100" : "h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-2 p-2 sm:p-4 rounded-md border bg-muted/20 max-w-[100vw]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-base sm:text-lg font-medium">Import/Export Markdown</h3>
            <div className="flex flex-row flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
              {showRevertButton && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={revertImport}
                  className="text-xs sm:text-sm px-2 py-1 flex-1 sm:flex-initial"
                  title="Revert to previous state (available for 1 minute)"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span className="inline">Undo Import</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportMarkdownTable}
                title="Update markdown from current table"
                className="text-xs sm:text-sm px-2 py-1 flex-1 sm:flex-initial"
              >
                <FileDown className="h-4 w-4 mr-1" />
                <span className="inline">Update</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={importMarkdownTable}
                className="text-xs sm:text-sm px-2 py-1 flex-1 sm:flex-initial"
              >
                <FileUp className="h-4 w-4 mr-1" />
                <span className="inline">Import</span>
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Paste markdown table here..."
            className="h-36 sm:h-48 w-full text-xs sm:text-sm font-mono"
            value={mappingMarkdown}
            onChange={(e) => setMappingMarkdown(e.target.value)}
            style={{ maxWidth: "100%" }}
          />
          {error && error.includes("import") && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border max-w-full -mx-0">
        <table className="w-full border-collapse min-w-max table-fixed sm:table-auto">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Term / Name</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Transcription</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Type</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Gender</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Notes</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappingTable.map((entry, index) => (
              <tr key={index} className="border-b">
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.term}
                    onChange={(e) => updateMappingEntry(index, "term", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.transcription}
                    onChange={(e) => updateMappingEntry(index, "transcription", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.type}
                    onChange={(e) => updateMappingEntry(index, "type", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.gender}
                    onChange={(e) => updateMappingEntry(index, "gender", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.notes}
                    onChange={(e) => updateMappingEntry(index, "notes", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMappingEntry(index)}
                    className="w-full text-xs sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MappingTable; 