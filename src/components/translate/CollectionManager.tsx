import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Pencil, Folder, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TranslationHistory from "@/components/translate/TranslationHistory";
import MappingTable from "@/components/translate/MappingTable";
import RelationshipsTable from "@/components/translate/RelationshipsTable";
import { MappingEntry, RelationshipEntry, TranslationHistoryEntry, TableUpdateEntry } from "@/types/translateTypes";

// NOTE: Keep this in sync with the Collection type in TranslatePage and types/translateTypes.ts
interface Collection {
  id: string;
  name: string;
  mappingTable: any[];
  relationshipsTable: any[];
  tableUpdateHistory: any[];
}

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
  updateMappingEntry: (index: number, field: keyof MappingEntry, value: string) => void;
  removeMappingEntry: (index: number) => void;
  addMappingEntry: () => void;
  showMappingImportArea: boolean;
  toggleMappingImportArea: () => void;
  mappingMarkdown: string;
  setMappingMarkdown: (markdown: string) => void;
  revertMappingImport: () => void;
  showMappingRevertButton: boolean;
  exportMappingMarkdown: () => void;
  importMappingMarkdown: () => void;
  updateRelationshipEntry: (index: number, field: keyof RelationshipEntry, value: string) => void;
  removeRelationshipEntry: (index: number) => void;
  addRelationshipEntry: () => void;
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
          ? "h-auto sm:h-[800px] opacity-100 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700"
          : "h-0 opacity-0 mb-0 pb-0 border-b-0"
      )}
      tabIndex={-1}
    >
      <Card className={cn(
        "h-full w-full bg-white/90 dark:bg-zinc-900/90 shadow-xl rounded-2xl p-0 flex flex-col sm:flex-row border border-gray-100 dark:border-zinc-800 transition-all duration-300 overflow-hidden",
        arcrylicBg && "backdrop-blur-md"
      )}>
        {/* Sidebar: Collection List */}
        <aside className="w-full sm:w-1/3 bg-muted/40 dark:bg-muted/20 p-3 sm:p-4 flex flex-col gap-2 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-800 min-h-[200px] sm:min-h-[320px] max-h-[220px] sm:max-h-none overflow-x-auto overflow-y-auto">
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
            {collections.map((collection) => (
              <div
                key={collection.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group transition-all",
                  collection.id === collectionToEdit
                    ? "bg-primary/10 dark:bg-primary/20 text-primary"
                    : "hover:bg-muted/60 dark:hover:bg-muted/30 text-gray-700 dark:text-gray-200"
                )}
                onClick={() => {
                  setCollectionToEdit(collection.id);
                  setEditedCollectionName(collection.name);
                  setError(null);
                }}
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
            ))}
          </div>
        </aside>

        {/* Main: Collection Details & Tabs */}
        <section className="flex-1 min-w-0 p-3 sm:p-6 flex flex-col h-full">
          <Tabs defaultValue="history" className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="mapping">Mapping</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="flex-1 overflow-auto">
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
            </TabsContent>
            <TabsContent value="mapping" className="flex-1 overflow-auto">
              {editingCollection && (
                <MappingTable
                  mappingTable={editingCollection.mappingTable}
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
              )}
            </TabsContent>
            <TabsContent value="relationships" className="flex-1 overflow-auto">
              {editingCollection && (
                <RelationshipsTable
                  relationshipsTable={editingCollection.relationshipsTable}
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
              )}
            </TabsContent>
            <TabsContent value="updates" className="flex-1 overflow-auto">
              {editingCollection?.tableUpdateHistory?.length ? (
                editingCollection.tableUpdateHistory.map(entry => (
                  <Card key={entry.id} className="mb-4">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Update on {new Date(entry.timestamp).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded text-sm ${entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>{entry.status}</span>
                      </div>
                      {entry.updates.added && entry.updates.added?.length > 0 && (
                        <div className="mb-2">
                          <strong>Added:</strong>
                          <ul className="list-disc list-inside">
                            {entry.updates.added.map((e: MappingEntry | RelationshipEntry, i: number) => (
                              <li key={i}>{entry.type === 'mapping' ? (e as MappingEntry).term : `${(e as RelationshipEntry).characterA}–${(e as RelationshipEntry).characterB}`}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.updates.updated && entry.updates.updated?.length > 0 && (
                        <div className="mb-2">
                          <strong>Updated:</strong>
                          <ul className="list-disc list-inside">
                            {entry.updates.updated.map((e: MappingEntry | RelationshipEntry, i: number) => (
                              <li key={i}>{entry.type === 'mapping' ? (e as MappingEntry).term : `${(e as RelationshipEntry).characterA}–${(e as RelationshipEntry).characterB}`}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => onRejectUpdate(entry)}>Reject</Button>
                          <Button variant="default" size="sm" onClick={() => onApproveUpdate(entry)}>Approve</Button>
                        </div>
                      )}
                      {(entry.status === 'approved' || entry.status === 'rejected') && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Confirm if this update was previously rejected
                              if (entry.status === 'rejected' && !window.confirm('This update was previously rejected. Do you want to reapply it?')) {
                                return;
                              }
                              onApproveUpdate(entry);
                            }}
                          >
                            Reapply
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No updates</p>
              )}
            </TabsContent>
          </Tabs>
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