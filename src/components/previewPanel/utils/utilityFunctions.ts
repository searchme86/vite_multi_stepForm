//====여기부터 수정됨====
// 원본 코드에서 누락된 유틸리티 함수들
export function formatDate(dateString: string): string {
  console.log('📅 날짜 포맷팅:', dateString);

  if (!dateString) {
    return new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function combineEmail(emailPrefix: string, emailDomain: string): string {
  console.log('📧 이메일 조합:', { emailPrefix, emailDomain });

  if (!emailPrefix || !emailDomain) {
    return '';
  }

  return `${emailPrefix}@${emailDomain}`;
}

export function getCurrentFormattedDate(): string {
  return formatDate(new Date().toISOString());
}
//====여기까지 수정됨====
