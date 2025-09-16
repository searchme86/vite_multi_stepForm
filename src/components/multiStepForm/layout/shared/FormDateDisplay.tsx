import { getCurrentDateString } from '../../utils/dateUtils';

function FormDateDisplay() {
  console.log('📅 FormDateDisplay: 폼 날짜 표시 컴포넌트 렌더링');

  const currentDate = getCurrentDateString();

  return (
    <span className="text-xs sm:text-sm text-default-500 sm:inline">
      작성 날짜: {currentDate}
    </span>
  );
}

export default FormDateDisplay;
