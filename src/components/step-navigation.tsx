import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface StepNavigationProps {
  currentStep: number;
  goToStep: (step: number) => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({ currentStep, goToStep }) => {
  const steps = [
    { id: 1, label: "1. 블로그 기본" },
    { id: 2, label: "2. 블로그 컨텐츠" },
    { id: 3, label: "3. 블로그 미디어" },
    { id: 4, label: "4. 작성 블로그 미리보기" }
  ];

  return (
    <div className="flex overflow-x-auto pb-2 hide-scrollbar">
      <div className="flex gap-2 min-w-full">
        {steps.map((step) => (
          <Button
            key={step.id}
            variant={currentStep === step.id ? "solid" : "flat"}
            color={currentStep === step.id ? "primary" : "default"}
            onPress={() => goToStep(step.id)}
            className={`flex-1 ${currentStep === step.id ? "bg-primary-500 text-white" : "bg-default-100"}`}
            size="sm"
          >
            {step.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StepNavigation;