import { SavedAlbum } from "@/types/SavedAlbum";

// Constants for database configuration
export const DB_CONFIG = {
  editor: {
    name: "htmlEditorDB",
    version: 1,
    stores: {
      htmlFiles: {
        keyPath: "id",
        autoIncrement: true,
      },
    },
  },
  ocr: {
    name: "ocrTool",
    version: 1,
    stores: {
      config: {
        keyPath: null,
        autoIncrement: false,
      },
    },
  },
};

/**
 * Opens an IndexedDB database connection
 * @param dbName - The name of the database to open
 * @param version - The version of the database to open
 * @param setupStores - Callback to set up object stores during upgradeneeded event
 * @returns A promise that resolves to the database connection
 */
export const openDatabase = (
  dbName: string,
  version: number,
  setupStores: (db: IDBDatabase) => void
): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      setupStores(db);
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Opens the HTML Editor database
 */
export const openEditorDB = (): Promise<IDBDatabase> => {
  return openDatabase(DB_CONFIG.editor.name, DB_CONFIG.editor.version, (db) => {
    if (!db.objectStoreNames.contains("htmlFiles")) {
      db.createObjectStore("htmlFiles", DB_CONFIG.editor.stores.htmlFiles);
    }
  });
};

/**
 * Opens the OCR Tool database
 */
export const openOcrDB = (): Promise<IDBDatabase> => {
  return openDatabase(DB_CONFIG.ocr.name, DB_CONFIG.ocr.version, (db) => {
    if (!db.objectStoreNames.contains("config")) {
      db.createObjectStore("config");
    }
  });
};

/**
 * Initializes the HTML Editor database and loads saved files
 * @param loadSavedFilesCallback - Callback to handle loaded files
 */
export const initDB = async (
  loadSavedFilesCallback: (files: SavedAlbum[]) => void
): Promise<void> => {
  try {
    const db = await openEditorDB();
    loadSavedFiles(db, loadSavedFilesCallback);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    loadSavedFilesCallback([]);
  }
};

/**
 * Loads saved files from the database
 * @param db - The database connection
 * @param callback - Callback to handle loaded files
 */
export const loadSavedFiles = (
  db: IDBDatabase,
  callback: (files: SavedAlbum[]) => void
): void => {
  const transaction = db.transaction(["htmlFiles"], "readonly");
  const store = transaction.objectStore("htmlFiles");
  const request = store.getAll();

  request.onsuccess = () => {
    callback(request.result);
  };

  request.onerror = () => {
    console.error("Failed to load files from IndexedDB:", request.error);
    callback([]);
  };
};

/**
 * Uploads an album to IndexedDB
 * @param albumName - The name of the album
 * @param chapterNumber - The chapter number for the album
 * @param namingMethod - The method to use for naming the album
 * @param extractedLinks - The links to images in the album
 * @param setSaving - Callback to handle saving state
 * @param setSaveMessage - Callback to handle save messages
 * @param setSavedFiles - Callback to handle saved files
 */
export const uploadToIndexedDB = async (
  albumName: string,
  chapterNumber: string,
  namingMethod: string,
  fileName: string,
  extractedLinks: string[],
  setSaving: (saving: boolean) => void,
  setSaveMessage: (
    message: { type: "success" | "error"; text: string } | null
  ) => void,
  setSavedFiles: (files: SavedAlbum[]) => void
): Promise<void> => {
  setSaving(true);

  try {
    const db = await openEditorDB();
    const transaction = db.transaction(["htmlFiles"], "readwrite");
    const store = transaction.objectStore("htmlFiles");

    const albumNameToSave =
      namingMethod === "chapter" ? `${chapterNumber} - ${albumName}` : fileName;

    // Check if album already exists
    const existingAlbums = await new Promise<SavedAlbum[]>(
      (resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    if (existingAlbums.some((album) => album.albumName === albumNameToSave)) {
      setSaving(false);
      setSaveMessage({
        type: "error",
        text: "Album name already exists. Please choose a different name.",
      });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    // Create new album entry
    const entry: SavedAlbum = {
      albumName: albumNameToSave,
      imageUrls: extractedLinks,
      createdAt: new Date().toISOString(),
    };

    // Add the new album
    const addRequest = store.add(entry);

    addRequest.onsuccess = () => {
      setSaving(false);
      setSaveMessage({
        type: "success",
        text: "Album saved successfully!",
      });
      loadSavedFiles(db, setSavedFiles);
      setTimeout(() => setSaveMessage(null), 3000);
    };

    addRequest.onerror = () => {
      setSaving(false);
      setSaveMessage({ type: "error", text: "Failed to save album." });
      setTimeout(() => setSaveMessage(null), 3000);
    };
  } catch (error) {
    console.error("IndexedDB operation failed:", error);
    setSaving(false);
    setSaveMessage({ type: "error", text: "IndexedDB operation failed." });
    setTimeout(() => setSaveMessage(null), 3000);
  }
};

/**
 * Retrieves data from the OCR Tool database
 * @param keyName - The key to retrieve
 * @returns The retrieved data
 */
export const getDataFromDB = async <T>(keyName: string): Promise<T | null> => {
  try {
    const db = await openOcrDB();
    const transaction = db.transaction(["config"], "readonly");
    const store = transaction.objectStore("config");
    const request = store.get(keyName);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T | null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get data from IndexedDB:", error);
    return null;
  }
};

/**
 * Saves data to the OCR Tool database
 * @param keyName - The key to save
 * @param data - The data to save
 */
export const saveDataToDB = async <T>(
  keyName: string,
  data: T
): Promise<void> => {
  try {
    const db = await openOcrDB();
    const transaction = db.transaction(["config"], "readwrite");
    const store = transaction.objectStore("config");
    const request = store.put(data, keyName);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save data to IndexedDB:", error);
    throw error;
  }
};

/**
 * Deletes an album from the HTML Editor database
 * @param albumId - The ID of the album to delete
 */
export const deleteAlbumFromDB = async (albumId: number): Promise<void> => {
  try {
    const db = await openEditorDB();
    const transaction = db.transaction(["htmlFiles"], "readwrite");
    const store = transaction.objectStore("htmlFiles");
    const request = store.delete(albumId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete album from IndexedDB:", error);
    throw error;
  }
};

/**
 * Renames an album in the HTML Editor database
 * @param albumId - The ID of the album to rename
 * @param newName - The new name for the album
 */
export const renameAlbumInDB = async (
  albumId: number,
  newName: string
): Promise<void> => {
  try {
    const db = await openEditorDB();
    const transaction = db.transaction(["htmlFiles"], "readwrite");
    const store = transaction.objectStore("htmlFiles");

    // Get the album
    const albumToUpdate = await new Promise<SavedAlbum | undefined>(
      (resolve, reject) => {
        const request = store.get(albumId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    if (!albumToUpdate) {
      throw new Error("Album not found");
    }

    // Update the album name
    albumToUpdate.albumName = newName;

    // Save the updated album using a simpler promise approach
    return new Promise((resolve, reject) => {
      const putRequest = store.put(albumToUpdate);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (error) {
    console.error("Failed to rename album in IndexedDB:", error);
    throw error;
  }
};

/**
 * Generates an HTML file for a collection of images
 * @param extractedLinks - The links to images
 * @param htmlContent - The HTML content (used if no links are provided)
 * @param lazyLoad - Whether to use lazy loading for images
 * @param fileName - The name of the file to generate
 */
export const generateHtmlFile = (
  extractedLinks: string[],
  htmlContent: string,
  lazyLoad: boolean,
  fileName: string
): void => {
  const linksHtml =
    extractedLinks?.length > 0
      ? extractedLinks
        .map(
          (link) =>
            `<img src="${link}" alt="" ${lazyLoad ? 'loading="lazy"' : ""}>`
        )
        .join("\n")
      : htmlContent;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
  <style>
    body { background: #f2f2f2; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    img { max-width: 100%; height: auto; object-fit: contain; object-position: top center;}
  </style>
</head>
<body class="container">
  ${linksHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};
