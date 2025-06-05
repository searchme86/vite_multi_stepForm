import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import {
  Button,
  Card,
  CardBody,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';

import { Icon } from '@iconify/react';

import { useFormContext } from 'react-hook-form';

import AccordionField from './accordion-field';

import ImageViewBuilder from './ImageViewBuilder'; // ✅ 간소화된 ImageViewBuilder import

import { useMultiStepForm } from './useMultiStepForm';

type BlogMediaStepProps = {};

function BlogMediaStep(props: BlogMediaStepProps): React.ReactNode {
  const { addToast, togglePreviewPanel } = useMultiStepForm();

  const { setValue, watch } = useFormContext();

  // ✅ 추가: 모바일 사이즈 감지

  const [isMobile, setIsMobile] = useState(false);

  // ✅ 수정: 더보기 기능을 위한 상태 (점진적 로딩 + 토글)

  const INITIAL_VISIBLE_FILES = 5; // 처음에 보여줄 파일 개수

  const LOAD_MORE_COUNT = 3; // 더보기 클릭시 추가로 보여줄 파일 개수

  const [visibleFilesCount, setVisibleFilesCount] = useState(
    INITIAL_VISIBLE_FILES
  );

  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ 추가: 체크박스 선택 관리

  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);

  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');

  // ✅ 추가: 이미지 모달을 위한 상태

  const {
    isOpen: isImageModalOpen,

    onOpen: onImageModalOpen,

    onClose: onImageModalClose,
  } = useDisclosure();

  const [selectedModalImage, setSelectedModalImage] = useState<string>('');

  const [selectedModalImageName, setSelectedModalImageName] =
    useState<string>('');

  // ✅ 추가: 툴팁 텍스트 설정 (나중에 변경 가능)

  const tooltipTexts = {
    mainImage: '메인 이미지로 설정',
    cancelMainImage: '메인 이미지 해제', // ✅ 추가: 메인 이미지 취소 툴팁
    slider: '슬라이더에 추가/제거',

    delete: '이미지 삭제',
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md 브레이크포인트
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 안정화된 setValue 함수들 생성

  const setMediaValue = useCallback(
    (value: string[]) => {
      setValue('media', value);
    },

    [setValue]
  );

  const setMainImageValue = useCallback(
    (value: string) => {
      setValue('mainImage', value);
    },

    [setValue]
  );

  const setSliderImagesValue = useCallback(
    (value: string[]) => {
      setValue('sliderImages', value);
    },

    [setValue]
  );

  const [dragActive, setDragActive] = useState(false);

  const [uploading, setUploading] = useState<Record<string, number>>({});

  const [uploadStatus, setUploadStatus] = useState<
    Record<string, 'uploading' | 'success' | 'error'>
  >({});

  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  const [sliderImages, setSliderImages] = useState<string[]>([]);

  const [localMediaFiles, setLocalMediaFiles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formValues = useMemo(() => {
    const mediaFromForm = watch('media');

    const mainImageFromForm = watch('mainImage');

    return {
      media: Array.isArray(mediaFromForm) ? mediaFromForm : localMediaFiles,

      mainImage: mainImageFromForm || null,
    };
  }, [watch('media'), watch('mainImage'), localMediaFiles]);

  const { media: mediaFiles, mainImage } = formValues;

  //====여기부터 수정됨====

  // ✅ 수정: preSelectedImage 상태 제거 - 바로 메인 이미지로 설정하도록 변경

  // 이유: 사용자가 홈 아이콘 클릭시 바로 메인 이미지로 설정되기를 원함

  //====여기까지 수정됨====

  // ✅ 추가: 파일 크기 포맷팅 함수

  const formatFileSize = useCallback((sizeInBytes: number) => {
    if (sizeInBytes === 0) return '0 B';

    const k = 1024;

    const sizes = ['B', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));

    return (
      parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    );
  }, []);

  // ✅ 수정: 정렬된 파일 목록

  const sortedMediaFiles = useMemo(() => {
    const filesWithIndex = mediaFiles.map((file, index) => ({
      file,

      index,

      name: selectedFileNames[index] || `이미지 ${index + 1}`,

      size: 1024 * 1024 * (Math.random() * 5 + 1), // 임시 파일 사이즈
    }));

    return filesWithIndex.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);

        case 'size':
          return b.size - a.size;

        case 'index':

        default:
          return a.index - b.index;
      }
    });
  }, [mediaFiles, selectedFileNames, sortBy]);

  // ✅ 수정: 표시할 파일 목록 계산 (정렬 적용)

  const displayFiles = useMemo(() => {
    return sortedMediaFiles.slice(0, visibleFilesCount);
  }, [sortedMediaFiles, visibleFilesCount]);

  // ✅ 수정: 더보기/접기 버튼 관련 계산

  const remainingFiles = sortedMediaFiles.length - visibleFilesCount;

  const hasMoreFiles = remainingFiles > 0;

  const showMoreCount = Math.min(LOAD_MORE_COUNT, remainingFiles);

  const canExpand = sortedMediaFiles.length > INITIAL_VISIBLE_FILES;

  // ✅ 수정: 더보기/접기 버튼 클릭 함수

  const handleLoadMoreToggle = useCallback(() => {
    if (isExpanded) {
      // 접기

      setVisibleFilesCount(INITIAL_VISIBLE_FILES);

      setIsExpanded(false);
    } else if (hasMoreFiles) {
      // 더보기

      const newCount = Math.min(
        visibleFilesCount + LOAD_MORE_COUNT,

        sortedMediaFiles.length
      );

      setVisibleFilesCount(newCount);

      if (newCount >= sortedMediaFiles.length) {
        setIsExpanded(true);
      }
    }
  }, [
    isExpanded,

    hasMoreFiles,

    visibleFilesCount,

    sortedMediaFiles.length,

    LOAD_MORE_COUNT,

    INITIAL_VISIBLE_FILES,
  ]);

  // ✅ 추가: 체크박스 관련 함수들

  const handleSelectFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.length === displayFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(displayFiles.map((item) => item.index));
    }
  }, [selectedFiles.length, displayFiles]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedFiles.length === 0) return;

    // 인덱스를 역순으로 정렬하여 삭제 (배열 인덱스 변경 방지)

    const sortedIndices = [...selectedFiles].sort((a, b) => b - a);

    setLocalMediaFiles((prev) => {
      let newFiles = [...prev];

      let removedMainImage = false;

      sortedIndices.forEach((index) => {
        // 메인 이미지 체크

        if (mainImage === newFiles[index]) {
          removedMainImage = true;
        }

        newFiles.splice(index, 1);
      });

      setTimeout(() => {
        setMediaValue(newFiles);

        // ✅ 메인 이미지가 삭제된 경우 초기화

        if (removedMainImage) {
          setMainImageValue('');
        }
      }, 0);

      return newFiles;
    });

    setSelectedFileNames((prev) => {
      let newNames = [...prev];

      sortedIndices.forEach((index) => {
        newNames.splice(index, 1);
      });

      return newNames;
    });

    // 선택 상태 초기화

    setSelectedFiles([]);

    // 파일 개수가 줄어들면 visibleFilesCount 조정

    const newLength = mediaFiles.length - selectedFiles.length;

    if (visibleFilesCount > newLength) {
      setVisibleFilesCount(Math.max(INITIAL_VISIBLE_FILES, newLength));

      setIsExpanded(newLength <= INITIAL_VISIBLE_FILES ? false : isExpanded);
    }

    addToast({
      title: '파일 삭제 완료',

      description: `${selectedFiles.length}개의 파일이 삭제되었습니다.`,

      color: 'success',
    });
  }, [
    selectedFiles,

    mediaFiles,

    mainImage,

    visibleFilesCount,

    isExpanded,

    INITIAL_VISIBLE_FILES,

    setMediaValue,

    setMainImageValue,

    addToast,
  ]);

  // ✅ 추가: 이미지 모달 열기 함수

  const openImageModal = useCallback(
    (imageUrl: string, imageName: string) => {
      setSelectedModalImage(imageUrl);

      setSelectedModalImageName(imageName);

      onImageModalOpen();
    },

    [onImageModalOpen]
  );

  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    switch (extension) {
      case 'jpg':

      case 'jpeg':
        return 'lucide:image';

      case 'png':
        return 'lucide:image';

      case 'svg':
        return 'lucide:file-image';

      case 'gif':
        return 'lucide:film';

      default:
        return 'lucide:file';
    }
  }, []);

  //====여기부터 수정됨====

  // ✅ 수정: 바로 메인 이미지로 설정하는 함수로 변경

  // 이유: preSelectedImage 단계를 거치지 않고 바로 메인 이미지로 설정

  const setAsMainImageDirect = useCallback(
    (index: number) => {
      const selectedImage = mediaFiles[index];

      if (selectedImage) {
        setMainImageValue(selectedImage);

        addToast({
          title: '메인 이미지 설정 완료',

          description:
            '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',

          color: 'success',

          hideCloseButton: false,
        });
      }
    },

    [mediaFiles, setMainImageValue, addToast]
  );

  // ✅ 추가: 메인 이미지 해제 함수

  // 이유: 사용자가 메인 이미지를 취소할 수 있는 기능 제공

  const cancelMainImage = useCallback(() => {
    setMainImageValue('');

    addToast({
      title: '메인 이미지 해제 완료',

      description: '메인 이미지 설정이 해제되었습니다.',

      color: 'warning',

      hideCloseButton: false,
    });
  }, [setMainImageValue, addToast]);

  //====여기까지 수정됨====

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file, fileIndex) => {
        const reader = new FileReader();

        const fileId = `file-${Date.now()}-${Math.random()

          .toString(36)

          .substring(2, 9)}`;

        const fileName = file.name;

        if (file.size > 10 * 1024 * 1024) {
          setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));

          addToast({
            title: '업로드 실패',

            description: `${fileName} 파일이 10MB 제한을 초과합니다.`,

            color: 'danger',
          });

          return;
        }

        setUploading((prev) => ({ ...prev, [fileId]: 0 }));

        setUploadStatus((prev) => ({ ...prev, [fileName]: 'uploading' }));

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);

            setUploading((prev) => ({ ...prev, [fileId]: progress }));
          }
        };

        reader.onload = (e) => {
          const result = e.target?.result as string;

          setTimeout(() => {
            try {
              setLocalMediaFiles((prev) => {
                const newFiles = [...prev, result];

                setTimeout(() => {
                  setMediaValue(newFiles);
                }, 0);

                return newFiles;
              });

              setSelectedFileNames((prev) => [...prev, fileName]);

              setUploadStatus((prev) => ({ ...prev, [fileName]: 'success' }));

              setUploading((prev) => {
                const newState = { ...prev };

                delete newState[fileId];

                return newState;
              });
            } catch (error) {
              console.error('상태 업데이트 에러:', error);
            }
          }, 1500);
        };

        reader.onerror = (error) => {
          console.error('FileReader 에러:', fileName, error);
        };

        reader.readAsDataURL(file);
      });
    },

    [setMediaValue, addToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      e.stopPropagation();

      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },

    [handleFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },

    [handleFiles]
  );

  const removeMedia = useCallback(
    (index: number) => {
      const fileToRemove = mediaFiles[index];

      setLocalMediaFiles((prev) => {
        const newFiles = [...prev];

        newFiles.splice(index, 1);

        setTimeout(() => {
          setMediaValue(newFiles);

          // ✅ 메인 이미지가 삭제된 경우 초기화

          if (mainImage === fileToRemove) {
            setMainImageValue('');
          }
        }, 0);

        return newFiles;
      });

      setSelectedFileNames((prev) => {
        const newFiles = [...prev];

        newFiles.splice(index, 1);

        return newFiles;
      });

      // 파일이 삭제되면 visibleFilesCount도 조정

      if (visibleFilesCount > mediaFiles.length - 1) {
        setVisibleFilesCount(
          Math.max(INITIAL_VISIBLE_FILES, mediaFiles.length - 1)
        );
      }
    },

    [
      setMediaValue,

      setMainImageValue,

      mainImage,

      mediaFiles,

      visibleFilesCount,

      INITIAL_VISIBLE_FILES,
    ]
  );

  const setAsMainImage = useCallback(
    (index: number) => {
      const selectedImage = mediaFiles[index];

      if (selectedImage) {
        setMainImageValue(selectedImage);
      }
    },

    [mediaFiles, setMainImageValue]
  );

  const toggleSliderSelection = useCallback(
    (imageUrl: string) => {
      if (mainImage === imageUrl) {
        addToast({
          title: '선택 불가',

          description: '이미 메인 이미지로 선택된 이미지입니다.',

          color: 'warning',
        });

        return;
      }

      setSliderImages((prev) => {
        const newImages = prev.includes(imageUrl)
          ? prev.filter((img) => img !== imageUrl)
          : [...prev, imageUrl];

        setTimeout(() => {
          setSliderImagesValue(newImages);
        }, 0);

        return newImages;
      });
    },

    [mainImage, setSliderImagesValue, addToast]
  );

  const removeFromSlider = useCallback(
    (imageUrl: string) => {
      setSliderImages((prev) => {
        const newImages = prev.filter((img) => img !== imageUrl);

        setTimeout(() => {
          setSliderImagesValue(newImages);
        }, 0);

        return newImages;
      });
    },

    [setSliderImagesValue]
  );

  const isMainImage = useCallback(
    (imageUrl: string) => {
      return mainImage === imageUrl;
    },

    [mainImage]
  );

  const updateMainImage = useCallback(
    (index: number) => {
      const selectedImage = mediaFiles[index];

      if (selectedImage) {
        setMainImageValue(selectedImage);

        addToast({
          title: '메인 이미지 설정 완료',

          description:
            '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',

          color: 'success',

          hideCloseButton: false,
        });
      }
    },

    [mediaFiles, setMainImageValue, addToast]
  );

  useEffect(() => {
    const formMedia = watch('media');

    if (Array.isArray(formMedia) && formMedia.length > 0) {
      setLocalMediaFiles(formMedia);
    }
  }, []);

  useEffect(() => {
    setSliderImagesValue(sliderImages);
  }, [sliderImages, setSliderImagesValue]);

  return (
    <>
      {/* ✅ 수정: 모바일에서만 표시되는 버튼 - bottom-sheet 스타일로 변경 */}

      <button
        type="button"
        className={`absolute top-0 right-0 bg-primary text-white px-4 py-2 rounded-full shadow-lg transition-all hover:bg-primary-600 active:scale-95 flex items-center gap-2 ${
          isMobile ? 'block' : 'hidden'
        }`}
        onClick={togglePreviewPanel}
        aria-label="미리보기 패널 토글"
      >
        <Icon icon="lucide:eye" />

        <span className="text-sm font-medium">미리보기</span>
      </button>

      <div className="relative p-4 mb-6 mt-[46px] rounded-lg bg-default-50">
        <h3 className="mb-2 text-lg font-medium">블로그 미디어 입력 안내</h3>

        <p className="text-default-600">
          블로그에 첨부할 이미지를 업로드해주세요. 파일을 드래그하여
          업로드하거나 파일 선택 버튼을 클릭하여 업로드할 수 있습니다. 지원
          형식: JPG, PNG, SVG (최대 10MB).
        </p>
      </div>

      {/* 미디어 업로드 섹션 */}

      <AccordionField
        title="미디어 업로드"
        description="이미지 파일을 업로드해주세요."
        defaultExpanded={true}
        id="media-upload-section"
      >
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-primary bg-primary-50' : 'border-default-300'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            role="region"
            aria-label="파일 업로드 영역"
          >
            <div className="flex flex-col items-center gap-2">
              <Icon
                icon="lucide:upload-cloud"
                className={`text-4xl ${
                  dragActive ? 'text-primary' : 'text-default-400'
                }`}
                aria-hidden="true"
              />

              <h3 className="text-lg font-medium">
                {dragActive
                  ? '파일을 놓아주세요'
                  : '클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요'}
              </h3>

              <p className="mb-4 text-sm text-default-500">
                지원 형식: SVG, JPG, PNG (최대 10MB)
              </p>

              <Button
                color="primary"
                variant="flat"
                onPress={() => fileInputRef.current?.click()}
                type="button"
                aria-label="파일 선택"
              >
                파일 선택
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".jpg,.jpeg,.png,.svg"
                multiple
                onChange={handleFileChange}
                aria-label="파일 입력"
              />
            </div>
          </div>

          {Object.keys(uploading).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">업로드 중...</h4>

              {Object.entries(uploading).map(([id, progress]) => (
                <div key={id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>파일 업로드 중</span>

                    <span>{progress}%</span>
                  </div>

                  <Progress
                    value={progress}
                    color="primary"
                    size="sm"
                    aria-label={`파일 업로드 진행률 ${progress}%`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </AccordionField>

      {/* ✅ 수정: 통합된 이미지 테이블 섹션 - 체크박스 및 정렬 기능 추가 */}

      <AccordionField
        title="업로드된 이미지"
        description={
          mediaFiles.length > 0
            ? `업로드된 이미지가 아래에 표시됩니다. (${mediaFiles.length}개)`
            : '업로드된 이미지가 여기에 표시됩니다.'
        }
        defaultExpanded={true}
      >
        {mediaFiles.length > 0 ? (
          <div className="space-y-4">
            {/* ✅ 추가: 테이블 상단 컨트롤 */}

            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                {selectedFiles.length > 0 && (
                  <Button
                    color="danger"
                    size="sm"
                    variant="flat"
                    startContent={
                      <Icon icon="lucide:trash-2" className="text-sm" />
                    }
                    onPress={handleDeleteSelected}
                  >
                    {selectedFiles.length}개 삭제
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={
                        <Icon icon="lucide:arrow-down-up" className="text-sm" />
                      }
                    >
                      정렬:{' '}
                      {sortBy === 'index'
                        ? '순서'
                        : sortBy === 'name'
                        ? '이름'
                        : '크기'}
                    </Button>
                  </DropdownTrigger>

                  <DropdownMenu aria-label="정렬 옵션">
                    <DropdownItem
                      key="index"
                      onPress={() => setSortBy('index')}
                    >
                      순서
                    </DropdownItem>

                    <DropdownItem key="name" onPress={() => setSortBy('name')}>
                      이름
                    </DropdownItem>

                    <DropdownItem key="size" onPress={() => setSortBy('size')}>
                      크기
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            {/* ✅ 반응형 파일 테이블 */}

            <div className="overflow-hidden">
              {/* 데스크톱 테이블 뷰 */}

              <div className="hidden md:block">
                <Table
                  aria-label="업로드된 이미지 목록"
                  removeWrapper
                  classNames={{
                    table: 'min-h-[200px]',

                    tbody: 'divide-y divide-default-200',
                  }}
                >
                  <TableHeader>
                    <TableColumn scope="col" className="w-10">
                      <Checkbox
                        isSelected={
                          selectedFiles.length === displayFiles.length &&
                          displayFiles.length > 0
                        }
                        isIndeterminate={
                          selectedFiles.length > 0 &&
                          selectedFiles.length < displayFiles.length
                        }
                        onValueChange={handleSelectAll}
                      />
                    </TableColumn>

                    <TableColumn scope="col">파일</TableColumn>

                    <TableColumn scope="col">진행률</TableColumn>

                    <TableColumn scope="col">크기</TableColumn>

                    <TableColumn scope="col" className="text-center">
                      액션
                    </TableColumn>
                  </TableHeader>

                  <TableBody>
                    {displayFiles.map((fileItem) => {
                      const { file, index, name, size } = fileItem;

                      const uploadProgress = Object.values(uploading)[0] || 100;

                      const isUploaded =
                        uploadStatus[name] === 'success' ||
                        uploadProgress === 100;

                      const isMain = isMainImage(file);

                      return (
                        <TableRow
                          key={index}
                          className={`${
                            isMain ? 'bg-primary-50 border-primary-200' : ''
                          }`}
                        >
                          <TableCell>
                            <Checkbox
                              isSelected={selectedFiles.includes(index)}
                              onValueChange={() => handleSelectFile(index)}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              {/*====여기부터 수정됨====*/}

                              {/* ✅ 수정: 이미지 크기 고정 - w-16 h-16으로 고정하여 레이아웃 안정화 */}

                              {/* 이유: 큰 이미지가 들어와도 테이블 레이아웃이 깨지지 않도록 */}

                              <div className="relative flex-shrink-0 w-16 h-16 cursor-pointer group">
                                {/* ✅ 추가: 이미지 순서 번호 */}

                                <div className="absolute z-10 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg -top-2 -left-2 bg-primary">
                                  {index + 1}
                                </div>

                                <img
                                  src={file}
                                  alt={`업로드 이미지 ${index + 1}`}
                                  className="object-cover w-full h-full rounded-md"
                                  onClick={() => openImageModal(file, name)}
                                />

                                {/* 호버 효과 유지 */}

                                <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                                  <Icon
                                    icon="lucide:zoom-in"
                                    className="text-sm text-white"
                                  />
                                </div>

                                {/* ✅ 메인 이미지 표시 */}

                                {isMain && (
                                  <div className="absolute p-1 text-white rounded-full -top-1 -right-1 bg-primary">
                                    <Icon
                                      icon="lucide:crown"
                                      className="text-xs"
                                    />
                                  </div>
                                )}
                              </div>

                              {/*====여기까지 수정됨====*/}

                              <div className="flex-1 min-w-0">
                                <span
                                  className="text-sm font-medium block max-w-[100px] truncate"
                                  title={name}
                                >
                                  {name}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {!isUploaded ? (
                              <div className="w-full max-w-[100px]">
                                <Progress
                                  aria-label="업로드 중..."
                                  value={uploadProgress}
                                  size="sm"
                                  color="primary"
                                />

                                <span className="text-xs text-default-500">
                                  {Math.round(uploadProgress)}%
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Icon
                                  icon="lucide:check-circle"
                                  className="text-sm text-success"
                                />

                                <span className="text-sm text-success">
                                  완료
                                </span>
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-default-500">
                              {formatFileSize(size)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {/*====여기부터 수정됨====*/}

                              {/* ✅ 수정: 메인 이미지 설정/해제 버튼 로직 변경 */}

                              {/* 이유: 홈 아이콘 클릭시 바로 메인 이미지 설정, 메인 이미지인 경우 취소 버튼 추가 */}

                              {!isMain ? (
                                // 메인 이미지가 아닌 경우: 홈 아이콘으로 메인 이미지 설정

                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="default"
                                  onPress={() => setAsMainImageDirect(index)}
                                  aria-label={`이미지 ${
                                    index + 1
                                  } 메인 이미지로 선택`}
                                  title={tooltipTexts.mainImage}
                                >
                                  <Icon
                                    icon="lucide:home"
                                    className="text-sm"
                                  />
                                </Button>
                              ) : (
                                // 메인 이미지인 경우: 홈 아이콘 + 취소 버튼

                                <div className="flex items-center gap-1">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    className="cursor-default bg-primary-100"
                                    aria-label="현재 메인 이미지"
                                    title="현재 메인 이미지"
                                    isDisabled
                                  >
                                    <Icon
                                      icon="lucide:home"
                                      className="text-sm"
                                    />
                                  </Button>

                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="warning"
                                    onPress={cancelMainImage}
                                    aria-label="메인 이미지 해제"
                                    title={tooltipTexts.cancelMainImage}
                                  >
                                    <Icon icon="lucide:x" className="text-sm" />
                                  </Button>
                                </div>
                              )}

                              {/*====여기까지 수정됨====*/}

                              {/* 슬라이더 추가/제거 버튼 */}

                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color={
                                  sliderImages.includes(file)
                                    ? 'success'
                                    : 'default'
                                }
                                onPress={() => toggleSliderSelection(file)}
                                aria-label={`이미지 ${index + 1} 슬라이더에 ${
                                  sliderImages.includes(file) ? '제거' : '추가'
                                }`}
                                title={tooltipTexts.slider}
                              >
                                <Icon
                                  icon={
                                    sliderImages.includes(file)
                                      ? 'lucide:check'
                                      : 'lucide:plus'
                                  }
                                  className="text-sm"
                                />
                              </Button>

                              {/* 삭제 버튼 */}

                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => removeMedia(index)}
                                aria-label={`파일 ${name} 삭제`}
                                title={tooltipTexts.delete}
                              >
                                <Icon
                                  icon="lucide:trash-2"
                                  className="text-sm"
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ✅ 모바일 카드 뷰 */}

              <div className="space-y-3 md:hidden">
                {displayFiles.map((fileItem) => {
                  const { file, index, name, size } = fileItem;

                  const uploadProgress = Object.values(uploading)[0] || 100;

                  const isUploaded =
                    uploadStatus[name] === 'success' || uploadProgress === 100;

                  const isMain = isMainImage(file);

                  return (
                    <Card
                      key={index}
                      className={`${
                        isMain ? 'border-primary-200 bg-primary-50' : ''
                      }`}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            isSelected={selectedFiles.includes(index)}
                            onValueChange={() => handleSelectFile(index)}
                            className="flex-shrink-0"
                          />

                          {/*====여기부터 수정됨====*/}

                          {/* ✅ 수정: 모바일 카드뷰에서도 이미지 크기 고정 */}

                          {/* 이유: 일관된 레이아웃 유지 */}

                          <div className="relative flex-shrink-0 w-16 h-16 cursor-pointer group">
                            {/* ✅ 추가: 이미지 순서 번호 */}

                            <div className="absolute z-10 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg -top-2 -left-2 bg-primary">
                              {index + 1}
                            </div>

                            <img
                              src={file}
                              alt={`업로드 이미지 ${index + 1}`}
                              className="object-cover w-full h-full rounded-md"
                              onClick={() => openImageModal(file, name)}
                            />

                            <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                              <Icon
                                icon="lucide:zoom-in"
                                className="text-sm text-white"
                              />
                            </div>

                            {isMain && (
                              <div className="absolute p-1 text-white rounded-full -top-1 -right-1 bg-primary">
                                <Icon icon="lucide:crown" className="text-xs" />
                              </div>
                            )}
                          </div>

                          {/*====여기까지 수정됨====*/}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <span
                                className="text-sm font-medium block max-w-[120px] truncate"
                                title={name}
                              >
                                {name}
                              </span>

                              <span className="text-xs text-default-500">
                                {formatFileSize(size)}
                              </span>
                            </div>

                            {!isUploaded ? (
                              <div className="mb-3">
                                <Progress
                                  aria-label="업로드 중..."
                                  value={uploadProgress}
                                  size="sm"
                                  color="primary"
                                />

                                <span className="text-xs text-default-500">
                                  {Math.round(uploadProgress)}%
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mb-3">
                                <Icon
                                  icon="lucide:check-circle"
                                  className="text-sm text-success"
                                />

                                <span className="text-sm text-success">
                                  완료
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {/*====여기부터 수정됨====*/}

                              {/* ✅ 수정: 모바일에서도 메인 이미지 설정/해제 로직 적용 */}

                              {/* 이유: 데스크톱과 동일한 UX 제공 */}

                              {!isMain ? (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="default"
                                  onPress={() => setAsMainImageDirect(index)}
                                  title={tooltipTexts.mainImage}
                                >
                                  <Icon
                                    icon="lucide:home"
                                    className="text-sm"
                                  />
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    className="cursor-default bg-primary-100"
                                    title="현재 메인 이미지"
                                    isDisabled
                                  >
                                    <Icon
                                      icon="lucide:home"
                                      className="text-sm"
                                    />
                                  </Button>

                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="warning"
                                    onPress={cancelMainImage}
                                    title={tooltipTexts.cancelMainImage}
                                  >
                                    <Icon icon="lucide:x" className="text-sm" />
                                  </Button>
                                </div>
                              )}

                              {/*====여기까지 수정됨====*/}

                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color={
                                  sliderImages.includes(file)
                                    ? 'success'
                                    : 'default'
                                }
                                onPress={() => toggleSliderSelection(file)}
                                title={tooltipTexts.slider}
                              >
                                <Icon
                                  icon={
                                    sliderImages.includes(file)
                                      ? 'lucide:check'
                                      : 'lucide:plus'
                                  }
                                  className="text-sm"
                                />
                              </Button>

                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => removeMedia(index)}
                                title={tooltipTexts.delete}
                              >
                                <Icon
                                  icon="lucide:trash-2"
                                  className="text-sm"
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* ✅ 수정: 더보기/접기 토글 버튼 */}

            {canExpand && (
              <div className="pt-2 text-center">
                <Button
                  variant="flat"
                  color="primary"
                  size="sm"
                  onPress={handleLoadMoreToggle}
                  className="relative transition-all hover:bg-primary-50"
                >
                  <span className="flex items-center gap-2">
                    {isExpanded ? (
                      <>
                        접기
                        <Icon icon="lucide:chevron-up" className="text-sm" />
                      </>
                    ) : hasMoreFiles ? (
                      <>
                        더보기
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full text-primary-600 bg-primary-100">
                          {showMoreCount}
                        </span>
                      </>
                    ) : (
                      <>
                        접기
                        <Icon icon="lucide:chevron-up" className="text-sm" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            )}

            {/*====여기부터 수정됨====*/}

            {/* ✅ 수정: 메인 이미지 미리 선택 확인 UI 제거 */}

            {/* 이유: 바로 메인 이미지로 설정하므로 미리 선택 단계가 불필요 */}

            {/*====여기까지 수정됨====*/}
          </div>
        ) : (
          <div className="p-8 text-center rounded-lg bg-default-100">
            <Icon
              icon="lucide:images"
              className="w-12 h-12 mx-auto mb-3 text-default-400"
              aria-hidden="true"
            />

            <p className="mb-3 text-default-600">업로드된 이미지가 없습니다.</p>

            <Button
              color="primary"
              variant="flat"
              size="sm"
              startContent={<Icon icon="lucide:upload" />}
              onPress={() =>
                document

                  .getElementById('media-upload-section')

                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              aria-label="이미지 업로드 이동"
            >
              이미지 업로드하기
            </Button>
          </div>
        )}
      </AccordionField>

      {/* ✅ 핵심: 간소화된 이미지 뷰 빌더 섹션 */}

      {mediaFiles.length > 0 && (
        <ImageViewBuilder
          mediaFiles={mediaFiles}
          mainImage={mainImage}
          sliderImages={sliderImages}
        />
      )}

      {/* ✅ 추가: 이미지 모달 */}

      <Modal
        isOpen={isImageModalOpen}
        onClose={onImageModalClose}
        size={isMobile ? 'full' : '2xl'}
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          base: isMobile ? 'm-0 rounded-none' : '',

          body: 'p-6',
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">이미지 미리보기</h2>

            <p
              className="text-sm truncate text-default-600"
              title={selectedModalImageName}
            >
              {selectedModalImageName}
            </p>
          </ModalHeader>

          <ModalBody>
            <div className="flex justify-center">
              <img
                src={selectedModalImage}
                alt={selectedModalImageName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button color="default" variant="light" onPress={onImageModalClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/*====여기부터 수정됨====*/}

      {/* ✅ 수정: 블로그 메인 이미지 선택 섹션에서도 바로 설정 로직 적용 */}

      {/* 이유: 일관된 UX 제공 */}

      {/* 블로그 메인 이미지 선택 섹션 - 기존 유지하되 함수만 변경 */}

      <AccordionField
        title="블로그 메인 이미지 선택"
        description={
          mediaFiles.length > 0
            ? '블로그 상단에 가장 중요하게 표시될 대표 이미지를 선택하세요.'
            : '이미지를 먼저 업로드한 후 메인 이미지를 선택할 수 있습니다.'
        }
        defaultExpanded={true}
      >
        {mediaFiles.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {mediaFiles.map((file, index) => (
                <Card key={index} className="relative w-48 group">
                  <CardBody className="p-0 aspect-square">
                    <img
                      src={file}
                      alt={`업로드 이미지 ${index + 1}`}
                      className="object-cover w-full h-full"
                    />

                    <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                      <Button
                        isIconOnly
                        color="primary"
                        variant="solid"
                        size="sm"
                        onPress={() => setAsMainImageDirect(index)}
                        type="button"
                        aria-label={`이미지 ${index + 1} 메인 이미지로 선택`}
                      >
                        <Icon icon="lucide:home" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center rounded-lg bg-default-100">
            <Icon
              icon="lucide:image-off"
              className="w-10 h-10 mx-auto mb-2 text-default-400"
              aria-hidden="true"
            />

            <p className="text-default-600">
              이미지를 업로드하면 메인 이미지를 선택할 수 있습니다.
            </p>
          </div>
        )}
      </AccordionField>

      {/*====여기까지 수정됨====*/}

      {/* 이미지 슬라이더 섹션 - 기존 유지 */}

      <AccordionField
        title="이미지 슬라이더"
        description="블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요."
        defaultExpanded={true}
      >
        <div className="space-y-4">
          {mediaFiles.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-4">
                {mediaFiles.map((file, index) => {
                  const isMain = isMainImage(file);

                  const isSelected = sliderImages.includes(file);

                  return (
                    <Card
                      key={index}
                      className={`relative w-48 group ${
                        isMain ? 'opacity-50' : ''
                      }`}
                    >
                      <CardBody className="p-0 aspect-square">
                        <img
                          src={file}
                          alt={`슬라이더 이미지 ${index + 1}`}
                          className="object-cover w-full h-full"
                        />

                        {isMain && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="px-2 py-1 text-xs text-white rounded bg-primary">
                              메인 이미지
                            </div>
                          </div>
                        )}

                        {!isMain && (
                          <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                            <Button
                              isIconOnly
                              color={isSelected ? 'success' : 'primary'}
                              variant="solid"
                              size="sm"
                              onPress={() => toggleSliderSelection(file)}
                              type="button"
                              aria-label={`이미지 ${index + 1} 슬라이더 ${
                                isSelected ? '제거' : '추가'
                              }`}
                            >
                              <Icon
                                icon={
                                  isSelected ? 'lucide:check' : 'lucide:plus'
                                }
                              />
                            </Button>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>

              {sliderImages.length > 0 && (
                <div className="p-4 mt-6 rounded-lg bg-default-50">
                  <h4 className="mb-3 text-sm font-medium">
                    선택된 슬라이더 이미지 ({sliderImages.length}개)
                  </h4>

                  <div className="flex flex-wrap gap-3">
                    {sliderImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`선택된 슬라이더 이미지 ${index + 1}`}
                          className="object-cover w-20 h-20 rounded-md"
                        />

                        <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-50 group-hover:opacity-100">
                          <Button
                            isIconOnly
                            color="danger"
                            variant="solid"
                            size="sm"
                            onPress={() => removeFromSlider(imageUrl)}
                            type="button"
                            aria-label={`슬라이더 이미지 ${index + 1} 삭제`}
                          >
                            <Icon icon="lucide:trash-2" size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center rounded-lg bg-default-100">
              <Icon
                icon="lucide:layout-grid"
                className="w-10 h-10 mx-auto mb-2 text-default-400"
                aria-hidden="true"
              />

              <p className="text-default-600">
                이미지를 업로드하면 슬라이더를 구성할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </AccordionField>
    </>
  );
}

export default BlogMediaStep;
