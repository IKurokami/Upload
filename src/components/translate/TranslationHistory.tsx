import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, RotateCcw, History } from "lucide-react";
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
    <Card className={cn("p-6", arcrylicBg && "arcrylic-blur")}> 
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Translation History</h2>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClear}
            disabled={history.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No translation history yet
          </p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {history.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <span className="text-sm font-medium">
                        Collection: {entry.collectionName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Model: {entry.model}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUseAgain(entry)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Use Again
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Input Text</Label>
                      <div className="text-sm border rounded-md p-2 max-h-[100px] overflow-y-auto">
                        {entry.inputText}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Translated Text</Label>
                      <div className="text-sm border rounded-md p-2 max-h-[100px] overflow-y-auto">
                        {entry.translatedText}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TranslationHistory; 