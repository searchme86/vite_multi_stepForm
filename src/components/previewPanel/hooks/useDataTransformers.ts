//====여기부터 수정됨====
// 데이터 변환 훅 - 무한 렌더링 방지
import { useMemo } from 'react';

// 타입 정의들
interface FormData {
  mainImage?: string;
  media?: unknown[];
  sliderImages?: string[];
  [key: string]: unknown;
}

interface EditorContainer {
  id: string;
  content: string;
  [key: string]: unknown;
}

interface EditorParagraph {
  id: string;
  text: string;
  [key: string]: unknown;
}

interface UseDataTransformersProps {
  formData: FormData;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
  editorContainers: EditorContainer[];
  editorParagraphs: EditorParagraph[];
}

interface TransformedData {
  currentFormValues: FormData;
  displayContent: string;
  editorStatusInfo: {
    isCompleted: boolean;
    contentLength: number;
    hasContainers: boolean;
    hasParagraphs: boolean;
  };
  heroImage: string;
  isUsingFallbackImage: boolean;
  tagArray: string[];
  avatarProps: {
    src?: string;
    name: string;
    fallback: string;
  };
  swiperKey: string;
  email: string;
  currentDate: string;
}

export function useDataTransformers({
  formData,
  editorCompletedContent,
  isEditorCompleted,
  editorContainers,
  editorParagraphs,
}: UseDataTransformersProps): TransformedData {
  // 폼 데이터 메모이제이션
  // formData 객체의 참조가 변경될 때만 새로운 객체를 생성합니다
  const currentFormValues = useMemo(() => {
    return formData || {};
  }, [formData]);

  // 에디터 상태 정보 메모이제이션
  // 에디터 관련 데이터가 변경될 때만 새로운 상태 객체를 생성합니다
  const editorStatusInfo = useMemo(() => {
    return {
      isCompleted: isEditorCompleted,
      contentLength: editorCompletedContent?.length || 0,
      hasContainers:
        Array.isArray(editorContainers) && editorContainers.length > 0,
      hasParagraphs:
        Array.isArray(editorParagraphs) && editorParagraphs.length > 0,
    };
  }, [
    isEditorCompleted,
    editorCompletedContent,
    editorContainers,
    editorParagraphs,
  ]);

  // 표시할 콘텐츠 메모이제이션
  // 에디터 완료 여부에 따라 다른 콘텐츠를 반환합니다
  const displayContent = useMemo(() => {
    if (isEditorCompleted && editorCompletedContent) {
      return editorCompletedContent;
    }

    // fallback 콘텐츠 생성
    const containerContent =
      editorContainers
        ?.map((container) => container.content || '')
        .filter(Boolean)
        .join('\n\n') || '';

    const paragraphContent =
      editorParagraphs
        ?.map((paragraph) => paragraph.text || '')
        .filter(Boolean)
        .join('\n\n') || '';

    return containerContent || paragraphContent || '내용이 없습니다.';
  }, [
    isEditorCompleted,
    editorCompletedContent,
    editorContainers,
    editorParagraphs,
  ]);

  // 히어로 이미지 처리 메모이제이션
  // 메인 이미지가 있으면 사용하고, 없으면 fallback 이미지를 사용합니다
  const heroImageData = useMemo(() => {
    const mainImage = currentFormValues.mainImage;
    const fallbackImage =
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800';

    return {
      heroImage: mainImage || fallbackImage,
      isUsingFallbackImage: !mainImage,
    };
  }, [currentFormValues.mainImage]);

  // 태그 배열 메모이제이션
  // 폼 데이터에서 태그를 추출하여 배열로 변환합니다
  const tagArray = useMemo(() => {
    const tags = currentFormValues.tags;
    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    if (Array.isArray(tags)) {
      return tags.filter(Boolean);
    }
    return [];
  }, [currentFormValues.tags]);

  // 아바타 props 메모이제이션
  // 사용자 정보를 기반으로 아바타 속성을 생성합니다
  const avatarProps = useMemo(() => {
    const name =
      currentFormValues.author || currentFormValues.userName || '익명';
    const avatarImage =
      currentFormValues.avatar || currentFormValues.profileImage;

    return {
      ...(avatarImage && { src: avatarImage }),
      name: String(name),
      fallback: String(name).charAt(0).toUpperCase(),
    };
  }, [
    currentFormValues.author,
    currentFormValues.userName,
    currentFormValues.avatar,
    currentFormValues.profileImage,
  ]);

  // Swiper 키 메모이제이션
  // 슬라이더 이미지가 변경될 때 Swiper를 재초기화하기 위한 키입니다
  const swiperKey = useMemo(() => {
    const sliderImages = currentFormValues.sliderImages;
    if (Array.isArray(sliderImages)) {
      return `swiper-${sliderImages.length}-${Date.now()}`;
    }
    return `swiper-default-${Date.now()}`;
  }, [currentFormValues.sliderImages]);

  // 이메일 메모이제이션
  // 폼 데이터에서 이메일을 추출합니다
  const email = useMemo(() => {
    return (
      currentFormValues.email ||
      currentFormValues.contactEmail ||
      'example@example.com'
    );
  }, [currentFormValues.email, currentFormValues.contactEmail]);

  // 현재 날짜 메모이제이션
  // 컴포넌트가 마운트될 때의 날짜를 고정합니다
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []); // 빈 의존성 배열로 한 번만 계산

  // 모든 변환된 데이터를 하나의 객체로 메모이제이션
  // 각각의 의존성이 변경될 때만 새로운 객체를 생성합니다
  return useMemo(
    () => ({
      currentFormValues,
      displayContent,
      editorStatusInfo,
      heroImage: heroImageData.heroImage,
      isUsingFallbackImage: heroImageData.isUsingFallbackImage,
      tagArray,
      avatarProps,
      swiperKey,
      email,
      currentDate,
    }),
    [
      currentFormValues,
      displayContent,
      editorStatusInfo,
      heroImageData.heroImage,
      heroImageData.isUsingFallbackImage,
      tagArray,
      avatarProps,
      swiperKey,
      email,
      currentDate,
    ]
  );
}
//====여기까지 수정됨====
