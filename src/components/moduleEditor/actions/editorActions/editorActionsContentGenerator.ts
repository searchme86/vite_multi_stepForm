// 📁 actions/editorActions/editorActionsContentGenerator.ts

import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';

/**
 * 컨테이너와 단락들을 기반으로 최종 마크다운 콘텐츠를 생성하는 함수
 * @param containersForContent - 콘텐츠 생성에 사용할 컨테이너 배열
 * @param paragraphsForContent - 콘텐츠 생성에 사용할 단락 배열
 * @returns 최종 마크다운 형태의 완성된 콘텐츠 문자열
 *
 * 1. 이 함수의 의미: 사용자가 작성한 여러 섹션(컨테이너)과 내용(단락)을 하나의 완전한 문서로 조합
 * 2. 왜 이 함수를 사용했는지: 모듈화된 편집 방식으로 작성된 내용을 읽기 좋은 최종 문서 형태로 변환하기 위해
 *
 * 실행 매커니즘:
 * 1. 컨테이너들을 순서대로 정렬
 * 2. 각 컨테이너에 속하는 단락들을 찾아서 순서대로 정렬
 * 3. 컨테이너명을 마크다운 헤딩(##)으로 추가
 * 4. 해당 컨테이너의 단락들을 순서대로 내용에 추가
 * 5. 모든 컨테이너 처리 완료 후 최종 문자열 반환
 */
export const generateCompletedContent = (
  containersForContent: Container[], // ✨ [매개변수명 개선] containers → containersForContent로 의미 명확화
  paragraphsForContent: LocalParagraph[] // ✨ [매개변수명 개선] paragraphs → paragraphsForContent로 의미 명확화
): string => {
  console.log('📝 [CONTENT] 최종 내용 생성 시작:', {
    containerCount: containersForContent.length,
    paragraphCount: paragraphsForContent.length,
  });

  // 1. 컨테이너들을 order 속성에 따라 오름차순으로 정렬 2. 사용자가 설정한 순서대로 섹션을 배치하기 위해
  const containersSortedByOrder = [...containersForContent].sort(
    (firstContainer, secondContainer) =>
      firstContainer.order - secondContainer.order
  ); // ✨ [변수명 개선] sortedContainers → containersSortedByOrder, a,b → firstContainer,secondContainer로 의미 명확화

  // 1. 최종 완성될 콘텐츠를 저장할 문자열 변수 초기화 2. 각 섹션의 내용을 순차적으로 추가하기 위해
  let finalCompletedContent = ''; // ✨ [변수명 개선] completedContent → finalCompletedContent로 의미 명확화

  // 1. 정렬된 각 컨테이너를 순서대로 처리 2. 모든 섹션의 내용을 최종 문서에 포함시키기 위해
  containersSortedByOrder.forEach((currentContainer, _) => {
    // ✨ [매개변수명 개선] container → currentContainer, containerIndex → _ (미사용 변수)로 의미 명확화

    // 1. 현재 컨테이너에 속하는 단락들만 필터링하고 순서대로 정렬 2. 해당 섹션의 내용만 추출하여 올바른 순서로 배치하기 위해
    const paragraphsInCurrentContainer = paragraphsForContent // ✨ [변수명 개선] containerParagraphs → paragraphsInCurrentContainer로 의미 명확화
      .filter(
        (currentParagraph) =>
          currentParagraph.containerId === currentContainer.id
      ) // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order
      ); // ✨ [매개변수명 개선] a,b → firstParagraph,secondParagraph로 의미 명확화

    // 1. 현재 컨테이너에 단락이 하나 이상 있는지 확인 2. 내용이 없는 빈 섹션은 최종 문서에 포함하지 않기 위해
    if (paragraphsInCurrentContainer.length > 0) {
      console.log('📝 [CONTENT] 컨테이너 처리:', {
        containerName: currentContainer.name,
        paragraphCount: paragraphsInCurrentContainer.length,
      });

      // 1. 컨테이너 이름을 마크다운 헤딩 형태로 추가 2. 섹션 제목을 명확히 구분하기 위해
      finalCompletedContent += `\n\n## ${currentContainer.name}\n\n`;

      // 1. 현재 컨테이너의 각 단락을 순서대로 처리 2. 섹션 내의 모든 내용을 최종 문서에 추가하기 위해
      paragraphsInCurrentContainer.forEach((currentParagraph, _) => {
        // ✨ [매개변수명 개선] paragraph → currentParagraph, paragraphIndex → _ (미사용 변수)로 의미 명확화

        // 1. 단락에 실제 내용이 있고 공백이 아닌지 확인 2. 빈 단락은 최종 문서에 포함하지 않기 위해
        if (currentParagraph.content && currentParagraph.content.trim()) {
          // 1. 단락 내용의 앞뒤 공백을 제거하고 최종 콘텐츠에 추가 2. 깔끔한 문서 형태를 만들기 위해
          finalCompletedContent += currentParagraph.content.trim() + '\n\n';

          console.log('📝 [CONTENT] 단락 추가:', {
            paragraphId: currentParagraph.id,
            contentLength: currentParagraph.content.trim().length,
          });
        }
      });
    }
  });

  console.log('✅ [CONTENT] 최종 내용 생성 완료:', {
    totalLength: finalCompletedContent.length,
    isEmpty: !finalCompletedContent.trim(),
  });

  // 1. 최종 콘텐츠의 앞뒤 공백을 제거하여 반환 2. 깔끔한 문서 형태로 완성하기 위해
  return finalCompletedContent.trim();
};
