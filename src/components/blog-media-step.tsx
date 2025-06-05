import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Card, CardBody, Progress } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import AccordionField from './accordion-field';
import { useMultiStepForm } from './useMultiStepForm';

type BlogMediaStepProps = {};

function BlogMediaStep(props: BlogMediaStepProps): React.ReactNode {
  const { addToast, togglePreviewPanel } = useMultiStepForm();
  const { setValue, watch } = useFormContext();

  // ✅ 추가: 모바일 사이즈 감지
  const [isMobile, setIsMobile] = useState(false);

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
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [localMediaFiles, setLocalMediaFiles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formValues = React.useMemo(() => {
    const mediaFromForm = watch('media');
    const mainImageFromForm = watch('mainImage');

    return {
      media: Array.isArray(mediaFromForm) ? mediaFromForm : localMediaFiles,
      mainImage: mainImageFromForm || null,
    };
  }, [watch('media'), watch('mainImage'), localMediaFiles]);

  const { media: mediaFiles, mainImage } = formValues;

  const [preSelectedImage, setPreSelectedImage] = useState<string | null>(null);

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

  const preSelectImage = useCallback((imageUrl: string) => {
    setPreSelectedImage(imageUrl);
  }, []);

  const confirmMainImage = useCallback(() => {
    if (preSelectedImage) {
      setMainImageValue(preSelectedImage);
      setPreSelectedImage(null);

      addToast({
        title: '메인 이미지 설정 완료',
        description:
          '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',
        color: 'success',
        hideCloseButton: false,
      });
    }
  }, [preSelectedImage, setMainImageValue, addToast]);

  const cancelPreSelection = useCallback(() => {
    setPreSelectedImage(null);
  }, []);

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

              setSelectedFiles((prev) => [...prev, fileName]);
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
      setLocalMediaFiles((prev) => {
        const newFiles = [...prev];
        newFiles.splice(index, 1);

        setTimeout(() => {
          setMediaValue(newFiles);
        }, 0);

        return newFiles;
      });

      setSelectedFiles((prev) => {
        const newFiles = [...prev];
        newFiles.splice(index, 1);
        return newFiles;
      });
    },
    [setMediaValue]
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

          {mediaFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium">
                업로드된 파일 ({mediaFiles.length})
              </h4>
              <div className="space-y-2">
                {selectedFiles.map((fileName, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      uploadStatus[fileName] === 'error'
                        ? 'bg-danger-50'
                        : 'bg-default-50'
                    }`}
                    role="alert"
                    aria-label={`업로드된 파일 ${fileName} 상태`}
                  >
                    <div className="flex items-center">
                      <Icon
                        icon={
                          uploadStatus[fileName] === 'error'
                            ? 'lucide:alert-circle'
                            : getFileIcon(fileName)
                        }
                        className={
                          uploadStatus[fileName] === 'error'
                            ? 'text-danger mr-2'
                            : 'text-default-600 mr-2'
                        }
                        aria-hidden="true"
                      />
                      <div>
                        <span className="text-sm">{fileName}</span>
                        {uploadStatus[fileName] === 'error' && (
                          <p className="text-xs text-danger">
                            업로드 실패! 다시 시도해주세요.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadStatus[fileName] === 'success' && (
                        <Icon
                          icon="lucide:check-circle"
                          className="text-success"
                          aria-hidden="true"
                        />
                      )}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => removeMedia(index)}
                        type="button"
                        aria-label={`파일 ${fileName} 삭제`}
                      >
                        <Icon icon="lucide:trash-2" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AccordionField>

      {/* 업로드된 이미지 섹션 */}
      <AccordionField
        title="업로드된 이미지"
        description={
          mediaFiles.length > 0
            ? `업로드된 이미지 미리보기 (${mediaFiles.length}개)`
            : '업로드된 이미지가 여기에 표시됩니다.'
        }
        defaultExpanded={true}
      >
        {mediaFiles.length > 0 ? (
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
                      color="danger"
                      variant="solid"
                      size="sm"
                      onPress={() => removeMedia(index)}
                      type="button"
                      aria-label={`이미지 ${index + 1} 삭제`}
                    >
                      <Icon icon="lucide:trash-2" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center rounded-lg bg-default-100">
            <Icon
              icon="lucide:images"
              className="w-10 h-10 mx-auto mb-2 text-default-400"
              aria-hidden="true"
            />
            <p className="text-default-600">업로드된 이미지가 없습니다.</p>
          </div>
        )}
      </AccordionField>

      {/* 블로그 메인 이미지 선택 섹션 */}
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
                        onPress={() => preSelectImage(file)}
                        type="button"
                        aria-label={`이미지 ${index + 1} 메인 이미지로 선택`}
                      >
                        <Icon icon="lucide:star" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            {preSelectedImage && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-default-100">
                <img
                  src={preSelectedImage}
                  alt="미리 선택된 메인 이미지"
                  className="object-cover w-24 h-24 rounded"
                />
                <div>
                  <p className="text-sm font-medium">미리 선택된 메인 이미지</p>
                  <p className="text-xs text-default-600">
                    확인 버튼을 눌러 메인 이미지를 설정하세요.
                  </p>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button
                    color="primary"
                    size="sm"
                    onPress={confirmMainImage}
                    type="button"
                    aria-label="메인 이미지 확인"
                  >
                    확인
                  </Button>
                  <Button
                    color="danger"
                    variant="light"
                    size="sm"
                    onPress={cancelPreSelection}
                    type="button"
                    aria-label="선택 취소"
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
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
            <Button
              color="primary"
              variant="flat"
              size="sm"
              className="mt-3"
              startContent={<Icon icon="lucide:upload" />}
              onPress={() =>
                document
                  .getElementById('media-upload-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              type="button"
              aria-label="이미지 업로드 이동"
            >
              이미지 업로드하기
            </Button>
          </div>
        )}
      </AccordionField>

      {/* 이미지 슬라이더 섹션 */}
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
