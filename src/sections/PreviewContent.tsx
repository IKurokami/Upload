import React from "react";

interface PreviewContentProps {
  previewTab: string;
  extractedLinks: string[];
  htmlContent: string;
  lazyLoad: boolean;
}

const PreviewContent: React.FC<PreviewContentProps> = ({
  previewTab,
  extractedLinks,
  htmlContent,
  lazyLoad,
}) => {
  if (previewTab === "visual") {
    return extractedLinks.length > 0 ? (
      <div className="flex flex-col items-center">
        {extractedLinks.map((link, index) => (
          <img
            key={link}
            src={link}
            alt={`Image ${index + 1}`}
            className="max-w-full h-auto"
          />
        ))}
      </div>
    ) : (
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="prose dark:prose-invert max-w-none"
      />
    );
  } else {
    const codeToRender =
      extractedLinks.length > 0
        ? extractedLinks
            .map(
              (link) =>
                `<img src="${link}" alt="" ${lazyLoad ? 'loading="lazy"' : ""}>`
            )
            .join("\n")
        : htmlContent;
    return (
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
        <code className="text-sm font-mono">{codeToRender}</code>
      </pre>
    );
  }
};

export default PreviewContent;
