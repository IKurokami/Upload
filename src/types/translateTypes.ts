// Shared types for translation page and components
export interface MappingEntry {
  term?: string;
  transcription?: string;
  type?: string;
  gender?: string;
  notes?: string;
}

export interface RelationshipEntry {
  characterA?: string;
  characterB?: string;
  relationship?: string;
  addressTermsAToB?: string;
  addressTermsBToA?: string;
  notes?: string;
}

export interface TranslationHistoryEntry {
  id: string;
  timestamp: number;
  inputText: string;
  translatedText: string;
  model: string;
  collectionId: string;
  collectionName: string;
}

export interface TableUpdateEntry {
  id: string;
  timestamp: number;
  type: 'mapping' | 'relationships';
  updates: {
    added: (MappingEntry | RelationshipEntry)[];
    updated: (MappingEntry | RelationshipEntry)[];
  };
  status: 'pending' | 'approved' | 'rejected';
}

export interface Collection {
  id: string;
  name: string;
  mappingTable: MappingEntry[];
  relationshipsTable: RelationshipEntry[];
  tableUpdateHistory: TableUpdateEntry[];
} 