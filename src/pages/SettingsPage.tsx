import React, { useState } from "react";
import ApiKeySettings from "@/sections/ApiKeySettings";

const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <ApiKeySettings apiKey={apiKey} setApiKey={setApiKey} />
    </div>
  );
};

export default SettingsPage;
