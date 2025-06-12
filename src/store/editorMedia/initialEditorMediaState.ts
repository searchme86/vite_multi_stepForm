export interface MediaData {
  id: string;
  paragraphId: string;
  base64Data: string;
  metadata: {
    filename: string;
    size: number;
    type: string;
    uploadedAt: Date;
  };
}

export interface EditorMediaState {
  imageCache: Map<string, string>;
  uploadingImages: string[];
  failedImages: string[];
}

export const initialEditorMediaState: EditorMediaState = {
  imageCache: new Map(),
  uploadingImages: [],
  failedImages: [],
};
