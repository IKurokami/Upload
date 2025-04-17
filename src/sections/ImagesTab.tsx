import React, { useState, useMemo, useRef } from "react";
import { ImageData } from "@/types/ImageData";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  Copy,
  RefreshCw,
  X,
  AlertCircle,
  ArrowUpDown,
  Eye,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImageModal from "@/sections/ImageModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useId } from "react";
import { useLongPress } from "@/hooks/useLongPress";
import { LongPressOverlay } from "@/components/common/LongPressOverlay";
import type { Action } from "@/components/common/LongPressOverlay";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImagesTabProps {
  images: ImageData[];
  handleRetry: (image: ImageData) => Promise<void>;
  copiedAll: boolean;
  copyAllToClipboard: () => void;
  handleDelete: (id: string) => void;
  handleDeleteAll?: () => void;
}

interface PositionData {
  top: number;
  left: number;
  width: number;
  height: number;
}

type SortOption = "default" | "name" | "timestamp" | "status";

const ImagesTab: React.FC<ImagesTabProps> = ({
  images,
  handleRetry,
  copiedAll,
  copyAllToClipboard,
  handleDelete,
  handleDeleteAll = () => {},
}) => {
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [copied, setCopied] = useState(false);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayRect, setOverlayRect] = useState<DOMRect | null>(null);
  const [overlayImage, setOverlayImage] = useState<ImageData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const id = useId();

  const handleImageClick = (
    image: ImageData,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    // Get the clicked element
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    // Calculate 70vh in pixels
    const viewportHeight = window.innerHeight;
    const calculatedHeight = viewportHeight * 0.8;

    // Store position data for animation
    setPositionData({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: calculatedHeight,
    });

    setActiveImage(image);
  };

  const copyToClipboard = () => {
    if (activeImage && activeImage.geminiResponse.ocrText) {
      navigator.clipboard.writeText(activeImage.geminiResponse.ocrText);
      setCopied(true);
      toast.success(`Copied text from ${activeImage.file.name}`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No text available to copy");
    }
  };

  // Reset position data when modal closes
  const handleCloseModal = () => {
    setActiveImage(null);
    setPositionData(null);
  };

  const handleLongPress = (img: ImageData, idx: number) => {
    const node = cardRefs.current[idx];
    if (node) {
      setOverlayRect(node.getBoundingClientRect());
      setOverlayImage(img);
      setOverlayOpen(true);
    }
  };

  const getActions = (img: ImageData): Action[] => {
    const actions: Action[] = [
      {
        label: "View",
        icon: <Eye className="w-4 h-4" />,
        onClick: () => {
          setActiveImage(img);
          setOverlayOpen(false);
        },
      },
    ];
    if (img.hasError) {
      actions.push({
        label: "Retry",
        icon: <RefreshCw className="w-4 h-4" />,
        onClick: () => handleRetry(img),
      });
    }
    actions.push({
      label: "Remove",
      icon: <X className="w-4 h-4" />,
      onClick: () => confirmDelete(img.id),
      destructive: true,
    });
    return actions;
  };

  // Natural sort function for filenames with numbers
  const naturalSort = (a: string, b: string) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  // Sort images based on selected option
  const sortedImages = useMemo(() => {
    const imagesCopy = [...images];

    switch (sortBy) {
      case "name":
        return imagesCopy.sort((a, b) => naturalSort(a.file.name, b.file.name));
      case "timestamp":
        return imagesCopy.sort((a, b) => {
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return b.timestamp - a.timestamp;
        });
      case "status":
        return imagesCopy.sort((a, b) => {
          const getStatusPriority = (img: ImageData): number => {
            if (!img.isProcessing && !img.willProcess && !img.hasError)
              return 1;
            if (img.isProcessing) return 2;
            if (img.willProcess) return 3;
            if (img.hasError) return 4;
            return 5;
          };
          return getStatusPriority(a) - getStatusPriority(b);
        });
      default:
        return imagesCopy;
    }
  }, [images, sortBy]);

  const confirmDelete = (id: string) => {
    setImageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (imageToDelete) {
      handleDelete(imageToDelete);
      setImageToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleConfirmDeleteAll = () => {
    handleDeleteAll();
    setDeleteAllDialogOpen(false);
  };

  if (images?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-2 text-muted-foreground/50" />
        <p>No images uploaded yet</p>
        <p className="text-xs mt-1 text-muted-foreground/70">
          Use the upload button to add images for text extraction
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col bg-background rounded-md border">
        <div className="p-3 border-b flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
          <h2 className="text-base font-medium mb-2 xs:mb-0">
            Processed Images ({images?.length})
          </h2>
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 w-full xs:w-auto">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="h-8 w-full xs:w-[140px]">
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="name">Filename</SelectItem>
                <SelectItem value="timestamp">Time added</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 w-full xs:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllToClipboard}
                disabled={!images.some((img) => !img.isProcessing && !img.hasError)}
                className={cn(
                  "flex items-center gap-1 h-7 text-xs transition-all duration-200 px-2 flex-1 xs:flex-initial",
                  copiedAll && "bg-primary text-primary-foreground"
                )}
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span className="hidden xs:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="hidden xs:inline">Copy All</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={confirmDeleteAll}
                className="flex items-center gap-1 h-7 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors px-2 flex-1 xs:flex-initial"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden xs:inline">Remove All</span>
              </Button>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedImages.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                id={id}
                handleImageClick={handleImageClick}
                handleRetry={handleRetry}
                handleDelete={confirmDelete}
                handleLongPress={handleLongPress}
                cardRefs={cardRefs}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Delete All */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Images</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {images?.length} images? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Long Press Overlay */}
      {overlayOpen && overlayImage && (
        <LongPressOverlay
          rect={overlayRect}
          actions={getActions(overlayImage)}
          onClose={() => setOverlayOpen(false)}
          renderHighlighted={() => (
            <div
              style={{
                width: overlayRect?.width,
                height: overlayRect?.height,
                borderRadius: 12,
                boxShadow: "0 0 0 4px rgba(0, 0, 0, 0.25)",
                border: "2px solid rgba(110, 152, 219, 0.41)6",
                background: "#fff",
                overflow: "hidden",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={overlayImage.url}
                alt={overlayImage.file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  fontSize: 12,
                  color: "#fff",
                  background: "rgba(0,0,0,0.5)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  zIndex: 1,
                }}
              >
                {overlayImage.file.name?.length > 15
                  ? `${overlayImage.file.name.substring(0, 15)}...`
                  : overlayImage.file.name}
              </span>
            </div>
          )}
        />
      )}

      {/* Image Modal */}
      <ImageModal
        active={activeImage}
        setActive={handleCloseModal}
        handleRetry={handleRetry}
        copied={copied}
        copyToClipboard={copyToClipboard}
        positionData={positionData}
        id={activeImage?.id || ""}
      />
    </>
  );
};

/**
 * ImageCard component to fix hooks-in-loop issue.
 */
function ImageCard({
  image,
  index,
  id,
  handleImageClick,
  handleRetry,
  handleDelete,
  handleLongPress,
  cardRefs,
}: {
  image: ImageData;
  index: number;
  id: string;
  handleImageClick: (
    image: ImageData,
    e: React.MouseEvent<HTMLDivElement>
  ) => void;
  handleRetry: (image: ImageData) => Promise<void>;
  handleDelete: (id: string) => void;
  handleLongPress: (img: ImageData, idx: number) => void;
  cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  const longPressProps = useLongPress({
    onLongPress: () => handleLongPress(image, index),
    delay: 500,
  });

  return (
    <div
      className="relative group rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in-0 zoom-in-95 cursor-pointer"
      style={{
        animationDelay: `${index * 30}ms`,
        touchAction: "manipulation",
      }}
      onClick={(e) => handleImageClick(image, e)}
      ref={(el) => {
        cardRefs.current[index] = el;
      }}
      {...longPressProps}
    >
      <motion.div
        layoutId={`card-${image.id}-${id}`}
        style={{ width: "100%", height: "100%" }}
      >
        <div className="relative aspect-square overflow-hidden">
          <div className="w-full h-full">
            <motion.div
              layoutId={`image-${image.id}-${id}`}
              style={{ width: "100%", height: "100%" }}
            >
              <img
                src={image.url}
                alt={image.file.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-2 bg-background border-t">
          <div className="text-sm font-medium truncate mb-1">
            <motion.div layoutId={`title-${image.id}-${id}`}>
              {image.file.name}
            </motion.div>
          </div>

          {image.isProcessing ? (
            <div className="flex items-center text-xs text-amber-500">
              <div className="animate-spin mr-1 h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />
              Processing...
            </div>
          ) : image.willProcess ? (
            <div className="text-xs text-muted-foreground">
              Queued for processing
            </div>
          ) : image.hasError ? (
            <div className="text-xs text-destructive mb-1">
              Error processing image
            </div>
          ) : (
            <div
              className="text-xs text-muted-foreground mb-1 overflow-x-auto break-words"
              style={{
                maxHeight: "4.5em",
                WebkitLineClamp: 3,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {image.geminiResponse.ocrText
                ? image.geminiResponse.ocrText
                : "No text extracted"}
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            {image.hasError ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry(image);
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            ) : (
              <span className="text-[10px] text-muted-foreground/70">
                {image.timestamp
                  ? new Date(image.timestamp).toLocaleTimeString()
                  : ""}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(image.id);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          {image.isProcessing && (
            <div className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              Processing
            </div>
          )}
          {image.willProcess && (
            <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              Queued
            </div>
          )}
          {image.hasError && (
            <div className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              Error
            </div>
          )}
          {!image.isProcessing && !image.willProcess && !image.hasError && (
            <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Complete
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ImagesTab;
