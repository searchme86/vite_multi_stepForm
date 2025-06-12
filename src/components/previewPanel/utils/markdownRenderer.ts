// 마크다운 텍스트를 HTML로 변환하는 렌더러
import React from 'react';

export function renderMarkdown(text: string): React.ReactElement | null {
  console.log('📝 마크다운 렌더링 시작:', text ? '텍스트 있음' : '텍스트 없음');

  if (!text) {
    console.log('⚠️ 빈 텍스트로 인해 마크다운 렌더링 중단');
    return null;
  }

  let formatted = text
    .replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-primary hover:underline">$1</a>'
    )
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/`(.*?)`/g, '<code class="bg-default-100 px-1 rounded">$1</code>')
    .replace(/\n/g, '<br />');

  if (formatted.includes('<li>')) {
    formatted = formatted.replace(
      /<li>.*?<\/li>/gs,
      (match) => `<ul class="list-disc pl-5 my-2">${match}</ul>`
    );
    formatted = formatted.replace(
      /<ul class="list-disc pl-5 my-2">(<ul class="list-disc pl-5 my-2">.*?<\/ul>)<\/ul>/g,
      '$1'
    );
  }

  console.log('✅ 마크다운 렌더링 완료');

  return (
    <div
      className="prose markdown-content max-w-none"
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
}
