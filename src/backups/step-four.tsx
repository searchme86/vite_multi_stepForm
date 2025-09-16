import React from "react";
import { Input, Card, CardBody } from "@heroui/react";
import { useFormContext } from "react-hook-form";

interface StepFourProps {
  visible: boolean;
}

const StepFour: React.FC<StepFourProps> = ({ visible }) => {
  const { register, watch } = useFormContext();
  const formValues = watch();

  if (!visible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">게시 설정</h3>
      
      <Input
        type="date"
        label="게시 날짜"
        {...register("publishDate")}
      />
      
      <Card className="mt-6">
        <CardBody>
          <h4 className="text-lg font-medium mb-2">포스트 미리보기</h4>
          
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm text-default-500">제목</p>
              <p className="font-medium">{formValues.title || "제목이 입력되지 않았습니다."}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">요약</p>
              <p>{formValues.description || "요약이 입력되지 않았습니다."}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">카테고리</p>
              <p>{formValues.keywords || "카테고리가 선택되지 않았습니다."}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">내용 미리보기</p>
              <p className="line-clamp-3">{formValues.content || "내용이 입력되지 않았습니다."}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">미디어 유형</p>
              <p>{formValues.media || "미디어가 선택되지 않았습니다."}</p>
            </div>
            
            <div>
              <p className="text-sm text-default-500">게시 날짜</p>
              <p>{formValues.publishDate || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default StepFour;