import { FormValues } from './formTypes';
import { ImageViewConfig, CustomGalleryView } from './galleryTypes';
import { EditorState, EditorActions } from './editorTypes';
import { ToastOptions } from './toastTypes';

export interface MultiStepFormContextType {
  // Form values
  formValues: FormValues;

  // Toast
  addToast: (options: ToastOptions) => void;

  // Preview
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (open: boolean) => void;
  togglePreviewPanel: () => void;

  // Image/Gallery
  imageViewConfig: ImageViewConfig;
  setImageViewConfig: (config: ImageViewConfig) => void;
  customGalleryViews: CustomGalleryView[];
  addCustomGalleryView: (view: CustomGalleryView) => void;
  removeCustomGalleryView: (id: string) => void;
  clearCustomGalleryViews: () => void;
  updateCustomGalleryView: (
    id: string,
    updates: Partial<CustomGalleryView>
  ) => void;

  // Editor
  editorState: EditorState;
  updateEditorContainers: EditorActions['updateEditorContainers'];
  updateEditorParagraphs: EditorActions['updateEditorParagraphs'];
  updateEditorCompletedContent: EditorActions['updateEditorCompletedContent'];
  setEditorCompleted: EditorActions['setEditorCompleted'];
  resetEditorState: EditorActions['resetEditorState'];
}
