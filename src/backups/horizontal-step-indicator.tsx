import React from "react";

interface HorizontalStepIndicatorProps {
  currentStep: number;
}

const HorizontalStepIndicator: React.FC<HorizontalStepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "기본 정보", time: "약 3분" },
    { id: 2, label: "컨텐츠", time: "약 5분" },
    { id: 3, label: "미디어", time: "약 2분" },
    { id: 4, label: "미리보기", time: "약 1분" }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;
          
          // Calculate the progress for the connector line
          const showConnector = index < steps.length - 1;
          const connectorClass = isCompleted 
            ? "bg-primary" 
            : "bg-default-200";
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center">
                  {/* Step indicator circle */}
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium
                      ${isCompleted 
                        ? "bg-primary text-white" 
                        : isActive 
                          ? "bg-primary ring-4 ring-primary-100 text-white" 
                          : "bg-default-200 text-default-600"}
                    `}
                  >
                    {step.id}
                  </div>
                </div>
                
                {/* Step label */}
                <div className="mt-2">
                  <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-default-600"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-default-400">
                    {step.time}
                  </p>
                </div>
              </div>
              
              {/* Connector line */}
              {showConnector && (
                <div className="flex-1 flex items-center mx-2">
                  <div className={`h-0.5 w-full ${connectorClass}`}></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalStepIndicator;