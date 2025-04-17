import React, { useEffect } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash2,
  RotateCcw,
  History,
  Clock,
  Archive,
  Clipboard,
  Database,
  Folder,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";

export interface TranslationHistoryEntry {
  id: string;
  timestamp: number;
  inputText: string;
  translatedText: string;
  model: string;
  collectionId: string;
  collectionName: string;
}

export interface TranslationCollection {
  id: string;
  name: string;
}

interface TranslationHistoryProps {
  show: boolean;
  history: TranslationHistoryEntry[];
  collections: TranslationCollection[];
  selectedCollectionId: string;
  onSelectCollection: (id: string) => void;
  onClear: () => void;
  onUseAgain: (entry: TranslationHistoryEntry) => void;
  arcrylicBg?: boolean;
  onRemoveEntry: (entryId: string) => void;
  hideCollectionSelector?: boolean;
}

const TranslationHistory: React.FC<TranslationHistoryProps> = ({
  show,
  history,
  collections = [],
  selectedCollectionId = "",
  onSelectCollection,
  onClear,
  onUseAgain,
  onRemoveEntry,
  hideCollectionSelector = false,
}) => {
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogTab, setDialogTab] = React.useState<'input' | 'translated'>('input');
  const filteredHistory = Array.isArray(history)
    ? history.filter((entry) => entry.collectionId === selectedCollectionId)
    : [];
  const selectedCollection = Array.isArray(collections)
    ? collections.find((c) => c.id === selectedCollectionId)
    : undefined;
  const selectedEntry = filteredHistory.find((e) => e.id === selectedEntryId) || null;

  React.useEffect(() => {
    setSelectedEntryId(null);
    setDialogOpen(false);
  }, [selectedCollectionId, history]);

  // Keyboard shortcuts for drawer actions
  useEffect(() => {
    if (!dialogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        const text = dialogTab === 'input' ? (selectedEntry?.inputText || '') : (selectedEntry?.translatedText || '');
        if (text) {
          navigator.clipboard.writeText(text);
          toast.success(`Copied ${dialogTab === 'input' ? 'input text' : 'translated text'}`);
        }
      } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (selectedEntry) onUseAgain(selectedEntry);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (selectedEntry) { setDialogOpen(false); onRemoveEntry(selectedEntry.id); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, dialogTab, selectedEntry, onUseAgain, onRemoveEntry]);

  if (!show) return null;

  return (
    <div className={cn("h-full w-full flex flex-col")}>
      <div className="my-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="h-5 w-5 mr-2 text-primary" />
            <div>
              <span className="text-xl font-bold">Translation History</span>
              <span className="block text-sm mt-1 text-muted-foreground">Previously translated content, organized by collection</span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onClear}
                  disabled={filteredHistory?.length === 0}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Delete all translation history in this collection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="px-2 pb-0 flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-[500px] w-full">
          {/* Optional: Folder/Collection List */}
          {!hideCollectionSelector && (
            <>
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r border-border/40">
                <div className="h-full flex flex-col">
                  <ScrollArea className="flex-1 px-2 pb-2">
                    <div className="flex flex-col gap-1">
                      {collections?.length === 0 ? (
                        <div className="text-xs text-muted-foreground px-2 py-4 text-center">
                          No collections
                        </div>
                      ) : (
                        collections.map((collection) => (
                          <div
                            key={collection.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all",
                              collection.id === selectedCollectionId
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-muted/60 text-gray-700 dark:text-gray-200"
                            )}
                            onClick={() => onSelectCollection(collection.id)}
                          >
                            <Folder className="h-4 w-4 mr-1 text-primary/70" />
                            <span className="truncate text-sm">{collection.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          {/* History Content */}
          <ResizablePanel defaultSize={hideCollectionSelector ? 100 : 75} minSize={hideCollectionSelector ? 0 : 40}>
            <div className="h-full flex flex-col px-4">
              <div className=" pt-4 pb-2 font-semibold text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary/70" />
                {selectedCollection ? selectedCollection.name : "No Collection Selected"}
              </div>
              <div className="flex-1 px-0 pb-4">
                {filteredHistory?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Archive className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No translation history yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                      Translations will be saved here automatically as you use the translator
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-2">
                      {filteredHistory.map((entry) => (
                        <Card
                          key={entry.id}
                          className={cn(
                            "transition-all cursor-pointer border-2",
                            selectedEntryId === entry.id && dialogOpen
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:border-border"
                          )}
                          onClick={() => {
                            setSelectedEntryId(entry.id);
                            setDialogTab('input');
                            setDialogOpen(true);
                          }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 py-3">
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(entry.timestamp).toLocaleString()}
                                <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 h-5">
                                  {entry.model}
                                </Badge>
                              </div>
                              <div className="flex flex-col md:flex-row md:gap-4 mt-1">
                                <span className="truncate text-sm font-medium text-primary/90 max-w-[180px] md:max-w-[220px]" title={entry.inputText}>{entry.inputText}</span>
                                <span className="hidden md:inline text-muted-foreground">→</span>
                                <span className="truncate text-sm text-muted-foreground max-w-[180px] md:max-w-[220px]" title={entry.translatedText}>{entry.translatedText}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={e => { e.stopPropagation(); onUseAgain(entry); }}
                                      className="h-8"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                      Reuse
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Load this translation again</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={e => { e.stopPropagation(); onRemoveEntry(entry.id); }}
                                      className="h-8 w-8 text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Delete this entry</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                {/* Drawer for entry details with tabs */}
                <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DrawerContent className="w-screen h-screen max-w-none max-h-none flex flex-col">
                    <DrawerHeader>
                      <DrawerTitle>Translation Details</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex-1 px-4 pb-32 overflow-y-auto">
                      <Tabs value={dialogTab} onValueChange={v => setDialogTab(v as 'input' | 'translated')} className="w-full">
                        <TabsList className="mb-4 w-full">
                          <TabsTrigger value="input" className="flex-1">Input Text</TabsTrigger>
                          <TabsTrigger value="translated" className="flex-1">Translated Text</TabsTrigger>
                        </TabsList>
                        <TabsContent value="input">
                          <Label className="text-xs flex items-center text-muted-foreground mb-1">
                            <Clipboard className="h-3 w-3 mr-1" />
                            Input Text
                          </Label>
                          <Textarea
                            value={selectedEntry?.inputText || ''}
                            readOnly
                            className="text-sm bg-muted/20 rounded-md p-3 min-h-[120px] max-h-[300px] border border-border/40 resize-none"
                          />
                        </TabsContent>
                        <TabsContent value="translated">
                          <Label className="text-xs flex items-center text-muted-foreground mb-1">
                            <Clipboard className="h-3 w-3 mr-1" />
                            Translated Text
                          </Label>
                          <Textarea
                            value={selectedEntry?.translatedText || ''}
                            readOnly
                            className="text-sm bg-muted/20 rounded-md p-3 min-h-[120px] max-h-[300px] border border-border/40 resize-none"
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                    {/* Centered sticky footer for action buttons, each on its own row */}
                    <div className="fixed bottom-0 left-0 w-full flex flex-col items-center bg-background/95 py-6 z-50 border-t gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full max-w-md mx-auto text-base"
                        onClick={async () => {
                          const text = dialogTab === 'input' ? (selectedEntry?.inputText || '') : (selectedEntry?.translatedText || '');
                          if (text) {
                            await navigator.clipboard.writeText(text);
                            toast.success(`Copied ${dialogTab === 'input' ? 'input text' : 'translated text'}`);
                          }
                        }}
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy <span className="ml-2 text-xs text-muted-foreground">Ctrl+C</span>
                      </Button>
                      {selectedEntry && (
                        <Button
                          variant="default"
                          size="lg"
                          className="w-full max-w-md mx-auto text-base"
                          onClick={() => onUseAgain(selectedEntry)}
                        >
                          <RotateCcw className="h-5 w-5 mr-2" />
                          Reuse <span className="ml-2 text-xs text-muted-foreground">Ctrl+V</span>
                        </Button>
                      )}
                      {selectedEntry && (
                        <Button
                          variant="destructive"
                          size="lg"
                          className="w-full max-w-md mx-auto text-base"
                          onClick={() => { setDialogOpen(false); onRemoveEntry(selectedEntry.id); }}
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          Delete <span className="ml-2 text-xs text-muted-foreground">Backspace</span>
                        </Button>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default TranslationHistory; 