// src/components/HtmlEditor.tsx
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface HtmlEditorProps {
  htmlContent: string;
  setHtmlContent: (content: string) => void;
  lazyLoad: boolean;
  setLazyLoad: (lazy: boolean) => void;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({
  htmlContent,
  setHtmlContent,
  lazyLoad,
  setLazyLoad,
}) => {
  return (
    <>
      <Textarea
        className="min-h-[150px] font-mono text-sm"
        value={htmlContent}
        onChange={(e) => setHtmlContent(e.target.value)}
        placeholder="Paste your HTML or image links here..."
      />
      <div className="flex items-center space-x-2 my-4">
        <Checkbox
          id="lazy-load"
          checked={lazyLoad}
          onCheckedChange={(checked) => setLazyLoad(!!checked)}
        />
        <Label htmlFor="lazy-load">Enable Lazy Loading for Images</Label>
      </div>
      <Separator className="my-4" />
    </>
  );
};

export default HtmlEditor;
