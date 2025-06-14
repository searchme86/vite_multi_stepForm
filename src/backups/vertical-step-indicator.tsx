import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface VerticalStepIndicatorProps {
  currentStep: number;
  goToStep: (step: number) => void;
}

const VerticalStepIndicator: React.FC<VerticalStepIndicatorProps> = ({
  currentStep,
  goToStep,
}) => {
  const steps = [
    {
      id: 1,
      label: '블로그 기본',
      description: '제목, 요약 및 카테고리 정보',
    },
    {
      id: 2,
      label: '블로그 컨텐츠',
      description: '블로그 포스트의 본문 내용',
    },
    {
      id: 3,
      label: '블로그 미디어',
      description: '이미지 또는 비디오 추가',
    },
    {
      id: 4,
      label: '작성 블로그 미리보기',
      description: '게시 설정 및 최종 확인',
    },
  ];

  return (
    <div className="p-6 bg-default-50 rounded-xl">
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${
                        isCompleted
                          ? 'bg-primary text-white'
                          : isActive
                          ? 'bg-primary ring-4 ring-primary-100 text-white'
                          : 'bg-default-200 text-default-600'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Icon icon="lucide:check" width={16} height={16} />
                    ) : (
                      step.id
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={`
                        h-14 w-0.5
                        ${
                          index < currentStep - 1
                            ? 'bg-primary'
                            : 'bg-default-200'
                        }
                      `}
                    />
                  )}
                </div>

                <Button
                  variant="light"
                  disableRipple
                  className={`
                    flex flex-col items-start px-0 hover:bg-transparent w-full
                    ${isActive ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  onPress={() => goToStep(step.id)}
                >
                  <span
                    className={`
                      font-medium
                      ${
                        isActive || isCompleted
                          ? 'text-primary'
                          : 'text-default-600'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs text-default-500">
                    {step.description}
                  </span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerticalStepIndicator;
