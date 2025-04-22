import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  ArrowUp,
  Eraser,
  Copy,
} from "lucide-react";
import { useArcrylicBg } from "@/contexts/ArcrylicBgContext";
import { getDataFromDB, saveDataToDB } from "@/lib/db";
import { runGeminiTranslation } from "@/lib/gemini";
import { toast } from "sonner";
import TranslationInputOutput from "@/components/translate/TranslationInputOutput";
import CollectionManager from "@/components/translate/CollectionManager";
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

  // =================== STATE MANAGEMENT ===================
  // All state is centralized in this component

  // State for text input and translation
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Translation history state
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryEntry[]>([]);
  const [, setShowHistory] = useState<boolean>(false);

  // Scroll to top button visibility
  const [, setShowScrollButton] = useState<boolean>(true);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(
    "gemini-2.0-flash-exp"
  );

  const models = [
    "gemini-2.0-flash-exp", //Recommended
    "gemini-2.0-flash-exp-image-generation", //Image Generation
    "gemini-2.0-flash-thinking-exp-01-21", //No support for function calling 
    "gemini-2.5-pro-exp-03-25", //Pro but Stupid (Super slow)
  ];

  // Model descriptions
  const modelDescriptions: Record<string, string> = {
    "gemini-2.0-flash-exp": "Recommended",
    "gemini-2.0-flash-exp-image-generation": "Image Generation",
    "gemini-2.0-flash-thinking-exp-01-21": "No support for function calling",
    "gemini-2.5-pro-exp-03-25": "Pro but Stupid (Super slow)",
  };

  // Settings
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Collections of mapping/relationship tables
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  // Collection management states
  const [isCollectionManagementVisible, setIsCollectionManagementVisible] =
    useState<boolean>(false);
  const [collectionToEdit, setCollectionToEdit] = useState<string>("");
  const [editedCollectionName, setEditedCollectionName] = useState<string>("");
  const [collectionToDelete, setCollectionToDelete] = useState<string>("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);

  // Current active tables
  const [activeTab] = useState<string>("mapping");
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

  // =================== FUNCTIONS ===================
  // All functions that modify state are defined here and passed to child components

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

  // Clear input text
  const clearInputText = () => {
    setInputText("");
  };

  // Clear all text fields
  const clearText = () => {
    setInputText("");
    setTranslatedText("");
    setError(null);
    toast.info("Text cleared");
  };

  // Copy translated text to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Set error message
  const setErrorMessage = (message: string | null) => {
    setError(message);
  };

  // Show update confirmation dialog
  const showUpdateConfirmationDialog = (entry: TableUpdateEntry | null) => {
    setCurrentUpdateEntry(entry);
    setShowUpdateConfirmation(!!entry);
  };

  // Handle toggle collection management visibility
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

  // Use selected collection in main input
  const useCollection = (collectionId: string) => {
    handleCollectionChange(collectionId);
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
                  const { updatedCount, added, updated } = processTableUpdate(
                    mappingTable,
                    entries,
                    validateAndProcessMappingEntry,
                    (table, entry) => table.findIndex(e => e.term === entry.term)
                  );

                  if (updatedCount > 0) {
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
                  const { updatedCount, added, updated } = processTableUpdate(
                    relationshipsTable,
                    entries,
                    validateAndProcessRelationshipEntry,
                    (table, entry) => table.findIndex(e =>
                      e.characterA === entry.characterA &&
                      e.characterB === entry.characterB
                    )
                  );

                  if (updatedCount > 0) {
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

  // Create new translation from history entry
  const createNewFromHistory = (entry: TranslationHistoryEntry) => {
    setInputText(entry.inputText);
    setTranslatedText("");
    setSelectedModel(entry.model);
    handleCollectionChange(entry.collectionId);
    setShowHistory(false);
    toast.info("Previous translation loaded");
  };

  // Helper to remove a single history entry
  const removeHistoryEntry = async (entryId: string) => {
    const updated = translationHistory.filter(e => e.id !== entryId);
    setTranslationHistory(updated);
    await saveDataToDB('translationHistory', updated);
  };

  // ===== Collection-scoped table editing handlers =====
  const updateMappingEntryInCollection = async (collectionId: string, index: number, field: keyof MappingEntry, value: string) => {
    if (!collectionId) return;
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        const newMap = c.mappingTable.map((e, i) => i === index ? { ...e, [field]: value } : e);
        return { ...c, mappingTable: newMap };
      }
      return c;
    });
    setCollections(updatedCollections);
    await saveDataToDB('translationCollections', updatedCollections);
    if (selectedCollectionId === collectionId) {
      setMappingTable(updatedCollections.find(c => c.id === collectionId)!.mappingTable);
    }
  };

  const removeMappingEntryInCollection = async (collectionId: string, index: number) => {
    if (!collectionId) return;
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        const newMap = c.mappingTable.filter((_, i) => i !== index);
        return { ...c, mappingTable: newMap };
      }
      return c;
    });
    setCollections(updatedCollections);
    await saveDataToDB('translationCollections', updatedCollections);
    if (selectedCollectionId === collectionId) {
      setMappingTable(updatedCollections.find(c => c.id === collectionId)!.mappingTable);
    }
  };

  const addMappingEntryInCollection = async (collectionId: string, entries: MappingEntry[] = []) => {
    if (!collectionId) return;

    // If no entries provided, use default empty entry
    const entriesToAdd = entries.length > 0
      ? entries
      : [{ term: '', transcription: '', type: '', gender: '', notes: '' }];

    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, mappingTable: [...c.mappingTable, ...entriesToAdd] };
      }
      return c;
    });

    setCollections(updatedCollections);
    await saveDataToDB('translationCollections', updatedCollections);
    if (selectedCollectionId === collectionId) {
      setMappingTable(updatedCollections.find(c => c.id === collectionId)!.mappingTable);
    }
  };

  const updateRelationshipEntryInCollection = async (collectionId: string, index: number, field: keyof RelationshipEntry, value: string) => {
    if (!collectionId) return;
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        const newRel = c.relationshipsTable.map((e, i) => i === index ? { ...e, [field]: value } : e);
        return { ...c, relationshipsTable: newRel };
      }
      return c;
    });
    setCollections(updatedCollections);
    await saveDataToDB('translationCollections', updatedCollections);
    if (selectedCollectionId === collectionId) {
      setRelationshipsTable(updatedCollections.find(c => c.id === collectionId)!.relationshipsTable);
    }
  };

  const removeRelationshipEntryInCollection = async (collectionId: string, index: number) => {
    if (!collectionId) return;
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        const newRel = c.relationshipsTable.filter((_, i) => i !== index);
        return { ...c, relationshipsTable: newRel };
      }
      return c;
    });
    setCollections(updatedCollections);
    await saveDataToDB('translationCollections', updatedCollections);
    if (selectedCollectionId === collectionId) {
      setRelationshipsTable(updatedCollections.find(c => c.id === collectionId)!.relationshipsTable);
    }
  };

  const addRelationshipEntryInCollection = async (collectionId: string, entries: RelationshipEntry[] = []) => {
    if (!collectionId) return;

    // If no entries provided, use default empty entry
    const entriesToAdd = entries.length > 0
      ? entries
      : [{ characterA: '', characterB: '', relationship: '', addressTermsAToB: '', addressTermsBToA: '', notes: '' }];

    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, relationshipsTable: [...c.relationshipsTable, ...entriesToAdd] };
      }
      return c;
    });

    setCollections(updatedCollections);
    await saveDataToDB('translationCollections', updatedCollections);
    if (selectedCollectionId === collectionId) {
      setRelationshipsTable(updatedCollections.find(c => c.id === collectionId)!.relationshipsTable);
    }
  };

  // Reapply a past update entry directly into its table
  const handleReapplyUpdate = async (entry: TableUpdateEntry) => {
    try {
      if (entry.type === 'mapping') {
        const newMap = [...mappingTable];
        entry.updates.added.forEach(e => newMap.push(e as MappingEntry));
        entry.updates.updated.forEach(e => {
          const idx = newMap.findIndex(item => item.term === (e as MappingEntry).term);
          if (idx >= 0) newMap[idx] = e as MappingEntry;
        });
        setMappingTable(newMap);
        await saveTableToCurrentCollection(true, newMap, selectedCollectionId);
      } else {
        const newRel = [...relationshipsTable];
        entry.updates.added.forEach(e => newRel.push(e as RelationshipEntry));
        entry.updates.updated.forEach(e => {
          const idx = newRel.findIndex(item =>
            item.characterA === (e as RelationshipEntry).characterA &&
            item.characterB === (e as RelationshipEntry).characterB
          );
          if (idx >= 0) newRel[idx] = e as RelationshipEntry;
        });
        setRelationshipsTable(newRel);
        await saveTableToCurrentCollection(false, newRel, selectedCollectionId);
      }

      // Also update the status in collections if it was previously rejected
      if (entry.status === 'rejected') {
        const updatedCollections = collections.map(collection => {
          if (collection.id === selectedCollectionId) {
            const updatedHistory = collection.tableUpdateHistory?.map(historyEntry =>
              historyEntry.id === entry.id
                ? { ...historyEntry, status: 'approved' as const }
                : historyEntry
            ) || [];

            return {
              ...collection,
              tableUpdateHistory: updatedHistory
            };
          }
          return collection;
        });

        setCollections(updatedCollections);
        await saveDataToDB("translationCollections", updatedCollections);
      }
    } catch (error) {
      console.error('Error reapplying update:', error);
      toast.error('Failed to reapply update');
    }
  };

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

  // Handle model change
  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    await saveDataToDB("translateModel", newModel);
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

        if (storedCollections && storedCollections?.length > 0) {
          setCollections(storedCollections);
          setSelectedCollectionId(storedCollections[0].id);
          setMappingTable(storedCollections[0].mappingTable);
          setRelationshipsTable(storedCollections[0].relationshipsTable);

          // Load any pending table updates from the first collection
          const pendingUpdates = storedCollections[0].tableUpdateHistory?.filter(
            update => update.status === 'pending'
          ) || [];
          setPendingTableUpdates(pendingUpdates);

          // If we have pending updates, show the updates panel
          if (pendingUpdates.length > 0) {
            setShowTableUpdates(true);
          }
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

  // Use effect for smooth scrolling to settings panel when it becomes visible
  useEffect(() => {
    if (isCollectionManagementVisible && settingsPanelRef.current) {
      // Use a longer delay and ensure we scroll with enough spacing to see the top of the component
      setTimeout(() => {
        settingsPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center", // Change from "start" to "center" to ensure more visibility
          inline: "nearest",
        });

        // Additional backup approach if the above doesn't work well
        if (settingsPanelRef.current) {
          const yOffset = -50; // Add some offset for better visibility
          const y = settingsPanelRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 250); // Increased from 100ms to 300ms for more reliable rendering
    }
  }, [isCollectionManagementVisible]);

  // We need to update editedCollectionName when collectionToEdit changes
  useEffect(() => {
    if (collectionToEdit) {
      const collection = collections.find((c) => c.id === collectionToEdit);
      if (collection) {
        setEditedCollectionName(collection.name);
      }
    }
  }, [collectionToEdit, collections]);

  // Parse markdown table to array of objects
  const parseMarkdownTable = (
    markdown: string,
    isMapping: boolean
  ): MappingEntry[] | RelationshipEntry[] => {
    try {
      const lines = markdown.trim().split("\n");
      if (lines?.length < 3) return []; // Need at least header, separator, and one data row

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
                (index !== 0 && index !== array?.length - 1) ||
                cell.trim() !== ""
            )
            .map((cell) => cell.trim());

          if (cells?.length < 5) {
            console.warn("Row has fewer than expected columns:", row);
            // Fill missing cells with empty strings
            while (cells?.length < 5) cells.push("");
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
                (index !== 0 && index !== array?.length - 1) ||
                cell.trim() !== ""
            )
            .map((cell) => cell.trim());

          if (cells?.length < 6) {
            console.warn("Row has fewer than expected columns:", row);
            // Fill missing cells with empty strings
            while (cells?.length < 6) cells.push("");
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
    if (data?.length === 0) return "";

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
      if (lines?.length < 3) {
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
      if (parsed?.length === 0) {
        toast.error("No valid data rows found in the table");
        setError(`Import failed: No valid data rows found in the table`);
        return;
      }

      setError(null);

      // Check if we're editing a specific collection in the Collection Manager
      if (collectionToEdit) {
        // Save current state before updating
        if (isMapping) {
          // Find the collection being edited to save its original state
          const editingCollection = collections.find(c => c.id === collectionToEdit);
          if (editingCollection) {
            setPreviousMappingTable(editingCollection.mappingTable);
          }
        } else {
          const editingCollection = collections.find(c => c.id === collectionToEdit);
          if (editingCollection) {
            setPreviousRelationshipsTable(editingCollection.relationshipsTable);
          }
        }

        // Update the specific collection being edited
        const updatedCollections = collections.map(collection => {
          if (collection.id === collectionToEdit) {
            return {
              ...collection,
              mappingTable: isMapping ? (parsed as MappingEntry[]) : collection.mappingTable,
              relationshipsTable: !isMapping ? (parsed as RelationshipEntry[]) : collection.relationshipsTable,
            };
          }
          return collection;
        });

        setCollections(updatedCollections);
        saveDataToDB("translationCollections", updatedCollections);

        // If the selected collection is also the one being edited, update the current tables too
        if (selectedCollectionId === collectionToEdit) {
          if (isMapping) {
            setMappingTable(parsed as MappingEntry[]);
          } else {
            setRelationshipsTable(parsed as RelationshipEntry[]);
          }
        }
      } else {
        // Original behavior for the main UI
        // Save current state before updating
        if (isMapping) {
          setPreviousMappingTable(mappingTable);
          setMappingTable(parsed as MappingEntry[]);
        } else {
          setPreviousRelationshipsTable(relationshipsTable);
          setRelationshipsTable(parsed as RelationshipEntry[]);
        }

        // Save to current collection
        saveTableToCurrentCollection(isMapping, parsed, selectedCollectionId);
      }

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
    if (collectionToEdit) {
      // We're editing in the Collection Manager
      const updatedCollections = collections.map(collection => {
        if (collection.id === collectionToEdit) {
          return {
            ...collection,
            mappingTable: isMapping ? previousMappingTable : collection.mappingTable,
            relationshipsTable: !isMapping ? previousRelationshipsTable : collection.relationshipsTable,
          };
        }
        return collection;
      });

      setCollections(updatedCollections);
      saveDataToDB("translationCollections", updatedCollections);

      // If the selected collection is also the one being edited, update the current tables too
      if (selectedCollectionId === collectionToEdit) {
        if (isMapping) {
          setMappingTable(previousMappingTable);
        } else {
          setRelationshipsTable(previousRelationshipsTable);
        }
      }
    } else {
      // Original behavior for the main UI
      if (isMapping) {
        setMappingTable(previousMappingTable);
        saveTableToCurrentCollection(true, previousMappingTable, selectedCollectionId);
        setPreviousMappingTable([]);
      } else {
        setRelationshipsTable(previousRelationshipsTable);
        saveTableToCurrentCollection(false, previousRelationshipsTable, selectedCollectionId);
        setPreviousRelationshipsTable([]);
      }
    }

    // In all cases, reset previous tables and hide revert button
    if (isMapping) {
      setPreviousMappingTable([]);
    } else {
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
    tableData: MappingEntry[] | RelationshipEntry[],
    collectionId: string = selectedCollectionId
  ) => {
    if (!collectionId) return;

    const updatedCollections = collections.map((collection) => {
      if (collection.id === collectionId) {
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
    // First check if we're editing a specific collection in the Collection Manager
    if (collectionToEdit) {
      // Find the collection being edited
      const editingCollection = collections.find(c => c.id === collectionToEdit);
      if (editingCollection) {
        // Use the data from the collection being edited
        const markdown = generateMarkdownTable(
          isMapping ? editingCollection.mappingTable : editingCollection.relationshipsTable,
          isMapping
        );

        if (isMapping) {
          setMappingMarkdown(markdown);
        } else {
          setRelationshipsMarkdown(markdown);
        }
        return;
      }
    }

    // Otherwise use the global tables (for the main UI)
    const markdown = generateMarkdownTable(
      isMapping ? mappingTable : relationshipsTable,
      isMapping
    );

    if (isMapping) {
      setMappingMarkdown(markdown);
    } else {
      setRelationshipsMarkdown(markdown);
    }

    // Don't automatically show the import/export area when updating
    // This fixes the issue where clicking Update always shows the area
    // The import/export area should only be shown when explicitly toggled
  };

  // Handle collection change
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

      // Load pending table updates from the selected collection
      const pendingUpdates = selectedCollection.tableUpdateHistory?.filter(
        update => update.status === 'pending'
      ) || [];
      setPendingTableUpdates(pendingUpdates);

      // Show updates panel if there are pending updates
      setShowTableUpdates(pendingUpdates.length > 0);
    }
  };

  const saveCurrentTablesToCollection = (collectionId: string = selectedCollectionId) => {
    if (!collectionId) return;

    const updatedCollections = collections.map((collection) => {
      if (collection.id === collectionId) {
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

  const addNewCollection = (name: string) => {
    if (!name.trim()) {
      toast.error("Please enter a name for the new collection");
      setError("Please enter a name for the new collection");
      return;
    }

    // Save current tables to current collection before creating a new one
    saveCurrentTablesToCollection();

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: name,
      mappingTable: [],
      relationshipsTable: [],
      tableUpdateHistory: [],
    };

    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    setSelectedCollectionId(newCollection.id);
    setMappingTable([]);
    setRelationshipsTable([]);

    saveDataToDB("translationCollections", updatedCollections);
    toast.success(`Collection "${name}" created`);
  };

  const deleteCollection = (collectionId: string) => {
    if (collections?.length <= 1) {
      toast.error("You must have at least one collection");
      setError("You must have at least one collection");
      return;
    }

    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    const updatedCollections = collections.filter((c) => c.id !== collectionId);

    // If we're deleting the currently selected collection, select the first available one
    if (collectionId === selectedCollectionId && updatedCollections?.length > 0) {
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

  // Toggle the import/export area
  const toggleImportArea = () => {
    setShowImportArea(!showImportArea);
    if (!showImportArea) {
      // Generate markdown from current table when opening import area
      if (activeTab === "mapping") {
        exportMarkdownTable(true);
      } else {
        exportMarkdownTable(false);
      }
    }
  };

  // Modify the handleTableUpdate function to not auto-update tables
  const handleTableUpdate = (type: 'mapping' | 'relationships', added: any[], updated: any[]) => {
    console.log('handleTableUpdate called with type:', type, 'added:', added, 'updated:', updated);
    const newUpdateEntry: TableUpdateEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      updates: {
        added,
        updated
      },
      status: 'pending'
    };

    // Add to pending updates state
    setPendingTableUpdates(prev => [...prev, newUpdateEntry]);
    setShowTableUpdates(true);
    setIsTableUpdatesAnimating(true);
    setTimeout(() => setIsTableUpdatesAnimating(false), 300);

    const updatedCollections = collections.map(collection => {
      if (collection.id === selectedCollectionId) {
        collection.tableUpdateHistory.push(newUpdateEntry);

        return {
          ...collection,
          tableUpdateHistory: collection.tableUpdateHistory
        };
      }
      return collection;
    });

    // Update collections state and save to database
    setCollections(updatedCollections);
    saveDataToDB("translationCollections", updatedCollections).catch(error => {
      console.error('Error saving pending update to database:', error);
      toast.error('Failed to save pending update to database');
    });

    // Show notification about pending update
    toast.info('New table update available for review', {
      description: `${added?.length} new entries and ${updated?.length} updated entries`,
      action: {
        label: "Review",
        onClick: () => setShowTableUpdates(true)
      }
    });
  };

  // Handle update confirmation (approve/reject)
  const handleUpdateConfirmation = async (updateEntry: TableUpdateEntry, approve: boolean) => {
    // --- Input Validation ---
    if (!selectedCollectionId) {
      console.error("handleUpdateConfirmation error: No collection selected.");
      toast.error("Error: No collection selected to apply updates.");
      return;
    }

    const targetCollectionIndex = collections.findIndex(c => c.id === selectedCollectionId);
    if (targetCollectionIndex === -1) {
      console.error(`handleUpdateConfirmation error: Collection with ID ${selectedCollectionId} not found.`);
      toast.error("Error: Selected collection could not be found.");
      // Optionally close modals if the state is inconsistent
      setShowUpdateConfirmation(false);
      setCurrentUpdateEntry(null);
      return;
    }

    // Get the current state of the target collection
    const targetCollection = collections[targetCollectionIndex];

    // --- Prepare Updated Data (without mutating original state yet) ---

    // Start with the existing tables from the target collection
    let finalMappingTable = targetCollection.mappingTable || [];
    let finalRelationshipsTable = targetCollection.relationshipsTable || [];

    // If approved, calculate the new table state based on the updateEntry
    if (approve) {
      if (updateEntry.type === 'mapping') {
        // Use a temporary copy to apply updates
        let tempMappingTable = [...finalMappingTable];
        updateEntry.updates.added.forEach(entry => tempMappingTable.push(entry as MappingEntry));
        updateEntry.updates.updated.forEach(updatedEntryData => {
          const index = tempMappingTable.findIndex(e => e.term === (updatedEntryData as MappingEntry).term);
          if (index >= 0) {
            tempMappingTable[index] = updatedEntryData as MappingEntry;
          } else {
            // Log a warning if an 'updated' item wasn't found - might indicate an issue
            console.warn(`Mapping term "${(updatedEntryData as MappingEntry).term}" marked for update not found in current table.`);
            // Decide how to handle: maybe add it anyway? Or ignore? For now, logging.
          }
        });
        // Assign the result to the variable that will be used in the collection update
        finalMappingTable = tempMappingTable;
      } else { // 'relationships'
        // Use a temporary copy to apply updates
        let tempRelationshipsTable = [...finalRelationshipsTable];
        updateEntry.updates.added.forEach(entry => tempRelationshipsTable.push(entry as RelationshipEntry));
        updateEntry.updates.updated.forEach(updatedEntryData => {
          const index = tempRelationshipsTable.findIndex(e =>
            e.characterA === (updatedEntryData as RelationshipEntry).characterA &&
            e.characterB === (updatedEntryData as RelationshipEntry).characterB
          );
          if (index >= 0) {
            tempRelationshipsTable[index] = updatedEntryData as RelationshipEntry;
          } else {
            console.warn(`Relationship between "${(updatedEntryData as RelationshipEntry).characterA}" and "${(updatedEntryData as RelationshipEntry).characterB}" marked for update not found.`);
          }
        });
        // Assign the result to the variable that will be used in the collection update
        finalRelationshipsTable = tempRelationshipsTable;
      }
    }

    // --- Construct the Next State for Collections ---

    // Create the updated history entry with the new status
    const updatedHistoryEntry = {
      ...updateEntry, // Keep original update details
      status: approve ? 'approved' as const : 'rejected' as const,
      // Maybe add timestamps for approval/rejection?
      // processedAt: new Date().toISOString(),
    };

    // Find the specific history entry within the target collection and update it
    const updatedTableUpdateHistory = (targetCollection.tableUpdateHistory || []).map(entry =>
      entry.id === updateEntry.id ? updatedHistoryEntry : entry
    );

    // Create the final, updated collection object
    const updatedTargetCollection: Collection = {
      ...targetCollection,
      tableUpdateHistory: updatedTableUpdateHistory,
      // Only update tables if approved, otherwise keep original
      mappingTable: approve && updateEntry.type === 'mapping' ? finalMappingTable : targetCollection.mappingTable,
      relationshipsTable: approve && updateEntry.type === 'relationships' ? finalRelationshipsTable : targetCollection.relationshipsTable,
    };

    // Create the full updated collections array for state and DB
    const nextCollectionsState = collections.map(collection =>
      collection.id === selectedCollectionId ? updatedTargetCollection : collection
    );

    // --- Perform State Updates and DB Save ---
    try {
      // 1. Update React state FIRST for immediate UI feedback
      setCollections(nextCollectionsState);

      // 2. Save the ENTIRE updated collections array to the DB
      // This single save operation ensures atomicity for the status and table changes.
      await saveDataToDB("translationCollections", nextCollectionsState);

      // --- Post-Save UI Updates ---

      // Remove the processed item from the pending list in the UI
      setPendingTableUpdates(prev => {
        const newPending = prev.filter(entry => entry.id !== updateEntry.id);
        // If no more pending updates, close the updates panel
        if (newPending.length === 0) {
          setShowTableUpdates(false);
        }
        return newPending;
      });

      // Close the confirmation dialog
      setShowUpdateConfirmation(false);
      setCurrentUpdateEntry(null);

      // Show success message
      toast.success(`Table update ${approve ? 'approved' : 'rejected'} successfully.`);

    } catch (error) {
      console.error('Error saving update confirmation:', error);
      toast.error(`Failed to ${approve ? 'approve' : 'reject'} update. Database save failed. Please try again.`);
    }
  };

  useEffect(() => {
    if (collections?.length === 0) {
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

  // Generate full translation prompt with mapping and relationship data
  const generateFullPrompt = (): string => {
    // Generate markdown tables
    const mappingMarkdown = generateMarkdownTable(mappingTable, true);
    const relationshipsMarkdown = generateMarkdownTable(relationshipsTable, false);

    const prompt = `
# TRANSLATE: Original Language to Vietnamese with Professional Accuracy

Translate the original language text into Vietnamese with complete accuracy and cultural nuance by following these comprehensive guidelines:

---

### 🔹 DELIVER precise translations that:

- CAPTURE every single word, preserving the **exact meaning, tone, and nuance** of the original
- MAINTAIN **stylistic fidelity**, including:
  - Formality level (trang trọng, suồng sã, thân mật…)
  - Emotional undertones
  - Cultural or historical references
- ENSURE **pronoun consistency** throughout (e.g. ta, ngươi, người, hắn, nàng, muội, chàng) as appropriate to character and context
- RESPECT the original **sentence structure**, but rewrite for **natural Vietnamese flow** where necessary without losing meaning

---

### 🔹 ENSURE emotional and stylistic authenticity:

- MATCH the original **emotional intensity** — never exaggerate or understate the mood
- REPLICATE the tone precisely — formal stays formal, casual stays casual
- PRESERVE **character-specific speech styles**, such as unique patterns, dialects, or quirks

---

### 🔹 HANDLE names, terms, and references as follows:

- USE **Sino-Vietnamese phonetic transcription** for common historical/cultural nouns if appropriate
- RETAIN **established translations** for character and place names
- PREFER **English equivalents** for Western mythological or biblical references
- DO NOT localize or adapt terms unless required for clarity

---

### 🔹 MAINTAIN contextual and narrative integrity:

- TRANSLATE with attention to the **broader context** — ensure meaning carries across lines and paragraphs
- PRESERVE **subtext and implication**, without adding interpretation or explanation
- DO NOT omit, simplify, or condense the content — translate **everything** as faithfully as possible
- SPLIT long or complex Chinese sentences into manageable Vietnamese ones **without altering their meaning**

---

### 🔹 RELATIONSHIPS & ADDRESS TERMS:

- PRESERVE exact **modes of address** between characters:  
  (e.g. huynh – muội, ngươi – ta, nàng – thiếp, ca – đệ…)
- DISTINGUISH between:
  - **Dialogue speech**
  - **Narration by a character**
  - **Character's internal thoughts**
- ADAPT address and tone appropriately to **each narrative layer** (dialogue, monologue, narration)

---

### 🔹 QUALITY CONTROL CHECKLIST:

- ✅ No omissions – every word is translated
- ✅ No stylistic deviation from original
- ✅ Emotional tone precisely mirrored
- ✅ Consistent vocabulary, names, and pronouns
- ✅ Cultural authenticity maintained

---

## Current Tables:

1. **TERM MAPPING TABLE**:
${mappingMarkdown || "No mapping table provided."}

2. **RELATIONSHIPS & ADDRESS TERMS TABLE**:
${relationshipsMarkdown || "No relationships table provided."}

TEXT TO TRANSLATE:
${inputText}

---

## 🔹 BEFORE TRANSLATION – TRY TO DEFINE THE CONTEXT:

Before beginning the translation:

1. **CONTEXT AND REFERENCE INFORMATION**:  
   
   - Summary of the story or scene  
   - World background if relevant (historical, fantasy, modern…)

2. **ADDRESS RELATIONSHIPS**:  
   
   - Character names, their **genders**, and **relationships** with each other  
   - Specific **ways characters address each other** in:  
     - Dialogue  
     - Narration  
     - Inner thoughts

3. **STYLE & TONE OF NARRATOR**:  
   
   - E.g. omniscient formal narrator, or a character's personal internal monologue  

---

🔹 AFTER TRANSLATION – CALL FUNCTION TO UPDATE TABLES:
`;

    return prompt;
  };

  // Copy full prompt to clipboard
  const copyFullPrompt = () => {
    const fullPrompt = generateFullPrompt();
    navigator.clipboard.writeText(fullPrompt);
    toast.success("Full translation prompt copied to clipboard");
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

      // Do NOT close the collection management section after deletion
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
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
            onClick={copyFullPrompt}
            aria-label="Copy full prompt"
            className="hidden md:flex"
          >
            <Copy className="h-5 w-5 mr-2" />
            Copy Prompt
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
        modelDescriptions={modelDescriptions}
        clearInputText={clearInputText}
        setErrorMessage={setErrorMessage}
      />

      {/* Collection Management & Collection‑Scoped Views */}
      <CollectionManager
        isVisible={isCollectionManagementVisible}
        settingsPanelRef={settingsPanelRef as React.RefObject<HTMLDivElement>}
        collections={collections}
        collectionToEdit={collectionToEdit}
        setCollectionToEdit={setCollectionToEdit}
        editedCollectionName={editedCollectionName}
        setEditedCollectionName={setEditedCollectionName}
        addNewCollection={addNewCollection}
        useCollection={useCollection}
        renameCollection={renameCollection}
        requestDeleteCollection={requestDeleteCollection}
        showDeleteConfirmation={showDeleteConfirmation}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        confirmDeleteCollection={confirmDeleteCollection}
        selectedCollectionId={selectedCollectionId}
        error={error}
        setError={setError}
        arcrylicBg={arcrylicBg}
        translationHistory={translationHistory}
        onClearHistory={clearHistory}
        onUseHistoryEntry={createNewFromHistory}
        onRemoveHistoryEntry={removeHistoryEntry}
        updateMappingEntry={updateMappingEntryInCollection}
        removeMappingEntry={removeMappingEntryInCollection}
        addMappingEntry={addMappingEntryInCollection}
        showMappingImportArea={showImportArea}
        toggleMappingImportArea={toggleImportArea}
        mappingMarkdown={mappingMarkdown}
        setMappingMarkdown={setMappingMarkdown}
        revertMappingImport={() => revertImport(true)}
        showMappingRevertButton={showRevertButton}
        exportMappingMarkdown={() => exportMarkdownTable(true)}
        importMappingMarkdown={() => importMarkdownTable(mappingMarkdown, true)}
        updateRelationshipEntry={updateRelationshipEntryInCollection}
        removeRelationshipEntry={removeRelationshipEntryInCollection}
        addRelationshipEntry={addRelationshipEntryInCollection}
        showRelationshipImportArea={showImportArea}
        toggleRelationshipImportArea={toggleImportArea}
        relationshipsMarkdown={relationshipsMarkdown}
        setRelationshipsMarkdown={setRelationshipsMarkdown}
        revertRelationshipImport={() => revertImport(false)}
        showRelationshipRevertButton={showRevertButton}
        exportRelationshipMarkdown={() => exportMarkdownTable(false)}
        importRelationshipMarkdown={() => importMarkdownTable(relationshipsMarkdown, false)}
        onApproveUpdate={handleReapplyUpdate}
        onRejectUpdate={(entry: TableUpdateEntry) => {
          const updatedCollections = collections.map(collection => {
            if (collection.id === selectedCollectionId) {
              const updatedHistory = collection.tableUpdateHistory?.map(historyEntry =>
                historyEntry.id === entry.id
                  ? { ...historyEntry, status: 'rejected' as const }
                  : historyEntry
              ) || [];

              return {
                ...collection,
                tableUpdateHistory: updatedHistory
              };
            }
            return collection;
          });

          // Update the state
          setCollections(updatedCollections);

          // Save to database
          saveDataToDB("translationCollections", updatedCollections);

          // Remove from pending updates
          setPendingTableUpdates(prev => prev.filter(pendingEntry => pendingEntry.id !== entry.id));

          // Show success message
          toast.success("Table update rejected successfully");
        }}
      />

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
          handleUpdateConfirmation={handleUpdateConfirmation}
          showUpdateConfirmation={showUpdateConfirmationDialog}
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
