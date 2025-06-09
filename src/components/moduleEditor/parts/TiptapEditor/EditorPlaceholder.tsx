import Placeholder from '@tiptap/extension-placeholder';

export function createPlaceholderExtension() {
  console.log('📝 [PLACEHOLDER] Placeholder 확장 생성');

  return Placeholder.configure({
    placeholder: ({ node }) => {
      console.log('📝 [PLACEHOLDER] 플레이스홀더 설정:', {
        nodeType: node.type.name,
      });

      if (node.type.name === 'heading') {
        return '제목을 입력하세요...';
      }
      return '마크다운 형식으로 내용을 작성하세요...\n\n🖼️ 이미지 추가 방법:\n• 파일을 드래그 앤 드롭\n• Ctrl+V로 클립보드에서 붙여넣기\n• 툴바의 이미지 버튼 클릭\n\n지원 형식: JPG, PNG, GIF, WebP, SVG (최대 10MB)';
    },
  });
}

export default createPlaceholderExtension;
