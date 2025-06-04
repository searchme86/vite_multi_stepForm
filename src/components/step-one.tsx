import React from "react";
import { Input, Textarea, Checkbox, CheckboxGroup, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useFormContext } from "react-hook-form";

interface StepOneProps {
  visible: boolean;
}

const StepOne: React.FC<StepOneProps> = ({ visible }) => {
  const { register, formState: { errors }, setValue } = useFormContext();

  // Add this function to handle checkbox changes and convert to string
  const handleCheckboxChange = (values: string[]) => {
    setValue("keywords", values.join(','));
  };

  if (!visible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">포스트 작성 유의사항</h3>
      
      <ul className="list-disc pl-5 space-y-2 text-default-600">
        <li>제목은 5자 이상 100자 이하로 작성해주세요.</li>
        <li>요약은 10자 이상 작성해주세요.</li>
        <li>카테고리를 반드시 선택해주세요.</li>
      </ul>
      
      <div className="space-y-4 mt-6">
        <Input
          label="제목"
          placeholder="블로그 제목을 입력하세요"
          {...register("title")}
          errorMessage={errors.title?.message?.toString()}
          isInvalid={!!errors.title}
        />
        
        <Textarea
          label="요약"
          placeholder="블로그 내용을 요약해주세요"
          {...register("description")}
          errorMessage={errors.description?.message?.toString()}
          isInvalid={!!errors.description}
        />
        
        <div>
          <p className="text-sm mb-2">카테고리 선택</p>
          <CheckboxGroup
            orientation="horizontal"
            color="primary"
            onValueChange={handleCheckboxChange}
          >
            <Checkbox value="tech">기술</Checkbox>
            <Checkbox value="lifestyle">라이프스타일</Checkbox>
            <Checkbox value="travel">여행</Checkbox>
            <Checkbox value="food">음식</Checkbox>
          </CheckboxGroup>
          <input type="hidden" {...register("keywords")} />
          {errors.keywords && (
            <p className="text-danger text-xs mt-1">{errors.keywords.message?.toString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepOne;