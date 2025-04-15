import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MappingEntry {
  term?: string;
  transcription?: string;
  type?: string;
  gender?: string;
  notes?: string;
}

interface RelationshipEntry {
  characterA?: string;
  characterB?: string;
  relationship?: string;
  addressTermsAToB?: string;
  addressTermsBToA?: string;
  notes?: string;
}

interface TableUpdateEntry {
  id: string;
  timestamp: number;
  type: 'mapping' | 'relationships';
  updates: {
    added: (MappingEntry | RelationshipEntry)[];
    updated: (MappingEntry | RelationshipEntry)[];
  };
  status: 'pending' | 'approved' | 'rejected';
}

interface TableUpdatesPanelProps {
  showTableUpdates: boolean;
  isTableUpdatesAnimating: boolean;
  arcrylicBg?: boolean;
  pendingTableUpdates: TableUpdateEntry[];
  expandedEntries: Set<string>;
  toggleEntryExpansion: (entryId: string) => void;
  setShowTableUpdates: (show: boolean) => void;
  setCurrentUpdateEntry: (entry: TableUpdateEntry) => void;
  setShowUpdateConfirmation: (show: boolean) => void;
}

const TableUpdatesPanel: React.FC<TableUpdatesPanelProps> = ({
  showTableUpdates,
  isTableUpdatesAnimating,
  arcrylicBg,
  pendingTableUpdates,
  expandedEntries,
  toggleEntryExpansion,
  setShowTableUpdates,
  setCurrentUpdateEntry,
  setShowUpdateConfirmation,
}) => {
  if (!showTableUpdates) return null;
  return (
    <Card
      className={cn(
        "fixed bottom-20 right-6 w-96 max-w-[calc(100vw-3rem)] z-[9998] shadow-lg transition-all duration-300 ease-in-out",
        isTableUpdatesAnimating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
        arcrylicBg && "arcrylic-blur"
      )}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Table Updates</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTableUpdates(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {pendingTableUpdates.map((update) => (
            <div key={update.id} className="border rounded-lg p-3">
              <div
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleEntryExpansion(update.id)}
              >
                <div>
                  <span className="text-sm font-medium">
                    {update.type === 'mapping' ? 'Mapping Table' : 'Relationships Table'} Update
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(update.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={e => {
                      e.stopPropagation();
                      toggleEntryExpansion(update.id);
                    }}
                  >
                    {expandedEntries.has(update.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      setCurrentUpdateEntry(update);
                      setShowUpdateConfirmation(true);
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>

              {expandedEntries.has(update.id) && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Added Entries ({update.updates.added.length})</span>
                    </div>
                    {update.updates.added.length > 0 && (
                      <div className="bg-muted/50 rounded-md p-2 max-h-32 overflow-y-auto">
                        {update.updates.added.map((entry: any, idx) => (
                          <div key={idx} className="text-xs mb-1">
                            {update.type === 'mapping' ? (
                              <>{entry.term} → {entry.transcription}</>
                            ) : (
                              <>{entry.characterA} → {entry.characterB}</>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Updated Entries ({update.updates.updated.length})</span>
                    </div>
                    {update.updates.updated.length > 0 && (
                      <div className="bg-muted/50 rounded-md p-2 max-h-32 overflow-y-auto">
                        {update.updates.updated.map((entry: any, idx) => (
                          <div key={idx} className="text-xs mb-1">
                            {update.type === 'mapping' ? (
                              <>{entry.term} → {entry.transcription}</>
                            ) : (
                              <>{entry.characterA} → {entry.characterB}</>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {pendingTableUpdates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No pending updates
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TableUpdatesPanel; 