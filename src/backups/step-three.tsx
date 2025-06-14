import React from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useFormContext } from "react-hook-form";

interface StepThreeProps {
  visible: boolean;
}

const StepThree: React.FC<StepThreeProps> = ({ visible }) => {
  const { register, setValue, watch } = useFormContext();
  const mediaValue = watch("media");

  const handleMediaSelect = (mediaType: string) => {
    setValue("media", mediaType);
  };

  if (!visible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">미디어 추가</h3>
      
      <input type="hidden" {...register("media")} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          isPressable 
          className={`border-2 ${mediaValue === "image" ? "border-primary" : "border-default-200"}`}
          onPress={() => handleMediaSelect("image")}
        >
          <CardBody className="flex flex-col items-center justify-center p-6">
            <Icon icon="lucide:image" className="text-4xl mb-2" />
            <p className="font-medium">이미지 추가</p>
            <p className="text-xs text-default-500 mt-1">JPG, PNG, GIF 파일 지원</p>
          </CardBody>
        </Card>
        
        <Card 
          isPressable 
          className={`border-2 ${mediaValue === "video" ? "border-primary" : "border-default-200"}`}
          onPress={() => handleMediaSelect("video")}
        >
          <CardBody className="flex flex-col items-center justify-center p-6">
            <Icon icon="lucide:video" className="text-4xl mb-2" />
            <p className="font-medium">비디오 추가</p>
            <p className="text-xs text-default-500 mt-1">MP4, WebM 파일 지원</p>
          </CardBody>
        </Card>
      </div>
      
      {mediaValue && (
        <div className="mt-4 p-4 bg-default-100 rounded-medium">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {mediaValue === "image" ? "이미지" : "비디오"} 업로드
            </p>
            <Button size="sm" color="primary" variant="flat">
              파일 선택
            </Button>
          </div>
          <p className="text-xs text-default-500 mt-2">
            선택된 미디어 유형: {mediaValue === "image" ? "이미지" : "비디오"}
          </p>
        </div>
      )}
    </div>
  );
};

export default StepThree;