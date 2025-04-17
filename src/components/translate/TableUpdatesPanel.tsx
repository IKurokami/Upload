import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, ChevronUp, ChevronDown, Clock, CheckCircle, ChevronsUp, ChevronsDown } from "lucide-react";
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
        "fixed bottom-20 right-6 w-96 max-w-[calc(100vw-3rem)] z-[9998] shadow-lg transition-all duration-300 ease-in-out rounded-xl border-border/40",
        isTableUpdatesAnimating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
        arcrylicBg && "arcrylic-blur"
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-base font-medium">Table Updates</CardTitle>
          <Badge variant="outline" className="ml-2 text-xs">
            {pendingTableUpdates?.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTableUpdates(false)}
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-3">
        <ScrollArea className="max-h-[60vh] pr-2 overflow-y-auto">
          <div className="space-y-3">
            {pendingTableUpdates?.length > 0 ? (
              pendingTableUpdates.map((update) => (
                <div key={update.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-3 flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          {update.type === 'mapping' ? 'Mapping Table' : 'Relationships Table'}
                        </span>
                        <Badge 
                          variant={
                            update.status === 'pending' ? 'outline' :
                            update.status === 'approved' ? 'secondary' : 'destructive'
                          }
                          className="ml-2 text-xs px-1.5"
                        >
                          {update.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(update.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => toggleEntryExpansion(update.id)}
                      >
                        {expandedEntries.has(update.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setCurrentUpdateEntry(update);
                                setShowUpdateConfirmation(true);
                              }}
                            >
                              Review
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Review and approve/reject changes</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  {expandedEntries.has(update.id) && (
                    <div className="p-3 space-y-3 bg-background">
                      {/* Added Entries */}
                      {update.updates.added?.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium flex items-center">
                              <ChevronsUp className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                              Added Entries
                            </span>
                            <Badge variant="outline" className="text-xs px-1.5 h-5">
                              {update.updates.added?.length}
                            </Badge>
                          </div>
                          <ScrollArea className="h-[120px]">
                            <div className="bg-muted/30 rounded-md p-2.5">
                              {update.updates.added.map((entry: any, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-xs py-1.5 px-2 rounded mb-1 hover:bg-accent/50 transition-colors"
                                >
                                  {update.type === 'mapping' ? (
                                    <div className="flex justify-between">
                                      <span className="font-medium">{entry.term}</span>
                                      <span className="text-muted-foreground">→ {entry.transcription}</span>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between">
                                      <span className="font-medium">{entry.characterA}</span>
                                      <span className="text-muted-foreground">→ {entry.characterB}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                      
                      {/* Updated Entries */}
                      {update.updates.updated?.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium flex items-center">
                              <ChevronsDown className="h-3.5 w-3.5 mr-1 text-blue-500" />
                              Updated Entries
                            </span>
                            <Badge variant="outline" className="text-xs px-1.5 h-5">
                              {update.updates.updated?.length}
                            </Badge>
                          </div>
                          <ScrollArea className="h-[120px]">
                            <div className="bg-muted/30 rounded-md p-2.5">
                              {update.updates.updated.map((entry: any, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-xs py-1.5 px-2 rounded mb-1 hover:bg-accent/50 transition-colors"
                                >
                                  {update.type === 'mapping' ? (
                                    <div className="flex justify-between">
                                      <span className="font-medium">{entry.term}</span>
                                      <span className="text-muted-foreground">→ {entry.transcription}</span>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between">
                                      <span className="font-medium">{entry.characterA}</span>
                                      <span className="text-muted-foreground">→ {entry.characterB}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No pending updates</p>
                <p className="text-xs text-muted-foreground mt-1">Updates will appear here when available</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TableUpdatesPanel; 