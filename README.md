# 📝 Multi-Step Blog Creation Platform

엔터프라이즈급 React TypeScript 기반의 다단계 블로그 작성 플랫폼입니다. 모듈화된 에디터, 실시간 미리보기, 고급 이미지 관리 시스템을 통해 완전한 블로그 제작 워크플로우를 제공합니다.

## 🎯 애플리케이션 개요

이 애플리케이션은 사용자가 4단계의 직관적인 과정을 통해 완성된 블로그 포스트를 작성할 수 있는 플랫폼입니다. 각 단계는 독립적이면서도 서로 연동되어 일관된 사용자 경험을 제공하며, 실시간 미리보기를 통해 결과를 즉시 확인할 수 있습니다.

## 📑 목차

- [🚀 React Hook Form 멀티스텝 구현의 핵심 이점](#-react-hook-form-멀티스텝-구현의-핵심-이점)
- [🔄 핵심 동작 원리](#-핵심-동작-원리)
- [🚀 고급 폼 관리 시스템](#-고급-폼-관리-시스템)
- [✨ 주요 특징](#-주요-특징)
- [⭐ 주요 기능](#-주요-기능)
- [📁 프로젝트 구조](#-프로젝트-구조)
- [🛠 기술 스택](#-기술-스택)

## 🚀 React Hook Form 멀티스텝 구현의 핵심 이점

### 🎯 단일 폼 인스턴스로 복잡한 워크플로우 관리

React Hook Form의 가장 큰 장점은 **하나의 폼 인스턴스**로 전체 다단계 프로세스를 관리할 수 있다는 점입니다.

#### 📊 상태 통합 관리

```typescript
// 4개 단계의 모든 필드를 하나의 폼으로 관리
const formMethods = useForm<FormSchemaValues>({
  resolver: zodResolver(formSchema), // 전체 스키마 통합 검증
  mode: 'onChange', // 실시간 검증
});

// 모든 단계에서 동일한 폼 컨텍스트 공유
<FormProvider {...formMethods}>
  <UserInfoStep /> {/* 1단계 */}
  <BlogBasicStep /> {/* 2단계 */}
  <ModularEditor /> {/* 3단계 */}
  <MediaStep /> {/* 4단계 */}
</FormProvider>;
```

### 🔄 단계별 독립적 검증 시스템

각 단계가 독립적으로 검증되면서도 전체적으로는 통합된 상태를 유지합니다.

#### 🛡️ 스마트 검증 전략

- **📍 단계별 부분 검증**: 현재 단계의 필드만 검증
- **🔍 실시간 피드백**: 입력과 동시에 에러 표시
- **⚠️ 진행 차단**: 필수 필드 미완성 시 다음 단계 진행 불가
- **✅ 전체 검증**: 최종 제출 시 모든 단계 통합 검증

### 💾 상태 지속성 및 복원

React Hook Form의 내장 상태 관리로 복잡한 단계간 데이터 전달을 단순화합니다.

#### 🔄 데이터 지속성 보장

- **📤 단계 이동**: 이전 단계 데이터 자동 보존
- **🔙 뒤로가기**: 기존 입력값 완전 복원
- **💾 임시 저장**: localStorage 연동으로 세션 유지
- **🔄 실시간 동기화**: 모든 단계의 데이터 즉시 반영

### ⚡ 성능 최적화의 핵심

React Hook Form의 **언컨트롤드 컴포넌트** 방식으로 최적의 성능을 구현합니다.

#### 🚀 렌더링 최적화

```typescript
// 필드 변경 시에도 불필요한 리렌더링 방지
const watchedValues = watch(['title', 'description']); // 필요한 필드만 감시
const currentStep = watch('currentStep'); // 단계 변경만 추적

// 조건부 렌더링으로 성능 극대화
{
  currentStep === 1 && <UserInfoStep />;
}
{
  currentStep === 2 && <BlogBasicStep />;
}
```

### 🧩 복잡한 폼 로직 간소화

다단계 폼에서 발생하는 복잡한 비즈니스 로직을 React Hook Form이 효율적으로 처리합니다.

#### 🔧 고급 폼 제어

- **📋 조건부 필드**: 특정 조건에 따른 필드 활성화/비활성화
- **🔄 동적 검증**: 단계별 다른 검증 규칙 적용
- **📊 진행률 계산**: 실시간 완성도 추적
- **🎯 포커스 관리**: 에러 발생 시 해당 필드로 자동 이동

### 🌉 Bridge 시스템과의 완벽한 연동

React Hook Form의 `setValue`와 `getValues`를 활용해 단계간 데이터 전송을 구현합니다.

#### 🔗 자동화된 데이터 흐름

```typescript
// 단계 완료 시 자동 데이터 전송
const handleStepComplete = () => {
  const currentData = getValues(); // 현재 폼 데이터 추출

  // Bridge 시스템으로 다음 단계에 전송
  bridgeTransfer.send({
    from: currentStep,
    to: currentStep + 1,
    data: currentData,
  });
};

// 다음 단계에서 데이터 수신
const handleDataReceive = (receivedData) => {
  Object.entries(receivedData).forEach(([key, value]) => {
    setValue(key, value, { shouldValidate: true }); // 검증과 함께 값 설정
  });
};
```

### 🔄 실시간 미리보기 연동

React Hook Form의 `watch` 기능으로 입력과 동시에 미리보기가 업데이트됩니다.

#### 👁️ 즉시 반영 시스템

- **⚡ 실시간 감지**: 모든 필드 변경 즉시 감지
- **🔄 자동 동기화**: PreviewPanel과 자동 연동
- **📊 상태 추적**: 각 단계별 완성도 실시간 표시
- **🎯 선택적 감시**: 필요한 필드만 감시하여 성능 최적화

## 🔄 핵심 동작 원리

### 📋 4단계 워크플로우

1. **👤 사용자 정보 단계** - 프로필 이미지, 닉네임, 이메일, 자기소개 입력
2. **📰 블로그 기본 정보** - 제목, 설명, 태그 설정
3. **🧩 모듈화 에디터** - 구조화된 컨텐츠 작성 (컨테이너 + 단락 조합)
4. **🖼️ 미디어 관리** - 이미지 업로드, 메인 이미지 설정, 갤러리 구성

### ⚡ 실시간 데이터 동기화

- **🔗 React Hook Form** ↔ **🏪 Zustand Store** ↔ **👁️ PreviewPanel** 삼방향 실시간 동기화
- **🌉 Bridge 시스템**을 통한 단계간 데이터 전송
- **🔌 Context API** 기반 컴포넌트간 상태 공유

### 🧱 모듈화 에디터 시스템

- **📐 구조 설정**: 섹션명 입력 → 컨테이너 자동 생성
- **✍️ 자유 작성**: TipTap 에디터로 단락별 컨텐츠 작성
- **🔧 구조화**: 작성된 단락들을 컨테이너에 할당
- **📄 최종 생성**: 마크다운 형태로 완성된 컨텐츠 생성

## 🚀 고급 폼 관리 시스템

### ⚙️ React Hook Form 동작 원리

이 애플리케이션은 React Hook Form을 중심으로 한 정교한 폼 상태 관리 시스템을 구축했습니다.

#### 🔧 핵심 동작 메커니즘

- **📝 register**: 각 입력 필드를 폼에 등록하고 검증 규칙 적용
- **👀 watch**: 실시간 필드 값 감지 및 즉시 반응
- **📤 setValue**: 프로그래매틱 값 업데이트 (Bridge 시스템 연동)
- **📥 getValues**: 현재 폼 상태 추출 (미리보기 패널 동기화)

#### 🛡️ Zod 스키마 검증 통합

```typescript
// 12개 필드에 대한 실시간 타입 안전 검증
- 👤 userImage, nickname, emailPrefix/emailDomain
- 📝 bio, title, description, tags
- 🖼️ media, mainImage, sliderImages
- ✅ editorCompletedContent, isEditorCompleted
```

### 🔄 삼방향 실시간 동기화 아키텍처

#### 🔗 React Hook Form ↔ 🏪 Zustand ↔ 💾 localStorage

**1. 📋 React Hook Form (폼 상태 관리)**

- 사용자 입력의 단일 진실 공급원
- Zod 스키마 기반 실시간 검증
- 컴포넌트 생명주기와 연동된 상태 관리

**2. 🏪 Zustand Store (글로벌 상태)**

- 컴포넌트 간 상태 공유
- 단계별 독립적 상태 관리
- 실시간 미리보기 패널과 동기화

**3. 💾 localStorage (영속 저장)**

- 브라우저 새로고침 시에도 데이터 유지
- 2MB 임계값 기반 스마트 저장 (큰 이미지는 메모리만)
- 자동 데이터 정리 및 복구 시스템

#### 🔀 동기화 플로우

```
👨‍💻 사용자 입력
    ↓
📋 React Hook Form (즉시 반응)
    ↓
🏪 Zustand Store (글로벌 상태 업데이트)
    ↓
💾 localStorage (선택적 영속화)
    ↓
👁️ PreviewPanel (실시간 미리보기)
```

### 🎯 고급 최적화 시스템

#### 🚫 무한루프 감지 및 방지

- 📊 컴포넌트별 렌더링 횟수 추적
- ⏰ 10초 타임아웃 시스템
- 🔄 자동 순환 참조 차단

#### 🧠 메모리 효율성

- **📏 2MB 임계값**: 대용량 이미지는 localStorage 제외
- **⚠️ QuotaExceededError 감지**: 저장소 용량 초과 시 자동 대응
- **🗑️ WeakMap 활용**: 자동 가비지 컬렉션

#### 🌉 Bridge 데이터 전송 시스템

- **🌍 환경별 설정**: Development/Production 자동 최적화
- **🤖 자동 전송**: 특정 조건 시 단계간 자동 데이터 이동
- **🔄 재시도 로직**: 실패 시 exponential backoff 재시도

## ✨ 주요 특징

- **📋 4단계 워크플로우**: 체계적인 블로그 작성 과정
- **🧩 모듈화 에디터**: 레고 블록처럼 조합 가능한 컨텐츠 구조
- **👁️ 실시간 미리보기**: 입력과 동시에 결과 확인
- **🖼️ 고급 이미지 관리**: 드래그앤드롭, 갤러리, 슬라이더 통합
- **🛡️ 완전한 타입 안전성**: TypeScript + Zod 스키마 검증
- **📱 반응형 디자인**: 모바일/데스크톱 최적화

## ⭐ 주요 기능

### 👨‍💻 사용자 경험

- **🎨 직관적 UI**: 단계별 명확한 진행 과정
- **⚡ 실시간 피드백**: 모든 입력에 대한 즉시 반응
- **♿ 완전한 접근성**: WCAG 2.1 가이드라인 준수
- **📱 반응형 디자인**: 모든 디바이스 최적화

### 🛠️ 개발자 경험

- **🔒 타입 안전성**: 완전한 TypeScript 커버리지
- **🧩 모듈화 설계**: 재사용 가능한 컴포넌트 구조
- **🚀 성능 최적화**: 메모이제이션 + 지연 로딩
- **🛡️ 에러 처리**: 다층 방어 시스템

### 🔥 고급 기능

- **📁 파일 처리**: 드래그앤드롭, 진행률 표시, 중복 검사
- **🖼️ 이미지 갤러리**: Grid/Masonry 레이아웃, 사용자 정의 뷰
- **🎠 스와이퍼 통합**: 자동재생, 페이드 효과, 반응형 네비게이션
- **🏪 상태 관리**: Zustand 기반 중앙집중식 상태 관리

## 📁 프로젝트 구조

### 🏢 메인 애플리케이션 계층

```
src/
├── components/
│   ├── multiStepForm/                    # 📋 다단계 폼 시스템
│   ├── previewPanel/                     # 👁️ 실시간 미리보기 시스템
│   └── ImageGalleryWithContent/          # 🖼️ 이미지 갤러리 + 제품 정보
├── store/                                # 🏪 Zustand 상태 관리
├── utils/                                # 🛠️ 공통 유틸리티
└── types/                                # 📝 TypeScript 타입 정의
```

### 🔧 주요 시스템별 구조

#### 1. 📋 MultiStepForm 시스템 (다단계 폼)

- **🎯 MultiStepFormContainer** - 메인 오케스트레이터
- **📂 steps/stepsSections/** - 4단계별 컴포넌트
  - `👤 userInfoStep/` - 사용자 정보 입력 (프로필, 이메일, 자기소개)
  - `📰 blogBasicStep/` - 블로그 기본 정보 (제목, 설명, 태그)
  - `🧩 modularBlogEditor/` - 모듈화 에디터 (구조화된 컨텐츠 작성)
  - `🖼️ blogMediaStep/` - 미디어 관리 (이미지 업로드, 갤러리, 슬라이더)

#### 2. 🧩 ModularBlogEditor 시스템 (모듈화 에디터)

- **🎯 ModularBlogEditorContainer** - 에디터 메인 컨테이너
- **⚡ actions/** - 에디터 상태 관리 액션 (Container, Editor, Paragraph)
- **🪝 hooks/** - 특화된 에디터 훅 시스템
- **🧩 parts/** - 에디터 UI 컴포넌트들
- **📝 types/** - 에디터 전용 타입 정의

#### 3. 📤 ImageUpload 시스템 (이미지 관리)

- **🎯 ImageUploadContainer** - 메인 이미지 업로드 관리
- **🔌 context/** - Context API 기반 상태 통합
- **🪝 hooks/** - 7개 특화 훅 (파일처리, 중복검사, 검증 등)
- **🧩 parts/** - 12개 UI 컴포넌트 (드래그앤드롭, 프리뷰 등)
- **🛠️ utils/** - 7개 유틸리티 (파일처리, 검증, 로깅 등)

#### 4. 🖼️ ImageGallery 시스템 (이미지 갤러리)

- **🎯 ImageGalleryContainer** - 갤러리 메인 관리자
- **🧩 parts/** - 3계층 아키텍처
  - `🖼️ gallery/` - 기본 갤러리 기능 (테이블, 카드, 모달)
  - `📐 layout/` - 레이아웃 엔진 (Grid, Masonry)
  - `🏗️ viewBuilder/` - 사용자 갤러리 빌더
- **🪝 hooks/** - 14개 특화 훅 시스템

#### 5. 👁️ PreviewPanel 시스템 (실시간 미리보기)

- **🎯 PreviewPanelContainer** - 미리보기 메인 컨테이너
- **🧩 parts/** - 플랫폼별 최적화 컴포넌트
  - `🖥️ DesktopContentComponent` - 데스크톱 최적화 미리보기
  - `📱 MobileContentComponent` - 모바일 최적화 미리보기
  - `📊 StatusIndicatorComponent` - 실시간 상태 표시
- **🪝 hooks/** - 4개 특화 훅 (모바일감지, 데이터변환 등)

## 🛠 기술 스택

### ⚡ 코어 기술

- **⚛️ React 18** + **📘 TypeScript** - 메인 프레임워크
- **⚡ Vite** - 빌드 도구 및 개발 서버
- **🐻 Zustand** - 경량 상태 관리
- **📋 React Hook Form** + **🛡️ Zod** - 폼 관리 및 검증

### 🎨 UI/UX

- **🦸 HeroUI** - 메인 UI 컴포넌트 라이브러리
- **🎨 Tailwind CSS** - 유틸리티 기반 스타일링
- **🎭 Framer Motion** - 애니메이션 시스템
- **🎯 Iconify React** - 아이콘 시스템

### 🔧 특화 라이브러리

- **✍️ TipTap** - 리치 텍스트 에디터
- **🎠 Swiper** - 이미지 갤러리 및 슬라이더
- **🔧 Lodash** - 유틸리티 함수

---

**📊 총 172개 파일로 구성된 엔터프라이즈급 React TypeScript 애플리케이션**으로, 복잡한 블로그 작성 워크플로우를 직관적이고 효율적으로 처리할 수 있도록 설계되었습니다.
