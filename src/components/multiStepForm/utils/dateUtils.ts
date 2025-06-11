export const getCurrentDateString = (): string => {
  console.log('📅 getCurrentDateString: 현재 날짜 문자열 생성');
  const dateString = new Date().toISOString().split('T')[0];
  console.log('📅 getCurrentDateString 결과:', dateString);
  return dateString;
};

export const getCurrentTimeString = (): string => {
  console.log('⏰ getCurrentTimeString: 현재 시간 문자열 생성');
  const timeString = new Date().toLocaleTimeString();
  console.log('⏰ getCurrentTimeString 결과:', timeString);
  return timeString;
};
