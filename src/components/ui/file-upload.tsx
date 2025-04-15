import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  id,
  disabled = false,
}: {
  onChange?: (files: File[]) => void;
  id?: string;
  disabled?: boolean;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    if (disabled) return;
    const remaining = 1000 - files.length;
    if (remaining <= 0) return;
    const filesToAdd = newFiles.slice(0, remaining);
    
    // Only display files temporarily before passing them to parent
    setFiles(filesToAdd);
    
    // Pass files to parent component
    if (onChange) {
      onChange(filesToAdd);
      
      // Clear files after a short delay to allow for animation
      setTimeout(() => {
        setFiles([]);
      }, 1000);
    }
  };

  // Clear the input after files are handled
  useEffect(() => {
    if (files.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [files]);

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
    disabled,
  });

  // Display the latest files instead of the first three
  const filesToDisplay = files.length > 3 ? files.slice(-2) : files;

  return (
    <div className={cn("w-full", disabled && "opacity-60 cursor-not-allowed")} {...getRootProps()}>
      <motion.div
        whileHover={disabled ? undefined : "animate"}
      >
        <input
          ref={fileInputRef}
          id={id || "file-upload-handle"}
          type="file"
          multiple
          disabled={disabled}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Upload file
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Drag or drop your files here or click to upload
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 && (
              <>
                {files.length > 3 && (
                  <motion.div
                    layoutId="file-upload-ellipsis"
                  >
                    ...
                  </motion.div>
                )}
                {filesToDisplay.map((file, idx) => (
                  <motion.div
                    key={"file" + (files.length - filesToDisplay.length + idx)}
                    layoutId={
                      idx === 0
                        ? "file-upload"
                        : "file-upload-" + (files.length - filesToDisplay.length + idx)
                    }
                  >
                    <div className="flex justify-between w-full items-center gap-4">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                      >
                        {file.name}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                      >
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                    </div>

                    <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                      >
                        {file.type}
                      </motion.p>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                      >
                        modified{" "}
                        {new Date(file.lastModified).toLocaleDateString()}
                      </motion.p>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Drop it
                    <ImageIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </motion.p>
                ) : (
                  <ImageIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${index % 2 === 0
                ? "bg-gray-50 dark:bg-neutral-950"
                : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
                }`}
            />
          );
        })
      )}
    </div>
  );
}