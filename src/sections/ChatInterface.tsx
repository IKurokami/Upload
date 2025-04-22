import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessageContent = string | { content: string; imageBase64s?: string[] };

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: MessageContent;
  imageDataUrls?: string[];
  isEditing?: boolean;
  isProcessing?: boolean;
  hasError?: boolean;
  originalContent?: MessageContent;
}

import {
  Send,
  Image as ImageIcon,
  X,
  Edit,
  Save,
  Loader2,
  Paperclip,
  Trash2,
  GripVertical,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, files?: File[]) => void;
  onEditMessage: (id: string, content: string) => void;
  apiKey: string | null;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isProcessing: boolean;
  handleFileUpload: (files: File[]) => void;
}

// We'll need to extend ChatMessage type to store original files
interface ExtendedChatMessage extends ChatMessage {
  originalFiles?: File[];
}

const MemoizedMarkdown = React.memo(({ content }: { content: string }) => {
  // Check if content actually has markdown formatting
  const hasMarkdown = /[*_~`#>|\[\]()]/.test(content);

  if (!hasMarkdown) {
    // If no markdown, just render as plain text for better performance
    return (
      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {content}
      </div>
    );
  }

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
});

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onEditMessage,
  apiKey,
  selectedModel,
  onModelChange,
  isProcessing,
  handleFileUpload,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedInputValue, setExpandedInputValue] = useState("");
  const [expandedSelectedModel, setExpandedSelectedModel] =
    useState(selectedModel);

  // When opening dialog, set expandedInputValue and expandedSelectedModel from current values
  useEffect(() => {
    if (isExpanded) {
      setExpandedInputValue(inputValue);
      setExpandedSelectedModel(selectedModel);
    }
    // eslint-disable-next-line
  }, [isExpanded, selectedModel]);

  // When closing dialog, update inputValue and selectedModel from expanded values
  const handleDialogSave = () => {
    setInputValue(expandedInputValue);
    onModelChange(expandedSelectedModel);
    setIsExpanded(false);
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles?.length === 0) return;

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // HTML5 Drag and Drop implementation
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Create new arrays
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];

    // Get the dragged item
    const draggedFile = newFiles[draggedIndex];
    const draggedPreview = newPreviews[draggedIndex];

    // Remove the dragged item
    newFiles.splice(draggedIndex, 1);
    newPreviews.splice(draggedIndex, 1);

    // Insert at the target position
    newFiles.splice(targetIndex, 0, draggedFile);
    newPreviews.splice(targetIndex, 0, draggedPreview);

    // Update state
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper to convert File to base64

  const handleSubmit = async () => {
    const trimmedValue = inputValue.trim();
    if ((!trimmedValue && selectedFiles?.length === 0) || !apiKey) return;

    if (selectedFiles?.length > 0) {
      // If there are images, convert to base64 and send as object
      onSendMessage(trimmedValue, [...selectedFiles]);
    } else {
      // If no images, send as plain string
      onSendMessage(trimmedValue);
    }

    setInputValue("");
    setSelectedFiles([]);
    setPreviewUrls([]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.key === "Enter" && !e.shiftKey) ||
      (e.key === "Enter" && e.ctrlKey)
    ) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    const imageItems = Array.from(items).filter((item) =>
      item.type.startsWith("image/")
    );

    if (imageItems?.length > 0) {
      const newFiles = imageItems.map((item) => item.getAsFile()!);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Handle message editing
  const handleEditSubmit = (message: ChatMessage) => {
    const textContent =
      typeof message.content === "string"
        ? message.content
        : message.content?.content || "";
    if (textContent.trim() === "") return;

    // Find the message in the messages array
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    if (messageIndex !== -1) {
      // Update message locally first to ensure UI is updated immediately
      const updatedMessages = [...messages];

      // Turn off edit mode
      updatedMessages[messageIndex].isEditing = false;

      // Send edited message to parent component
      onEditMessage(message.id, textContent);
    }
  };

  // Handle direct file upload to the images tab
  const handleDirectFileUpload = () => {
    if (fileInputRef.current?.files?.length) {
      const files = Array.from(fileInputRef.current.files);
      // Process directly for OCR
      handleFileUpload(files);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // When component unmounts or when files change, cleanup any URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Reset zoom level when closing the dialog
  const handleCloseImageDialog = () => {
    setExpandedImage(null);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Add zoom control functions
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 5));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  const resetZoom = () => setZoomLevel(1);

  // Add panning/scrolling functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoomLevel <= 1) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setImagePosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset position when zoom level changes
  useEffect(() => {
    if (zoomLevel <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Scroll to bottom when new messages arrive or when message content changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Additional effect to scroll to bottom when any message content changes
  useEffect(() => {
    // Check if we need to scroll based on message content changing
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-background rounded-md border relative transition-transform duration-200"
      style={{}}
    >
      {/* Messages area taking full height with bottom padding for the fixed input card */}
      <ScrollArea className="min-h-[70vh] p-4 pb-[140px]" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-in fade-in-0 slide-in-from-bottom-4 duration-300 ease-in-out",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "flex flex-col",
                  message.role === "user"
                    ? "items-end ml-auto"
                    : "items-start mr-auto",
                  "max-w-[85%] w-auto"
                )}
              >
                {message.role === "user" &&
                !message.isProcessing &&
                !message.isEditing ? (
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div>
                        <Card
                          className={cn(
                            "p-3 shadow-sm group hover:shadow-md transition-shadow duration-200",
                            message.role === "user" ? "bg-muted/5" : "bg-muted"
                          )}
                          style={{ wordBreak: "break-word", width: "100%" }}
                        >
                          {message.isEditing ? (
                            <div className="flex flex-col gap-2">
                              <Textarea
                                value={
                                  typeof message.content === "string"
                                    ? message.content
                                    : message.content?.content || ""
                                }
                                onChange={(e) => {
                                  // Update message content directly in the messages array
                                  const updatedMessages = [...messages];
                                  const messageIndex =
                                    updatedMessages.findIndex(
                                      (m) => m.id === message.id
                                    );
                                  if (messageIndex !== -1) {
                                    updatedMessages[messageIndex].content =
                                      e.target.value;
                                    // We're just updating the local state, not sending to the server yet
                                    onEditMessage(message.id, e.target.value);
                                  }
                                }}
                                className="min-h-[60px] bg-background/50"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Exit edit mode without saving
                                    const updatedMessages = [...messages];
                                    const messageIndex =
                                      updatedMessages.findIndex(
                                        (m) => m.id === message.id
                                      );
                                    if (messageIndex !== -1) {
                                      // Revert any changes and turn off edit mode
                                      if (message.originalContent) {
                                        // If we have original content, restore it
                                        updatedMessages[messageIndex].content =
                                          message.originalContent;
                                      }
                                      updatedMessages[messageIndex].isEditing =
                                        false;

                                      // Notify parent with original content to ensure consistency
                                      const orig =
                                        typeof message.originalContent ===
                                        "string"
                                          ? message.originalContent
                                          : (message.originalContent as any)
                                              ?.content || "";
                                      const fallback =
                                        typeof message.content === "string"
                                          ? message.content
                                          : message.content?.content || "";
                                      onEditMessage(
                                        message.id,
                                        orig || fallback
                                      );
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditSubmit(message)}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Message content with markdown support */}
                              <div className="prose prose-sm max-w-none break-words dark:prose-invert">
                                <MemoizedMarkdown
                                  content={
                                    typeof message.content === "string"
                                      ? message.content
                                      : message.content?.content || ""
                                  }
                                />
                              </div>

                              {/* Display images for user messages */}
                              {(message.imageDataUrls &&
                              message.imageDataUrls?.length > 0
                                ? message.imageDataUrls
                                : typeof message.content === "object" &&
                                  message.content?.imageBase64s) && (
                                <div className="mt-2 flex flex-wrap gap-2 max-w-full overflow-hidden">
                                  {(message.imageDataUrls &&
                                  message.imageDataUrls?.length > 0
                                    ? message.imageDataUrls
                                    : (typeof message.content === "object" &&
                                        message.content?.imageBase64s) ||
                                      []
                                  ).map((url: string, imgIndex: number) => (
                                    <div
                                      key={imgIndex}
                                      className="relative animate-in zoom-in-95 duration-200 max-w-[calc(100%-8px)]"
                                      style={{
                                        animationDelay: `${imgIndex * 100}ms`,
                                      }}
                                    >
                                      <img
                                        src={url}
                                        alt={`Uploaded ${imgIndex}`}
                                        className="max-w-full max-h-[150px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setExpandedImage(url)}
                                        style={{
                                          objectFit: "cover",
                                          aspectRatio: "4/3",
                                        }}
                                      />
                                      <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ZoomIn className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Loading indicator for processing */}
                              {message.isProcessing && (
                                <div className="flex items-center mt-2 text-sm animate-in fade-in-0 duration-200">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </div>
                              )}

                              {/* Error indicator */}
                              {message.hasError && (
                                <div className="text-destructive mt-2 text-sm animate-in fade-in-0 duration-200">
                                  Error processing message
                                </div>
                              )}
                            </>
                          )}
                        </Card>
                        {/* Icon-only buttons, visible below and outside the card */}
                        <div className="flex gap-2 mt-2 opacity-100 transition-opacity duration-200 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Edit"
                            onClick={async () => {
                              // Get text content
                              const textContent =
                                typeof message.content === "string"
                                  ? message.content
                                  : message.content?.content || "";

                              // Copy text to input field
                              setInputValue(textContent);

                              // Clear any existing selected files
                              previewUrls.forEach((url) =>
                                URL.revokeObjectURL(url)
                              );
                              setSelectedFiles([]);
                              setPreviewUrls([]);

                              // Process images if present
                              const imageUrls =
                                message.imageDataUrls &&
                                message.imageDataUrls?.length > 0
                                  ? message.imageDataUrls
                                  : typeof message.content === "object" &&
                                    message.content?.imageBase64s;

                              if (imageUrls && imageUrls?.length > 0) {
                                try {
                                  // Convert image URLs to Files and add to selectedFiles
                                  const files = await Promise.all(
                                    imageUrls.map(async (url, idx) => {
                                      const match = url.match(
                                        /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
                                      );
                                      const mime = match
                                        ? match[1]
                                        : "image/png";
                                      const res = await fetch(url);
                                      const blob = await res.blob();
                                      const ext = mime.split("/")[1] || "png";
                                      return new File(
                                        [blob],
                                        `edit-image-${idx}.${ext}`,
                                        { type: mime }
                                      );
                                    })
                                  );

                                  // Create preview URLs for the files
                                  const newPreviews = files.map((file) =>
                                    URL.createObjectURL(file)
                                  );

                                  // Set the files and previews
                                  setSelectedFiles(files);
                                  setPreviewUrls(newPreviews);
                                } catch (err) {
                                  console.error(
                                    "Failed to load images for editing:",
                                    err
                                  );
                                }
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Retry"
                            onClick={async () => {
                              const extMessage =
                                message as ExtendedChatMessage & {
                                  imageBase64s?: string[];
                                };
                              // Fix: Check for imageDataUrls first, which is where images are stored in the message
                              const imageUrls =
                                message.imageDataUrls &&
                                message.imageDataUrls?.length > 0
                                  ? message.imageDataUrls
                                  : extMessage.imageBase64s ||
                                    (typeof message.content === "object" &&
                                      message.content?.imageBase64s);
                              const textContent =
                                typeof message.content === "string"
                                  ? message.content
                                  : message.content?.content || "";
                              if (
                                extMessage.originalFiles &&
                                extMessage.originalFiles?.length > 0
                              ) {
                                onSendMessage(
                                  textContent,
                                  extMessage.originalFiles
                                );
                              } else if (imageUrls && imageUrls?.length > 0) {
                                try {
                                  const files = await Promise.all(
                                    imageUrls.map(
                                      async (url: string, idx: number) => {
                                        const match = url.match(
                                          /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
                                        );
                                        const mime = match
                                          ? match[1]
                                          : "image/png";
                                        const res = await fetch(url);
                                        const blob = await res.blob();
                                        const ext = mime.split("/")[1] || "png";
                                        return new File(
                                          [blob],
                                          `retried-image-${idx}.${ext}`,
                                          { type: mime }
                                        );
                                      }
                                    )
                                  );
                                  onSendMessage(textContent, files);
                                } catch (err) {
                                  alert(
                                    "Unable to retry image prompt: could not reconstruct image files from base64."
                                  );
                                }
                              } else {
                                onSendMessage(textContent);
                              }
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    {/* Context menu with icon + label, shown on right-click */}
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={async () => {
                          // Get text content
                          const textContent =
                            typeof message.content === "string"
                              ? message.content
                              : message.content?.content || "";

                          // Copy text to input field
                          setInputValue(textContent);

                          // Clear any existing selected files
                          previewUrls.forEach((url) =>
                            URL.revokeObjectURL(url)
                          );
                          setSelectedFiles([]);
                          setPreviewUrls([]);

                          // Process images if present
                          const imageUrls =
                            message.imageDataUrls &&
                            message.imageDataUrls?.length > 0
                              ? message.imageDataUrls
                              : typeof message.content === "object" &&
                                message.content?.imageBase64s;

                          if (imageUrls && imageUrls?.length > 0) {
                            try {
                              // Convert image URLs to Files and add to selectedFiles
                              const files = await Promise.all(
                                imageUrls.map(async (url, idx) => {
                                  const match = url.match(
                                    /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
                                  );
                                  const mime = match ? match[1] : "image/png";
                                  const res = await fetch(url);
                                  const blob = await res.blob();
                                  const ext = mime.split("/")[1] || "png";
                                  return new File(
                                    [blob],
                                    `edit-image-${idx}.${ext}`,
                                    { type: mime }
                                  );
                                })
                              );

                              // Create preview URLs for the files
                              const newPreviews = files.map((file) =>
                                URL.createObjectURL(file)
                              );

                              // Set the files and previews
                              setSelectedFiles(files);
                              setPreviewUrls(newPreviews);
                            } catch (err) {
                              console.error(
                                "Failed to load images for editing:",
                                err
                              );
                            }
                          }
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={async () => {
                          const extMessage = message as ExtendedChatMessage & {
                            imageBase64s?: string[];
                          };
                          // Fix: Check for imageDataUrls first, which is where images are stored in the message
                          const imageUrls =
                            message.imageDataUrls &&
                            message.imageDataUrls?.length > 0
                              ? message.imageDataUrls
                              : extMessage.imageBase64s ||
                                (typeof message.content === "object" &&
                                  message.content?.imageBase64s);
                          const textContent =
                            typeof message.content === "string"
                              ? message.content
                              : message.content?.content || "";
                          if (
                            extMessage.originalFiles &&
                            extMessage.originalFiles?.length > 0
                          ) {
                            onSendMessage(
                              textContent,
                              extMessage.originalFiles
                            );
                          } else if (imageUrls && imageUrls?.length > 0) {
                            try {
                              const files = await Promise.all(
                                imageUrls.map(
                                  async (url: string, idx: number) => {
                                    const match = url.match(
                                      /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
                                    );
                                    const mime = match ? match[1] : "image/png";
                                    const res = await fetch(url);
                                    const blob = await res.blob();
                                    const ext = mime.split("/")[1] || "png";
                                    return new File(
                                      [blob],
                                      `retried-image-${idx}.${ext}`,
                                      { type: mime }
                                    );
                                  }
                                )
                              );
                              onSendMessage(textContent, files);
                            } catch (err) {
                              alert(
                                "Unable to retry image prompt: could not reconstruct image files from base64."
                              );
                            }
                          } else {
                            onSendMessage(textContent);
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ) : (
                  <Card
                    className={cn(
                      "p-3 shadow-sm group hover:shadow-md transition-shadow duration-200",
                      message.role === "user" ? "bg-muted/5" : "bg-muted"
                    )}
                    style={{ wordBreak: "break-word", width: "100%" }}
                  >
                    {message.isEditing ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={
                            typeof message.content === "string"
                              ? message.content
                              : message.content?.content || ""
                          }
                          onChange={(e) => {
                            // Update message content directly in the messages array
                            const updatedMessages = [...messages];
                            const messageIndex = updatedMessages.findIndex(
                              (m) => m.id === message.id
                            );
                            if (messageIndex !== -1) {
                              updatedMessages[messageIndex].content =
                                e.target.value;
                              // We're just updating the local state, not sending to the server yet
                              onEditMessage(message.id, e.target.value);
                            }
                          }}
                          className="min-h-[60px] bg-background/50"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Exit edit mode without saving
                              const updatedMessages = [...messages];
                              const messageIndex = updatedMessages.findIndex(
                                (m) => m.id === message.id
                              );
                              if (messageIndex !== -1) {
                                // Revert any changes and turn off edit mode
                                if (message.originalContent) {
                                  // If we have original content, restore it
                                  updatedMessages[messageIndex].content =
                                    message.originalContent;
                                }
                                updatedMessages[messageIndex].isEditing = false;

                                // Notify parent with original content to ensure consistency
                                const orig =
                                  typeof message.originalContent === "string"
                                    ? message.originalContent
                                    : (message.originalContent as any)
                                        ?.content || "";
                                const fallback =
                                  typeof message.content === "string"
                                    ? message.content
                                    : message.content?.content || "";
                                onEditMessage(message.id, orig || fallback);
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditSubmit(message)}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Message content with markdown support */}
                        <div className="prose prose-sm max-w-none break-words dark:prose-invert">
                          <MemoizedMarkdown
                            content={
                              typeof message.content === "string"
                                ? message.content
                                : message.content?.content || ""
                            }
                          />
                        </div>

                        {/* Display images for user messages */}
                        {(message.imageDataUrls &&
                        message.imageDataUrls?.length > 0
                          ? message.imageDataUrls
                          : typeof message.content === "object" &&
                            message.content?.imageBase64s) && (
                          <div className="mt-2 flex flex-wrap gap-2 max-w-full overflow-hidden">
                            {(message.imageDataUrls &&
                            message.imageDataUrls?.length > 0
                              ? message.imageDataUrls
                              : (typeof message.content === "object" &&
                                  message.content?.imageBase64s) ||
                                []
                            ).map((url: string, imgIndex: number) => (
                              <div
                                key={imgIndex}
                                className="relative animate-in zoom-in-95 duration-200 max-w-[calc(100%-8px)]"
                                style={{
                                  animationDelay: `${imgIndex * 100}ms`,
                                }}
                              >
                                <img
                                  src={url}
                                  alt={`Uploaded ${imgIndex}`}
                                  className="max-w-full max-h-[150px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setExpandedImage(url)}
                                  style={{
                                    objectFit: "cover",
                                    aspectRatio: "4/3",
                                  }}
                                />
                                <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ZoomIn className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loading indicator for processing */}
                        {message.isProcessing && (
                          <div className="flex items-center mt-2 text-sm animate-in fade-in-0 duration-200">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </div>
                        )}

                        {/* Error indicator */}
                        {message.hasError && (
                          <div className="text-destructive mt-2 text-sm animate-in fade-in-0 duration-200">
                            Error processing message
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                )}
              </div>
            </div>
          ))}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Gradient overlay for better visual transition */}
      <div className="absolute bottom-[150px] left-0 right-0 h-[60px] bg-gradient-to-t from-background to-transparent pointer-events-none z-[5]"></div>

      {/* Input card - fixed position at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-auto max-h-[400px] flex flex-col overflow-hidden z-10 mb-4 px-4">
        <div className="relative rounded-[24px] p-2 mx-auto w-full max-w-5xl">
          <div className="absolute inset-0 -z-10 rounded-[24px] shadow-lg backdrop-blur-md bg-background/40 border"></div>
          <div className="flex flex-col gap-1.5">
            {/* Text input area */}
            <div className="flex">
              <div className="flex p-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!apiKey || isProcessing}
                  className="relative w-[36px] h-[36px] p-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={!apiKey || isProcessing}
                />
              </div>
              <div className="flex-1 flex items-center relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Type a message..."
                  className="w-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm overflow-y-auto bg-transparent px-2 py-3"
                  disabled={!apiKey || isProcessing}
                  style={{
                    opacity: !apiKey || isProcessing ? 0.6 : 1,
                    overflow: "auto",
                    overflowWrap: "break-word",
                    minHeight: "44px",
                    maxHeight: "200px",
                    transition: "height 0.1s ease-in-out",
                  }}
                />
                <button
                  type="button"
                  aria-label="Expand editor"
                  className="w-[24px] h-[24px] rounded-full bg-muted/30 hover:bg-muted/50 transition-colors justify-center flex items-center ml-1"
                  onClick={() => setIsExpanded(true)}
                  disabled={!apiKey || isProcessing}
                  tabIndex={-1}
                >
                  <Maximize2 className="h-4 w-4 text-primary" />
                </button>
              </div>
            </div>

            {/* File preview area */}
            {previewUrls?.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">
                    {previewUrls?.length} file
                    {previewUrls?.length !== 1 ? "s" : ""} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="h-7 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                </div>

                {/* Scrollable preview container */}
                <div className="mt-2 flex flex-wrap gap-2 overflow-auto max-h-[80px]">
                  {previewUrls.map((url, index) => (
                    <div
                      key={`preview-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={cn(
                        "relative group cursor-grab transition-transform duration-200",
                        draggedIndex === index && "opacity-50",
                        dragOverIndex === index && "scale-105"
                      )}
                    >
                      <div className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          className="w-16 h-16 rounded-md object-cover border cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedImage(url);
                          }}
                          style={{ objectFit: "cover", aspectRatio: "1/1" }}
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {/* Upload directly to Images tab */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.multiple = true;
                      fileInputRef.current.click();
                      fileInputRef.current.onchange = () =>
                        handleDirectFileUpload();
                    }
                  }}
                  disabled={!apiKey || isProcessing}
                  className="bg-muted/30 hover:bg-muted/50 border-muted/30 font-semibold px-3 py-2 h-9 rounded-full"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-[18px] w-[18px] sm:block hidden" />
                    <span className="truncate">Image</span>
                  </div>
                </Button>

                {/* Model selector */}
                <Select
                  value={selectedModel}
                  onValueChange={onModelChange}
                  disabled={!apiKey || isProcessing}
                >
                  <SelectTrigger className="h-9 text-sm font-semibold bg-muted/30 hover:bg-muted/50 border-muted/30 px-3 py-2 rounded-full">
                    <SelectValue placeholder="Model">
                      {selectedModel.includes("flash") ? "2.0" : "2.5"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[1100]">
                    <SelectItem value="gemini-2.0-flash-exp-image-generation">
                      2.0 Flash
                    </SelectItem>
                    <SelectItem value="gemini-2.5-pro-exp-03-25">
                      2.5 Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Send button */}
              <Button
                type="button"
                disabled={
                  (!inputValue.trim() && selectedFiles?.length === 0) ||
                  !apiKey ||
                  isProcessing
                }
                onClick={handleSubmit}
                className="w-[36px] h-[36px] p-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal - Using a completely separate DialogContent with a higher z-index overlay */}
      <Dialog
        open={!!expandedImage}
        onOpenChange={(open) => {
          if (!open) handleCloseImageDialog();
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/80 z-[2000] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-[2000] grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] p-0 sm:rounded-lg bg-background/95 backdrop-blur-xs border-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-75 data-[state=open]:zoom-in-95"
            style={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              width: "auto",
              transformOrigin: "center"
            }}
          >
            <DialogPrimitive.Close className="absolute right-3 top-3 z-10 rounded-full w-8 h-8 flex items-center justify-center bg-background/80 shadow-md opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <div
              ref={scrollContainerRef}
              className="relative flex items-center justify-center max-h-[85vh] min-h-[300px] overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                cursor: isDragging
                  ? "grabbing"
                  : zoomLevel > 1
                  ? "grab"
                  : "default",
              }}
            >
              {expandedImage && (
                <div
                  className="transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    position: "relative",
                    left: `${imagePosition.x}px`,
                    top: `${imagePosition.y}px`,
                  }}
                >
                  <img
                    src={expandedImage}
                    alt="Expanded view"
                    className="max-w-full max-h-[80vh] object-contain"
                    draggable={false}
                  />
                </div>
              )}

              {/* Help text for panning */}
              {zoomLevel > 1 && (
                <div className="absolute top-2 left-2 text-xs bg-background/70 p-1 px-2 rounded-md animate-in fade-in-0 duration-200">
                  {isDragging ? "Moving..." : "Click and drag to move"}
                </div>
              )}

              {/* Zoom controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-full shadow-md">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.1}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-14 text-xs"
                  onClick={resetZoom}
                >
                  {Math.round(zoomLevel * 100)}%
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Expanded Input Dialog */}
      <Dialog open={isExpanded} onOpenChange={(open) => setIsExpanded(open)}>
        <DialogContent
          className="sm:max-w-[95%] md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 sm:p-6 md:p-8 flex items-center justify-center w-full h-[90vh] max-h-[90vh]"
          style={
            {
              zIndex: 1000,
              "--hide-dialog-close": "none",
            } as React.CSSProperties
          }
        >
          <style>
            {`
              [data-dialog-close], .DialogClose, .dialog-close, .dialog__close {
                display: none !important;
              }
            `}
          </style>
          <div className="relative flex flex-col w-full h-full min-h-0 overflow-hidden">
            {/* File preview area in dialog */}
            {previewUrls?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    {previewUrls?.length} file
                    {previewUrls?.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 overflow-auto max-h-[80px]">
                  {previewUrls.map((url, index) => (
                    <div
                      key={`dialog-preview-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={cn(
                        "relative group cursor-grab transition-transform duration-200",
                        draggedIndex === index && "opacity-50",
                        dragOverIndex === index && "scale-105"
                      )}
                    >
                      <div className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          className="w-16 h-16 rounded-md object-cover border cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedImage(url);
                          }}
                          style={{ objectFit: "cover", aspectRatio: "1/1" }}
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs for Raw and Markdown */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <Tabs
                value={expandedInputValue === undefined ? "raw" : undefined}
                defaultValue="raw"
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
                onValueChange={() => {}}
              >
                <TabsList className="mb-2">
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  {previewUrls?.length > 0 && (
                    <TabsTrigger value="images">Images ({previewUrls.length})</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent
                  value="raw"
                  className="flex-1 min-h-0 overflow-hidden"
                >
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        e.preventDefault();
                        handleSubmit();
                        handleDialogSave();
                      }
                    }}
                    className="h-full min-h-0 max-h-full w-full text-sm sm:text-base md:text-lg font-mono resize-none overflow-auto p-3 sm:p-4"
                    autoFocus
                  />
                </TabsContent>
                <TabsContent
                  value="markdown"
                  className="flex-1 min-h-0 overflow-hidden"
                >
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <span className="animate-spin mr-2 inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></span>
                        <span className="text-muted-foreground">
                          Rendering preview…
                        </span>
                      </div>
                    }
                  >
                    <LazyMarkdownPreview inputValue={inputValue} />
                  </React.Suspense>
                </TabsContent>
                <TabsContent
                  value="images"
                  className="flex-1 min-h-0 overflow-auto"
                >
                  {previewUrls?.length > 0 ? (
                    <div className="p-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Drag images to reorder. Click an image to expand it.
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <div 
                            key={`gallery-${index}`} 
                            className={cn(
                              "relative group border rounded-md shadow-sm transition-all duration-200",
                              draggedIndex === index && "opacity-50 border-primary border-dashed",
                              dragOverIndex === index && "scale-[1.02] border-primary"
                            )}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                            <div className="absolute top-2 left-2 bg-black/60 rounded-md p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                              <GripVertical className="h-4 w-4 text-white" />
                            </div>
                            
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button 
                                variant="default" 
                                size="icon" 
                                className="h-8 w-8 rounded-full shadow-md bg-black/60 hover:bg-black/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedImage(url);
                                }}
                              >
                                <ZoomIn className="h-4 w-4 text-white" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-8 w-8 rounded-full shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(index);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <img 
                              src={url}
                              alt={`Image ${index + 1}`}
                              className="w-full h-auto rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setExpandedImage(url)}
                            />
                            
                            <div className="bg-background/95 backdrop-blur-[2px] p-2 text-xs flex justify-between items-center">
                              <span>Image {index + 1}</span>
                              <div className="flex items-center gap-1">
                                <button 
                                  className="p-1 rounded-md hover:bg-muted transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Move image left if not first
                                    if (index > 0) {
                                      const newFiles = [...selectedFiles];
                                      const newPreviews = [...previewUrls];
                                      
                                      // Swap with previous
                                      [newFiles[index], newFiles[index-1]] = [newFiles[index-1], newFiles[index]];
                                      [newPreviews[index], newPreviews[index-1]] = [newPreviews[index-1], newPreviews[index]];
                                      
                                      setSelectedFiles(newFiles);
                                      setPreviewUrls(newPreviews);
                                    }
                                  }}
                                  disabled={index === 0}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={index === 0 ? "opacity-30" : ""}>
                                    <path d="m15 18-6-6 6-6" />
                                  </svg>
                                </button>
                                <button 
                                  className="p-1 rounded-md hover:bg-muted transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Move image right if not last
                                    if (index < previewUrls.length - 1) {
                                      const newFiles = [...selectedFiles];
                                      const newPreviews = [...previewUrls];
                                      
                                      // Swap with next
                                      [newFiles[index], newFiles[index+1]] = [newFiles[index+1], newFiles[index]];
                                      [newPreviews[index], newPreviews[index+1]] = [newPreviews[index+1], newPreviews[index]];
                                      
                                      setSelectedFiles(newFiles);
                                      setPreviewUrls(newPreviews);
                                    }
                                  }}
                                  disabled={index === previewUrls.length - 1}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={index === previewUrls.length - 1 ? "opacity-30" : ""}>
                                    <path d="m9 18 6-6-6-6" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No images attached</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => dialogFileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Add Images
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Controls moved to bottom */}
            <div className="mt-4 border-t pt-4 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Model selector */}
                <Select
                  value={expandedSelectedModel}
                  onValueChange={(value) => {
                    setExpandedSelectedModel(value);
                    onModelChange(value);
                  }}
                  disabled={!apiKey || isProcessing}
                >
                  {/* File upload */}
                  <div className="flex items-center">
                    <input
                      ref={dialogFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={!apiKey || isProcessing}
                    />
                    <Button
                      type="button"
                      onClick={() => dialogFileInputRef.current?.click()}
                      className="h-9 px-3 rounded-full text-xs sm:text-sm"
                      disabled={!apiKey || isProcessing}
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Add Image</span>
                      <span className="inline sm:hidden">Image</span>
                    </Button>
                  </div>

                  <SelectTrigger className="h-9 text-sm font-semibold px-3 py-2 rounded-full min-w-[120px]">
                    <SelectValue placeholder="Model">
                      {expandedSelectedModel.includes("flash") ? "2.0" : "2.5"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[1100]">
                    <SelectItem value="gemini-2.0-flash-exp-image-generation">
                      2.0 Flash
                    </SelectItem>
                    <SelectItem value="gemini-2.5-pro-exp-03-25">
                      2.5 Pro
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear files button shown only when files are present */}
                {selectedFiles?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="h-7 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Clear all</span>
                    <span className="inline sm:hidden">Clear</span>
                  </Button>
                )}
              </div>

              {/* Send button */}
              <Button
                type="button"
                onClick={async () => {
                  await handleSubmit();
                  handleDialogSave();
                }}
                className="h-9 px-5 rounded-full bg-primary text-primary-foreground font-semibold z-10 shadow-lg flex items-center"
                disabled={
                  (!inputValue.trim() && selectedFiles?.length === 0) ||
                  !apiKey ||
                  isProcessing
                }
              >
                <Send className="h-5 w-5 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LazyMarkdownPreview = React.lazy(() =>
  Promise.resolve({
    default: React.memo(({ inputValue }: { inputValue: string }) => {
      // Check if content actually has markdown formatting
      const hasMarkdown = /[*_~`#>|\[\]()]/.test(inputValue);

      return (
        <div className="h-full min-h-[40vh] max-h-[70vh] w-full overflow-auto bg-background border rounded-md p-2 sm:p-4 prose prose-sm sm:prose-base md:prose-lg dark:prose-invert">
          {hasMarkdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {inputValue}
            </ReactMarkdown>
          ) : (
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {inputValue}
            </div>
          )}
        </div>
      );
    }),
  })
);

export default ChatInterface;
