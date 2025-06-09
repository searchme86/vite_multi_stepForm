import { isImageFile } from '../../utils/imageUpload';

interface ImageDropZoneHandlers {
  handleImageUpload: (files: File[]) => Promise<string[]>;
}

export function createDropHandler({
  handleImageUpload,
}: ImageDropZoneHandlers) {
  console.log('🎯 [DROP_ZONE] Drop 핸들러 생성');

  return (view: any, event: DragEvent, _slice: any, moved: boolean) => {
    console.log('📂 [DROP_ZONE] Drop 이벤트 발생:', {
      moved,
      hasFiles: !!(
        event.dataTransfer &&
        event.dataTransfer.files &&
        event.dataTransfer.files[0]
      ),
    });

    if (
      !moved &&
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files[0]
    ) {
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter(isImageFile);

      console.log('🖼️ [DROP_ZONE] 이미지 파일 감지:', {
        totalFiles: files.length,
        imageFiles: imageFiles.length,
      });

      if (imageFiles.length > 0) {
        event.preventDefault();

        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        const dropPos = coordinates
          ? coordinates.pos
          : view.state.selection.from;

        console.log('📍 [DROP_ZONE] 드롭 위치 계산:', { dropPos });

        handleImageUpload(imageFiles).then((urls) => {
          if (urls.length > 0 && view.state) {
            console.log('✅ [DROP_ZONE] 이미지 삽입 시작:', urls.length);

            urls.forEach((url, index) => {
              if (url) {
                const node = view.state.schema.nodes.image.create({
                  src: url,
                  alt: imageFiles[index]?.name || 'Uploaded image',
                  title: imageFiles[index]?.name || 'Uploaded image',
                });

                const transaction = view.state.tr.insert(dropPos + index, node);
                view.dispatch(transaction);

                console.log('✅ [DROP_ZONE] 이미지 삽입 완료:', index + 1);
              }
            });
          }
        });

        return true;
      }
    }
    return false;
  };
}

export function createPasteHandler({
  handleImageUpload,
}: ImageDropZoneHandlers) {
  console.log('📋 [DROP_ZONE] Paste 핸들러 생성');

  return (view: any, event: ClipboardEvent, _slice: any) => {
    console.log('📋 [DROP_ZONE] Paste 이벤트 발생');

    const items = Array.from(event.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));

    console.log('🖼️ [DROP_ZONE] 클립보드 이미지 감지:', {
      totalItems: items.length,
      imageItems: imageItems.length,
    });

    if (imageItems.length > 0) {
      event.preventDefault();

      const files = imageItems
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      console.log('📁 [DROP_ZONE] 클립보드 파일 변환:', files.length);

      handleImageUpload(files).then((urls) => {
        if (urls.length > 0 && view.state) {
          console.log('✅ [DROP_ZONE] 클립보드 이미지 삽입 시작:', urls.length);

          const { state } = view;
          const { selection } = state;
          const position = selection.from;

          urls.forEach((url, index) => {
            if (url) {
              const node = state.schema.nodes.image.create({
                src: url,
                alt: `붙여넣은_이미지_${Date.now()}_${index}.png`,
                title: `붙여넣은_이미지_${Date.now()}_${index}.png`,
              });
              const transaction = state.tr.insert(position + index, node);
              view.dispatch(transaction);

              console.log(
                '✅ [DROP_ZONE] 클립보드 이미지 삽입 완료:',
                index + 1
              );
            }
          });
        }
      });

      return true;
    }
    return false;
  };
}
