// src/components/ExtractTextPage.tsx
import { SparklesText } from "@/components/magicui/sparkles-text";
import { getDataFromDB, saveDataToDB } from "@/lib/db";
import { runGeminiChat, runGeminiMultiOCR } from "@/lib/gemini";
import ImagesTab from "@/sections/ImagesTab";
import ChatInterface from "@/sections/ChatInterface";
import { FileUpload } from "@/components/ui/file-upload";
import React, { useState, useEffect, useId, useRef } from "react";
import { ImageData } from "@/types/ImageData";
import { ChatMessage } from "@/types/ChatMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Image as ImageIcon,
  Settings,
  ArrowRight,
  Upload,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const API_KEY_NAME = "apiKey";
const SYSTEM_PROMPT_NAME = "systemPrompt";

// Define filter types
type FilterType = "all" | "completed" | "processing" | "queued" | "error";

const ExtractTextPage: React.FC = () => {
  // State for image processing
  const [images, setImages] = useState<ImageData[]>([]);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [processingImageIds, setProcessingImageIds] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  // State for chat interface
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<string>("images");
  const [processingChat, setProcessingChat] = useState<boolean>(false);

  // API key and settings
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>(
    "gemini-2.0-flash-exp-image-generation"
  );
  const [rpm, setRpm] = useState<number>(10);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>("");

  // Control concurrent processing
  const [maxConcurrentRequests, setMaxConcurrentRequests] = useState<number>(3);

  // Rate limiting
  const [requestTimestamps, setRequestTimestamps] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number>(0);

  // System prompt input state
  const [inputSystemPrompt, setInputSystemPrompt] = useState<string>("");

  const id = useId();
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const pageRef = useRef<HTMLDivElement>(null);
  // New ref for the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch API key and settings from IndexedDB on component mount
  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoadingApiKey(true);
      try {
        const storedKey = await getDataFromDB<string>(API_KEY_NAME);
        const storedModel = await getDataFromDB<string>("selectedModel");
        const storedRpm = await getDataFromDB<number>("rpm");
        const storedSystemPrompt = await getDataFromDB<string>(
          SYSTEM_PROMPT_NAME
        );
        const storedConcurrent = await getDataFromDB<number>(
          "maxConcurrentRequests"
        );

        setApiKey(storedKey);

        if (storedModel) {
          setSelectedModel(storedModel);
        }

        if (storedRpm && storedRpm > 0) {
          setRpm(storedRpm);
        }

        if (storedConcurrent && storedConcurrent > 0) {
          setMaxConcurrentRequests(storedConcurrent);
        }

        if (storedSystemPrompt) {
          setSystemPrompt(storedSystemPrompt);
          setInputSystemPrompt(storedSystemPrompt);
        }
      } catch (error) {
        console.error("Error retrieving settings from IndexedDB:", error);
      } finally {
        setIsLoadingApiKey(false);
      }
    };
    loadApiKey();
  }, []);

  // Handle countdown timer for rate limiting
  useEffect(() => {
    setMaxConcurrentRequests(rpm);
    const updateCountdown = () => {
      if (requestTimestamps.length === 0) {
        setCountdown(0);
        return;
      }

      if (requestTimestamps.length < rpm) {
        setCountdown(0);
        return;
      }

      // Get the oldest timestamp that's within our rate limit
      const now = Date.now();
      const oldestRelevantTimestamp =
        requestTimestamps[requestTimestamps.length - rpm];
      const resetTime = oldestRelevantTimestamp + 60000; // one minute after oldest request

      if (now >= resetTime) {
        // Clean up old timestamps
        cleanupOldTimestamps();
        setCountdown(0);
      } else {
        // Calculate remaining time
        setCountdown(Math.ceil((resetTime - now) / 1000));
      }
    };

    // Start timer
    const intervalId = setInterval(updateCountdown, 1000);

    // Initial update
    updateCountdown();

    return () => clearInterval(intervalId);
  }, [requestTimestamps, rpm]);

  // Clean up timestamps older than 1 minute
  const cleanupOldTimestamps = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    setRequestTimestamps((prev) =>
      prev.filter((timestamp) => timestamp > oneMinuteAgo)
    );
  };

  // Check if can process image based on RPM
  const canProcessImage = () => {
    // Clean up old timestamps first
    cleanupOldTimestamps();

    // If we have fewer requests in the last minute than our RPM, we can proceed
    return requestTimestamps.length < rpm;
  };

  // Record a new request timestamp
  const recordRequest = () => {
    const now = Date.now();
    // Add current timestamp and sort in descending order (newest first)
    setRequestTimestamps((prev) => {
      const newTimestamps = [...prev, now].sort((a, b) => b - a);
      // Strictly enforce RPM limit by keeping only the most recent timestamps up to RPM
      return newTimestamps.slice(0, Math.min(rpm, newTimestamps.length));
    });
  };

  // Handle model change
  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    await saveDataToDB("selectedModel", newModel);
  };

  // Handle RPM change
  const handleRpmChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRpm = parseInt(e.target.value);
    if (newRpm > 0) {
      setRpm(newRpm);
      await saveDataToDB("rpm", newRpm);
    }
  };

  // Handle concurrent requests change
  const handleConcurrentChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = parseInt(e.target.value);
    if (newValue > 0) {
      setMaxConcurrentRequests(newValue);
      await saveDataToDB("maxConcurrentRequests", newValue);
    }
  };

  // Save system prompt
  const saveSystemPrompt = async () => {
    await saveDataToDB(SYSTEM_PROMPT_NAME, inputSystemPrompt);
    setSystemPrompt(inputSystemPrompt);
  };

  // Process a single image with Gemini
  const processImage = async (imageData: ImageData): Promise<void> => {
    if (!apiKey) return;

    // Mark as processing
    setImages((prev) =>
      prev
        .map((img) =>
          img.id === imageData.id
            ? { ...img, isProcessing: true, willProcess: false }
            : img
        )
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    );

    setProcessingImageIds((prev) => [...prev, imageData.id]);

    try {
      recordRequest();

      const geminiResponse = await runGeminiMultiOCR(
        [imageData.file],
        apiKey,
        selectedModel,
        systemPrompt || undefined
      );

      setImages((prev) =>
        prev
          .map((img) =>
            img.id === imageData.id
              ? {
                  ...img,
                  geminiResponse,
                  hasError: geminiResponse.hasError,
                  isProcessing: false,
                  willProcess: false,
                  timestamp: Date.now(),
                }
              : img
          )
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      );
    } catch (error) {
      console.error("Error processing image:", error);
      setImages((prev) =>
        prev
          .map((img) =>
            img.id === imageData.id
              ? {
                  ...img,
                  geminiResponse: {
                    thinking: "",
                    ocrText: "",
                    hasError: true,
                  },
                  hasError: true,
                  isProcessing: false,
                  willProcess: false,
                  timestamp: Date.now(),
                }
              : img
          )
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      );
    } finally {
      setProcessingImageIds((prev) => prev.filter((id) => id !== imageData.id));
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (!apiKey) {
      alert(
        "API key is not set. Please set it in the API Key Settings section."
      );
      return;
    }

    // Clean up old timestamps first
    cleanupOldTimestamps();

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    // Create placeholder images for all uploaded files
    const newImages = imageFiles.map((file) => {
      const url = URL.createObjectURL(file);
      const id = `${file.name}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      return {
        id,
        file,
        url,
        geminiResponse: { thinking: "", ocrText: "", hasError: false },
        hasError: false,
        isProcessing: false,
        willProcess: true, // All images start as queued
        timestamp: Date.now(),
      };
    });

    // Add all images to the state and sort by timestamp (newest first)
    setImages((prev) =>
      [...prev, ...newImages].sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      )
    );

    // Switch to images tab
    setActiveTab("images");
  };

  // Handle chat message submission
  const handleSendMessage = async (
    content: string | { content: string; imageBase64s?: string[] },
    files?: File[]
  ) => {
    if (!apiKey) return;

    // Determine text and images for user message
    let textContent: string;
    let imageBase64s: string[] | undefined = undefined;

    if (typeof content === "string") {
      textContent = content;
    } else {
      textContent = content.content;
      imageBase64s = content.imageBase64s;
    }

    // Add message to state
    const messageId = `message-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Create image data URLs for preview if files are provided
    const imageDataUrls =
      files?.map((file) => URL.createObjectURL(file)) || imageBase64s || [];

    // Add user message
    const userMessage: ChatMessage = {
      id: messageId,
      role: "user",
      content,
      timestamp: Date.now(),
      files,
      imageDataUrls,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isProcessing: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setProcessingChat(true);

    // Process with Gemini
    try {
      recordRequest();

      const response = await runGeminiChat(
        files || [],
        textContent,
        apiKey,
        selectedModel
      );

      // Update assistant message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.ocrText || "I couldn't process your request.",
                isProcessing: false,
                hasError: response.hasError,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error in chat:", error);

      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Sorry, an error occurred while processing your request.",
                isProcessing: false,
                hasError: true,
              }
            : msg
        )
      );
    } finally {
      setProcessingChat(false);
    }
  };

  // Handle message editing
  const handleEditMessage = (id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              content,
            }
          : msg
      )
    );
  };

  // Handle image retry
  const handleRetry = async (imageData: ImageData) => {
    if (!apiKey) return;

    // Clean up old timestamps first
    cleanupOldTimestamps();

    if (!canProcessImage()) {
      // Queue the image for processing
      setImages((prev) =>
        prev
          .map((img) =>
            img.id === imageData.id
              ? { ...img, willProcess: true, isProcessing: false }
              : img
          )
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      );
      console.log(
        `Queued image ${imageData.file.name} for retry due to rate limits`
      );
      return;
    }

    await processImage(imageData);
  };

  // Copy all text to clipboard
  const copyAllToClipboard = () => {
    // Apply current filter when copying
    let imagesToCopy = images;

    if (selectedFilter === "completed") {
      imagesToCopy = images.filter(
        (img) => !img.isProcessing && !img.willProcess && !img.hasError
      );
    }

    if (imagesToCopy.length > 0) {
      const formattedText = imagesToCopy
        .sort((a, b) => {
          const numA = parseInt(a.file.name.split(".")[0], 10);
          const numB = parseInt(b.file.name.split(".")[0], 10);
          return numA - numB;
        })
        .map((img) => {
          return `${img.file.name}:\n${img.geminiResponse.ocrText}\n`;
        })
        .join("\n");

      navigator.clipboard.writeText(formattedText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  // Handle image deletion
  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Process images concurrently when slots are available
  useEffect(() => {
    const processQueuedImages = async () => {
      // Check if we can process more images
      if (!apiKey || !canProcessImage()) return;

      // Find out how many more images we can process concurrently
      const currentlyProcessing = processingImageIds.length;
      const slotsAvailable = Math.min(
        maxConcurrentRequests - currentlyProcessing, // Don't exceed max concurrent
        rpm - requestTimestamps.length, // Don't exceed RPM
        images.filter((img) => img.willProcess).length // Don't exceed number of queued images
      );

      if (slotsAvailable <= 0) return;

      // Get the next batch of images to process
      const imagesToProcess = images
        .filter((img) => img.willProcess && !img.isProcessing)
        .slice(0, slotsAvailable);

      if (imagesToProcess.length === 0) return;

      // Process each image concurrently
      await Promise.all(imagesToProcess.map((img) => processImage(img)));
    };

    // Use setTimeout to avoid render loops
    const timeoutId = setTimeout(() => {
      processQueuedImages();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    processingImageIds.length,
    images,
    apiKey,
    requestTimestamps.length,
    maxConcurrentRequests,
  ]);

  // Get filtered images based on selected filter
  const getFilteredImages = () => {
    switch (selectedFilter) {
      case "completed":
        return images.filter(
          (img) => !img.isProcessing && !img.willProcess && !img.hasError
        );
      case "processing":
        return images.filter((img) => img.isProcessing);
      case "queued":
        return images.filter((img) => img.willProcess);
      case "error":
        return images.filter((img) => img.hasError);
      case "all":
      default:
        return images;
    }
  };

  // Function to scroll to bottom
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // Add scroll event listener to show/hide button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled up more than 500px from bottom
      const scrolledFromBottom =
        document.documentElement.scrollHeight -
        document.documentElement.scrollTop -
        document.documentElement.clientHeight;

      setShowScrollButton(scrolledFromBottom > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add a function to scroll chat to bottom
  const scrollChatToBottom = () => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      });
    }
  };

  // Add effect to scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === "chat") {
      scrollChatToBottom();
    }
  }, [messages, activeTab]);

  // Handle tab change to scroll to bottom when switching to chat
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "chat") {
      // Wait for tab content to render before scrolling
      setTimeout(scrollChatToBottom, 50);
    }
  };

  if (isLoadingApiKey) {
    return (
      <Card className="container mx-auto px-4 py-8 flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </Card>
    );
  }

  return (
    <div className={cn("container mx-auto p-4")} ref={pageRef}>
      {/* Header with logo and settings button */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start justify-start gap-2 mb-2 bg-transparent w-full">
        <div className="flex flex-col xs:flex-row xs:items-center w-full">
          <h1 className="text-xl xs:text-2xl font-bold overflow-visible inline-flex items-center flex-wrap">
            <SparklesText
              className="text-2xl xs:text-3xl font-bold"
              text="Gemini"
            />
            <span className="ml-2 text-base xs:text-xl">AI Chat & OCR</span>
          </h1>

          <div className="mt-2 xs:mt-0 xs:ml-3 px-2 py-1 bg-primary/10 rounded-full text-xs font-medium inline-flex items-center animate-in fade-in slide-in-from-left-4 duration-300">
            <span className="text-primary">
              {requestTimestamps.length}/{rpm}
            </span>
            {countdown > 0 && (
              <span className="ml-1 text-amber-600 animate-pulse">
                ({countdown}s)
              </span>
            )}
          </div>
        </div>

        <Button
          variant={showSettings ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-1 h-8 transition-colors duration-200 mt-2 sm:mt-0 self-end sm:self-auto"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Settings</span>
        </Button>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <Card className="mb-4 p-4">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {/* API Key Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">API Key</h3>
                  {apiKey ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        API Key is set
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setApiKey(null)}
                        className="h-7 text-xs"
                      >
                        Remove API Key
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="apikey">Enter your Gemini API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="apikey"
                          value={inputApiKey}
                          onChange={(e) => setInputApiKey(e.target.value)}
                          placeholder="API Key"
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (inputApiKey.trim()) {
                              await saveDataToDB(API_KEY_NAME, inputApiKey);
                              setApiKey(inputApiKey);
                              setInputApiKey("");
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label
                    htmlFor="system-prompt"
                    className="text-sm font-medium"
                  >
                    System Prompt
                  </Label>
                  <div className="flex gap-2">
                    <textarea
                      id="system-prompt"
                      value={inputSystemPrompt}
                      onChange={(e) => setInputSystemPrompt(e.target.value)}
                      placeholder="Enter system prompt for Gemini"
                      className="flex-1 min-h-[100px] px-3 py-2 border rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      rows={4}
                    />
                    <Button onClick={saveSystemPrompt}>Save</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Card>
        )}
      </AnimatePresence>

      {/* Tabs Navigation at the top */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger
            value="images"
            className={cn(
              "flex items-center gap-1 transition-all duration-200 data-[state=active]:scale-105",
              activeTab === "images" ? "font-medium" : ""
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Images{" "}
            {images.length > 0 && (
              <span className="bg-primary/15 text-primary px-1.5 py-0.5 rounded-full text-xs ml-1">
                {images.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className={cn(
              "flex items-center gap-1 transition-all duration-200 data-[state=active]:scale-105",
              activeTab === "chat" ? "font-medium" : ""
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 flex flex-col">
          {/* Chat Tab Content */}
          <TabsContent value="chat" className="h-full">
            {!apiKey ? (
              <div className="flex flex-col items-center justify-center h-full rounded-md border">
                <div className="text-center p-6 max-w-md">
                  <h2 className="text-xl font-semibold mb-2">
                    No API Key Found
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Please set your Gemini API key in the settings to start
                    using the chat interface.
                  </p>
                  <Button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Open Settings
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full" ref={chatContainerRef}>
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onEditMessage={handleEditMessage}
                  apiKey={apiKey}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  isProcessing={processingChat}
                  handleFileUpload={handleFileUpload}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="h-full flex flex-col">
            {/* Images Tab Content */}
            <Card className="mb-3 animate-in fade-in-0 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium p-2">Upload Images</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 mr-2"
                  disabled={!apiKey || requestTimestamps.length >= rpm}
                  onClick={() => {
                    const fileInput = document.getElementById(
                      `file-upload-${id}`
                    );
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                >
                  <Upload className="h-3 w-3" />
                  Select Images
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-3 p-2">
                {/* Model selection for images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="image-model-select"
                      className="text-xs font-medium"
                    >
                      Model
                    </Label>
                    <Select
                      value={selectedModel}
                      onValueChange={handleModelChange}
                    >
                      <SelectTrigger
                        id="image-model-select"
                        className="h-8 text-xs"
                      >
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="gemini-2.0-flash-exp-image-generation">
                            gemini-2.0-flash-exp-image-generation
                          </SelectItem>
                          <SelectItem value="gemini-2.5-pro-exp-03-25">
                            gemini-2.5-pro-exp-03-25
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="image-rpm-input"
                      className="text-xs font-medium"
                    >
                      Requests Per Minute
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="image-rpm-input"
                        type="number"
                        min="1"
                        value={rpm}
                        onChange={handleRpmChange}
                        className="h-8 text-xs"
                      />
                      {countdown > 0 && (
                        <span className="text-xs text-amber-600 animate-pulse">
                          ({countdown}s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="concurrent-requests"
                      className="text-xs font-medium"
                    >
                      Concurrent Requests
                    </Label>
                    <Input
                      id="concurrent-requests"
                      type="number"
                      min="1"
                      max={rpm}
                      value={maxConcurrentRequests}
                      onChange={handleConcurrentChange}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden">
                <FileUpload
                  id={`file-upload-${id}`}
                  onChange={handleFileUpload}
                  disabled={!apiKey || requestTimestamps.length >= rpm}
                />
              </div>
            </Card>

            {/* Status filter buttons */}
            <div className="mb-3 p-3 rounded-md border flex flex-wrap gap-2 text-sm">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 flex items-center gap-1"
                onClick={() => setSelectedFilter("all")}
              >
                <Filter className="h-3 w-3" />
                <span className="font-medium">Total:</span>
                <span className="text-primary">{images.length}</span>
              </Button>

              <Button
                variant={selectedFilter === "completed" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 flex items-center gap-1"
                onClick={() => setSelectedFilter("completed")}
              >
                <span className="font-medium">Completed:</span>
                <span className="text-green-600">
                  {
                    images.filter(
                      (img) =>
                        !img.isProcessing && !img.willProcess && !img.hasError
                    ).length
                  }
                </span>
              </Button>

              <Button
                variant={
                  selectedFilter === "processing" ? "default" : "outline"
                }
                size="sm"
                className="h-8 px-3 flex items-center gap-1"
                onClick={() => setSelectedFilter("processing")}
              >
                <span className="font-medium">Processing:</span>
                <span className="text-blue-600">
                  {images.filter((img) => img.isProcessing).length}
                </span>
              </Button>

              <Button
                variant={selectedFilter === "queued" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 flex items-center gap-1"
                onClick={() => setSelectedFilter("queued")}
              >
                <span className="font-medium">Queued:</span>
                <span className="text-amber-600">
                  {images.filter((img) => img.willProcess).length}
                </span>
              </Button>

              <Button
                variant={selectedFilter === "error" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 flex items-center gap-1"
                onClick={() => setSelectedFilter("error")}
              >
                <span className="font-medium">Error:</span>
                <span className="text-red-600">
                  {images.filter((img) => img.hasError).length}
                </span>
              </Button>
            </div>

            <div className="flex-1 mb-2">
              <ImagesTab
                images={getFilteredImages()}
                handleRetry={handleRetry}
                copiedAll={copiedAll}
                copyAllToClipboard={copyAllToClipboard}
                handleDelete={handleDeleteImage}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          className="fixed bottom-5 right-5 rounded-full h-12 w-12 shadow-md hover:bg-primary/90 z-50 flex items-center justify-center"
          size="icon"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ExtractTextPage;
