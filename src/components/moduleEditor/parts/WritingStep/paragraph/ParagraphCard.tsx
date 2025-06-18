// 📁 src/components/moduleEditor/parts/WritingStep/paragraph/ParagraphCard.tsx

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import TiptapEditor from '../../TiptapEditor/TiptapEditor';
import ParagraphActions from './ParagraphActions';
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParagraphCardProps {
  paragraph: LocalParagraph;
  internalState: EditorInternalState;
  sortedContainers: Container[];
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
}

function ParagraphCard({
  paragraph,
  internalState,
  sortedContainers,
  deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
}: ParagraphCardProps) {
  const lastContentRef = useRef<string>(paragraph.content);
  const updateCountRef = useRef<number>(0);
  const pendingUpdateRef = useRef<string | null>(null);
  const [forceUpdateKey, setForceUpdateKey] = useState<number>(0);
  const timeoutRef = useRef<number | null>(null);

  console.log('📄 [PARAGRAPH_CARD] 렌더링 (Zustand 통합 모드):', {
    paragraphId: paragraph.id,
    contentLength: paragraph.content?.length || 0,
    isActive: internalState.activeParagraphId === paragraph.id,
    isSelected: internalState.selectedParagraphIds.includes(paragraph.id),
    updateFunctionType: typeof updateLocalParagraphContent,
    lastContentLength: lastContentRef.current?.length || 0,
    contentChanged: paragraph.content !== lastContentRef.current,
    updateCount: updateCountRef.current,
    hasPendingUpdate: !!pendingUpdateRef.current,
    forceUpdateKey,
  });

  useEffect(() => {
    console.log('🔍 [PARAGRAPH_CARD] useEffect 실행됨 (단순화):', {
      paragraphId: paragraph.id,
      currentContent: paragraph.content?.substring(0, 50),
      currentLength: paragraph.content?.length || 0,
      lastContent: lastContentRef.current?.substring(0, 50),
      lastLength: lastContentRef.current?.length || 0,
      hasPending: !!pendingUpdateRef.current,
      pendingContent: pendingUpdateRef.current?.substring(0, 50),
      contentChanged: paragraph.content !== lastContentRef.current,
      forceUpdateKey,
    });

    if (paragraph.content !== lastContentRef.current) {
      console.log('🔄 [PARAGRAPH_CARD] Content 변경 감지:', {
        paragraphId: paragraph.id,
        oldContent: lastContentRef.current?.substring(0, 50),
        newContent: paragraph.content?.substring(0, 50),
        oldLength: lastContentRef.current?.length || 0,
        newLength: paragraph.content?.length || 0,
        wasPending: pendingUpdateRef.current?.substring(0, 50),
      });

      if (pendingUpdateRef.current) {
        const isExactMatch = pendingUpdateRef.current === paragraph.content;
        const isLengthSimilar =
          Math.abs(
            (pendingUpdateRef.current?.length || 0) -
              (paragraph.content?.length || 0)
          ) < 100;
        const hasContent = paragraph.content && paragraph.content.length > 0;

        console.log('🧮 [PARAGRAPH_CARD] 업데이트 성공 여부 계산:', {
          paragraphId: paragraph.id,
          isExactMatch,
          isLengthSimilar,
          hasContent,
          pendingLength: pendingUpdateRef.current?.length || 0,
          actualLength: paragraph.content?.length || 0,
        });

        if (isExactMatch || (isLengthSimilar && hasContent)) {
          console.log(
            '✅ [PARAGRAPH_CARD] 업데이트 후 상태 확인: updateSuccessful: true',
            {
              paragraphId: paragraph.id,
              matchType: isExactMatch ? '정확일치' : '길이유사',
              contentLength: paragraph.content.length,
              pendingLength: pendingUpdateRef.current.length,
            }
          );
          pendingUpdateRef.current = null;
          setForceUpdateKey((prev) => prev + 1);
        } else {
          console.log(
            '❌ [PARAGRAPH_CARD] 업데이트 후 상태 확인: updateSuccessful: false',
            {
              paragraphId: paragraph.id,
              expectedLength: pendingUpdateRef.current.length,
              actualLength: paragraph.content.length,
              lengthDiff: Math.abs(
                pendingUpdateRef.current.length - paragraph.content.length
              ),
            }
          );

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            if (
              pendingUpdateRef.current &&
              paragraph.content &&
              paragraph.content.length > 0 &&
              pendingUpdateRef.current.length === paragraph.content.length
            ) {
              console.log('⏰ [PARAGRAPH_CARD] 타임아웃 후 강제 성공 처리:', {
                paragraphId: paragraph.id,
                finalLength: paragraph.content.length,
              });
              pendingUpdateRef.current = null;
              setForceUpdateKey((prev) => prev + 1);
            }
          }, 3000);
        }
      }

      lastContentRef.current = paragraph.content;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [paragraph.content, paragraph.id]);

  const isActive = useMemo(
    () => internalState.activeParagraphId === paragraph.id,
    [internalState.activeParagraphId, paragraph.id]
  );

  const isSelected = useMemo(
    () => internalState.selectedParagraphIds.includes(paragraph.id),
    [internalState.selectedParagraphIds, paragraph.id]
  );

  const handleSelectionChange = useCallback(() => {
    console.log('☑️ [PARAGRAPH_CARD] 선택 상태 변경:', {
      paragraphId: paragraph.id,
      currentlySelected: isSelected,
      toggleFunctionType: typeof toggleParagraphSelection,
    });

    if (
      toggleParagraphSelection &&
      typeof toggleParagraphSelection === 'function'
    ) {
      try {
        toggleParagraphSelection(paragraph.id);
        console.log('✅ [PARAGRAPH_CARD] toggleParagraphSelection 호출 성공');
      } catch (error) {
        console.error(
          '❌ [PARAGRAPH_CARD] toggleParagraphSelection 호출 실패:',
          error
        );
      }
    } else {
      console.error(
        '❌ [PARAGRAPH_CARD] toggleParagraphSelection이 함수가 아님:',
        {
          type: typeof toggleParagraphSelection,
          value: toggleParagraphSelection,
        }
      );
    }
  }, [paragraph.id, isSelected, toggleParagraphSelection]);

  const handleContentChange = useCallback(
    (content: string) => {
      updateCountRef.current += 1;
      pendingUpdateRef.current = content;

      console.log('✏️ [PARAGRAPH_CARD] 내용 변경 콜백 시작:', {
        paragraphId: paragraph.id,
        contentLength: content?.length || 0,
        contentPreview:
          content?.substring(0, 100) + (content?.length > 100 ? '...' : ''),
        updateFunctionType: typeof updateLocalParagraphContent,
        updateCount: updateCountRef.current,
        currentParagraphContent: paragraph.content?.substring(0, 50),
        timestamp: new Date().toISOString(),
      });

      console.log('🔍 [PARAGRAPH_CARD] 업데이트 전 상태:', {
        paragraphId: paragraph.id,
        currentContent: paragraph.content || '',
        newContent: content || '',
        isSameContent: paragraph.content === content,
        functionExists: !!updateLocalParagraphContent,
        functionType: typeof updateLocalParagraphContent,
      });

      if (paragraph.content === content) {
        console.log('ℹ️ [PARAGRAPH_CARD] 동일한 내용, 업데이트 스킵');
        pendingUpdateRef.current = null;
        return;
      }

      if (
        updateLocalParagraphContent &&
        typeof updateLocalParagraphContent === 'function'
      ) {
        try {
          console.log(
            '🚀 [PARAGRAPH_CARD] updateLocalParagraphContent 호출 시작'
          );

          updateLocalParagraphContent(paragraph.id, content);

          console.log(
            '✅ [PARAGRAPH_CARD] updateLocalParagraphContent 호출 완료:',
            {
              paragraphId: paragraph.id,
              contentLength: content?.length || 0,
              updateCount: updateCountRef.current,
            }
          );
        } catch (error) {
          console.error(
            '❌ [PARAGRAPH_CARD] updateLocalParagraphContent 호출 실패:',
            {
              paragraphId: paragraph.id,
              error: error instanceof Error ? error.message : error,
              stack: error instanceof Error ? error.stack : 'No stack',
            }
          );
          pendingUpdateRef.current = null;
        }
      } else {
        console.error(
          '❌ [PARAGRAPH_CARD] updateLocalParagraphContent가 함수가 아님:',
          {
            type: typeof updateLocalParagraphContent,
            value: updateLocalParagraphContent,
            paragraphId: paragraph.id,
          }
        );
        pendingUpdateRef.current = null;
      }
    },
    [paragraph.id, paragraph.content, updateLocalParagraphContent]
  );

  const handleDelete = useCallback(() => {
    console.log('🗑️ [PARAGRAPH_CARD] 단락 삭제:', {
      paragraphId: paragraph.id,
      paragraphContent: paragraph.content,
      deleteFunctionType: typeof deleteLocalParagraph,
    });

    if (deleteLocalParagraph && typeof deleteLocalParagraph === 'function') {
      if (paragraph.content?.trim().length > 0) {
        const confirmDelete = window.confirm(
          `단락을 삭제하시겠습니까?\n\n내용: "${paragraph.content.substring(
            0,
            50
          )}${paragraph.content.length > 50 ? '...' : ''}"`
        );

        if (!confirmDelete) {
          console.log('ℹ️ [PARAGRAPH_CARD] 삭제 취소됨');
          return;
        }
      }

      try {
        deleteLocalParagraph(paragraph.id);
        console.log('✅ [PARAGRAPH_CARD] deleteLocalParagraph 호출 성공:', {
          paragraphId: paragraph.id,
        });
      } catch (error) {
        console.error('❌ [PARAGRAPH_CARD] deleteLocalParagraph 호출 실패:', {
          paragraphId: paragraph.id,
          error,
        });
      }
    } else {
      console.error('❌ [PARAGRAPH_CARD] deleteLocalParagraph가 함수가 아님:', {
        type: typeof deleteLocalParagraph,
        value: deleteLocalParagraph,
      });
    }
  }, [paragraph.id, paragraph.content, deleteLocalParagraph]);

  const cardClassName = useMemo(() => {
    const baseClasses =
      'group relative bg-white rounded-lg transition-all duration-200';
    const borderClasses = isActive
      ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
      : 'border border-gray-200 hover:border-gray-300';
    const selectionClasses = isSelected
      ? 'bg-blue-50 ring-1 ring-blue-300'
      : 'hover:bg-gray-50';

    return `${baseClasses} ${borderClasses} ${selectionClasses}`;
  }, [isActive, isSelected]);

  const handleForceSync = useCallback(() => {
    console.log('🔄 [PARAGRAPH_CARD] 강제 동기화 요청:', {
      paragraphId: paragraph.id,
      currentContent: paragraph.content?.substring(0, 50),
      currentLength: paragraph.content?.length || 0,
    });

    const editorElement = document.querySelector(
      `[data-paragraph-id="${paragraph.id}"] .ProseMirror`
    );
    if (editorElement) {
      const currentHtml = editorElement.innerHTML;
      if (currentHtml && currentHtml !== paragraph.content) {
        console.log('🔧 [PARAGRAPH_CARD] 에디터에서 강제 동기화:', {
          paragraphId: paragraph.id,
          editorContent: currentHtml.substring(0, 50),
          paragraphContent: paragraph.content?.substring(0, 50),
          editorLength: currentHtml.length,
          paragraphLength: paragraph.content?.length || 0,
        });
        handleContentChange(currentHtml);
      } else {
        console.log('ℹ️ [PARAGRAPH_CARD] 에디터와 상태가 이미 동기화됨');

        if (paragraph.content && paragraph.content.length > 0) {
          console.log('✅ [PARAGRAPH_CARD] 강제 상태 확인: 내용 존재함', {
            paragraphId: paragraph.id,
            contentLength: paragraph.content.length,
            contentPreview: paragraph.content.substring(0, 50),
          });
          pendingUpdateRef.current = null;
        }
      }
    } else {
      console.warn('⚠️ [PARAGRAPH_CARD] 에디터 요소를 찾을 수 없음');
    }
  }, [paragraph.id, paragraph.content, handleContentChange]);

  const handleCheckStatus = useCallback(() => {
    console.log('🔍 [PARAGRAPH_CARD] 즉시 상태 확인:', {
      paragraphId: paragraph.id,
      paragraphContent: paragraph.content?.substring(0, 50),
      paragraphLength: paragraph.content?.length || 0,
      hasPending: !!pendingUpdateRef.current,
      pendingContent: pendingUpdateRef.current?.substring(0, 50),
      updateCount: updateCountRef.current,
      isActive: isActive,
      isSelected: isSelected,
    });

    if (paragraph.content && paragraph.content.length > 0) {
      console.log('✅ [PARAGRAPH_CARD] 상태 정상: 내용이 존재함');
      pendingUpdateRef.current = null;
    } else {
      console.log('❌ [PARAGRAPH_CARD] 상태 문제: 내용이 비어있음');
    }
  }, [paragraph.id, paragraph.content, isActive, isSelected]);

  const handleForceRefresh = useCallback(() => {
    console.log('🔄 [PARAGRAPH_CARD] 강제 새로고침 실행:', {
      paragraphId: paragraph.id,
      beforeRefresh: {
        contentLength: paragraph.content?.length || 0,
        hasPending: !!pendingUpdateRef.current,
        forceUpdateKey,
      },
    });

    pendingUpdateRef.current = null;
    setForceUpdateKey((prev) => prev + 1);

    setTimeout(() => {
      const newLength = paragraph.content?.length || 0;
      console.log('✅ [PARAGRAPH_CARD] 새로고침 완료:', {
        paragraphId: paragraph.id,
        afterRefresh: {
          contentLength: newLength,
          forceUpdateKey: forceUpdateKey + 1,
        },
      });
    }, 100);
  }, [paragraph.id, paragraph.content, forceUpdateKey]);

  return (
    <div className={cardClassName} data-paragraph-id={paragraph.id}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="mt-2"
              checked={isSelected}
              onChange={handleSelectionChange}
              aria-label={`단락 ${paragraph.id} 선택`}
            />

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>ID: {paragraph.id.slice(-8)}</span>
              <span>•</span>
              <span>길이: {paragraph.content?.length || 0}</span>
              <span>•</span>
              <span>업데이트: {updateCountRef.current}회</span>
              {pendingUpdateRef.current && (
                <>
                  <span>•</span>
                  <span className="text-orange-600">대기중</span>
                </>
              )}
              {paragraph.containerId && (
                <>
                  <span>•</span>
                  <span className="text-green-600">할당됨</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleForceSync}
              className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              title="강제 동기화"
            >
              🔄 동기화
            </button>

            <button
              type="button"
              onClick={handleCheckStatus}
              className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
              title="상태 확인"
            >
              🔍 확인
            </button>

            <button
              type="button"
              onClick={handleForceRefresh}
              className="px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
              title="강제 새로고침"
            >
              🔄 새로고침
            </button>

            <Button
              type="button"
              isIconOnly
              color="danger"
              variant="light"
              size="sm"
              onPress={handleDelete}
              aria-label={`단락 ${paragraph.id} 삭제`}
              title="단락 삭제"
            >
              <Icon icon="lucide:trash-2" />
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <TiptapEditor
            paragraphId={paragraph.id}
            initialContent={paragraph.content || ''}
            onContentChange={handleContentChange}
            isActive={isActive}
          />
        </div>

        <div className="pt-3 border-t border-gray-100">
          <ParagraphActions
            paragraph={paragraph}
            internalState={internalState}
            sortedContainers={sortedContainers}
            addToLocalContainer={addToLocalContainer}
            setTargetContainerId={setTargetContainerId}
            toggleParagraphSelection={toggleParagraphSelection}
          />
        </div>

        <div className="p-2 mt-2 text-xs rounded bg-gray-50">
          <div>
            <strong>🔍 실시간 디버그 정보 (Zustand 통합):</strong>
          </div>
          <div>
            Content: "{paragraph.content?.substring(0, 50) || '비어있음'}..."
          </div>
          <div>
            Length:{' '}
            <span
              className={
                paragraph.content?.length > 0
                  ? 'text-green-600 font-bold'
                  : 'text-red-600 font-bold'
              }
            >
              {paragraph.content?.length || 0}
            </span>
          </div>
          <div>Update Count: {updateCountRef.current}</div>
          <div>Force Update Key: {forceUpdateKey}</div>
          <div>
            Pending Update:{' '}
            <span
              className={
                pendingUpdateRef.current
                  ? 'text-orange-600 font-bold'
                  : 'text-gray-500'
              }
            >
              {pendingUpdateRef.current
                ? `"${pendingUpdateRef.current.substring(0, 30)}..."`
                : '없음'}
            </span>
          </div>
          <div>Is Active: {isActive ? '✅' : '❌'}</div>
          <div>
            Is Selected:{' '}
            <span
              className={
                isSelected ? 'text-green-600 font-bold' : 'text-gray-500'
              }
            >
              {isSelected ? '✅ 선택됨' : '❌'}
            </span>
          </div>
          <div>
            Last Updated: {paragraph.updatedAt?.toLocaleTimeString() || '없음'}
          </div>
          <div className="pt-1 mt-1 border-t border-gray-200">
            <strong>상태:</strong>
            {paragraph.content?.length > 0 ? (
              <span className="font-bold text-green-600"> ✅ 내용 있음</span>
            ) : (
              <span className="font-bold text-red-600"> ❌ 내용 없음</span>
            )}
            {pendingUpdateRef.current && (
              <span className="font-bold text-orange-600">
                {' '}
                | ⏳ 업데이트 대기중
              </span>
            )}
          </div>
        </div>

        {isActive && (
          <div className="absolute rounded-lg -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 -z-10" />
        )}
      </div>
    </div>
  );
}

export default ParagraphCard;
