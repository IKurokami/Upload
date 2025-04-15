import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
}

interface CollectionManagerProps {
  isVisible: boolean;
  settingsPanelRef: React.RefObject<HTMLDivElement>;
  collections: Collection[];
  collectionToEdit: string;
  setCollectionToEdit: (id: string) => void;
  editedCollectionName: string;
  setEditedCollectionName: (name: string) => void;
  newCollectionName: string;
  setNewCollectionName: (name: string) => void;
  addNewCollection: () => void;
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
  newCollectionName,
  setNewCollectionName,
  addNewCollection,
  useCollection,
  renameCollection,
  requestDeleteCollection,
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  confirmDeleteCollection,
  collectionToDelete,
  selectedCollectionId,
  error,
  setError,
  arcrylicBg,
}) => {
  return (
    <div
      ref={settingsPanelRef}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isVisible
          ? "h-[400px] sm:h-[320px] opacity-100 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700"
          : "h-0 opacity-0 mb-0 pb-0 border-b-0"
      )}
      tabIndex={-1}
    >
      <div className="h-full">
        <h3 className="text-xl font-semibold mb-4">Collection Management</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label
              htmlFor="collectionManagement"
              className="block text-sm font-medium mb-2"
            >
              Collection
            </Label>
            <Select
              value={collectionToEdit}
              onValueChange={(value) => {
                setCollectionToEdit(value);
                const collection = collections.find((c) => c.id === value);
                if (collection) {
                  setEditedCollectionName(collection.name);
                }
              }}
            >
              <SelectTrigger id="collectionManagement" className="w-full">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                    {collection.id === selectedCollectionId ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-2">New Collection</Label>
            <div className="flex gap-2 h-10">
              <Input
                placeholder="New collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={addNewCollection}
                disabled={!newCollectionName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {collectionToEdit && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-medium mb-3">
              {collections.find((c) => c.id === collectionToEdit)?.name || "Selected Collection"}
            </h4>

            <div className="flex flex-col gap-4">
              {/* Rename Collection */}
              <div>
                <Label htmlFor="renameCollection" className="text-sm font-medium mb-2">
                  Rename
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="renameCollection"
                    value={editedCollectionName}
                    onChange={(e) => setEditedCollectionName(e.target.value)}
                    placeholder="New name"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={renameCollection}
                    disabled={!editedCollectionName.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => useCollection(collectionToEdit)}
                >
                  Use This Collection
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (collections.length > 1) {
                      requestDeleteCollection(collectionToEdit);
                    } else {
                      setError("You must have at least one collection");
                    }
                  }}
                  disabled={collections.length <= 1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Collection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-2">Are you sure you want to delete this collection?</p>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteCollection}
                >
                  Delete Collection
                </Button>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
};

export default CollectionManager; 