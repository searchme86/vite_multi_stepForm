import React from "react";
import { Textarea } from "@heroui/react";
import { useFormContext } from "react-hook-form";

interface StepTwoProps {
  visible: boolean;
}

const StepTwo: React.FC<StepTwoProps> = ({ visible }) => {
  const { register, formState: { errors } } = useFormContext();

  if (!visible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">블로그 내용 작성</h3>
      
      <Textarea
        label="내용"
        placeholder="블로그 내용을 작성해주세요"
        minRows={10}
        {...register("content")}
        errorMessage={errors.content?.message?.toString()}
        isInvalid={!!errors.content}
      />
      
      <div className="mt-4 p-4 bg-default-100 rounded-medium">
        <p className="text-xs text-default-500">
          블로그 제목이 최소 5자 이상이어야 합니다.
        </p>
      </div>
    </div>
  );
};

export default StepTwo;