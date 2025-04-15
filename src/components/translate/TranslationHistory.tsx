import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Database 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TranslationHistoryEntry {
  id: string;
  timestamp: number;
  inputText: string;
  translatedText: string;
  model: string;
  collectionId: string;
  collectionName: string;
}

interface TranslationHistoryProps {
  show: boolean;
  history: TranslationHistoryEntry[];
  onClear: () => void;
  onUseAgain: (entry: TranslationHistoryEntry) => void;
  arcrylicBg?: boolean;
}

const TranslationHistory: React.FC<TranslationHistoryProps> = ({
  show,
  history,
  onClear,
  onUseAgain,
  arcrylicBg,
}) => {
  if (!show) return null;
  
  return (
    <Card className={cn("border-border/60", arcrylicBg && "arcrylic-blur")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="h-5 w-5 mr-2 text-primary" />
            <div>
              <CardTitle className="text-xl">Translation History</CardTitle>
              <CardDescription className="text-sm mt-1">
                Previously translated content
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onClear}
                  disabled={history.length === 0}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Delete all translation history</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Archive className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No translation history yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Translations will be saved here automatically as you use the translator
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-2">
            <div className="space-y-3">
              {history.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Database className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                        <span className="text-sm font-medium mr-2">
                          {entry.collectionName}
                        </span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          {entry.model}
                        </Badge>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUseAgain(entry)}
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
                    </TooltipProvider>
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center text-muted-foreground">
                          <Clipboard className="h-3 w-3 mr-1" />
                          Input Text
                        </Label>
                        <div className="text-sm bg-muted/20 rounded-md p-3 max-h-[100px] overflow-y-auto border border-border/40">
                          {entry.inputText}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center text-muted-foreground">
                          <Clipboard className="h-3 w-3 mr-1" />
                          Translated Text
                        </Label>
                        <div className="text-sm bg-muted/20 rounded-md p-3 max-h-[100px] overflow-y-auto border border-border/40">
                          {entry.translatedText}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationHistory; 