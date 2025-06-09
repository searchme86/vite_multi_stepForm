// 📁 hooks/useEditorEvents.ts

import { useCallback } from 'react';
import { validateImageFiles } from '../utils/validation';

interface UseEditorEventsProps {
  handleImageUpload: (files: File[]) => Promise<string[]>;
}

export const useEditorEvents = ({
  handleImageUpload,
}: UseEditorEventsProps) => {
  console.log('🎮 [HOOK] useEditorEvents 초기화');

  const handleDrop = useCallback(
    (view: any, event: DragEvent, _slice: any, moved: boolean) => {
      console.log('🎮 [EVENTS] handleDrop 이벤트 발생:', {
        moved,
        hasFiles: !!event.dataTransfer?.files?.length,
      });

      if (
        !moved &&
        event.dataTransfer &&
        event.dataTransfer.files &&
        event.dataTransfer.files[0]
      ) {
        const files = Array.from(event.dataTransfer.files);
        console.log('🎮 [EVENTS] 드롭된 파일들:', { fileCount: files.length });

        const { validFiles, errors } = validateImageFiles(files);

        if (validFiles.length > 0) {
          console.log('🎮 [EVENTS] 유효한 이미지 파일 드롭:', {
            validCount: validFiles.length,
          });
          event.preventDefault();

          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          const dropPos = coordinates
            ? coordinates.pos
            : view.state.selection.from;
          console.log('🎮 [EVENTS] 드롭 위치 계산:', {
            dropPos,
            hasCoordinates: !!coordinates,
          });

          handleImageUpload(validFiles)
            .then((urls) => {
              console.log('🎮 [EVENTS] 이미지 업로드 완료, 에디터에 삽입:', {
                urlCount: urls.length,
              });

              if (urls.length > 0 && view.state) {
                urls.forEach((url, index) => {
                  if (url) {
                    const node = view.state.schema.nodes.image.create({
                      src: url,
                      alt: validFiles[index]?.name || 'Uploaded image',
                      title: validFiles[index]?.name || 'Uploaded image',
                    });

                    const transaction = view.state.tr.insert(
                      dropPos + index,
                      node
                    );
                    view.dispatch(transaction);

                    console.log('🎮 [EVENTS] 이미지 노드 삽입 완료:', {
                      index,
                      fileName: validFiles[index]?.name,
                      position: dropPos + index,
                    });
                  }
                });
              }
            })
            .catch((error) => {
              console.error('❌ [EVENTS] 이미지 업로드 실패:', error);
            });

          return true;
        } else if (errors.length > 0) {
          console.log('⚠️ [EVENTS] 드롭된 파일 검증 실패:', errors);
        }
      }

      console.log('🎮 [EVENTS] 드롭 이벤트 처리하지 않음');
      return false;
    },
    [handleImageUpload]
  );

  const handlePaste = useCallback(
    (view: any, event: ClipboardEvent, _slice: any) => {
      console.log('🎮 [EVENTS] handlePaste 이벤트 발생');

      const items = Array.from(event.clipboardData?.items || []);
      const imageItems = items.filter((item) => item.type.startsWith('image/'));

      console.log('🎮 [EVENTS] 클립보드 아이템 분석:', {
        totalItems: items.length,
        imageItems: imageItems.length,
        itemTypes: items.map((item) => item.type),
      });

      if (imageItems.length > 0) {
        console.log('🎮 [EVENTS] 클립보드에서 이미지 발견:', {
          imageCount: imageItems.length,
        });
        event.preventDefault();

        const files = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null);

        console.log('🎮 [EVENTS] 클립보드 파일 변환 완료:', {
          fileCount: files.length,
        });

        const { validFiles, errors } = validateImageFiles(files);

        if (validFiles.length > 0) {
          console.log('🎮 [EVENTS] 유효한 클립보드 이미지:', {
            validCount: validFiles.length,
          });

          handleImageUpload(validFiles)
            .then((urls) => {
              console.log('🎮 [EVENTS] 클립보드 이미지 업로드 완료:', {
                urlCount: urls.length,
              });

              if (urls.length > 0 && view.state) {
                const { state } = view;
                const { selection } = state;
                const position = selection.from;

                console.log('🎮 [EVENTS] 클립보드 이미지 삽입 위치:', position);

                urls.forEach((url, index) => {
                  if (url) {
                    const node = state.schema.nodes.image.create({
                      src: url,
                      alt: `붙여넣은_이미지_${Date.now()}_${index}.png`,
                      title: `붙여넣은_이미지_${Date.now()}_${index}.png`,
                    });
                    const transaction = state.tr.insert(position + index, node);
                    view.dispatch(transaction);

                    console.log('🎮 [EVENTS] 클립보드 이미지 노드 삽입 완료:', {
                      index,
                      position: position + index,
                    });
                  }
                });
              }
            })
            .catch((error) => {
              console.error('❌ [EVENTS] 클립보드 이미지 업로드 실패:', error);
            });
        } else if (errors.length > 0) {
          console.log('⚠️ [EVENTS] 클립보드 이미지 검증 실패:', errors);
        }

        return true;
      }

      console.log('🎮 [EVENTS] 페이스트 이벤트 처리하지 않음');
      return false;
    },
    [handleImageUpload]
  );

  const createEditorProps = useCallback(() => {
    console.log('🎮 [EVENTS] 에디터 props 생성');

    return {
      handleDrop,
      handlePaste,
      attributes: {
        class:
          'tiptap-editor prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    };
  }, [handleDrop, handlePaste]);

  console.log('✅ [HOOK] useEditorEvents 훅 준비 완료');

  return {
    handleDrop,
    handlePaste,
    createEditorProps,
  };
};
