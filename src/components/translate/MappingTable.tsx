import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className={cn("border-border/60", arcrylicBg && "arcrylic-blur")}>
      <CardHeader className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Text className="h-5 w-5 mr-2 text-primary" />
              Mapping Table
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Manage term mappings and transcriptions
            </CardDescription>
          </div>
          <Badge variant="outline" className="h-6">
            {mappingTable.length} {mappingTable.length === 1 ? "Entry" : "Entries"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pb-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between gap-2 sm:gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={addMappingEntry}
                    variant="default"
                    className="text-sm h-9 px-4 w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Term
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
                      variant={showImportArea ? "default" : "outline"}
                      onClick={toggleImportArea}
                      size="sm"
                      className="h-9"
                    >
                      {showImportArea ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Close Import/Export
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4 mr-2" />
                          Import/Export
                        </>
                      )}
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
                      onClick={() => {
                        const exampleMappingTable = `| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |\n|:----------- |:------------- |:------------------------- |:------------------ |:------ |\n| 事情是这样的 | Chuyện là thế này | Phrase | | Opening phrase |\n| 最近 | Gần đây | Time | | |\n| 师兄 | Sư huynh | Title/Relationship | Male | Elder martial brother |\n| 其实 | Thực ra | Adverb | | |`;
                        setMappingMarkdown(exampleMappingTable);
                        if (!showImportArea) toggleImportArea();
                      }}
                      size="sm"
                      className="h-9"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Show Example
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
            <Card className="border-dashed">
              <CardHeader className="py-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-base font-medium">Import/Export Markdown</CardTitle>
                  <div className="flex flex-row flex-wrap gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
                    {showRevertButton && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={revertImport}
                        className="text-xs h-8"
                        title="Revert to previous state (available for 1 minute)"
                      >
                        <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
                        Undo Import
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportMarkdownTable}
                      title="Update markdown from current table"
                      className="text-xs h-8"
                    >
                      <FileDown className="h-3.5 w-3.5 mr-1.5" />
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={importMarkdownTable}
                      className="text-xs h-8"
                    >
                      <FileUp className="h-3.5 w-3.5 mr-1.5" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2">
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
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
              <thead>
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
                {mappingTable.length === 0 ? (
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
                          onChange={(e) => updateMappingEntry(index, "term", e.target.value)}
                          className="w-full text-sm px-3 py-1 h-8"
                          placeholder="Term or name"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={entry.transcription}
                          onChange={(e) => updateMappingEntry(index, "transcription", e.target.value)}
                          className="w-full text-sm px-3 py-1 h-8"
                          placeholder="Transcription"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={entry.type}
                          onChange={(e) => updateMappingEntry(index, "type", e.target.value)}
                          className="w-full text-sm px-3 py-1 h-8"
                          placeholder="Type"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={entry.gender}
                          onChange={(e) => updateMappingEntry(index, "gender", e.target.value)}
                          className="w-full text-sm px-3 py-1 h-8"
                          placeholder="Gender"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={entry.notes}
                          onChange={(e) => updateMappingEntry(index, "notes", e.target.value)}
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
                                onClick={() => removeMappingEntry(index)}
                                className="w-full h-8"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
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
      </CardContent>
    </Card>
  );
};

export default MappingTable; 