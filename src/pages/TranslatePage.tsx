import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  ArrowUp,
  Eraser,
  History,
} from "lucide-react";
import { useArcrylicBg } from "@/contexts/ArcrylicBgContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDataFromDB, saveDataToDB } from "@/lib/db";
import { runGeminiTranslation } from "@/lib/gemini";
import { toast } from "sonner";
import TranslationHistory from "@/components/translate/TranslationHistory";
import TranslationInputOutput from "@/components/translate/TranslationInputOutput";
import CollectionManager from "@/components/translate/CollectionManager";
import MappingTable from "@/components/translate/MappingTable";
import RelationshipsTable from "@/components/translate/RelationshipsTable";
import TableUpdatesPanel from "@/components/translate/TableUpdatesPanel";
import {
  MappingEntry,
  RelationshipEntry,
  TranslationHistoryEntry,
  TableUpdateEntry,
  Collection,
} from "@/types/translateTypes";
import {
  validateAndProcessMappingEntry,
  validateAndProcessRelationshipEntry,
  processTableUpdate,
} from "@/utils/translateUtils";

const TranslatePage: React.FC = () => {
  const arcrylicBg = useArcrylicBg();

  // State for text input and translation
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Translation history state
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Scroll to top button visibility
  const [, setShowScrollButton] = useState<boolean>(true);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(
    "gemini-2.0-flash-exp-image-generation"
  );
  const models = [
    "gemini-2.0-flash-exp-image-generation",
    "gemini-2.0-flash-thinking-exp-01-21",
    "gemini-2.5-pro-exp-03-25",
  ];

  // Settings
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Collections of mapping/relationship tables
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState<string>("");

  // Collection management states
  const [isCollectionManagementVisible, setIsCollectionManagementVisible] =
    useState<boolean>(false);
  const [collectionToEdit, setCollectionToEdit] = useState<string>("");
  const [editedCollectionName, setEditedCollectionName] = useState<string>("");
  const [collectionToDelete, setCollectionToDelete] = useState<string>("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);

  // Current active tables
  const [activeTab, setActiveTab] = useState<string>("mapping");
  const [mappingTable, setMappingTable] = useState<MappingEntry[]>([]);
  const [relationshipsTable, setRelationshipsTable] = useState<
    RelationshipEntry[]
  >([]);

  // Import/Export state
  const [mappingMarkdown, setMappingMarkdown] = useState<string>("");
  const [relationshipsMarkdown, setRelationshipsMarkdown] =
    useState<string>("");
  const [showImportArea, setShowImportArea] = useState<boolean>(false);

  // Previous table states for undo functionality
  const [previousMappingTable, setPreviousMappingTable] = useState<
    MappingEntry[]
  >([]);
  const [previousRelationshipsTable, setPreviousRelationshipsTable] = useState<
    RelationshipEntry[]
  >([]);
  const [showRevertButton, setShowRevertButton] = useState<boolean>(false);

  // Table update history state
  const [showTableUpdates, setShowTableUpdates] = useState<boolean>(false);
  const [pendingTableUpdates, setPendingTableUpdates] = useState<TableUpdateEntry[]>([]);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState<boolean>(false);
  const [currentUpdateEntry, setCurrentUpdateEntry] = useState<TableUpdateEntry | null>(null);

  // Animation states
  const [isTableUpdatesAnimating, setIsTableUpdatesAnimating] = useState<boolean>(false);

  // Create refs for sections
  const topRef = React.useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // Add new state for expanded entries
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Add toggle function for expanding/collapsing entries
  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // Load API key and settings from IndexedDB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedApiKey = await getDataFromDB<string>("apiKey");
        const storedModel = await getDataFromDB<string>("translateModel");
        const storedCollections = await getDataFromDB<Collection[]>("translationCollections");
        const storedHistory = await getDataFromDB<TranslationHistoryEntry[]>("translationHistory");

        if (storedApiKey) setApiKey(storedApiKey);
        if (storedModel) setSelectedModel(storedModel);
        if (storedHistory) setTranslationHistory(storedHistory);

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
            relationshipsTable: [],
            tableUpdateHistory: [],
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

  // Auto-select current collection for editing when page loads
  useEffect(() => {
    if (selectedCollectionId && !collectionToEdit) {
      setCollectionToEdit(selectedCollectionId);
    }
  }, [selectedCollectionId, collectionToEdit]);

  // Handle model change
  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    await saveDataToDB("translateModel", newModel);
  };

  // Handle API key change

  // Parse markdown table to array of objects
  const parseMarkdownTable = (
    markdown: string,
    isMapping: boolean
  ): MappingEntry[] | RelationshipEntry[] => {
    try {
      const lines = markdown.trim().split("\n");
      if (lines.length < 3) return []; // Need at least header, separator, and one data row

      // Skip header (first line) and separator (second line)
      const dataRows = lines.slice(2);

      if (isMapping) {
        // Parse mapping table
        return dataRows.map((row) => {
          // Split by pipe and remove empty entries from start/end that occur from table markdown format
          const cells = row
            .split("|")
            .filter(
              (cell, index, array) =>
                (index !== 0 && index !== array.length - 1) ||
                cell.trim() !== ""
            )
            .map((cell) => cell.trim());

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
            notes: cells[4] || "",
          };
        });
      } else {
        // Parse relationships table
        return dataRows.map((row) => {
          // Split by pipe and remove empty entries from start/end that occur from table markdown format
          const cells = row
            .split("|")
            .filter(
              (cell, index, array) =>
                (index !== 0 && index !== array.length - 1) ||
                cell.trim() !== ""
            )
            .map((cell) => cell.trim());

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
            notes: cells[5] || "",
          };
        });
      }
    } catch (error) {
      console.error("Error parsing markdown table:", error);
      return [];
    }
  };

  // Generate markdown table from array of objects
  const generateMarkdownTable = (
    data: MappingEntry[] | RelationshipEntry[],
    isMapping: boolean
  ): string => {
    if (data.length === 0) return "";

    let markdown = "";

    if (isMapping) {
      // Generate mapping table
      markdown =
        "| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |\n";
      markdown +=
        "|:----------- |:------------- |:------------------------- |:------------------ |:------ |\n";

      (data as MappingEntry[]).forEach((entry) => {
        markdown += `| ${entry.term} | ${entry.transcription} | ${entry.type} | ${entry.gender} | ${entry.notes} |\n`;
      });
    } else {
      // Generate relationships table
      markdown =
        "| Character A | Character B | Relationship | Address Terms (A→B) | Address Terms (B→A) | Notes |\n";
      markdown +=
        "|:----------- |:----------- |:------------ |:------------------- |:------------------- |:----- |\n";

      (data as RelationshipEntry[]).forEach((entry) => {
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

      if (!markdown.includes("|")) {
        toast.error(
          "Invalid table format. Table must contain pipe characters (|)"
        );
        setError(
          "Import failed: Invalid table format. Table must contain pipe characters (|)"
        );
        return;
      }

      const lines = markdown.trim().split("\n");
      if (lines.length < 3) {
        toast.error(
          "Table must contain at least 3 lines (header, separator, and data row)"
        );
        setError(
          `Import failed: Table must contain at least 3 lines (header, separator, and data row)`
        );
        return;
      }

      // Check for separator line (second line) with pipe and dashes/colons
      const separatorLine = lines[1];
      if (!separatorLine.includes("|") || !separatorLine.includes("-")) {
        toast.error(
          "Second line must be a separator with pipes (|) and dashes (-)"
        );
        setError(
          `Import failed: Second line must be a separator with pipes (|) and dashes (-)`
        );
        return;
      }

      const parsed = parseMarkdownTable(markdown, isMapping);
      if (parsed.length === 0) {
        toast.error("No valid data rows found in the table");
        setError(`Import failed: No valid data rows found in the table`);
        return;
      }

      setError(null);

      // Save current state before updating
      if (isMapping) {
        setPreviousMappingTable(mappingTable);
        setMappingTable(parsed as MappingEntry[]);
      } else {
        setPreviousRelationshipsTable(relationshipsTable);
        setRelationshipsTable(parsed as RelationshipEntry[]);
      }

      // Save to current collection
      saveTableToCurrentCollection(isMapping, parsed);

      // Show revert button
      setShowRevertButton(true);

      // Auto-hide revert button after 1 minute
      setTimeout(() => {
        setShowRevertButton(false);
      }, 60000);

      toast.success(
        `${isMapping ? "Mapping" : "Relationships"} table imported successfully`
      );
    } catch (error) {
      console.error("Error importing markdown table:", error);
      toast.error(
        `Import failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setError(
        `Import failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Revert import changes
  const revertImport = (isMapping: boolean) => {
    if (isMapping) {
      setMappingTable(previousMappingTable);
      saveTableToCurrentCollection(true, previousMappingTable);
      setPreviousMappingTable([]);
    } else {
      setRelationshipsTable(previousRelationshipsTable);
      saveTableToCurrentCollection(false, previousRelationshipsTable);
      setPreviousRelationshipsTable([]);
    }
    setShowRevertButton(false);
    toast.success(
      `${isMapping ? "Mapping" : "Relationships"
      } table reverted to previous state`
    );
  };

  // Save table changes to current collection
  const saveTableToCurrentCollection = async (
    isMapping: boolean,
    tableData: MappingEntry[] | RelationshipEntry[]
  ) => {
    if (!selectedCollectionId) return;

    const updatedCollections = collections.map((collection) => {
      if (collection.id === selectedCollectionId) {
        return {
          ...collection,
          mappingTable: isMapping
            ? (tableData as MappingEntry[])
            : collection.mappingTable,
          relationshipsTable: !isMapping
            ? (tableData as RelationshipEntry[])
            : collection.relationshipsTable,
        };
      }
      return collection;
    });

    setCollections(updatedCollections);
    await saveDataToDB("translationCollections", updatedCollections);
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
    const selectedCollection = collections.find((c) => c.id === collectionId);
    if (selectedCollection) {
      setSelectedCollectionId(collectionId);
      setMappingTable(selectedCollection.mappingTable);
      setRelationshipsTable(selectedCollection.relationshipsTable);
    }
  };

  const saveCurrentTablesToCollection = () => {
    if (!selectedCollectionId) return;

    const updatedCollections = collections.map((collection) => {
      if (collection.id === selectedCollectionId) {
        return {
          ...collection,
          mappingTable,
          relationshipsTable,
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
      relationshipsTable: [],
      tableUpdateHistory: [],
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

    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    const updatedCollections = collections.filter((c) => c.id !== collectionId);

    // If we're deleting the currently selected collection, select the first available one
    if (collectionId === selectedCollectionId && updatedCollections.length > 0) {
      const newSelectedCollection = updatedCollections[0];
      setSelectedCollectionId(newSelectedCollection.id);
      setMappingTable(newSelectedCollection.mappingTable);
      setRelationshipsTable(newSelectedCollection.relationshipsTable);
    }

    setCollections(updatedCollections);

    // Save to database
    saveDataToDB("translationCollections", updatedCollections)
      .then(() => {
        toast.success(`Collection "${collection.name}" deleted`);
      })
      .catch((error) => {
        console.error("Failed to save collections after deletion:", error);
        toast.error("Failed to delete collection");
      });

    // Clear edit state if needed
    if (collectionId === collectionToEdit) {
      setCollectionToEdit("");
      setEditedCollectionName("");
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
        setRelationshipsMarkdown(
          generateMarkdownTable(relationshipsTable, false)
        );
      }
    }
  };

  // Create new translation from history entry
  const createNewFromHistory = (entry: TranslationHistoryEntry) => {
    setInputText(entry.inputText);
    setTranslatedText("");
    setSelectedModel(entry.model);
    handleCollectionChange(entry.collectionId);
    setShowHistory(false);
    toast.info("Previous translation loaded");
  };

  // Clear translation history
  const clearHistory = async () => {
    setTranslationHistory([]);
    await saveDataToDB("translationHistory", []);
    toast.success("Translation history cleared");
  };

  // Add translation to history
  const addToHistory = async (translatedText: string) => {
    const currentCollection = collections.find(c => c.id === selectedCollectionId);
    if (!currentCollection) return;

    const newEntry: TranslationHistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      inputText,
      translatedText,
      model: selectedModel,
      collectionId: selectedCollectionId,
      collectionName: currentCollection.name
    };

    const updatedHistory = [newEntry, ...translationHistory].slice(0, 50); // Keep last 50 translations
    setTranslationHistory(updatedHistory);
    await saveDataToDB("translationHistory", updatedHistory);
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
          const relationshipsMarkdown = generateMarkdownTable(
            relationshipsTable,
            false
          );

          const response = await runGeminiTranslation(
            inputText,
            mappingMarkdown,
            relationshipsMarkdown,
            apiKey || "default-key",
            selectedModel,
            {
              onMappingTableUpdate: (entries: Partial<MappingEntry>[]) => {
                console.log('Received entries mapping table:', entries);
                try {
                  const { newTable, updatedCount, added, updated } = processTableUpdate(
                    mappingTable,
                    entries,
                    validateAndProcessMappingEntry,
                    (table, entry) => table.findIndex(e => e.term === entry.term)
                  );

                  if (updatedCount > 0) {
                    // Remove immediate table updates
                    // setMappingTable(newTable);
                    // saveTableToCurrentCollection(true, newTable);
                    handleTableUpdate('mapping', added, updated);
                  }
                } catch (error) {
                  console.error('Error updating mapping table:', error);
                  toast.error('Failed to update mapping table');
                }
              },
              onRelationshipsTableUpdate: (entries: Partial<RelationshipEntry>[]) => {
                console.log('Received entries relationships table:', entries);

                try {
                  const { newTable, updatedCount, added, updated } = processTableUpdate(
                    relationshipsTable,
                    entries,
                    validateAndProcessRelationshipEntry,
                    (table, entry) => table.findIndex(e =>
                      e.characterA === entry.characterA &&
                      e.characterB === entry.characterB
                    )
                  );

                  if (updatedCount > 0) {
                    // Remove immediate table updates
                    // setRelationshipsTable(newTable);
                    // saveTableToCurrentCollection(false, newTable);
                    handleTableUpdate('relationships', added, updated);
                  }
                } catch (error) {
                  console.error('Error updating relationships table:', error);
                  toast.error('Failed to update relationships table');
                }
              }
            }
          );

          if (response.hasError) {
            setError(
              response.thinking || "Translation failed. Please try again."
            );
            throw new Error(response.thinking || "Translation failed");
          } else {
            const translatedResult = response.ocrText || "";
            setTranslatedText(translatedResult);
            await addToHistory(translatedResult);
            return translatedResult;
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
        loading: "Translating text...",
        success: "Translation completed successfully",
        error: (err) =>
          `Translation failed: ${err instanceof Error ? err.message : "Unknown error"
          }`,
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
      notes: "",
    };

    const updatedTable = [...mappingTable, newEntry];
    setMappingTable(updatedTable);
    saveTableToCurrentCollection(true, updatedTable);
  };

  // Update mapping entry
  const updateMappingEntry = (
    index: number,
    field: keyof MappingEntry,
    value: string
  ) => {
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
      notes: "",
    };

    const updatedTable = [...relationshipsTable, newEntry];
    setRelationshipsTable(updatedTable);
    saveTableToCurrentCollection(false, updatedTable);
  };

  // Update relationship entry
  const updateRelationshipEntry = (
    index: number,
    field: keyof RelationshipEntry,
    value: string
  ) => {
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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    console.log("Scrolling to top attempt");

    // Try multiple approaches to ensure it works
    // Approach 1: Using scrollIntoView
    if (topRef.current) {
      topRef.current.scrollIntoView({
        behavior: "smooth",
      });
      console.log("Used scrollIntoView");
      return;
    }

    // Approach 2: Direct DOM method
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
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

  // Update collection name
  const renameCollection = () => {
    if (!collectionToEdit || !editedCollectionName.trim()) return;

    const updatedCollections = collections.map((c) => {
      if (c.id === collectionToEdit) {
        return { ...c, name: editedCollectionName.trim() };
      }
      return c;
    });

    setCollections(updatedCollections);
    saveDataToDB("translationCollections", updatedCollections);
    toast.success(`Collection renamed to "${editedCollectionName}"`);

    // Optionally close the settings after renaming
    closeCollectionSettings();
  };

  // Toggle collection management visibility
  const toggleCollectionManagement = (collectionId: string) => {
    const willBeVisible = !isCollectionManagementVisible;
    setIsCollectionManagementVisible(willBeVisible);
    if (willBeVisible) {
      // If we're opening the section, set the collection to edit
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        setCollectionToEdit(collectionId);
        setEditedCollectionName(collection.name);
      }
    }
  };

  // Use effect for smooth scrolling to settings panel when it becomes visible
  useEffect(() => {
    if (isCollectionManagementVisible && settingsPanelRef.current) {
      // Add a small delay to ensure the panel is rendered before scrolling
      setTimeout(() => {
        settingsPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 100);
    }
  }, [isCollectionManagementVisible]);

  // Close collection settings dialog
  const closeCollectionSettings = () => {
    setIsCollectionManagementVisible(false);
    setCollectionToEdit("");
    setEditedCollectionName("");
    setCollectionToDelete("");
    setShowDeleteConfirmation(false);
    // Add smooth scroll to top when closing
    setTimeout(() => {
      topRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 100);
  };

  // Request delete confirmation
  const requestDeleteCollection = (collectionId: string) => {
    console.log("Delete confirmation requested for collection:", collectionId);
    setCollectionToDelete(collectionId);
    // Force the value to true with a setTimeout to ensure state updates properly
    setTimeout(() => {
      setShowDeleteConfirmation(true);
      console.log("showDeleteConfirmation set to true");
    }, 0);
  };

  // Confirm and delete collection
  const confirmDeleteCollection = () => {
    console.log("Confirming deletion of collection:", collectionToDelete);
    if (!collectionToDelete) return;

    try {
      // Call deleteCollection and then close the dialog
      deleteCollection(collectionToDelete);

      // Clear dialog state
      setShowDeleteConfirmation(false);
      setCollectionToDelete("");

      // Close the collection management section after deletion
      setTimeout(() => {
        setIsCollectionManagementVisible(false);
      }, 300);
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  // Use selected collection in main input
  const useCollection = (collectionId: string) => {
    handleCollectionChange(collectionId);
    closeCollectionSettings();
  };

  // We need to update editedCollectionName when collectionToEdit changes
  useEffect(() => {
    if (collectionToEdit) {
      const collection = collections.find((c) => c.id === collectionToEdit);
      if (collection) {
        setEditedCollectionName(collection.name);
      }
    }
  }, [collectionToEdit, collections]);

  // Modify the handleTableUpdate function to not auto-update tables
  const handleTableUpdate = (type: 'mapping' | 'relationships', added: any[], updated: any[]) => {
    const newUpdateEntry: TableUpdateEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type,
      updates: {
        added,
        updated
      },
      status: 'pending'
    };

    setPendingTableUpdates(prev => [...prev, newUpdateEntry]);
    setShowTableUpdates(true);
    setIsTableUpdatesAnimating(true);
    setTimeout(() => setIsTableUpdatesAnimating(false), 300);

    // Show notification about pending update
    toast.info('New table update available for review', {
      description: `${added.length} new entries and ${updated.length} updated entries`,
      action: {
        label: "Review",
        onClick: () => setShowTableUpdates(true)
      }
    });
  };

  const handleUpdateConfirmation = async (updateEntry: TableUpdateEntry, approve: boolean) => {
    try {
      // First update the tables if approved
      if (approve) {
        if (updateEntry.type === 'mapping') {
          const newTable = [...mappingTable];
          updateEntry.updates.added.forEach(entry => newTable.push(entry as MappingEntry));
          updateEntry.updates.updated.forEach(entry => {
            const index = newTable.findIndex(e => e.term === (entry as MappingEntry).term);
            if (index >= 0) {
              newTable[index] = entry as MappingEntry;
            }
          });
          setMappingTable(newTable);
          await saveTableToCurrentCollection(true, newTable);
        } else {
          const newTable = [...relationshipsTable];
          updateEntry.updates.added.forEach(entry => newTable.push(entry as RelationshipEntry));
          updateEntry.updates.updated.forEach(entry => {
            const index = newTable.findIndex(e =>
              e.characterA === (entry as RelationshipEntry).characterA &&
              e.characterB === (entry as RelationshipEntry).characterB
            );
            if (index >= 0) {
              newTable[index] = entry as RelationshipEntry;
            }
          });
          setRelationshipsTable(newTable);
          await saveTableToCurrentCollection(false, newTable);
        }
      }

      // Update collections with the new history
      const updatedCollections = collections.map(collection => {
        if (collection.id === selectedCollectionId) {
          const updatedHistory = [...(collection.tableUpdateHistory || [])];
          const updatedEntry = {
            ...updateEntry,
            status: approve ? 'approved' as const : 'rejected' as const
          };
          updatedHistory.push(updatedEntry);

          return {
            ...collection,
            tableUpdateHistory: updatedHistory,
            mappingTable: approve && updateEntry.type === 'mapping' ? mappingTable : collection.mappingTable,
            relationshipsTable: approve && updateEntry.type === 'relationships' ? relationshipsTable : collection.relationshipsTable
          };
        }
        return collection;
      });

      setCollections(updatedCollections);
      await saveDataToDB("translationCollections", updatedCollections);

      // Remove from pending updates
      setPendingTableUpdates(prev => prev.filter(entry => entry.id !== updateEntry.id));

      // Close the confirmation dialog
      setShowUpdateConfirmation(false);
      setCurrentUpdateEntry(null);

      // Show success message
      toast.success(`Table update ${approve ? 'approved' : 'rejected'} successfully`);

      // If no more pending updates, close the updates panel
      if (pendingTableUpdates.length <= 1) {
        setShowTableUpdates(false);
      }
    } catch (error) {
      console.error('Error handling update confirmation:', error);
      toast.error(`Failed to ${approve ? 'approve' : 'reject'} update`);
    }
  };

  useEffect(() => {
    if (collections.length === 0) {
      setSelectedCollectionId("");
      setMappingTable([]);
      setRelationshipsTable([]);
      return;
    }

    // If the selected collection no longer exists, select the first one
    const selected = collections.find((c) => c.id === selectedCollectionId);
    if (!selected) {
      setSelectedCollectionId(collections[0].id);
      setMappingTable(collections[0].mappingTable);
      setRelationshipsTable(collections[0].relationshipsTable);
    }
  }, [collections, selectedCollectionId]);

  return (
    <div className="container mx-auto p-4 flex flex-col gap-6 pb-10 relative">
      {/* Invisible element at the top for scrollIntoView */}
      <div ref={topRef} className="absolute top-0" />

      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Text Translator</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Show translation history"
          >
            <History className="h-5 w-5 mr-2" />
            History
          </Button>
          <Button
            variant="outline"
            onClick={clearText}
            aria-label="Clear all text"
          >
            <Eraser className="h-5 w-5 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Translation History Panel */}
      <TranslationHistory
        show={showHistory}
        history={translationHistory}
        onClear={clearHistory}
        onUseAgain={createNewFromHistory}
        arcrylicBg={arcrylicBg}
      />

      {/* Main translation area */}
      <TranslationInputOutput
        inputText={inputText}
        setInputText={setInputText}
        translatedText={translatedText}
        isTranslating={isTranslating}
        error={error}
        isCopied={isCopied}
        onTranslate={translateText}
        onCopy={copyToClipboard}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        models={models}
        selectedCollectionId={selectedCollectionId}
        collections={collections}
        onCollectionChange={handleCollectionChange}
        isCollectionManagementVisible={isCollectionManagementVisible}
        onToggleCollectionManagement={toggleCollectionManagement}
        arcrylicBg={arcrylicBg}
      />

      {/* Mapping & Relationships Tables Panel */}
      <Card className={cn("p-6", arcrylicBg && "arcrylic-blur")}>
        {/* Collection Management Section - Only visible when toggled */}
        <CollectionManager
          isVisible={isCollectionManagementVisible}
          settingsPanelRef={settingsPanelRef as React.RefObject<HTMLDivElement>}
          collections={collections}
          collectionToEdit={collectionToEdit}
          setCollectionToEdit={setCollectionToEdit}
          editedCollectionName={editedCollectionName}
          setEditedCollectionName={setEditedCollectionName}
          newCollectionName={newCollectionName}
          setNewCollectionName={setNewCollectionName}
          addNewCollection={addNewCollection}
          useCollection={useCollection}
          renameCollection={renameCollection}
          requestDeleteCollection={requestDeleteCollection}
          showDeleteConfirmation={showDeleteConfirmation}
          setShowDeleteConfirmation={setShowDeleteConfirmation}
          confirmDeleteCollection={confirmDeleteCollection}
          collectionToDelete={collectionToDelete}
          selectedCollectionId={selectedCollectionId}
          error={error}
          setError={setError}
          arcrylicBg={arcrylicBg}
        />

        <Tabs
          defaultValue={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            // Update markdown when switching tabs if import area is open
            if (showImportArea) {
              if (value === "mapping") {
                setMappingMarkdown(generateMarkdownTable(mappingTable, true));
              } else {
                setRelationshipsMarkdown(
                  generateMarkdownTable(relationshipsTable, false)
                );
              }
            }
          }}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              Translation Mapping Tables
              {selectedCollectionId && (
                <span className="text-base sm:text-lg font-medium ml-2 text-muted-foreground">
                  -{" "}
                  {collections.find((c) => c.id === selectedCollectionId)
                    ?.name || ""}
                </span>
              )}
            </h2>
            <TabsList className="w-full sm:w-auto mt-2 sm:mt-0">
              <TabsTrigger
                value="mapping"
                className="text-xs sm:text-sm px-2 sm:px-4 flex-1 sm:flex-initial"
              >
                Mapping Table
              </TabsTrigger>
              <TabsTrigger
                value="relationships"
                className="text-xs sm:text-sm px-2 sm:px-4 flex-1 sm:flex-initial"
              >
                Relationships Table
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mapping Table */}
          <TabsContent value="mapping" className="mt-4">
            <MappingTable
              mappingTable={mappingTable}
              updateMappingEntry={updateMappingEntry}
              removeMappingEntry={removeMappingEntry}
              addMappingEntry={addMappingEntry}
              showImportArea={showImportArea}
              toggleImportArea={toggleImportArea}
              mappingMarkdown={mappingMarkdown}
              setMappingMarkdown={setMappingMarkdown}
              revertImport={() => revertImport(true)}
              showRevertButton={showRevertButton}
              exportMarkdownTable={() => exportMarkdownTable(true)}
              importMarkdownTable={() => importMarkdownTable(mappingMarkdown, true)}
              error={error}
              arcrylicBg={arcrylicBg}
            />
          </TabsContent>

          {/* Relationships Table */}
          <TabsContent value="relationships" className="mt-4">
            <RelationshipsTable
              relationshipsTable={relationshipsTable}
              updateRelationshipEntry={updateRelationshipEntry}
              removeRelationshipEntry={removeRelationshipEntry}
              addRelationshipEntry={addRelationshipEntry}
              showImportArea={showImportArea}
              toggleImportArea={toggleImportArea}
              relationshipsMarkdown={relationshipsMarkdown}
              setRelationshipsMarkdown={setRelationshipsMarkdown}
              revertImport={() => revertImport(false)}
              showRevertButton={showRevertButton}
              exportMarkdownTable={() => exportMarkdownTable(false)}
              importMarkdownTable={() => importMarkdownTable(relationshipsMarkdown, false)}
              error={error}
              arcrylicBg={arcrylicBg}
            />
          </TabsContent>
        </Tabs>
      </Card>

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

      {showTableUpdates && (
        <TableUpdatesPanel
          showTableUpdates={showTableUpdates}
          isTableUpdatesAnimating={isTableUpdatesAnimating}
          arcrylicBg={arcrylicBg}
          pendingTableUpdates={pendingTableUpdates}
          expandedEntries={expandedEntries}
          toggleEntryExpansion={toggleEntryExpansion}
          setShowTableUpdates={setShowTableUpdates}
          setCurrentUpdateEntry={setCurrentUpdateEntry}
          setShowUpdateConfirmation={setShowUpdateConfirmation}
        />
      )}

      {showUpdateConfirmation && currentUpdateEntry && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Confirm Table Update</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUpdateConfirmation(false);
                    setCurrentUpdateEntry(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Added Entries Section */}
                <div>
                  <h4 className="font-medium mb-2">Added Entries</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {currentUpdateEntry.type === 'mapping' ? (
                            <>
                              <th className="p-2 text-left">Term</th>
                              <th className="p-2 text-left">Transcription</th>
                              <th className="p-2 text-left">Type</th>
                            </>
                          ) : (
                            <>
                              <th className="p-2 text-left">Character A</th>
                              <th className="p-2 text-left">Character B</th>
                              <th className="p-2 text-left">Relationship</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentUpdateEntry.updates.added.map((entry: MappingEntry | RelationshipEntry, index: number) => (
                          <tr key={index} className="border-t">
                            {currentUpdateEntry.type === 'mapping' ? (
                              <>
                                <td className="p-2">{(entry as MappingEntry).term}</td>
                                <td className="p-2">{(entry as MappingEntry).transcription}</td>
                                <td className="p-2">{(entry as MappingEntry).type}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-2">{(entry as RelationshipEntry).characterA}</td>
                                <td className="p-2">{(entry as RelationshipEntry).characterB}</td>
                                <td className="p-2">{(entry as RelationshipEntry).relationship}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Updated Entries Section */}
                <div>
                  <h4 className="font-medium mb-2">Updated Entries</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {currentUpdateEntry.type === 'mapping' ? (
                            <>
                              <th className="p-2 text-left">Term</th>
                              <th className="p-2 text-left">Transcription</th>
                              <th className="p-2 text-left">Type</th>
                            </>
                          ) : (
                            <>
                              <th className="p-2 text-left">Character A</th>
                              <th className="p-2 text-left">Character B</th>
                              <th className="p-2 text-left">Relationship</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentUpdateEntry.updates.updated.map((entry: MappingEntry | RelationshipEntry, index: number) => (
                          <tr key={index} className="border-t">
                            {currentUpdateEntry.type === 'mapping' ? (
                              <>
                                <td className="p-2">{(entry as MappingEntry).term}</td>
                                <td className="p-2">{(entry as MappingEntry).transcription}</td>
                                <td className="p-2">{(entry as MappingEntry).type}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-2">{(entry as RelationshipEntry).characterA}</td>
                                <td className="p-2">{(entry as RelationshipEntry).characterB}</td>
                                <td className="p-2">{(entry as RelationshipEntry).relationship}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentUpdateEntry) {
                        handleUpdateConfirmation(currentUpdateEntry, false);
                      }
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (currentUpdateEntry) {
                        handleUpdateConfirmation(currentUpdateEntry, true);
                      }
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TranslatePage;
