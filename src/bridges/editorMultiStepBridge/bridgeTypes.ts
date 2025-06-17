import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 에디터 상태의 특정 시점 스냅샷을 나타내는 읽기 전용 인터페이스
// 브릿지에서 안전한 데이터 전송을 위해 불변 객체로 설계
export interface EditorStateSnapshotForBridge {
  // 에디터에서 생성된 모든 컨테이너들의 배열
  // 각 컨테이너는 문단들을 그룹화하는 역할
  readonly editorContainers: Container[];

  // 에디터에서 작성된 모든 문단 블록들의 배열
  // 실제 콘텐츠를 담고 있는 핵심 데이터
  readonly editorParagraphs: ParagraphBlock[];

  // 모든 문단이 완성된 최종 콘텐츠 문자열
  // 사용자에게 보여질 완성된 결과물
  readonly editorCompletedContent: string;

  // 에디터 작업이 완전히 완료되었는지를 나타내는 플래그
  // 전송 가능 여부를 판단하는 중요한 지표
  readonly editorIsCompleted: boolean;

  // 현재 활성화된(선택된) 문단의 ID
  // 사용자가 마지막으로 편집하던 위치 정보
  readonly editorActiveParagraphId: string | null;

  // 사용자가 선택한 여러 문단들의 ID 배열
  // 일괄 작업을 위한 선택 상태 정보
  readonly editorSelectedParagraphIds: string[];

  // 미리보기 모드가 열려있는지를 나타내는 상태
  // UI 상태 정보로 복원 시 필요
  readonly editorIsPreviewOpen: boolean;

  // 이 스냅샷이 생성된 정확한 시각 (밀리초 타임스탬프)
  // 데이터 신선도 및 동기화 검증용
  readonly extractedTimestamp: number;
}

// 멀티스텝 폼 상태의 특정 시점 스냅샷을 나타내는 읽기 전용 인터페이스
// 브릿지를 통한 역방향 전송이나 상태 복원에 활용
export interface MultiStepFormSnapshotForBridge {
  // 멀티스텝 폼에서 현재 진행 중인 단계 번호
  // 사용자의 워크플로우 진행 상황을 나타냄
  readonly formCurrentStep: number;

  // 사용자가 입력한 모든 폼 필드 값들
  // 실제 제출될 데이터의 집합
  readonly formValues: FormValues;

  // 진행률 표시바의 현재 너비 퍼센트
  // 사용자에게 시각적 진행 상황 제공
  readonly formProgressWidth: number;

  // 미리보기 모드가 활성화되어 있는지 여부
  // 사용자가 결과를 확인하고 있는 상태
  readonly formShowPreview: boolean;

  // 에디터에서 완성된 콘텐츠가 폼에 저장된 내용
  // 브릿지를 통해 전송받은 에디터 데이터
  readonly formEditorCompletedContent: string;

  // 에디터 작업이 완료되었는지를 폼에서 인식하는 상태
  // 폼 제출 가능 여부 판단에 활용
  readonly formIsEditorCompleted: boolean;

  // 이 스냅샷이 생성된 정확한 시각 (밀리초 타임스탬프)
  // 상태 동기화 및 데이터 신선도 검증용
  readonly snapshotTimestamp: number;
}

// 에디터 데이터를 멀티스텝 폼 형식으로 변환한 결과를 담는 인터페이스
// 데이터 변환 과정의 성공/실패 여부와 변환된 실제 데이터를 포함
export interface EditorToMultiStepDataTransformationResult {
  // 변환되어 멀티스텝 폼에서 사용할 수 있는 콘텐츠 문자열
  // 에디터의 복잡한 구조를 단순한 텍스트로 평탄화한 결과
  readonly transformedContent: string;

  // 변환된 콘텐츠가 완성된 상태인지를 나타내는 플래그
  // 멀티스텝 폼에서 제출 가능 여부 판단에 활용
  readonly transformedIsCompleted: boolean;

  // 변환 과정에서 수집된 에디터 데이터의 메타정보
  // 통계, 품질 지표, 데이터 특성 등을 포함
  readonly transformedMetadata: EditorContentMetadataForBridge;

  // 전체 변환 과정이 성공적으로 완료되었는지 여부
  // false인 경우 transformationErrors 배열에 오류 정보 포함
  readonly transformationSuccess: boolean;

  // 변환 과정에서 발생한 모든 오류 메시지들의 배열
  // 디버깅 및 사용자 피드백 제공용
  readonly transformationErrors: string[];
}

// 에디터 콘텐츠의 메타데이터를 담는 인터페이스
// 데이터 품질 평가, 통계 분석, 검증 등에 활용
export interface EditorContentMetadataForBridge {
  // 에디터에서 생성된 총 컨테이너 개수
  // 콘텐츠 구조화 수준을 나타내는 지표
  readonly containerCount: number;

  // 작성된 총 문단 개수
  // 콘텐츠 볼륨을 나타내는 기본 지표
  readonly paragraphCount: number;

  // 컨테이너에 할당된 문단들의 개수
  // 구조화가 완료된 콘텐츠의 양
  readonly assignedParagraphCount: number;

  // 아직 컨테이너에 할당되지 않은 문단들의 개수
  // 작업 미완료 부분을 나타내는 지표
  readonly unassignedParagraphCount: number;

  // 모든 콘텐츠의 총 글자 수
  // 콘텐츠 분량을 나타내는 정량적 지표
  readonly totalContentLength: number;

  // 이 메타데이터가 마지막으로 업데이트된 시각
  // 데이터 신선도 및 변경 추적용
  readonly lastModified: Date;
}

// 브릿지 검증 과정의 결과를 담는 인터페이스
// 데이터 전송 전 안전성 검사 결과 제공
export interface BridgeDataValidationResult {
  // 전송이 가능한 상태인지를 나타내는 최종 판단
  // 모든 검증 조건을 통과했을 때만 true
  readonly isValidForTransfer: boolean;

  // 검증 과정에서 발견된 치명적 오류들
  // 이 배열에 항목이 있으면 전송 불가
  readonly validationErrors: string[];

  // 검증 과정에서 발견된 경고사항들
  // 전송은 가능하지만 주의가 필요한 상황들
  readonly validationWarnings: string[];

  // 최소한의 콘텐츠 요구사항을 충족하는지 여부
  // 빈 콘텐츠나 불완전한 데이터 방지
  readonly hasMinimumContent: boolean;

  // 필수 데이터 구조를 갖추고 있는지 여부
  // 컨테이너-문단 관계 등 구조적 완전성 검증
  readonly hasRequiredStructure: boolean;
}

// 브릿지 작업 중 발생한 오류의 상세 정보를 담는 인터페이스
// 오류 추적, 디버깅, 복구 전략 수립에 활용
export interface BridgeOperationErrorDetails {
  // 오류를 고유하게 식별하는 코드
  // 오류 유형, 발생 시각, 랜덤 문자열을 조합하여 생성
  readonly errorCode: string;

  // 사용자가 이해할 수 있는 오류 설명 메시지
  // 기술적 세부사항보다는 상황 설명에 중점
  readonly errorMessage: string;

  // 오류가 발생한 정확한 시각
  // 오류 발생 순서 및 패턴 분석용
  readonly errorTimestamp: Date;

  // 오류 발생 당시의 환경 및 상황 정보
  // 브라우저 정보, URL, 스택 트레이스 등을 포함
  readonly errorContext: Record<string, unknown>;

  // 이 오류로부터 복구가 가능한지 여부
  // 자동 재시도나 대체 방안 적용 가능성 판단
  readonly isRecoverable: boolean;
}

// 브릿지 작업 전체의 실행 결과를 담는 인터페이스
// 작업 성공/실패, 소요 시간, 전송된 데이터 등 종합 정보 제공
export interface BridgeOperationExecutionResult {
  // 전체 브릿지 작업이 성공적으로 완료되었는지 여부
  // 모든 단계가 오류 없이 완료되었을 때만 true
  readonly operationSuccess: boolean;

  // 작업 과정에서 발생한 모든 오류들의 상세 정보
  // 각 오류는 BridgeOperationErrorDetails 형식
  readonly operationErrors: BridgeOperationErrorDetails[];

  // 작업 중 발생한 경고 메시지들
  // 작업은 완료되었지만 주의가 필요한 상황들
  readonly operationWarnings: string[];

  // 성공적으로 전송된 데이터 (실패 시 null)
  // 실제로 멀티스텝 폼에 적용된 변환 결과
  readonly transferredData: EditorToMultiStepDataTransformationResult | null;

  // 전체 작업에 소요된 시간 (밀리초)
  // 성능 모니터링 및 최적화 기준 데이터
  readonly operationDuration: number;
}

// 브릿지 시스템의 동작 방식을 설정하는 구성 인터페이스
// 다양한 환경과 요구사항에 맞게 브릿지 동작을 커스터마이징
export interface BridgeSystemConfiguration {
  // 데이터 전송 전 검증 과정을 수행할지 여부
  // false인 경우 검증 없이 바로 전송 (위험할 수 있음)
  readonly enableValidation: boolean;

  // 오류 발생 시 자동 복구를 시도할지 여부
  // true인 경우 일부 오류에서 재시도나 대체 방안 적용
  readonly enableErrorRecovery: boolean;

  // 검증 모드의 엄격성 수준
  // 'strict': 모든 조건 충족 필요, 'lenient': 일부 조건 미충족 허용
  readonly validationMode: 'strict' | 'lenient';

  // 디버그 정보 출력 여부
  // true인 경우 상세한 로그 및 디버그 정보 제공
  readonly debugMode: boolean;
}

// 에디터 상태 추출을 담당하는 함수의 타입 정의
// Zustand 스토어에서 현재 에디터 상태를 안전하게 추출
export type EditorStateExtractionFunction =
  () => EditorStateSnapshotForBridge | null;

// 멀티스텝 상태 업데이트를 담당하는 함수의 타입 정의
// 변환된 데이터를 멀티스텝 폼 상태에 비동기적으로 적용
export type MultiStepStateUpdateFunction = (
  data: EditorToMultiStepDataTransformationResult
) => Promise<boolean>;

// 데이터 변환을 담당하는 함수의 타입 정의
// 에디터의 복잡한 구조를 멀티스텝 폼에 맞는 형태로 변환
export type DataStructureTransformationFunction = (
  editorState: EditorStateSnapshotForBridge
) => EditorToMultiStepDataTransformationResult;

// 브릿지 데이터 검증을 담당하는 함수의 타입 정의
// 전송 전 데이터 유효성 및 완전성 검사 수행
export type BridgeValidationFunction = (
  editorState: EditorStateSnapshotForBridge
) => BridgeDataValidationResult;

// 브릿지 오류 처리를 담당하는 함수의 타입 정의
// 모든 종류의 오류를 표준화된 형식으로 처리
export type BridgeErrorHandlingFunction = (
  error: unknown
) => BridgeOperationErrorDetails;
