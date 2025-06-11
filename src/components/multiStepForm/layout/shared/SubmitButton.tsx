import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

function SubmitButton() {
  console.log('📤 SubmitButton: 제출 버튼 렌더링');

  return (
    <Button
      color="primary"
      type="submit"
      endContent={<Icon icon="lucide:check" className="hidden sm:inline" />}
      className="px-3 sm:px-4"
    >
      <span className="hidden sm:inline">제출하기</span>
      <span className="inline sm:hidden">제출</span>
    </Button>
  );
}

export default SubmitButton;
