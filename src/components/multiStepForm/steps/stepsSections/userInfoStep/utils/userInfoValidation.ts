// userInfoStep/utils/userInfoValidation.ts

import { isNonEmptyString, debugTypeCheck } from '../types/userInfoTypes';

/**
 * UserInfoStep 컴포넌트의 검증 관련 유틸리티 함수들
 * 이메일, 닉네임, 이미지 등의 유효성 검사를 담당합니다.
 */

// 📧 이메일 도메인 검증
export const validateEmailDomain = (domain: string): boolean => {
  console.log('📧 validateEmailDomain: 도메인 검증 시작', domain);
  debugTypeCheck(domain, 'string');

  if (!isNonEmptyString(domain)) {
    console.log('❌ validateEmailDomain: 빈 도메인 값');
    return false;
  }

  // 기본적인 도메인 형식 검증 (점이 포함되어야 함)
  const isValid = domain.includes('.') && domain.length > 3;
  console.log(`✅ validateEmailDomain: 검증 결과 - ${isValid}`);

  return isValid;
};

// 👤 닉네임 길이 검증
export const validateNicknameLength = (nickname: string): boolean => {
  console.log('👤 validateNicknameLength: 닉네임 길이 검증 시작', nickname);
  debugTypeCheck(nickname, 'string');

  if (!isNonEmptyString(nickname)) {
    console.log('❌ validateNicknameLength: 빈 닉네임 값');
    return false;
  }

  const isValid = nickname.trim().length >= 4;
  console.log(
    `✅ validateNicknameLength: 검증 결과 - ${isValid}, 길이: ${
      nickname.trim().length
    }`
  );

  return isValid;
};

// 📧 이메일 prefix 검증
export const validateEmailPrefix = (prefix: string): boolean => {
  console.log('📧 validateEmailPrefix: 이메일 prefix 검증 시작', prefix);
  debugTypeCheck(prefix, 'string');

  if (!isNonEmptyString(prefix)) {
    console.log('❌ validateEmailPrefix: 빈 prefix 값');
    return false;
  }

  // 영문, 숫자, 일부 특수문자만 허용
  const emailPrefixRegex = /^[a-zA-Z0-9._-]+$/;
  const isValid = emailPrefixRegex.test(prefix);
  console.log(`✅ validateEmailPrefix: 검증 결과 - ${isValid}`);

  return isValid;
};

// 🖼️ 이미지 파일 크기 검증 (최대 5MB)
export const validateImageSize = (file: File): boolean => {
  console.log('🖼️ validateImageSize: 이미지 크기 검증 시작', {
    name: file.name,
    size: file.size,
    type: file.type,
  });

  const maxSize = 5 * 1024 * 1024; // 5MB
  const isValid = file.size <= maxSize;

  console.log(
    `✅ validateImageSize: 검증 결과 - ${isValid}, 크기: ${(
      file.size /
      1024 /
      1024
    ).toFixed(2)}MB`
  );

  return isValid;
};

// 🎯 종합 사용자 정보 검증
export const validateUserInfo = (userInfo: {
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
}): { isValid: boolean; errors: string[] } => {
  console.log('🎯 validateUserInfo: 종합 검증 시작', userInfo);

  const errors: string[] = [];

  // 닉네임 검증
  if (!validateNicknameLength(userInfo.nickname)) {
    errors.push('닉네임은 최소 4자 이상이어야 합니다.');
  }

  // 이메일 prefix 검증
  if (!validateEmailPrefix(userInfo.emailPrefix)) {
    errors.push('올바른 이메일 형식을 입력해주세요.');
  }

  // 이메일 도메인 검증
  if (!validateEmailDomain(userInfo.emailDomain)) {
    errors.push('올바른 이메일 도메인을 선택해주세요.');
  }

  const isValid = errors.length === 0;
  console.log(`🎯 validateUserInfo: 종합 검증 완료 - ${isValid}`, { errors });

  return { isValid, errors };
};
