// src/components/ImageModal.tsx

import React, { useRef, useEffect, useId } from "react";
import { Check, Copy, RefreshCw, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageData } from "@/types/ImageData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Position data for animation
interface PositionData {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ImageModalProps {
  active: ImageData | null;
  setActive: (image: ImageData | null) => void;
  handleRetry: (imageData: ImageData) => Promise<void>; // Add handleRetry
  copied: boolean;
  copyToClipboard: () => void;
  id: string;
  positionData: PositionData | null;
}

const ImageModal: React.FC<ImageModalProps> = ({
  active,
  setActive,
  handleRetry,
  copied,
  copyToClipboard,
  positionData,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  const handleClose = () => setActive(null);

  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setActive(null);
      }
    };
    if (active) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
      document.body.style.overflow = "auto"; // Restore scrolling
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto"; // Ensure scrolling is restored
    };
  }, [active, setActive]);

  // Close modal on Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setActive]);

  // Animation effect for the modal when it opens
  useEffect(() => {
    if (active && positionData && ref.current) {
      // First set initial position (from the clicked image)
      ref.current.style.position = "fixed";
      ref.current.style.top = `${positionData.top}px`;
      ref.current.style.left = `${positionData.left}px`;
      ref.current.style.width = `${positionData.width}px`;
      ref.current.style.height = `${positionData.height}px`;
      ref.current.style.borderRadius = "0.5rem";
      ref.current.style.zIndex = "50";
      ref.current.style.opacity = "1";
      ref.current.style.transformOrigin = "top left";

      // Force a reflow to ensure the initial state is rendered
      ref.current.getBoundingClientRect();

      // Then animate to final position
      ref.current.style.transition = "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
      ref.current.style.top = "50%";
      ref.current.style.left = "50%";
      ref.current.style.transform = "translate(-50%, -50%)";
      ref.current.style.width = "";
      ref.current.style.height = "";
      ref.current.style.maxWidth = "64rem";
      ref.current.style.maxHeight = "90vh";
      ref.current.style.borderRadius = "0.75rem";
    }
  }, [active, positionData]);

  if (!active) return null;

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </AnimatePresence>

      <AnimatePresence>
        <div className="fixed inset-0 flex items-center justify-center z-50 p-0 md:p-4">
          <div
            ref={ref}
            className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden flex flex-col w-auto max-w-4xl max-h-[90vh] sm:w-full"
          >
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              initial={{ opacity: positionData ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: "100%", height: "100%" }}
            >
              <div className="flex justify-between items-center p-2 md:p-4 border-b">
                <div className="font-semibold truncate">
                  <motion.div layoutId={`title-${active.id}-${id}`}>
                    {active.file.name}
                  </motion.div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden h-full min-h-0">
                <div className="relative flex-1 min-h-0 h-[35vh] md:h-[70vh] overflow-auto">
                  <div
                    className={`w-full h-auto object-contain ${active.isProcessing || active.willProcess
                      ? "blur-xs"
                      : ""
                      }`}
                  >
                    <motion.div
                      layoutId={`image-${active.id}-${id}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <img
                        src={active.url}
                        alt={`Uploaded image ${active.file.name}`}
                        style={{
                          width: "100%",
                          height: "auto",
                          objectFit: "contain",
                        }}
                      />
                    </motion.div>
                  </div>
                  {active.isProcessing && (
                    <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 px-4 py-3 rounded">
                        <div className="animate-spin">
                          <RefreshCw className="h-4 w-4 text-white" />
                        </div>
                        <TextShimmer text="Processing..." />
                      </div>
                    </div>
                  )}
                  {active.willProcess && !active.isProcessing && (
                    <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 px-4 py-3 rounded">
                        <Clock className="h-4 w-4" />
                        <TextShimmer text="In queue..." />
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative flex-1 min-h-0 h-[35vh] md:h-[70vh] overflow-auto p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-base md:text-lg">
                      Gemini OCR Result
                    </h4>
                    <div className="flex gap-2">
                      {!active.isProcessing &&
                        !active.willProcess &&
                        active.hasError && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleRetry(active)}
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry</span>
                          </Button>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={copyToClipboard}
                        disabled={active.isProcessing || active.willProcess}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <Tabs
                      defaultValue="ocr"
                      className="flex flex-col min-h-0 flex-1"
                    >
                      <TabsList className="mb-2">
                        <TabsTrigger value="ocr">Answer</TabsTrigger>
                        <TabsTrigger value="thinking">Image</TabsTrigger>
                      </TabsList>
                      <div className="flex-1 min-h-0">
                        <TabsContent
                          value="ocr"
                          className="flex flex-col h-full min-h-0"
                        >
                          <ScrollArea className="flex-1 min-h-0 border rounded-md p-2 md:p-3 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words break-all text-sm md:text-base font-mono">
                            {active.isProcessing
                              ? "Processing..."
                              : active.willProcess
                                ? "Waiting in queue..."
                                : active.geminiResponse.ocrText}
                          </ScrollArea>
                        </TabsContent>
                        <TabsContent
                          value="thinking"
                          className="flex flex-col h-full min-h-0"
                        >
                          <ScrollArea className="flex-1 min-h-0 border rounded-md p-2 md:p-3 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words break-all text-sm md:text-base font-mono">
                            {active.isProcessing
                              ? "Processing..."
                              : active.willProcess
                                ? "Waiting in queue..."
                                : active.geminiResponse.thinking}
                          </ScrollArea>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatePresence>
    </>,
    document.body
  );
};

export default ImageModal;
