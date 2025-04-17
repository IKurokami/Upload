import React from "react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { ListChecks } from "lucide-react";
interface ImageDetectionAlertProps {
  extractedLinks: string[];
}
const ImageDetectionAlert: React.FC<ImageDetectionAlertProps> = ({
  extractedLinks,
}) => {
  return (
    extractedLinks?.length > 0 && (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400">
        <AlertTitle className="flex items-center gap-2">
          <ListChecks className="text-green-600 dark:text-green-300" />
          Image Detection
        </AlertTitle>
        <AlertDescription>
          Detected {extractedLinks?.length} image link(s). Only the image URLs
          will be processed.
        </AlertDescription>
      </Alert>
    )
  );
};
export default ImageDetectionAlert;
