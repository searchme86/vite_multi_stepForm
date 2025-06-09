import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface EmptyParagraphStateProps {
  addLocalParagraph: () => void;
}

function EmptyParagraphState({ addLocalParagraph }: EmptyParagraphStateProps) {
  console.log('📭 [EMPTY_PARAGRAPH] 빈 상태 렌더링');

  const handleAddFirstParagraph = () => {
    console.log('🚀 [EMPTY_PARAGRAPH] 첫 번째 단락 작성 시작');
    addLocalParagraph();
  };

  return (
    <div className="py-12 text-center text-gray-400">
      <Icon icon="lucide:file-text" className="mx-auto mb-4 text-6xl" />
      <div className="mb-2 text-lg font-medium">작성된 단락이 없습니다</div>
      <div className="text-sm">
        새 단락 버튼을 눌러 Tiptap 에디터로 글 작성을 시작하세요
      </div>
      <Button
        type="button"
        color="primary"
        className="mt-4"
        onPress={handleAddFirstParagraph}
        startContent={<Icon icon="lucide:plus" />}
        aria-label="첫 번째 단락 작성 시작"
      >
        첫 번째 단락 작성하기
      </Button>
    </div>
  );
}

export default EmptyParagraphState;
