import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Clipboard,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Languages,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collection } from "@/types/translateTypes";
import { EvervaultCard } from "@/components/ui/evervault-card";

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
  modelDescriptions?: Record<string, string>;
  clearInputText: () => void;
  setErrorMessage: (error: string | null) => void;
}

const MAX_INPUT_LENGTH = 32000;

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
  modelDescriptions,
  clearInputText,
  setErrorMessage,
}) => {
  const inputLength = inputText?.length || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 min-h-[650px] max-h-[calc(100vh-200px)] w-full overflow-hidden">
      {/* Input Section */}
      <Card className={cn("flex-1 flex flex-col shadow-lg rounded-xl border-0 mb-6 lg:mb-0", arcrylicBg && "arcrylic-blur")}>
        <CardHeader className="pb-2 border-b border-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">📝 Translate Text</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="px-2 sm:px-3 py-1 h-auto rounded-full text-sm sm:text-base bg-muted/40">
                    <Languages className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate max-w-[100px] sm:max-w-none">{selectedModel}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Current translation model</p>
                  {modelDescriptions && modelDescriptions[selectedModel] && (
                    <p className="text-xs text-muted-foreground mt-1">{modelDescriptions[selectedModel]}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        {/* Input Area */}
        <div className="flex-1 flex flex-col px-4 sm:px-6 py-3 sm:py-4 overflow-hidden">
          <div className="relative flex-1 overflow-hidden">
            <Textarea
              id="inputText"
              placeholder="Type or paste text to translate..."
              className="min-h-[200px] sm:min-h-[300px] h-full text-sm sm:text-lg leading-relaxed rounded-xl p-3 sm:p-4 pr-12 sm:pr-16 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all resize-none shadow-sm max-h-[calc(100vh-200px)] overflow-auto break-words break-all whitespace-pre-wrap"
              value={inputText}
              maxLength={MAX_INPUT_LENGTH}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Input text to translate"
            />
            {/* Character count */}
            <span className="absolute bottom-2 right-4 text-xs text-muted-foreground/70">
              {inputLength}/{MAX_INPUT_LENGTH}
            </span>
            {/* Clear button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearInputText}
                    disabled={!inputText.trim() || isTranslating}
                    className="absolute top-2 right-2 rounded-full"
                    aria-label="Clear input"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Clear input</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Model & Collection Selection */}
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <Select value={selectedModel} onValueChange={onModelChange}>
                <SelectTrigger className="h-8 text-xs font-medium px-2 py-1 rounded-full min-w-[90px] max-w-[110px]">
                  <SelectValue placeholder="Model">
                    <span className="truncate">{selectedModel}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex flex-col">
                        <span className="truncate">{model}</span>
                        {modelDescriptions && modelDescriptions[model] && (
                          <span className="text-xs text-muted-foreground">{modelDescriptions[model]}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center">
                <Select value={selectedCollectionId} onValueChange={onCollectionChange}>
                  <SelectTrigger className="h-8 text-xs font-medium px-2 py-1 rounded-full min-w-[90px] max-w-[110px]">
                    <SelectValue placeholder="Collection">
                      <span className="truncate">
                        {collections.find(c => c.id === selectedCollectionId)?.name || "Collection"}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        <span className="truncate">{collection.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isCollectionManagementVisible ? "default" : "outline"}
                        size="icon"
                        onClick={() => onToggleCollectionManagement(selectedCollectionId)}
                        className="h-8 w-8 rounded-full ml-1"
                        aria-label="Manage collections"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Manage collections</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Translate button */}
            <Button
              onClick={onTranslate}
              disabled={isTranslating || !inputText.trim()}
              className="h-8 px-3 rounded-full shadow-sm text-sm w-full sm:w-auto"
              size="default"
              aria-label="Translate"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Translating...
                </>
              ) : (
                <>
                  Translate <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Output Section */}
      <Card className={cn("flex-1 flex flex-col shadow-lg rounded-3xl border-0 relative", arcrylicBg && "arcrylic-blur")}>
        <CardHeader className="pb-2 border-b border-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">🌐 Translation</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCopy}
                    disabled={!translatedText}
                    className="rounded-full"
                    aria-label="Copy translation"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{isCopied ? "Copied!" : "Copy to clipboard"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <div className="p-3 sm:p-4 flex-1 overflow-hidden">
          {error ? (
            <div className="text-destructive flex items-start p-3 rounded-lg bg-destructive/10 mb-3">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 mt-2 text-xs px-2 py-1"
                  onClick={() => setErrorMessage(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : (
            <>
              {translatedText ? (
                <div className="rounded-xl h-full overflow-y-auto px-4 py-3 bg-muted/30">
                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                    {translatedText}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <EvervaultCard text="Translation" className="w-64 h-64 opacity-30 mb-4" />
                  <p className="text-sm">Enter text and click Translate to see results here</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TranslationInputOutput; 