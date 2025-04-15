import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, FilePlus, Lightbulb, ArrowUp, FileDown, FileUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelationshipEntry {
  characterA?: string;
  characterB?: string;
  relationship?: string;
  addressTermsAToB?: string;
  addressTermsBToA?: string;
  notes?: string;
}

interface RelationshipsTableProps {
  relationshipsTable: RelationshipEntry[];
  updateRelationshipEntry: (index: number, field: keyof RelationshipEntry, value: string) => void;
  removeRelationshipEntry: (index: number) => void;
  addRelationshipEntry: () => void;
  showImportArea: boolean;
  toggleImportArea: () => void;
  relationshipsMarkdown: string;
  setRelationshipsMarkdown: (markdown: string) => void;
  revertImport: () => void;
  showRevertButton: boolean;
  exportMarkdownTable: () => void;
  importMarkdownTable: () => void;
  error: string | null;
  arcrylicBg?: boolean;
}

const RelationshipsTable: React.FC<RelationshipsTableProps> = ({
  relationshipsTable,
  updateRelationshipEntry,
  removeRelationshipEntry,
  addRelationshipEntry,
  showImportArea,
  toggleImportArea,
  relationshipsMarkdown,
  setRelationshipsMarkdown,
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
          onClick={addRelationshipEntry}
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
              const exampleRelationshipsTable = `| Character A | Character B | Relationship | Address Terms (A→B) | Address Terms (B→A) | Notes |\n|:----------- |:----------- |:------------ |:------------------- |:------------------- |:----- |\n| Vưu Thiên Thu | Triệu Không Minh | Adoptive Younger Sister -> Elder Brother | Huynh trưởng, Sư huynh | Ngươi | Formal/Respectful |\n| Lâm Linh Dao | Vưu Thiên Thu | Female Lead 2 -> Female Lead 1 | Dao tỷ tỷ, Muội | Thiên Thu | Relationship strained |`;
              setRelationshipsMarkdown(exampleRelationshipsTable);
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
            value={relationshipsMarkdown}
            onChange={(e) => setRelationshipsMarkdown(e.target.value)}
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
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Character A</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Character B</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Relationship</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Address (A→B)</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Address (B→A)</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Notes</th>
              <th className="text-left py-1 sm:py-2 px-1 sm:px-2 md:px-4 text-xs sm:text-sm whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {relationshipsTable.map((entry, index) => (
              <tr key={index} className="border-b">
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.characterA}
                    onChange={(e) => updateRelationshipEntry(index, "characterA", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.characterB}
                    onChange={(e) => updateRelationshipEntry(index, "characterB", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.relationship}
                    onChange={(e) => updateRelationshipEntry(index, "relationship", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.addressTermsAToB}
                    onChange={(e) => updateRelationshipEntry(index, "addressTermsAToB", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.addressTermsBToA}
                    onChange={(e) => updateRelationshipEntry(index, "addressTermsBToA", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4 min-w-[100px]">
                  <Input
                    value={entry.notes}
                    onChange={(e) => updateRelationshipEntry(index, "notes", e.target.value)}
                    className="w-full text-xs sm:text-sm px-1 py-0.5 sm:px-3 sm:py-1.5 h-7 sm:h-9"
                  />
                </td>
                <td className="py-1 sm:py-2 px-1 sm:px-2 md:px-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRelationshipEntry(index)}
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

export default RelationshipsTable; 