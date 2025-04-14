import React from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";

interface UploadFormProps {
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ 
  onUpload, 
  disabled = false, 
  className,
  id
}) => {
  return (
    <div className={cn("mb-8", className)}>
      <div className="w-full max-w-4xl mx-auto border border-dashed bg-background border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <FileUpload onChange={onUpload} id={id} disabled={disabled} />
      </div>
    </div>
  );
};

export default UploadForm;
