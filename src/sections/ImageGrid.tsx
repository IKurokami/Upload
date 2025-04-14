import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, RefreshCw, Clock, Eye } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageData } from "@/types/ImageData";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useLongPress } from "@/hooks/useLongPress";
import { LongPressOverlay } from "@/components/common/LongPressOverlay";

interface ImageGridProps {
  images: ImageData[];
  setActive: (image: ImageData | null) => void;
  handleRetry: (imageData: ImageData) => Promise<void>;
  copiedAll: boolean;
  copyAllToClipboard: () => void;
  id: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  setActive,
  handleRetry,
  copiedAll,
  copyAllToClipboard,
  id,
}) => {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleLongPress = (img: ImageData, idx: number) => {
    const node = cardRefs.current[idx];
    if (node) {
      setRect(node.getBoundingClientRect());
      setActiveImage(img);
      setOverlayOpen(true);
    }
  };

  const getActions = (img: ImageData) => {
    const actions = [
      {
        label: "View Gemini OCR",
        icon: <Eye className="w-4 h-4" />,
        onClick: () => setActive(img),
      },
    ];
    if (img.hasError) {
      actions.push({
        label: "Retry",
        icon: <RefreshCw className="w-4 h-4" />,
        onClick: () => handleRetry(img),
      });
    }
    // Optionally add Delete or other actions here
    return actions;
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Images</h2>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={copyAllToClipboard}
        >
          {copiedAll ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied All</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy All Answers</span>
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => {
          const longPressProps = useLongPress({
            onLongPress: () => handleLongPress(img, index),
            delay: 500,
          });
          return (
            <motion.div
              layoutId={`card-${img.id}-${id}`}
              key={img.id}
              transition={{ duration: 0.2 }}
            >
              <BlurFade key={img.id} delay={0.25 + index * 0.05} inView>
                <div
                  className="relative w-full h-full"
                  ref={el => { cardRefs.current[index] = el; }}
                  {...longPressProps}
                  style={{ touchAction: "manipulation" }}
                >
                  <img
                    src={img.url}
                    alt={`Uploaded image ${img.file.name}`}
                    className={`w-full h-full object-cover ${img.isProcessing || img.willProcess ? "blur-xs" : ""
                      }`}
                  />

                  {/* Processing overlay with TextShimmer */}
                  {img.isProcessing && (
                    <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 px-4 py-3 rounded">
                        <div className="animate-spin">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <TextShimmer text="Processing..." />
                      </div>
                    </div>
                  )}

                  {/* Waiting to be processed overlay with TextShimmer */}
                  {img.willProcess && !img.isProcessing && (
                    <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 px-4 py-3 rounded">
                        <Clock className="h-4 w-4" />
                        <TextShimmer text="In queue..." />
                      </div>
                    </div>
                  )}
                </div>
              </BlurFade>

              {/* Image name label */}
              <span className="absolute top-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                {index + 1}.{" "}
                {img.file.name.length > 15
                  ? `${img.file.name.substring(0, 15)}...`
                  : img.file.name}
              </span>

              {/* Error overlay or normal hover overlay - only show if not processing and not in queue */}
              {!img.isProcessing && !img.willProcess &&
                (img.hasError ? (
                  <div
                    className="absolute inset-0 bg-red-500 bg-opacity-10 flex items-center justify-center"
                    onClick={() => handleRetry(img)}
                  >
                    <div className="flex items-center gap-2 text-white bg-black bg-opacity-50 px-3 py-2 rounded">
                      <RefreshCw className="h-4 w-4" />
                      <span>Retry</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 bg-transparent group-hover:backdrop-blur-md transition-opacity duration-300 flex items-center justify-center"
                    onClick={() => setActive(img)}
                  >
                    <Label className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                      View Gemini OCR
                    </Label>
                  </div>
                ))}
            </motion.div>
          );
        })}
      </div>
      {overlayOpen && activeImage && (
        <LongPressOverlay
          rect={rect}
          actions={getActions(activeImage)}
          onClose={() => {
            setOverlayOpen(false);
            setActiveImage(null);
          }}
          renderHighlighted={() => (
            <div style={{
              width: rect?.width,
              height: rect?.height,
              borderRadius: 12,
              boxShadow: "0 0 0 4px rgba(59,130,246,0.25)",
              border: "2px solid #3b82f6",
              background: "#fff",
              overflow: "hidden",
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <img
                src={activeImage.url}
                alt={`Uploaded image ${activeImage.file.name}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
              <span style={{
                position: "absolute",
                top: 4,
                left: 4,
                fontSize: 12,
                color: "#fff",
                background: "rgba(0,0,0,0.5)",
                padding: "2px 6px",
                borderRadius: 4,
                zIndex: 1,
              }}>
                {activeImage.file.name.length > 15
                  ? `${activeImage.file.name.substring(0, 15)}...`
                  : activeImage.file.name}
              </span>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default ImageGrid;
