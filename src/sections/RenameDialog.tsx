import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React from "react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Album</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            placeholder="Enter new album name"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onRename}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
