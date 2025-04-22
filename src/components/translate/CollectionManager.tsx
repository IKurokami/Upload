import React, { useRef, useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Pencil, Folder, CheckCircle2, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown, Clock, History, TableProperties, Network, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import TranslationHistory from "@/components/translate/TranslationHistory";
import MappingTable from "@/components/translate/MappingTable";
import RelationshipsTable from "@/components/translate/RelationshipsTable";
import { MappingEntry, RelationshipEntry, TranslationHistoryEntry, TableUpdateEntry, Collection } from "@/types/translateTypes";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CollectionManagerProps {
  isVisible: boolean;
  settingsPanelRef: React.RefObject<HTMLDivElement>;
  collections: Collection[];
  collectionToEdit: string;
  setCollectionToEdit: (id: string) => void;
  editedCollectionName: string;
  setEditedCollectionName: (name: string) => void;
  addNewCollection: (name: string) => void;
  useCollection: (id: string) => void;
  renameCollection: () => void;
  requestDeleteCollection: (id: string) => void;
  showDeleteConfirmation: boolean;
  setShowDeleteConfirmation: (show: boolean) => void;
  confirmDeleteCollection: () => void;
  selectedCollectionId: string;
  error: string | null;
  setError: (err: string | null) => void;
  arcrylicBg?: boolean;
  translationHistory: TranslationHistoryEntry[];
  onClearHistory: () => void;
  onUseHistoryEntry: (entry: TranslationHistoryEntry) => void;
  onRemoveHistoryEntry: (entryId: string) => void;
  updateMappingEntry: (collectionId: string, index: number, field: keyof MappingEntry, value: string) => void;
  removeMappingEntry: (collectionId: string, index: number) => void;
  addMappingEntry: (collectionId: string, entries?: MappingEntry[]) => void;
  showMappingImportArea: boolean;
  toggleMappingImportArea: () => void;
  mappingMarkdown: string;
  setMappingMarkdown: (markdown: string) => void;
  revertMappingImport: () => void;
  showMappingRevertButton: boolean;
  exportMappingMarkdown: () => void;
  importMappingMarkdown: () => void;
  updateRelationshipEntry: (collectionId: string, index: number, field: keyof RelationshipEntry, value: string) => void;
  removeRelationshipEntry: (collectionId: string, index: number) => void;
  addRelationshipEntry: (collectionId: string, entries?: RelationshipEntry[]) => void;
  showRelationshipImportArea: boolean;
  toggleRelationshipImportArea: () => void;
  relationshipsMarkdown: string;
  setRelationshipsMarkdown: (markdown: string) => void;
  revertRelationshipImport: () => void;
  showRelationshipRevertButton: boolean;
  exportRelationshipMarkdown: () => void;
  importRelationshipMarkdown: () => void;
  onApproveUpdate: (entry: TableUpdateEntry) => void;
  onRejectUpdate: (entry: TableUpdateEntry) => void;
}

const CollectionManager: React.FC<CollectionManagerProps> = ({
  isVisible,
  settingsPanelRef,
  collections,
  collectionToEdit,
  setCollectionToEdit,
  editedCollectionName,
  setEditedCollectionName,
  addNewCollection,
  useCollection,
  renameCollection,
  requestDeleteCollection,
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  confirmDeleteCollection,
  selectedCollectionId,
  error,
  setError,
  arcrylicBg,
  translationHistory,
  onClearHistory,
  onUseHistoryEntry,
  onRemoveHistoryEntry,
  updateMappingEntry,
  removeMappingEntry,
  addMappingEntry,
  showMappingImportArea,
  toggleMappingImportArea,
  mappingMarkdown,
  setMappingMarkdown,
  revertMappingImport,
  showMappingRevertButton,
  exportMappingMarkdown,
  importMappingMarkdown,
  updateRelationshipEntry,
  removeRelationshipEntry,
  addRelationshipEntry,
  showRelationshipImportArea,
  toggleRelationshipImportArea,
  relationshipsMarkdown,
  setRelationshipsMarkdown,
  revertRelationshipImport,
  showRelationshipRevertButton,
  exportRelationshipMarkdown,
  importRelationshipMarkdown,
  onApproveUpdate,
  onRejectUpdate,
}) => {
  // Find the collection being edited
  const editingCollection = collections.find((c) => c.id === collectionToEdit);

  // Local state for inline add
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineAddName, setInlineAddName] = useState("");
  const inlineAddInputRef = useRef<HTMLInputElement>(null);

  // State for inline editing in sidebar
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditName, setInlineEditName] = useState("");
  const inlineEditInputRef = useRef<HTMLInputElement>(null);

  // State for expanded update entry
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

  // Create a custom tabs solution with animation
  const [activeTab, setActiveTab] = useState("history");
  const [, setAnimationInProgress] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabOrder = ["history", "mapping", "relationships", "updates"];

  // Refs for measuring tab positions
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  // Create stable handler callbacks using useCallback
  const handleCollectionClick = useCallback((collectionId: string, collectionName: string) => {
    setCollectionToEdit(collectionId);
    setEditedCollectionName(collectionName);
    setError(null);
  }, [setCollectionToEdit, setEditedCollectionName, setError]);

  const handleCollectionLongPress = useCallback((e: React.SyntheticEvent, collectionId: string, collectionName: string) => {
    e.preventDefault();
    setCollectionToEdit(collectionId);
    setEditedCollectionName(collectionName);
    setInlineEditId(collectionId);
    setInlineEditName(collectionName);
  }, [setCollectionToEdit, setEditedCollectionName, setInlineEditId, setInlineEditName]);

  // Update the timerRef definition to specify the correct type for timers
  const timerRef = useRef<{ [key: string]: number | NodeJS.Timeout | null }>({});

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent, collection: Collection) => {
    timerRef.current[collection.id] = setTimeout(() => {
      handleCollectionLongPress(e, collection.id, collection.name);
      timerRef.current[collection.id] = null;
    }, 500);
  }, [handleCollectionLongPress]);

  const handleEnd = useCallback((_e: React.MouseEvent | React.TouchEvent, collection: Collection) => {
    if (timerRef.current[collection.id]) {
      clearTimeout(timerRef.current[collection.id]!);
      timerRef.current[collection.id] = null;
      handleCollectionClick(collection.id, collection.name);
    }
  }, [handleCollectionClick]);

  const handleCancel = useCallback((_e: React.MouseEvent | React.TouchEvent, collection: Collection) => {
    if (timerRef.current[collection.id]) {
      clearTimeout(timerRef.current[collection.id]!);
      timerRef.current[collection.id] = null;
    }
  }, []);

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeIndex = tabOrder.indexOf(activeTab);
    const currentTab = tabRefs.current[activeIndex];

    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

  // Clear any ongoing animation when component unmounts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Function to sequentially animate through tabs with interruption support
  const animateTabSequence = (targetTab: string) => {
    if (targetTab === activeTab) return;

    // Clear any existing animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    const startIndex = tabOrder.indexOf(activeTab);
    const endIndex = tabOrder.indexOf(targetTab);

    if (startIndex === -1 || endIndex === -1) return;

    // Determine direction and set animation flag
    const direction = startIndex < endIndex ? 1 : -1;
    setAnimationInProgress(true);

    // Start with the next tab in sequence
    let currentIndex = startIndex;

    const animateNext = () => {
      currentIndex += direction;
      setActiveTab(tabOrder[currentIndex]);

      // If we haven't reached the target yet, continue the animation
      if ((direction > 0 && currentIndex < endIndex) ||
        (direction < 0 && currentIndex > endIndex)) {
        animationTimeoutRef.current = setTimeout(animateNext, 150);
      } else {
        // Animation complete
        setAnimationInProgress(false);
        animationTimeoutRef.current = null;
      }
    };

    // Start the sequential animation
    animationTimeoutRef.current = setTimeout(animateNext, 150);
  };

  // Focus input when shown
  React.useEffect(() => {
    if (showInlineAdd && inlineAddInputRef.current) {
      inlineAddInputRef.current.focus();
    }
  }, [showInlineAdd]);

  // Focus input when edit mode is activated
  React.useEffect(() => {
    if (inlineEditId && inlineEditInputRef.current) {
      inlineEditInputRef.current.focus();
    }
  }, [inlineEditId]);

  // Helper to add collection and reset
  const handleAddInlineCollection = () => {
    if (inlineAddName.trim()) {
      addNewCollection(inlineAddName.trim());
      setInlineAddName("");
      setShowInlineAdd(false);
    } else {
      setShowInlineAdd(false);
      setInlineAddName("");
    }
  };

  // Handle saving the inline edit
  const handleInlineEditSave = () => {
    if (inlineEditId && inlineEditName.trim()) {
      setEditedCollectionName(inlineEditName);
      setCollectionToEdit(inlineEditId);
      renameCollection();
      setInlineEditId(null);
    } else {
      setInlineEditId(null);
    }
  };

  return (
    <div
      ref={settingsPanelRef}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isVisible
          ? "h-auto min-h-[700px] sm:h-[800px] opacity-100 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700"
          : "h-0 opacity-0 mb-0 pb-0 border-b-0"
      )}
      style={{
        display: isVisible ? 'block' : 'none',  // Force display block when visible
      }}
      tabIndex={-1}
    >
      <Card className={cn(
        "h-full min-h-[600px] w-full bg-white/90 dark:bg-zinc-900/90 shadow-xl rounded-2xl p-0 flex flex-col sm:flex-row border border-gray-100 dark:border-zinc-800 transition-all duration-300",
        arcrylicBg && "backdrop-blur-md"
      )}>
        {/* Sidebar with adjusted height for mobile */}
        <aside className="w-full sm:w-1/3 bg-muted/40 dark:bg-muted/20 p-2 sm:p-4 flex flex-col gap-2 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-800 min-h-[120px] h-[25vh] sm:h-auto max-h-[180px] sm:max-h-none overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Collections
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setShowInlineAdd(true);
                      setInlineAddName("");
                    }}
                    aria-label="Add new collection"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add new collection</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {showInlineAdd && (
              <div className="flex items-center gap-2 px-2 py-2 mb-1 rounded-lg bg-muted/30 dark:bg-muted/10">
                <Input
                  ref={inlineAddInputRef}
                  value={inlineAddName}
                  onChange={e => setInlineAddName(e.target.value)}
                  onBlur={handleAddInlineCollection}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleAddInlineCollection();
                    } else if (e.key === "Escape") {
                      setShowInlineAdd(false);
                      setInlineAddName("");
                    }
                  }}
                  placeholder="Collection name"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            )}
            {collections.map((collection) => {
              return (
                <div
                  key={collection.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group transition-all",
                    collection.id === collectionToEdit
                      ? "bg-primary/10 dark:bg-primary/20 text-primary"
                      : "hover:bg-muted/60 dark:hover:bg-muted/30 text-gray-700 dark:text-gray-200"
                  )}
                  onMouseDown={(e) => handleStart(e, collection)}
                  onMouseUp={(e) => handleEnd(e, collection)}
                  onMouseLeave={(e) => handleCancel(e, collection)}
                  onTouchStart={(e) => handleStart(e, collection)}
                  onTouchEnd={(e) => handleEnd(e, collection)}
                  onTouchCancel={(e) => handleCancel(e, collection)}
                  style={{ touchAction: "manipulation" }}
                >
                  <Folder className="h-4 w-4 mr-1 text-primary/70" />

                  {inlineEditId === collection.id ? (
                    <Input
                      ref={inlineEditInputRef}
                      value={editedCollectionName}
                      onChange={(e) => setEditedCollectionName(e.target.value)}
                      onBlur={handleInlineEditSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleInlineEditSave();
                        } else if (e.key === "Escape") {
                          setInlineEditId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div className="flex flex-1 items-center min-w-0">
                      <span className="flex-1 truncate font-medium text-sm sm:text-base">{collection.name}</span>
                      <Pencil
                        className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollectionToEdit(collection.id);
                          setEditedCollectionName(collection.name);
                          setInlineEditId(collection.id);
                          setInlineEditName(collection.name);
                        }}
                      />
                    </div>
                  )}

                  {collection.id === selectedCollectionId ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              useCollection(collection.id);
                            }}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            aria-label="Use this collection"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Use this collection</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteCollection(collection.id);
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500"
                          aria-label="Delete collection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete collection</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {collection.id === collectionToEdit && inlineEditId !== collection.id && (
                    <span className="ml-2 text-xs font-semibold">Editing</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main content section - force height to expand */}
        <section className="flex-1 min-w-0 p-2 sm:p-6 flex flex-col h-[75vh] sm:h-auto min-h-[400px] overflow-hidden">
          <div className="h-full flex flex-col overflow-hidden">
            {/* Tab header and content */}
            <div className="relative flex border-b mb-4 overflow-x-auto">
              {tabOrder.map((tab, index) => (
                <button
                  key={tab}
                  ref={el => {
                    tabRefs.current[index] = el;
                  }}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-sm font-medium transition-colors relative flex items-center justify-center",
                    tab === activeTab
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    animateTabSequence(tab);
                  }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="sm:hidden">
                          {tab === "history" && <History className="h-4 w-4" />}
                          {tab === "mapping" && <TableProperties className="h-4 w-4" />}
                          {tab === "relationships" && <Network className="h-4 w-4" />}
                          {tab === "updates" && <Sparkles className="h-4 w-4" />}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="sm:hidden">
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="hidden sm:block">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </button>
              ))}

              {/* Smooth sliding indicator */}
              <div
                className="absolute bottom-0 h-[2px] bg-primary"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  transform: 'translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>

            {/* Tab content container with full height */}
            <div className="relative flex-1 h-full">
              {/* History Tab */}
              {activeTab === "history" && (
                <div className="h-full pb-[80px] sm:pb-0 overflow-y-auto">
                  {editingCollection && (
                    <TranslationHistory
                      show={true}
                      history={translationHistory.filter(h => h.collectionId === editingCollection.id)}
                      collections={collections}
                      selectedCollectionId={editingCollection.id}
                      onSelectCollection={setCollectionToEdit}
                      onClear={onClearHistory}
                      onUseAgain={onUseHistoryEntry}
                      arcrylicBg={arcrylicBg}
                      onRemoveEntry={onRemoveHistoryEntry}
                      hideCollectionSelector={true}
                    />
                  )}
                </div>
              )}

              {/* Mapping Tab Content */}
              <div
                className={cn(
                  "transition-all duration-300",
                  activeTab === "mapping"
                    ? "visible h-auto opacity-100"
                    : "invisible h-0 opacity-0"
                )}
              >
                <MappingTable
                  mappingTable={editingCollection?.mappingTable || []}
                  collectionId={collectionToEdit}
                  updateMappingEntry={updateMappingEntry}
                  removeMappingEntry={removeMappingEntry}
                  addMappingEntry={addMappingEntry}
                  showImportArea={showMappingImportArea}
                  toggleImportArea={toggleMappingImportArea}
                  mappingMarkdown={mappingMarkdown}
                  setMappingMarkdown={setMappingMarkdown}
                  revertImport={revertMappingImport}
                  showRevertButton={showMappingRevertButton}
                  exportMarkdownTable={exportMappingMarkdown}
                  importMarkdownTable={importMappingMarkdown}
                  error={error}
                  arcrylicBg={arcrylicBg}
                />
              </div>

              {/* Relationships Tab Content */}
              <div
                className={cn(
                  "transition-all duration-300",
                  activeTab === "relationships"
                    ? "visible h-auto opacity-100"
                    : "invisible h-0 opacity-0"
                )}
              >
                <RelationshipsTable
                  relationshipsTable={editingCollection?.relationshipsTable || []}
                  collectionId={collectionToEdit}
                  updateRelationshipEntry={updateRelationshipEntry}
                  removeRelationshipEntry={removeRelationshipEntry}
                  addRelationshipEntry={addRelationshipEntry}
                  showImportArea={showRelationshipImportArea}
                  toggleImportArea={toggleRelationshipImportArea}
                  relationshipsMarkdown={relationshipsMarkdown}
                  setRelationshipsMarkdown={setRelationshipsMarkdown}
                  revertImport={revertRelationshipImport}
                  showRevertButton={showRelationshipRevertButton}
                  exportMarkdownTable={exportRelationshipMarkdown}
                  importMarkdownTable={importRelationshipMarkdown}
                  error={error}
                  arcrylicBg={arcrylicBg}
                />
              </div>

              {/* Updates Tab */}
              {activeTab === "updates" && (
                <div className="h-full pb-[80px] sm:pb-0 overflow-y-auto">
                  {editingCollection?.tableUpdateHistory ? (
                    editingCollection.tableUpdateHistory.length > 0 ? (
                      <div className="space-y-3">
                        {[...editingCollection.tableUpdateHistory]
                          .sort((a, b) => b.timestamp - a.timestamp)
                          .map(entry => {
                            const isExpanded = expandedUpdateId === entry.id;
                            return (
                              <div key={entry.id} className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/30 p-3 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium">
                                        {entry.type === 'mapping' ? 'Mapping Table' : 'Relationships Table'}
                                      </span>
                                      <Badge
                                        variant={
                                          entry.status === 'pending' ? 'outline' :
                                            entry.status === 'approved' ? 'secondary' : 'destructive'
                                        }
                                        className={cn(
                                          "ml-2 text-xs px-1.5",
                                          entry.status === 'pending' && "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/30",
                                          entry.status === 'approved' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30",
                                          entry.status === 'rejected' && "bg-red-100 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/30"
                                        )}
                                      >
                                        {entry.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {new Date(entry.timestamp).toLocaleString()}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-full"
                                      onClick={() => setExpandedUpdateId(isExpanded ? null : entry.id)}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                    {entry.status === 'pending' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-8"
                                              onClick={() => setExpandedUpdateId(isExpanded ? null : entry.id)}
                                            >
                                              Review
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">Review and approve/reject changes</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {(entry.status === 'approved' || entry.status === 'rejected') && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (entry.status === 'rejected' && !window.confirm('This update was previously rejected. Do you want to reapply it?')) {
                                            return;
                                          }
                                          onApproveUpdate(entry);
                                          toast.success(`${entry.type === 'mapping' ? 'Mapping' : 'Relationships'} table update reapplied`, {
                                            description: `${entry.updates.added?.length || 0} new entries and ${entry.updates.updated?.length || 0} updated entries`
                                          });
                                        }}
                                      >
                                        Reapply
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="p-3 space-y-3 bg-background">
                                    {/* Added Entries */}
                                    {entry.updates.added?.length > 0 && (
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium flex items-center">
                                            <ChevronsUp className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                                            Added Entries
                                          </span>
                                          <Badge variant="outline" className="text-xs px-1.5 h-5">
                                            {entry.updates.added?.length}
                                          </Badge>
                                        </div>
                                        <div className="bg-muted/30 rounded-md p-2.5">
                                          {entry.updates.added.map((e: MappingEntry | RelationshipEntry, i: number) => (
                                            <div
                                              key={i}
                                              className="text-xs py-1.5 px-2 rounded mb-1 hover:bg-accent/50 transition-colors"
                                            >
                                              {entry.type === 'mapping' ? (
                                                <div className="flex justify-between">
                                                  <span className="font-medium">{(e as MappingEntry).term}</span>
                                                  <span className="text-muted-foreground">→ {(e as MappingEntry).transcription}</span>
                                                </div>
                                              ) : (
                                                <div className="flex justify-between">
                                                  <span className="font-medium">{(e as RelationshipEntry).characterA}</span>
                                                  <span className="text-muted-foreground">→ {(e as RelationshipEntry).characterB}</span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Updated Entries */}
                                    {entry.updates.updated?.length > 0 && (
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium flex items-center">
                                            <ChevronsDown className="h-3.5 w-3.5 mr-1 text-blue-500" />
                                            Updated Entries
                                          </span>
                                          <Badge variant="outline" className="text-xs px-1.5 h-5">
                                            {entry.updates.updated?.length}
                                          </Badge>
                                        </div>
                                        <div className="bg-muted/30 rounded-md p-2.5">
                                          {entry.updates.updated.map((e: MappingEntry | RelationshipEntry, i: number) => (
                                            <div
                                              key={i}
                                              className="text-xs py-1.5 px-2 rounded mb-1 hover:bg-accent/50 transition-colors"
                                            >
                                              {entry.type === 'mapping' ? (
                                                <div className="flex justify-between">
                                                  <span className="font-medium">{(e as MappingEntry).term}</span>
                                                  <span className="text-muted-foreground">→ {(e as MappingEntry).transcription}</span>
                                                </div>
                                              ) : (
                                                <div className="flex justify-between">
                                                  <span className="font-medium">{(e as RelationshipEntry).characterA}</span>
                                                  <span className="text-muted-foreground">→ {(e as RelationshipEntry).characterB}</span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {entry.status === 'pending' && (
                                      <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="outline" onClick={() => setExpandedUpdateId(null)}>Cancel</Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => {
                                            onRejectUpdate(entry);
                                            setExpandedUpdateId(null);
                                          }}
                                        >
                                          Reject
                                        </Button>
                                        <Button
                                          variant="default"
                                          onClick={() => {
                                            onApproveUpdate(entry);
                                            // Also update UI to mark as approved
                                            toast.success(`${entry.type === 'mapping' ? 'Mapping' : 'Relationships'} table update approved`, {
                                              description: `${entry.updates.added?.length || 0} new entries and ${entry.updates.updated?.length || 0} updated entries`
                                            });
                                            setExpandedUpdateId(null);
                                          }}
                                        >
                                          Approve
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No updates available</p>
                        <p className="text-xs text-muted-foreground mt-1">Updates will appear here when available</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No updates available</p>
                      <p className="text-xs text-muted-foreground mt-1">Updates will appear here when available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-2">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-8 max-w-xs sm:max-w-md w-full mx-2 shadow-2xl border border-gray-200 dark:border-zinc-800 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-destructive" /> Confirm Deletion
              </h3>
              <p className="mb-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">Are you sure you want to delete this collection?</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              <div className="flex justify-end gap-3 flex-col sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="min-w-[90px]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteCollection}
                  className="min-w-[90px]"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CollectionManager; 