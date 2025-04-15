import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Clipboard,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
}

interface TranslationInputOutputProps {
  inputText: string;
  setInputText: (text: string) => void;
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
  isCopied: boolean;
  onTranslate: () => void;
  onCopy: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: string[];
  selectedCollectionId: string;
  collections: Collection[];
  onCollectionChange: (id: string) => void;
  isCollectionManagementVisible: boolean;
  onToggleCollectionManagement: (id: string) => void;
  arcrylicBg?: boolean;
}

const TranslationInputOutput: React.FC<TranslationInputOutputProps> = ({
  inputText,
  setInputText,
  translatedText,
  isTranslating,
  error,
  isCopied,
  onTranslate,
  onCopy,
  selectedModel,
  onModelChange,
  models,
  selectedCollectionId,
  collections,
  onCollectionChange,
  isCollectionManagementVisible,
  onToggleCollectionManagement,
  arcrylicBg,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
      {/* Input section */}
      <Card className={cn("p-6", arcrylicBg && "arcrylic-blur")}> 
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Label htmlFor="inputText" className="text-lg font-medium">
              Input Text
            </Label>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Collection Selection */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Label htmlFor="collectionSelect" className="text-sm font-medium">
              Translation Collection
            </Label>
            <div className="flex gap-2 w-full sm:w-auto items-center">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedCollectionId}
                  onValueChange={onCollectionChange}
                >
                  <SelectTrigger id="collectionSelect" className="w-full">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant={isCollectionManagementVisible ? "default" : "outline"}
                size="icon"
                onClick={() => onToggleCollectionManagement(selectedCollectionId)}
                title="Toggle Collection Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-grow flex flex-col">
            <Textarea
              id="inputText"
              placeholder="Enter text to translate..."
              className="min-h-[300px] flex-grow text-base leading-relaxed"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <Button
            onClick={onTranslate}
            disabled={isTranslating || !inputText.trim()}
            className="w-full"
          >
            {isTranslating ? (
              <>
                Translating... <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                Translate <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Output section */}
      <Card className={cn("p-6", arcrylicBg && "arcrylic-blur")}> 
        <div className="flex flex-col gap-4 h-full">
          <div className="flex justify-between items-center">
            <Label htmlFor="translatedText" className="text-lg font-medium">
              Translated Text
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              disabled={!translatedText}
              aria-label="Copy to clipboard"
            >
              {isCopied ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Clipboard className="h-4 w-4 mr-2" />
              )}
              {isCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex-grow flex flex-col">
            <Textarea
              id="translatedText"
              className="min-h-[300px] flex-grow text-base leading-relaxed"
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
            />
          </div>
          {error && !error.includes("import") && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TranslationInputOutput; 