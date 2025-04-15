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
import { Plus, Trash2, Pencil, Folder, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  collectionToDelete: string;
  selectedCollectionId: string;
  error: string | null;
  setError: (err: string | null) => void;
  arcrylicBg?: boolean;
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
}) => {
  // Find the collection being edited
  const editingCollection = collections.find((c) => c.id === collectionToEdit);

  // Local state for inline add
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineAddName, setInlineAddName] = useState("");
  const inlineAddInputRef = useRef<HTMLInputElement>(null);

  // Focus input when shown
  React.useEffect(() => {
    if (showInlineAdd && inlineAddInputRef.current) {
      inlineAddInputRef.current.focus();
    }
  }, [showInlineAdd]);

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

  return (
    <div
      ref={settingsPanelRef}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isVisible
          ? "h-[480px] sm:h-[400px] opacity-100 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700"
          : "h-0 opacity-0 mb-0 pb-0 border-b-0"
      )}
      tabIndex={-1}
    >
      <Card className={cn(
        "h-full w-full bg-white/90 dark:bg-zinc-900/90 shadow-xl rounded-2xl p-0 flex flex-col sm:flex-row border border-gray-100 dark:border-zinc-800 transition-all duration-300 overflow-hidden",
        arcrylicBg && "backdrop-blur-md"
      )}>
        {/* Sidebar: Collection List */}
        <aside className="w-full sm:w-1/3 bg-muted/40 dark:bg-muted/20 p-4 flex flex-col gap-2 border-r border-gray-200 dark:border-gray-800 min-h-[320px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                <span className="flex-1 truncate font-medium">{collection.name}</span>
                {collection.id === selectedCollectionId && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
                )}
                {collection.id === collectionToEdit && (
                  <span className="ml-2 text-xs font-semibold">Editing</span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main: Collection Details & Actions */}
        <section className="flex-1 p-6 flex flex-col gap-6">
          {/* Edit/Rename/Delete Collection */}
          {collectionToEdit && editingCollection && (
            <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
              <div className="flex items-center gap-3 mb-2">
                <Folder className="h-6 w-6 text-primary/80" />
                <h4 className="text-xl font-bold flex-1 truncate">{editingCollection.name}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setEditedCollectionName(editingCollection.name)}
                        aria-label="Rename collection"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rename</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => {
                          if (collections.length > 1) {
                            requestDeleteCollection(collectionToEdit);
                          } else {
                            setError("You must have at least one collection");
                          }
                        }}
                        disabled={collections.length <= 1}
                        aria-label="Delete collection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/* Rename input */}
              <div className="flex gap-2">
                <Input
                  value={editedCollectionName}
                  onChange={(e) => setEditedCollectionName(e.target.value)}
                  placeholder="Rename collection"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={renameCollection}
                  disabled={!editedCollectionName.trim()}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCollectionToEdit("")}
                >
                  Cancel
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="default"
                  onClick={() => useCollection(collectionToEdit)}
                  className="flex-1"
                >
                  Use This Collection
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-zinc-800 animate-fadeIn">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-destructive" /> Confirm Deletion
              </h3>
              <p className="mb-2 text-gray-700 dark:text-gray-300">Are you sure you want to delete this collection?</p>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
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