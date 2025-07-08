// blogMediaStep/imageUpload/parts/MobileTip.tsx

import React from 'react';

interface MobileTipProps {
  isMobileDevice: boolean;
}

function MobileTip({ isMobileDevice }: MobileTipProps): React.ReactNode {
  console.log('📱 [MOBILE_TIP] MobileTip 렌더링:', {
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  if (!isMobileDevice) {
    return null;
  }

  return (
    <div
      className="p-3 text-sm text-blue-700 rounded-lg bg-blue-50"
      role="note"
      aria-labelledby="mobile-tip-heading"
    >
      <p id="mobile-tip-heading" className="font-medium">
        모바일 팁:
      </p>
      <p>
        여러 파일을 한 번에 선택하려면 파일 선택 시 여러 개를 선택하세요.
        업로드된 이미지는 가로로 스크롤하여 확인할 수 있습니다. 이미지를
        터치하면 상세 정보와 삭제 버튼을 확인할 수 있습니다.
      </p>
    </div>
  );
}

export default MobileTip;
