import { MappingEntry, RelationshipEntry } from "@/types/translateTypes";

// Utility functions for entry validation and processing
export const validateAndProcessMappingEntry = (entry: Partial<MappingEntry>): MappingEntry | null => {
  if (!entry || typeof entry !== 'object') {
    console.warn('Invalid mapping entry:', entry);
    return null;
  }
  return {
    term: String(entry.term || ''),
    transcription: String(entry.transcription || ''),
    type: String(entry.type || ''),
    gender: String(entry.gender || ''),
    notes: String(entry.notes || '')
  };
};

export const validateAndProcessRelationshipEntry = (entry: Partial<RelationshipEntry>): RelationshipEntry | null => {
  if (!entry || typeof entry !== 'object') {
    console.warn('Invalid relationship entry:', entry);
    return null;
  }
  return {
    characterA: String(entry.characterA || ''),
    characterB: String(entry.characterB || ''),
    relationship: String(entry.relationship || ''),
    addressTermsAToB: String(entry.addressTermsAToB || ''),
    addressTermsBToA: String(entry.addressTermsBToA || ''),
    notes: String(entry.notes || '')
  };
};

export const processTableUpdate = <T extends MappingEntry | RelationshipEntry>(
  currentTable: T[],
  entries: Partial<T>[],
  validator: (entry: Partial<T>) => T | null,
  findExisting: (table: T[], entry: T) => number
): { newTable: T[], updatedCount: number, added: T[], updated: T[] } => {
  if (!Array.isArray(entries)) {
    console.error('Invalid entries format:', entries);
    return { newTable: currentTable, updatedCount: 0, added: [], updated: [] };
  }
  const newTable = [...currentTable];
  let updatedCount = 0;
  const added: T[] = [];
  const updated: T[] = [];
  entries.forEach((entry) => {
    const validEntry = validator(entry);
    if (validEntry) {
      const existingIndex = findExisting(newTable, validEntry);
      if (existingIndex >= 0) {
        newTable[existingIndex] = validEntry;
        updated.push(validEntry);
      } else {
        newTable.push(validEntry);
        added.push(validEntry);
      }
      updatedCount++;
    }
  });
  return { newTable, updatedCount, added, updated };
}; 