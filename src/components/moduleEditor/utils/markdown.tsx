import React from 'react';

export const renderMarkdown = (text: string): React.ReactNode => {
  console.log('🎨 [MARKDOWN] ============ 렌더링 시작 ============');
  console.log('🎨 [MARKDOWN] 입력 텍스트 전체:', {
    textLength: text?.length,
    hasText: !!text,
    fullText: text,
    containsImageMarkdown: text?.includes('!['),
    containsBase64: text?.includes('data:image'),
    containsHtmlImg: text?.includes('<img'),
  });

  if (!text || typeof text !== 'string') {
    console.log('⚠️ [MARKDOWN] 텍스트 없음 또는 잘못된 타입');
    return <span className="text-gray-400">내용이 없습니다.</span>;
  }

  console.log(
    '🔄 [MARKDOWN] 마크다운 변환 시작 - 이미지 플레이스홀더 방식 적용'
  );

  let formatted = text;
  const imagePlaceholders: { [key: string]: string } = {};
  let imageCounter = 0;

  console.log(
    '🖼️ [MARKDOWN] ===== 1단계: 이미지를 플레이스홀더로 치환 시작 ====='
  );
  console.log('🖼️ [MARKDOWN] 치환 전 텍스트:', formatted);

  console.log('🖼️ [MARKDOWN] base64 이미지 패턴 검색 중...');
  const base64Pattern =
    /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)[^)]*\)/g;
  let base64Matches = [...formatted.matchAll(base64Pattern)];
  console.log('🖼️ [MARKDOWN] base64 이미지 매치 결과:', {
    matchCount: base64Matches.length,
    matches: base64Matches.map((match) => ({
      fullMatch: match[0].slice(0, 100) + '...',
      alt: match[1],
      srcStart: match[2].slice(0, 50) + '...',
      hasTitle: match[0].includes('"'),
    })),
  });

  formatted = formatted.replace(base64Pattern, (match, alt, src) => {
    const placeholder = `__IMAGE_PLACEHOLDER_${imageCounter++}__`;
    console.log('🖼️ [MARKDOWN] base64 이미지 발견 및 플레이스홀더 생성:', {
      matchNumber: imageCounter,
      alt,
      srcLength: src.length,
      srcStart: src.slice(0, 50),
      placeholder,
      originalMatch: match.slice(0, 100) + '...',
    });

    const imgHtml =
      '<img src="' +
      src +
      '" alt="' +
      alt +
      '" class="rendered-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy" />';
    imagePlaceholders[placeholder] = imgHtml;

    console.log('🖼️ [MARKDOWN] 생성된 HTML:', imgHtml.slice(0, 200) + '...');
    return placeholder;
  });

  console.log('🖼️ [MARKDOWN] base64 처리 후 텍스트:', formatted);

  console.log('🖼️ [MARKDOWN] URL 이미지 패턴 검색 중...');
  const urlPattern = /!\[([^\]]*)\]\(((?!data:image)[^)]+)\)/g;
  let urlMatches = [...formatted.matchAll(urlPattern)];
  console.log('🖼️ [MARKDOWN] URL 이미지 매치 결과:', {
    matchCount: urlMatches.length,
    matches: urlMatches.map((match) => ({
      fullMatch: match[0],
      alt: match[1],
      src: match[2],
      isNotBase64: !match[2].startsWith('data:image'),
    })),
  });

  formatted = formatted.replace(urlPattern, (match, alt, src) => {
    const placeholder = `__IMAGE_PLACEHOLDER_${imageCounter++}__`;
    console.log('🖼️ [MARKDOWN] URL 이미지 발견 및 플레이스홀더 생성:', {
      matchNumber: imageCounter,
      alt,
      src,
      placeholder,
      originalMatch: match,
    });

    const imgHtml =
      '<img src="' +
      src +
      '" alt="' +
      alt +
      '" class="rendered-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy" />';
    imagePlaceholders[placeholder] = imgHtml;

    console.log('🖼️ [MARKDOWN] 생성된 HTML:', imgHtml);
    return placeholder;
  });

  console.log('🖼️ [MARKDOWN] ===== 이미지 플레이스홀더 생성 완료 =====');
  console.log('🖼️ [MARKDOWN] 결과:', {
    totalImages: imageCounter,
    placeholders: Object.keys(imagePlaceholders),
    textAfterImageReplacement: formatted,
    placeholderDetails: imagePlaceholders,
  });

  console.log('📝 [MARKDOWN] ===== 2단계: 제목 처리 시작 =====');
  const beforeHeadings = formatted;

  formatted = formatted.replace(/^# (.*?)$/gm, (match, title) => {
    console.log('📝 [MARKDOWN] H1 제목 처리:', title);
    return '<span class="text-2xl font-bold mb-3 block">' + title + '</span>';
  });

  formatted = formatted.replace(/^## (.*?)$/gm, (match, title) => {
    console.log('📝 [MARKDOWN] H2 제목 처리:', title);
    return '<span class="text-xl font-bold mb-2 block">' + title + '</span>';
  });

  formatted = formatted.replace(/^### (.*?)$/gm, (match, title) => {
    console.log('📝 [MARKDOWN] H3 제목 처리:', title);
    return '<span class="text-lg font-bold mb-2 block">' + title + '</span>';
  });

  if (beforeHeadings !== formatted) {
    console.log('📝 [MARKDOWN] 제목 처리 후 변화:', {
      before: beforeHeadings,
      after: formatted,
    });
  }

  console.log('🔤 [MARKDOWN] ===== 3단계: 텍스트 스타일 처리 시작 =====');
  const beforeStyles = formatted;

  formatted = formatted.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    console.log('🔤 [MARKDOWN] 굵은 텍스트 처리:', content);
    return '<strong>' + content + '</strong>';
  });

  formatted = formatted.replace(/\*(.*?)\*/g, (match, content) => {
    console.log('🔤 [MARKDOWN] 기울임 텍스트 처리:', content);
    return '<em>' + content + '</em>';
  });

  formatted = formatted.replace(/`(.*?)`/g, (match, content) => {
    console.log('🔤 [MARKDOWN] 인라인 코드 처리:', content);
    return '<code class="bg-gray-100 px-1 rounded">' + content + '</code>';
  });

  if (beforeStyles !== formatted) {
    console.log('🔤 [MARKDOWN] 스타일 처리 후 변화:', {
      before: beforeStyles,
      after: formatted,
    });
  }

  console.log('🔗 [MARKDOWN] ===== 4단계: 링크 처리 시작 =====');
  const beforeLinks = formatted;

  console.log('🔗 [MARKDOWN] 링크 패턴 검색 중...');
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatches = [...formatted.matchAll(linkPattern)];
  console.log('🔗 [MARKDOWN] 링크 매치 결과:', {
    matchCount: linkMatches.length,
    matches: linkMatches.map((match) => ({
      fullMatch: match[0],
      text: match[1],
      url: match[2],
      containsPlaceholder: match[2].includes('__IMAGE_PLACEHOLDER_'),
      isImageLink: match[0].startsWith('!['),
      isBase64: match[2].startsWith('data:image'),
    })),
  });

  formatted = formatted.replace(linkPattern, (match, text, url) => {
    if (url.includes('__IMAGE_PLACEHOLDER_')) {
      console.log(
        '🔗 [MARKDOWN] 이미지 플레이스홀더가 포함된 링크 패턴 무시:',
        { match, text, url }
      );
      return match;
    }
    if (match.startsWith('![')) {
      console.log('🔗 [MARKDOWN] 이미지 마크다운 패턴 무시:', {
        match,
        text,
        url,
      });
      return match;
    }
    if (url.startsWith('data:image')) {
      console.log('🔗 [MARKDOWN] base64 이미지 링크 무시:', {
        match,
        text,
        url,
      });
      return match;
    }
    console.log('🔗 [MARKDOWN] 링크 처리:', { text, url });
    return (
      '<a href="' +
      url +
      '" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">' +
      text +
      '</a>'
    );
  });

  if (beforeLinks !== formatted) {
    console.log('🔗 [MARKDOWN] 링크 처리 후 변화:', {
      before: beforeLinks,
      after: formatted,
    });
  }

  console.log('📄 [MARKDOWN] ===== 5단계: 줄바꿈 처리 =====');
  const beforeLineBreaks = formatted;
  formatted = formatted.replace(/\n/g, '<br />');

  if (beforeLineBreaks !== formatted) {
    console.log('📄 [MARKDOWN] 줄바꿈 처리 후 변화:', {
      lineBreakCount: (formatted.match(/<br \/>/g) || []).length,
      before: beforeLineBreaks,
      after: formatted,
    });
  }

  console.log('🖼️ [MARKDOWN] ===== 6단계: 이미지 플레이스홀더 복원 시작 =====');
  console.log('🖼️ [MARKDOWN] 복원 전 텍스트:', formatted);
  console.log(
    '🖼️ [MARKDOWN] 복원할 플레이스홀더들:',
    Object.keys(imagePlaceholders)
  );

  Object.keys(imagePlaceholders).forEach((placeholder, index) => {
    const before = formatted.includes(placeholder);
    const beforeText = formatted;
    formatted = formatted.replace(placeholder, imagePlaceholders[placeholder]);
    const after = formatted.includes(placeholder);

    console.log(
      `🖼️ [MARKDOWN] 플레이스홀더 복원 ${index + 1}/${
        Object.keys(imagePlaceholders).length
      }:`,
      {
        placeholder,
        foundBefore: before,
        foundAfter: after,
        replacementLength: imagePlaceholders[placeholder].length,
        beforeReplace: beforeText.includes(placeholder),
        afterReplace: formatted.includes(placeholder),
        textBefore: beforeText,
        textAfter: formatted,
      }
    );
  });

  console.log('🖼️ [MARKDOWN] 복원 완료 후 텍스트:', formatted);

  console.log('🔧 [MARKDOWN] ===== 7단계: HTML img 태그 스타일 추가 =====');
  const beforeImgStyle = formatted;

  console.log('🔧 [MARKDOWN] HTML img 태그 검색 중...');
  const imgTags = formatted.match(/<img[^>]*>/g) || [];
  console.log('🔧 [MARKDOWN] 발견된 img 태그들:', imgTags);

  formatted = formatted.replace(/<img([^>]*?)>/g, (match, attributes) => {
    if (attributes.includes('class="rendered-image"')) {
      console.log('🖼️ [MARKDOWN] 이미 스타일 적용된 img 태그 건너뛰기:', match);
      return match;
    }
    console.log('🖼️ [MARKDOWN] HTML img 태그에 스타일 추가:', {
      match,
      attributes,
    });
    const result =
      '<img' +
      attributes +
      ' class="rendered-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy">';
    console.log('🖼️ [MARKDOWN] 스타일 추가 결과:', result);
    return result;
  });

  if (beforeImgStyle !== formatted) {
    console.log('🔧 [MARKDOWN] img 스타일 처리 후 변화:', {
      before: beforeImgStyle,
      after: formatted,
    });
  }

  console.log('✅ [MARKDOWN] ============ 마크다운 변환 완료 ============');
  console.log('✅ [MARKDOWN] 최종 결과:', {
    originalText: text,
    originalLength: text.length,
    formattedText: formatted,
    formattedLength: formatted.length,
    totalImagesProcessed: imageCounter,
    finalImageCount: (formatted.match(/<img[^>]*>/g) || []).length,
    containsPlaceholders: formatted.includes('__IMAGE_PLACEHOLDER_'),
    finalImageTags: formatted.match(/<img[^>]*>/g) || [],
    placeholdersUsed: Object.keys(imagePlaceholders),
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
            src: img.src.slice(0, 100) + '...',
            alt: img.alt,
            className: img.className,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            currentSrc: img.currentSrc,
          });
        }
      }}
    />
  );
};
