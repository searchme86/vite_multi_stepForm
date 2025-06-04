import React from "react";
import { Input, Button, Avatar, Textarea, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useFormContext } from "react-hook-form";
import AccordionField from "./accordion-field";

const UserInfoStep: React.FC = () => {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const [imageSrc, setImageSrc] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bioValue = watch("bio") || "";
  
  const emailDomains = [
    { label: "gmail.com", value: "gmail.com" },
    { label: "naver.com", value: "naver.com" },
    { label: "daum.net", value: "daum.net" },
    { label: "yahoo.com", value: "yahoo.com" },
  ];
  
  // Add image cropping state
  const [showCropper, setShowCropper] = React.useState(false);
  const [cropData, setCropData] = React.useState<string | null>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageSrc(result);
        // In a real app, we would show the cropper here
        // For now, we'll just set the image directly
        setValue("userImage", result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDomainSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDomain = e.target.value;
    if (selectedDomain) {
      setValue("emailDomain", selectedDomain);
    }
  };
  
  const clearBio = () => {
    setValue("bio", "");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-friendly wrapper */}
      <div className="bg-default-50 p-3 sm:p-4 rounded-lg">
        <h3 className="text-base sm:text-lg font-medium mb-2">유저 정보 입력 안내</h3>
        <p className="text-xs sm:text-sm text-default-600">
          블로그 작성자 정보를 입력해주세요. 닉네임, 이메일은 필수 입력 항목입니다.
        </p>
      </div>
      
      {/* User profile with responsive layout */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
        <div className="w-full sm:w-auto flex flex-col items-center">
          <div className="relative">
            <Avatar
              src={imageSrc || "https://img.heroui.chat/image/avatar?w=200&h=200&u=15"}
              className="w-28 h-28 text-large"
            />
            <Button
              isIconOnly
              color="primary"
              variant="light"
              radius="full"
              size="sm"
              className="absolute bottom-0 right-0 shadow-md"
              onPress={() => fileInputRef.current?.click()}
            >
              <Icon icon="lucide:camera" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>
        
        <div className="w-full space-y-4">
          {/* Nickname input */}
          <Input
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            {...register("nickname")}
            errorMessage={errors.nickname?.message?.toString()}
            isInvalid={!!errors.nickname}
          />
          
          {/* Email with domain selector */}
          <div className="flex flex-col sm:flex-row items-start gap-2">
            <Input
              label="이메일"
              placeholder="이메일 아이디"
              className="w-full"
              {...register("emailPrefix")}
              errorMessage={errors.emailPrefix?.message?.toString()}
              isInvalid={!!errors.emailPrefix}
            />
            
            <span className="hidden sm:block self-center mt-3">@</span>
            <span className="block sm:hidden w-full text-center">@</span>
            
            <div className="w-full flex flex-row gap-2">
              <Input
                label="도메인"
                placeholder="도메인"
                className="flex-1"
                {...register("emailDomain")}
                errorMessage={errors.emailDomain?.message?.toString()}
                isInvalid={!!errors.emailDomain}
              />
              
              <Select
                label="선택"
                placeholder="선택"
                className="w-32"
                onChange={handleDomainSelect}
              >
                {emailDomains.map((domain) => (
                  <SelectItem key={domain.value} value={domain.value}>
                    {domain.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bio - Full width on all screens */}
      <Textarea
        label="자기소개"
        placeholder="간단한 자기소개를 입력하세요"
        minRows={3}
        {...register("bio")}
      />
    </div>
  );
};

export default UserInfoStep;