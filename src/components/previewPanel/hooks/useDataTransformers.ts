// 데이터 변환 처리 훅
import { useMemo } from 'react';
import {
  CurrentFormValues,
  DisplayContent,
  EditorStatusInfo,
  AvatarProps,
  ParagraphBlock,
} from '../types/previewPanel.types';
import { DEFAULT_AVATAR_SRC, DEFAULT_NICKNAME } from '../utils/constants';

interface UseDataTransformersProps {
  formData: any;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
  editorContainers: any[];
  editorParagraphs: ParagraphBlock[];
}

export function useDataTransformers({
  formData,
  editorCompletedContent,
  isEditorCompleted,
  editorContainers,
  editorParagraphs,
}: UseDataTransformersProps) {
  console.log('🔄 데이터 변환 시작');

  const currentFormValues: CurrentFormValues = useMemo(() => {
    console.log('📊 폼 데이터 변환');
    return {
      media: Array.isArray(formData?.media) ? formData.media : [],
      mainImage: formData?.mainImage || null,
      sliderImages: Array.isArray(formData?.sliderImages)
        ? formData.sliderImages
        : [],
      title: typeof formData?.title === 'string' ? formData.title : '',
      description:
        typeof formData?.description === 'string' ? formData.description : '',
      content: typeof formData?.content === 'string' ? formData.content : '',
      tags: typeof formData?.tags === 'string' ? formData.tags : '',
      nickname: typeof formData?.nickname === 'string' ? formData.nickname : '',
      userImage:
        typeof formData?.userImage === 'string' ? formData.userImage : '',
      editorCompletedContent:
        typeof editorCompletedContent === 'string'
          ? editorCompletedContent
          : '',
      isEditorCompleted:
        typeof isEditorCompleted === 'boolean' ? isEditorCompleted : false,
    };
  }, [formData, editorCompletedContent, isEditorCompleted]);

  const displayContent: DisplayContent = useMemo(() => {
    console.log('📝 표시 콘텐츠 변환');
    return {
      text:
        currentFormValues.isEditorCompleted &&
        currentFormValues.editorCompletedContent?.trim()
          ? currentFormValues.editorCompletedContent
          : currentFormValues.content,
      source:
        currentFormValues.isEditorCompleted &&
        currentFormValues.editorCompletedContent?.trim()
          ? 'editor'
          : 'basic',
    };
  }, [
    currentFormValues.isEditorCompleted,
    currentFormValues.editorCompletedContent,
    currentFormValues.content,
  ]);

  const editorStatusInfo: EditorStatusInfo = useMemo(() => {
    console.log('⚙️ 에디터 상태 정보 변환');
    return {
      hasEditor:
        (Array.isArray(editorContainers) && editorContainers.length > 0) ||
        (Array.isArray(editorParagraphs) && editorParagraphs.length > 0),
      containerCount: editorContainers?.length || 0,
      paragraphCount:
        editorParagraphs?.filter((p: ParagraphBlock) => p.containerId !== null)
          ?.length || 0,
      isCompleted: isEditorCompleted || false,
    };
  }, [editorContainers, editorParagraphs, isEditorCompleted]);

  const heroImage = useMemo(() => {
    console.log('🖼️ 히어로 이미지 선택');
    return (
      currentFormValues.mainImage ||
      (currentFormValues.media && currentFormValues.media.length > 0
        ? currentFormValues.media[0]
        : null)
    );
  }, [currentFormValues.mainImage, currentFormValues.media]);

  const isUsingFallbackImage = useMemo(() => {
    return (
      !currentFormValues.mainImage &&
      currentFormValues.media &&
      currentFormValues.media.length > 0
    );
  }, [currentFormValues.mainImage, currentFormValues.media]);

  const tagArray = useMemo(() => {
    console.log('🏷️ 태그 배열 변환');
    return currentFormValues.tags
      ? currentFormValues.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
  }, [currentFormValues.tags]);

  const avatarProps: AvatarProps = useMemo(() => {
    console.log('👤 아바타 props 생성');
    return {
      src: currentFormValues.userImage || DEFAULT_AVATAR_SRC,
      name: currentFormValues.nickname || DEFAULT_NICKNAME,
      className: 'w-10 h-10 border-2 border-white',
      showFallback: true,
      isBordered: true,
    };
  }, [currentFormValues.userImage, currentFormValues.nickname]);

  const swiperKey = useMemo(() => {
    return `swiper-${currentFormValues.sliderImages?.length || 0}`;
  }, [currentFormValues.sliderImages?.length]);

  console.log('✅ 데이터 변환 완료');

  return {
    currentFormValues,
    displayContent,
    editorStatusInfo,
    heroImage,
    isUsingFallbackImage,
    tagArray,
    avatarProps,
    swiperKey,
  };
}
