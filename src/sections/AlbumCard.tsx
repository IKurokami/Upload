import React, { useRef, useState } from "react";
import { MoreVertical, Trash2, Edit, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { SavedAlbum } from "@/types/SavedAlbum";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLongPress } from "@/hooks/useLongPress";
import { LongPressOverlay } from "@/components/common/LongPressOverlay";

interface AlbumCardProps {
  album: SavedAlbum;
  onRename: (albumId: number) => void;
  onDelete: (albumId: number) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onRename, onDelete }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();

  const handleLongPress = () => {
    if (cardRef.current) {
      setRect(cardRef.current.getBoundingClientRect());
      setOverlayOpen(true);
    }
  };

  const longPressProps = useLongPress({
    onLongPress: handleLongPress,
    delay: 500,
  });

  const actions = [
    {
      label: "View Album",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => navigate(`/albums/${album.id}`),
    },
    {
      label: "Rename",
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onRename(album.id!),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete(album.id!),
      destructive: true,
    },
  ];

  return (
    <>
      <div
        className="relative group h-full"
        ref={cardRef}
        {...longPressProps}
        style={{ touchAction: "manipulation" }}
      >
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col w-full overflow-hidden">
              <CardTitle
                className="text-lg truncate w-full"
                title={album.albumName}
              >
                {album.albumName}
              </CardTitle>
              <CardDescription>
                Created at: {new Date(album.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex-grow">
            <p className="text-sm flex items-center">
              <Badge variant="secondary" className="mr-1">
                {album.imageUrls?.length}
              </Badge>{" "}
              images
            </p>
          </CardContent>
          <CardFooter className="pt-2 flex justify-between items-center mt-auto">
            <Link to={`/albums/${album.id}`} className="flex-1 mr-2">
              <InteractiveHoverButton className="w-full">
                View Album
              </InteractiveHoverButton>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRename(album.id!)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(album.id!)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      </div>
      {overlayOpen && (
        <LongPressOverlay
          rect={rect}
          actions={actions}
          onClose={() => setOverlayOpen(false)}
          renderHighlighted={() => (
            <div
              style={{
                width: rect?.width,
                height: rect?.height,
                borderRadius: 12,
                boxShadow: "0 0 0 4px rgba(59,130,246,0.25)",
                border: "2px solid #3b82f6",
                background: "#fff",
                overflow: "hidden",
                pointerEvents: "auto",
              }}
            >
              <Card className="flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex flex-col w-full overflow-hidden">
                    <CardTitle
                      className="text-lg truncate w-full"
                      title={album.albumName}
                    >
                      {album.albumName}
                    </CardTitle>
                    <CardDescription>
                      Created at:{" "}
                      {new Date(album.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 flex-grow">
                  <p className="text-sm flex items-center">
                    <Badge variant="secondary" className="mr-1">
                      {album.imageUrls?.length}
                    </Badge>{" "}
                    images
                  </p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center mt-auto">
                  <Link to={`/albums/${album.id}`} className="flex-1 mr-2">
                    <InteractiveHoverButton className="w-full">
                      View Album
                    </InteractiveHoverButton>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRename(album.id!)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(album.id!)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            </div>
          )}
        />
      )}
    </>
  );
};

export default AlbumCard;
