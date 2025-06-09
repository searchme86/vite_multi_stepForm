// 📁 utils/markdown.tsx

import React from 'react';

export const renderMarkdown = (text: string): React.ReactNode => {
  console.log('🎨 [MARKDOWN] 렌더링 시작:', {
    textLength: text?.length,
    hasText: !!text,
  });

  if (!text || typeof text !== 'string') {
    console.log('⚠️ [MARKDOWN] 텍스트 없음 또는 잘못된 타입');
    return <span className="text-gray-400">내용이 없습니다.</span>;
  }

  console.log('🔄 [MARKDOWN] 마크다운 변환 시작');

  let formatted = text
    .replace(
      /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g,
      (match, alt, src) => {
        console.log('🖼️ [MARKDOWN] base64 이미지 처리:', {
          alt,
          srcLength: src.length,
        });
        return (
          '<img src="' +
          src +
          '" alt="' +
          alt +
          '" class="rendered-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy" />'
        );
      }
    )
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      console.log('🖼️ [MARKDOWN] URL 이미지 처리:', { alt, src });
      return (
        '<img src="' +
        src +
        '" alt="' +
        alt +
        '" class="rendered-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy" />'
      );
    })
    .replace(/<img([^>]*?)>/g, (match, attributes) => {
      if (attributes.includes('class="rendered-image"')) {
        console.log('🖼️ [MARKDOWN] 이미 스타일 적용된 img 태그 건너뛰기');
        return match;
      }
      console.log('🖼️ [MARKDOWN] HTML img 태그에 스타일 추가');
      return (
        '<img' +
        attributes +
        ' class="rendered-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy">'
      );
    })
    .replace(/^# (.*?)$/gm, (match, title) => {
      console.log('📝 [MARKDOWN] H1 제목 처리:', title);
      return '<span class="text-2xl font-bold mb-3 block">' + title + '</span>';
    })
    .replace(/^## (.*?)$/gm, (match, title) => {
      console.log('📝 [MARKDOWN] H2 제목 처리:', title);
      return '<span class="text-xl font-bold mb-2 block">' + title + '</span>';
    })
    .replace(/^### (.*?)$/gm, (match, title) => {
      console.log('📝 [MARKDOWN] H3 제목 처리:', title);
      return '<span class="text-lg font-bold mb-2 block">' + title + '</span>';
    })
    .replace(/\*\*(.*?)\*\*/g, (match, content) => {
      console.log('🔤 [MARKDOWN] 굵은 텍스트 처리:', content);
      return '<strong>' + content + '</strong>';
    })
    .replace(/\*(.*?)\*/g, (match, content) => {
      console.log('🔤 [MARKDOWN] 기울임 텍스트 처리:', content);
      return '<em>' + content + '</em>';
    })
    .replace(/`(.*?)`/g, (match, content) => {
      console.log('🔤 [MARKDOWN] 인라인 코드 처리:', content);
      return '<code class="bg-gray-100 px-1 rounded">' + content + '</code>';
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      console.log('🔗 [MARKDOWN] 링크 처리:', { text, url });
      return (
        '<a href="' +
        url +
        '" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">' +
        text +
        '</a>'
      );
    })
    .replace(/\n/g, '<br />');

  console.log('✅ [MARKDOWN] 마크다운 변환 완료:', {
    originalLength: text.length,
    formattedLength: formatted.length,
  });

  return (
    <div
      className="prose cursor-pointer max-w-none markdown-content"
      dangerouslySetInnerHTML={{ __html: formatted }}
      style={{
        wordBreak: 'break-word',
        lineHeight: '1.6',
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
          const img = target as HTMLImageElement;
          console.log('🖼️ [MARKDOWN] 이미지 클릭됨:', {
            src: img.src,
            alt: img.alt,
          });
        }
      }}
    />
  );
};
