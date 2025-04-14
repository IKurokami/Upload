import React, { useState, useEffect } from "react";
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
  Lightbulb,
  Plus,
  Trash2,
  FilePlus,
  FileDown,
  FileUp,
  X,
  ArrowUp,
  Eraser,
} from "lucide-react";
import { useArcrylicBg } from "@/contexts/ArcrylicBgContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDataFromDB, saveDataToDB } from "@/lib/db";
import { runGeminiTranslation } from "@/lib/gemini";
import { toast } from "sonner";

// Type definitions
interface MappingEntry {
  term: string;
  transcription: string;
  type: string;
  gender: string;
  notes: string;
}

interface RelationshipEntry {
  characterA: string;
  characterB: string;
  relationship: string;
  addressTermsAToB: string;
  addressTermsBToA: string;
  notes: string;
}

interface Collection {
  id: string;
  name: string;
  mappingTable: MappingEntry[];
  relationshipsTable: RelationshipEntry[];
}

const TranslatePage: React.FC = () => {
  const arcrylicBg = useArcrylicBg();

  // State for text input and translation
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Scroll to top button visibility
  const [, setShowScrollButton] = useState<boolean>(true);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.0-flash-exp-image-generation");
  const models = [
    "gemini-2.0-flash-exp-image-generation",
    "gemini-2.0-flash-thinking-exp-01-21",
    "gemini-2.5.pro-exp-03-25",
  ];

  // Settings
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Collections of mapping/relationship tables
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState<string>("");

  // Current active tables
  const [activeTab, setActiveTab] = useState<string>("mapping");
  const [mappingTable, setMappingTable] = useState<MappingEntry[]>([]);
  const [relationshipsTable, setRelationshipsTable] = useState<RelationshipEntry[]>([]);

  // Import/Export state
  const [mappingMarkdown, setMappingMarkdown] = useState<string>("");
  const [relationshipsMarkdown, setRelationshipsMarkdown] = useState<string>("");
  const [showImportArea, setShowImportArea] = useState<boolean>(false);

  // Create refs for sections
  const topRef = React.useRef<HTMLDivElement>(null);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  // Load API key and settings from IndexedDB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedApiKey = await getDataFromDB<string>("apiKey");
        const storedModel = await getDataFromDB<string>("translateModel");
        const storedCollections = await getDataFromDB<Collection[]>("translationCollections");

        if (storedApiKey) setApiKey(storedApiKey);
        if (storedModel) setSelectedModel(storedModel);

        if (storedCollections && storedCollections.length > 0) {
          setCollections(storedCollections);
          setSelectedCollectionId(storedCollections[0].id);
          setMappingTable(storedCollections[0].mappingTable);
          setRelationshipsTable(storedCollections[0].relationshipsTable);
        } else {
          // Create a default collection if none exists
          const defaultCollection: Collection = {
            id: Date.now().toString(),
            name: "Default Collection",
            mappingTable: [],
            relationshipsTable: []
          };
          setCollections([defaultCollection]);
          setSelectedCollectionId(defaultCollection.id);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Handle model change
  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    await saveDataToDB("translateModel", newModel);
  };

  // Handle API key change

  // Parse markdown table to array of objects
  const parseMarkdownTable = (markdown: string, isMapping: boolean): MappingEntry[] | RelationshipEntry[] => {
    try {
      const lines = markdown.trim().split('\n');
      if (lines.length < 3) return []; // Need at least header, separator, and one data row

      // Skip header (first line) and separator (second line)
      const dataRows = lines.slice(2);

      if (isMapping) {
        // Parse mapping table
        return dataRows.map(row => {
          // Split by pipe and remove empty entries from start/end that occur from table markdown format
          const cells = row
            .split('|')
            .filter((cell, index, array) =>
              (index !== 0 && index !== array.length - 1) || cell.trim() !== ''
            )
            .map(cell => cell.trim());

          if (cells.length < 5) {
            console.warn("Row has fewer than expected columns:", row);
            // Fill missing cells with empty strings
            while (cells.length < 5) cells.push("");
          }

          return {
            term: cells[0] || "",
            transcription: cells[1] || "",
            type: cells[2] || "",
            gender: cells[3] || "",
            notes: cells[4] || ""
          };
        });
      } else {
        // Parse relationships table
        return dataRows.map(row => {
          // Split by pipe and remove empty entries from start/end that occur from table markdown format
          const cells = row
            .split('|')
            .filter((cell, index, array) =>
              (index !== 0 && index !== array.length - 1) || cell.trim() !== ''
            )
            .map(cell => cell.trim());

          if (cells.length < 6) {
            console.warn("Row has fewer than expected columns:", row);
            // Fill missing cells with empty strings
            while (cells.length < 6) cells.push("");
          }

          return {
            characterA: cells[0] || "",
            characterB: cells[1] || "",
            relationship: cells[2] || "",
            addressTermsAToB: cells[3] || "",
            addressTermsBToA: cells[4] || "",
            notes: cells[5] || ""
          };
        });
      }
    } catch (error) {
      console.error("Error parsing markdown table:", error);
      return [];
    }
  };

  // Generate markdown table from array of objects
  const generateMarkdownTable = (data: MappingEntry[] | RelationshipEntry[], isMapping: boolean): string => {
    if (data.length === 0) return "";

    let markdown = "";

    if (isMapping) {
      // Generate mapping table
      markdown = "| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |\n";
      markdown += "|:----------- |:------------- |:------------------------- |:------------------ |:------ |\n";

      (data as MappingEntry[]).forEach(entry => {
        markdown += `| ${entry.term} | ${entry.transcription} | ${entry.type} | ${entry.gender} | ${entry.notes} |\n`;
      });
    } else {
      // Generate relationships table
      markdown = "| Character A | Character B | Relationship | Address Terms (A→B) | Address Terms (B→A) | Notes |\n";
      markdown += "|:----------- |:----------- |:------------ |:------------------- |:------------------- |:----- |\n";

      (data as RelationshipEntry[]).forEach(entry => {
        markdown += `| ${entry.characterA} | ${entry.characterB} | ${entry.relationship} | ${entry.addressTermsAToB} | ${entry.addressTermsBToA} | ${entry.notes} |\n`;
      });
    }

    return markdown;
  };

  // Import markdown to table
  const importMarkdownTable = (markdown: string, isMapping: boolean) => {
    try {
      if (!markdown.trim()) {
        toast.error("Please enter a markdown table to import");
        setError("Please enter a markdown table to import");
        return;
      }

      if (!markdown.includes('|')) {
        toast.error("Invalid table format. Table must contain pipe characters (|)");
        setError("Import failed: Invalid table format. Table must contain pipe characters (|)");
        return;
      }

      const lines = markdown.trim().split('\n');
      if (lines.length < 3) {
        toast.error("Table must contain at least 3 lines (header, separator, and data row)");
        setError(`Import failed: Table must contain at least 3 lines (header, separator, and data row)`);
        return;
      }

      // Check for separator line (second line) with pipe and dashes/colons
      const separatorLine = lines[1];
      if (!separatorLine.includes('|') || !separatorLine.includes('-')) {
        toast.error("Second line must be a separator with pipes (|) and dashes (-)");
        setError(`Import failed: Second line must be a separator with pipes (|) and dashes (-)`);
        return;
      }

      const parsed = parseMarkdownTable(markdown, isMapping);
      if (parsed.length === 0) {
        toast.error("No valid data rows found in the table");
        setError(`Import failed: No valid data rows found in the table`);
        return;
      }

      setError(null);

      if (isMapping) {
        setMappingTable(parsed as MappingEntry[]);
      } else {
        setRelationshipsTable(parsed as RelationshipEntry[]);
      }

      // Save to current collection
      saveTableToCurrentCollection(isMapping, parsed);

      // Close the import area after successful import
      setShowImportArea(false);
      toast.success(`${isMapping ? "Mapping" : "Relationships"} table imported successfully`);
    } catch (error) {
      console.error("Error importing markdown table:", error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setError(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Save table changes to current collection
  const saveTableToCurrentCollection = (isMapping: boolean, tableData: MappingEntry[] | RelationshipEntry[]) => {
    if (!selectedCollectionId) return;

    const updatedCollections = collections.map(collection => {
      if (collection.id === selectedCollectionId) {
        return {
          ...collection,
          mappingTable: isMapping ? tableData as MappingEntry[] : collection.mappingTable,
          relationshipsTable: !isMapping ? tableData as RelationshipEntry[] : collection.relationshipsTable
        };
      }
      return collection;
    });

    setCollections(updatedCollections);
    saveDataToDB("translationCollections", updatedCollections);
  };

  // Export table to markdown
  const exportMarkdownTable = (isMapping: boolean) => {
    const markdown = generateMarkdownTable(
      isMapping ? mappingTable : relationshipsTable,
      isMapping
    );

    if (isMapping) {
      setMappingMarkdown(markdown);
    } else {
      setRelationshipsMarkdown(markdown);
    }

    // Show the import/export area with the generated markdown
    setShowImportArea(true);
  };

  // Collection management
  const handleCollectionChange = (collectionId: string) => {
    if (collectionId === selectedCollectionId) return;

    // Save current tables to current collection before switching
    saveCurrentTablesToCollection();

    // Find the selected collection
    const selectedCollection = collections.find(c => c.id === collectionId);
    if (selectedCollection) {
      setSelectedCollectionId(collectionId);
      setMappingTable(selectedCollection.mappingTable);
      setRelationshipsTable(selectedCollection.relationshipsTable);
    }
  };

  const saveCurrentTablesToCollection = () => {
    if (!selectedCollectionId) return;

    const updatedCollections = collections.map(collection => {
      if (collection.id === selectedCollectionId) {
        return {
          ...collection,
          mappingTable,
          relationshipsTable
        };
      }
      return collection;
    });

    setCollections(updatedCollections);
    saveDataToDB("translationCollections", updatedCollections);
  };

  const addNewCollection = () => {
    if (!newCollectionName.trim()) {
      toast.error("Please enter a name for the new collection");
      setError("Please enter a name for the new collection");
      return;
    }

    // Save current tables to current collection before creating a new one
    saveCurrentTablesToCollection();

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName,
      mappingTable: [],
      relationshipsTable: []
    };

    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    setSelectedCollectionId(newCollection.id);
    setMappingTable([]);
    setRelationshipsTable([]);
    setNewCollectionName("");

    saveDataToDB("translationCollections", updatedCollections);
    toast.success(`Collection "${newCollectionName}" created`);
  };

  const deleteCollection = (collectionId: string) => {
    if (collections.length <= 1) {
      toast.error("You must have at least one collection");
      setError("You must have at least one collection");
      return;
    }

    const collection = collections.find(c => c.id === collectionId);
    const updatedCollections = collections.filter(c => c.id !== collectionId);
    setCollections(updatedCollections);

    // If we're deleting the selected collection, switch to the first one
    if (collectionId === selectedCollectionId) {
      setSelectedCollectionId(updatedCollections[0].id);
      setMappingTable(updatedCollections[0].mappingTable);
      setRelationshipsTable(updatedCollections[0].relationshipsTable);
    }

    saveDataToDB("translationCollections", updatedCollections);
    if (collection) {
      toast.success(`Collection "${collection.name}" deleted`);
    }
  };

  // Handle import/export visibility
  const toggleImportArea = () => {
    setShowImportArea(!showImportArea);
    if (!showImportArea) {
      // Generate markdown from current table when opening import area
      if (activeTab === "mapping") {
        setMappingMarkdown(generateMarkdownTable(mappingTable, true));
      } else {
        setRelationshipsMarkdown(generateMarkdownTable(relationshipsTable, false));
      }
    }
  };

  // Translate text
  const translateText = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to translate");
      setError("Please enter text to translate");
      return;
    }

    // Save any pending changes to the current collection
    saveCurrentTablesToCollection();

    setIsTranslating(true);
    setError(null);
    
    toast.promise(
      async () => {
        try {
          // Generate markdown tables
          const mappingMarkdown = generateMarkdownTable(mappingTable, true);
          const relationshipsMarkdown = generateMarkdownTable(relationshipsTable, false);

          // Get the current collection name for context

          const response = await runGeminiTranslation(
            inputText,
            mappingMarkdown,
            relationshipsMarkdown,
            apiKey || "default-key", // Use a default key if none is provided
            selectedModel
          );

          if (response.hasError) {
            setError(response.thinking || "Translation failed. Please try again.");
            throw new Error(response.thinking || "Translation failed");
          } else {
            setTranslatedText(response.ocrText || "");
            return response.ocrText;
          }
        } catch (error) {
          console.error("Translation error:", error);
          setError("An error occurred during translation. Please try again.");
          throw error;
        } finally {
          setIsTranslating(false);
        }
      },
      {
        loading: 'Translating text...',
        success: 'Translation completed successfully',
        error: (err) => `Translation failed: ${err instanceof Error ? err.message : "Unknown error"}`
      }
    );
  };

  // Copy translated text to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Add entry to mapping table
  const addMappingEntry = () => {
    const newEntry: MappingEntry = {
      term: "",
      transcription: "",
      type: "",
      gender: "",
      notes: ""
    };

    const updatedTable = [...mappingTable, newEntry];
    setMappingTable(updatedTable);
    saveTableToCurrentCollection(true, updatedTable);
  };

  // Update mapping entry
  const updateMappingEntry = (index: number, field: keyof MappingEntry, value: string) => {
    const updatedTable = [...mappingTable];
    updatedTable[index] = { ...updatedTable[index], [field]: value };
    setMappingTable(updatedTable);
    saveTableToCurrentCollection(true, updatedTable);
  };

  // Remove mapping entry
  const removeMappingEntry = (index: number) => {
    const updatedTable = mappingTable.filter((_, i) => i !== index);
    setMappingTable(updatedTable);
    saveTableToCurrentCollection(true, updatedTable);
  };

  // Add entry to relationships table
  const addRelationshipEntry = () => {
    const newEntry: RelationshipEntry = {
      characterA: "",
      characterB: "",
      relationship: "",
      addressTermsAToB: "",
      addressTermsBToA: "",
      notes: ""
    };

    const updatedTable = [...relationshipsTable, newEntry];
    setRelationshipsTable(updatedTable);
    saveTableToCurrentCollection(false, updatedTable);
  };

  // Update relationship entry
  const updateRelationshipEntry = (index: number, field: keyof RelationshipEntry, value: string) => {
    const updatedTable = [...relationshipsTable];
    updatedTable[index] = { ...updatedTable[index], [field]: value };
    setRelationshipsTable(updatedTable);
    saveTableToCurrentCollection(false, updatedTable);
  };

  // Remove relationship entry
  const removeRelationshipEntry = (index: number) => {
    const updatedTable = relationshipsTable.filter((_, i) => i !== index);
    setRelationshipsTable(updatedTable);
    saveTableToCurrentCollection(false, updatedTable);
  };

  // Handle scroll event to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down 200px
      if (window.scrollY > 200) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    console.log("Scrolling to top attempt");

    // Try multiple approaches to ensure it works
    // Approach 1: Using scrollIntoView
    if (topRef.current) {
      topRef.current.scrollIntoView({
        behavior: 'smooth'
      });
      console.log("Used scrollIntoView");
      return;
    }

    // Approach 2: Direct DOM method
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      console.log("Used window.scroll");
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
      console.log("Used fallback scrollTo");
    }
  };

  // Clear text fields
  const clearText = () => {
    setInputText("");
    setTranslatedText("");
    setError(null);
    toast.info("Text cleared");
  };

  // Toggle settings and scroll to settings card
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    
    // If opening settings, wait for render then scroll
    if (!isSettingsOpen) {
      setTimeout(() => {
        settingsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col gap-6 pb-10 relative">
      {/* Invisible element at the top for scrollIntoView */}
      <div ref={topRef} className="absolute top-0" />

      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Text Translator</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearText}
            aria-label="Clear all text"
          >
            <Eraser className="h-5 w-5 mr-2" />
            Clear
          </Button>
          <Button
            variant={isSettingsOpen ? "default" : "outline"}
            size="icon"
            onClick={toggleSettings}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main translation area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Input section */}
        <Card className={cn("p-6", arcrylicBg && "arcrylic-blur")}>
          <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <Label htmlFor="inputText" className="text-lg font-medium">Input Text</Label>
              <Select value={selectedModel} onValueChange={handleModelChange}>
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
              <Label htmlFor="collectionSelect" className="text-sm font-medium">Translation Collection</Label>
              <Select value={selectedCollectionId} onValueChange={handleCollectionChange}>
                <SelectTrigger id="collectionSelect" className="w-full sm:w-[300px]">
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
              onClick={translateText}
              disabled={isTranslating || !inputText.trim()}
              className="w-full"
            >
              {isTranslating ? "Translating..." : "Translate"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Output section */}
        <Card className={cn("p-6", arcrylicBg && "arcrylic-blur")}>
          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
              <Label htmlFor="translatedText" className="text-lg font-medium">Translated Text</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
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

      {/* Settings panel */}
      {isSettingsOpen && (
        <Card ref={settingsRef} className={cn("p-6", arcrylicBg && "arcrylic-blur")}>
          <h2 className="text-2xl font-bold mb-4">Translation Settings</h2>

          {/* Collection Management */}
          <div className="mb-6">
            <Label className="block mb-2">Collection Management</Label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="New collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-grow"
              />
              <Button
                variant="outline"
                onClick={addNewCollection}
                disabled={!newCollectionName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Collection
              </Button>
            </div>

            {selectedCollectionId && collections.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteCollection(selectedCollectionId)}
                className="mt-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Collection
              </Button>
            )}
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="mapping" className="flex-1">Mapping Table</TabsTrigger>
              <TabsTrigger value="relationships" className="flex-1">Relationships Table</TabsTrigger>
            </TabsList>

            {/* Mapping Table */}
            <TabsContent value="mapping" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <Button onClick={addMappingEntry} variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Entry
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={showImportArea ? "default" : "outline"}
                      onClick={toggleImportArea}
                    >
                      {showImportArea ? (
                        <><X className="h-4 w-4 mr-2" />Close</>
                      ) : (
                        <><FilePlus className="h-4 w-4 mr-2" />Import/Export</>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const exampleMappingTable = `| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |
|:----------- |:------------- |:------------------------- |:------------------ |:------ |
| 事情是这样的 | Chuyện là thế này | Phrase | | Opening phrase |
| 最近 | Gần đây | Time | | |
| 师兄 | Sư huynh | Title/Relationship | Male | Elder martial brother |
| 其实 | Thực ra | Adverb | | |`;
                        setMappingMarkdown(exampleMappingTable);
                        setShowImportArea(true);
                      }}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Sample
                    </Button>
                  </div>
                </div>

                {/* Import/Export Area */}
                {showImportArea && (
                  <div className="flex flex-col gap-4 p-4 rounded-md border bg-muted/20">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Import/Export Markdown</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportMarkdownTable(true)}
                          title="Update markdown from current table"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => importMarkdownTable(mappingMarkdown, true)}
                        >
                          <FileUp className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Paste markdown table here..."
                      className="h-48"
                      value={mappingMarkdown}
                      onChange={(e) => setMappingMarkdown(e.target.value)}
                    />
                    {error && error.includes("import") && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-4">Term / Name</th>
                        <th className="text-left py-2 px-4">Transcription</th>
                        <th className="text-left py-2 px-4">Type</th>
                        <th className="text-left py-2 px-4">Gender</th>
                        <th className="text-left py-2 px-4">Notes</th>
                        <th className="text-left py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappingTable.map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">
                            <Input
                              value={entry.term}
                              onChange={(e) => updateMappingEntry(index, "term", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.transcription}
                              onChange={(e) => updateMappingEntry(index, "transcription", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.type}
                              onChange={(e) => updateMappingEntry(index, "type", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.gender}
                              onChange={(e) => updateMappingEntry(index, "gender", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.notes}
                              onChange={(e) => updateMappingEntry(index, "notes", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeMappingEntry(index)}
                              className="w-full"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Relationships Table */}
            <TabsContent value="relationships" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <Button onClick={addRelationshipEntry} variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Entry
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={showImportArea ? "default" : "outline"}
                      onClick={toggleImportArea}
                    >
                      {showImportArea ? (
                        <><X className="h-4 w-4 mr-2" />Close</>
                      ) : (
                        <><FilePlus className="h-4 w-4 mr-2" />Import/Export</>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const exampleRelationshipsTable = `| Character A | Character B | Relationship | Address Terms (A→B) | Address Terms (B→A) | Notes |
|:----------- |:----------- |:------------ |:------------------- |:------------------- |:----- |
| Vưu Thiên Thu | Triệu Không Minh | Adoptive Younger Sister -> Elder Brother | Huynh trưởng, Sư huynh | Ngươi | Formal/Respectful |
| Lâm Linh Dao | Vưu Thiên Thu | Female Lead 2 -> Female Lead 1 | Dao tỷ tỷ, Muội | Thiên Thu | Relationship strained |`;
                        setRelationshipsMarkdown(exampleRelationshipsTable);
                        setShowImportArea(true);
                      }}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Sample
                    </Button>
                  </div>
                </div>

                {/* Import/Export Area */}
                {showImportArea && (
                  <div className="flex flex-col gap-4 p-4 rounded-md border bg-muted/20">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Import/Export Markdown</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportMarkdownTable(false)}
                          title="Update markdown from current table"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => importMarkdownTable(relationshipsMarkdown, false)}
                        >
                          <FileUp className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Paste markdown table here..."
                      className="h-48"
                      value={relationshipsMarkdown}
                      onChange={(e) => setRelationshipsMarkdown(e.target.value)}
                    />
                    {error && error.includes("import") && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-4">Character A</th>
                        <th className="text-left py-2 px-4">Character B</th>
                        <th className="text-left py-2 px-4">Relationship</th>
                        <th className="text-left py-2 px-4">Address (A→B)</th>
                        <th className="text-left py-2 px-4">Address (B→A)</th>
                        <th className="text-left py-2 px-4">Notes</th>
                        <th className="text-left py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relationshipsTable.map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">
                            <Input
                              value={entry.characterA}
                              onChange={(e) => updateRelationshipEntry(index, "characterA", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.characterB}
                              onChange={(e) => updateRelationshipEntry(index, "characterB", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.relationship}
                              onChange={(e) => updateRelationshipEntry(index, "relationship", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.addressTermsAToB}
                              onChange={(e) => updateRelationshipEntry(index, "addressTermsAToB", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.addressTermsBToA}
                              onChange={(e) => updateRelationshipEntry(index, "addressTermsBToA", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              value={entry.notes}
                              onChange={(e) => updateRelationshipEntry(index, "notes", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeRelationshipEntry(index)}
                              className="w-full"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Scroll to top button */}
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl z-[9999] w-12 h-12 p-0"
        onClick={() => {
          console.log("Button clicked");
          scrollToTop();
        }}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default TranslatePage; 