import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React, { useEffect, useRef } from "react";

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  albumName: string;
  onRename: () => void;
  setAlbumName: (name: string) => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  onClose,
  albumName,
  onRename,
  setAlbumName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Handle state changes carefully to prevent UI freezing
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure dialog is fully mounted before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Controlled handler for dialog close to prevent race conditions
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Use requestAnimationFrame to ensure UI updates first
      requestAnimationFrame(() => {
        onClose();
      });
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlbumName(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use requestAnimationFrame to ensure UI updates correctly
    requestAnimationFrame(onRename);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()} // Prevent outside interactions during transitions
        onEscapeKeyDown={(e) => {
          // Prevent default escape key behavior and use our handler
          e.preventDefault();
          handleOpenChange(false);
        }}
      >
        <DialogHeader>
          <DialogTitle>Rename Album</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={albumName}
              onChange={handleChange}
              placeholder="Enter new album name"
              name="albumName"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              tabIndex={0}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              tabIndex={0}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
