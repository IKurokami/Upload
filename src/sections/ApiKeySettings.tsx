import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { getDataFromDB, saveDataToDB } from "../lib/db";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "../components/ui/alert-dialog";
import { toast } from "sonner";

const API_KEY_NAME = "apiKey";

interface ApiKeySettingsProps {
  apiKey: string | null;
  setApiKey: (apiKey: string | null) => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  apiKey,
  setApiKey,
}) => {
  const [inputApiKey, setInputApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Sync API key from DB on mount and when changed
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const storedKey = await getDataFromDB<string>(API_KEY_NAME);
        setApiKey(storedKey || null);
      } catch (e) {
        // ignore
      }
    };
    loadApiKey();
  }, [setApiKey]);

  const handleSaveApiKey = async () => {
    if (!inputApiKey.trim()) {
      toast.error("Please enter a valid API key.");
      return;
    }
    setLoading(true);
    try {
      await saveDataToDB(API_KEY_NAME, inputApiKey.trim());
      setApiKey(inputApiKey.trim());
      setInputApiKey("");
      toast.success("API key saved successfully.");

      window.dispatchEvent(new Event("apiKeyChanged"));
    } catch (e) {
      toast.error("Failed to save API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setRemoving(true);
    try {
      await saveDataToDB(API_KEY_NAME, "");
      setApiKey(null);
      toast.success("API key removed.");

      // Dispatch custom event to notify layout about API key removal
      window.dispatchEvent(new Event("apiKeyChanged"));
    } catch (e) {
      toast.error("Failed to remove API key.");
    } finally {
      setRemoving(false);
      setShowRemoveDialog(false);
    }
  };

  const handleCopy = async () => {
    if (apiKey) {
      try {
        await navigator.clipboard.writeText(apiKey);
        setCopied(true);
        toast.success("API key copied to clipboard.");
        setTimeout(() => setCopied(false), 1200);
      } catch {
        toast.error("Failed to copy API key.");
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-2">Gemini API Key</h2>
      <div className="mt-2 mb-4 text-sm text-gray-600">
        <span>
          Enter your <b>Gemini API Key</b> to enable advanced features like OCR and Translation.{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Get your API key
          </a>
          .
        </span>
      </div>
      {apiKey ? (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              readOnly
              className="flex-1"
              aria-label="API Key"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey((v) => !v)}
              aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
              tabIndex={0}
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy API Key"
              tabIndex={0}
              disabled={copied}
            >
              {copied ? (
                <span className="text-green-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                onClick={() => setShowRemoveDialog(true)}
                disabled={removing}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove API Key
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remove API Key?
                </AlertDialogTitle>
              </AlertDialogHeader>
              <div className="text-sm text-gray-600">
                Are you sure you want to remove your API key? This will disable OCR and Translation features.
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveApiKey}
                  disabled={removing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {removing ? "Removing..." : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4 mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveApiKey();
          }}
        >
          <Input
            type="text"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
            placeholder="Enter your Gemini API Key"
            aria-label="Enter your Gemini API Key"
            autoFocus
            required
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save API Key"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ApiKeySettings;
