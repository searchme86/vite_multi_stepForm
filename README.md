# 📝 Multi-Step Blog Creation Platform

엔터프라이즈급 React TypeScript 기반의 다단계 블로그 작성 플랫폼입니다. 모듈화된 에디터, 실시간 미리보기, 고급 이미지 관리 시스템을 통해 완전한 블로그 제작 워크플로우를 제공합니다.

## 🎯 애플리케이션 개요

이 애플리케이션은 사용자가 4단계의 직관적인 과정을 통해 완성된 블로그 포스트를 작성할 수 있는 플랫폼입니다. 각 단계는 독립적이면서도 서로 연동되어 일관된 사용자 경험을 제공하며, 실시간 미리보기를 통해 결과를 즉시 확인할 수 있습니다.

## 🔗 React Hook Form과 멀티스텝 폼의 완벽한 조합

### 🎯 왜 React Hook Form인가?

React Hook Form은 멀티스텝 폼 구현에 있어서 다른 폼 라이브러리 대비 뚜렷한 장점을 제공합니다.

#### 🔄 단일 폼 인스턴스로 모든 단계 관리

- **🎭 하나의 useForm으로 4단계 통합 관리**: 복잡한 상태 분산 없이 단일 진실 공급원 유지
- **📊 전체 폼 상태 추적**: 모든 단계의 데이터를 하나의 객체에서 관리
- **🔀 단계별 조건부 렌더링**: 현재 단계에 따른 동적 UI 제어

#### 💾 강력한 상태 지속성

- **🔒 단계 이동 시 데이터 유지**: 사용자가 이전 단계로 돌아가도 입력 데이터 보존
- **⚡ 즉시 접근 가능한 모든 필드**: getValues()로 언제든 전체 폼 상태 추출
- **🎨 실시간 미리보기 연동**: 어느 단계에서든 완전한 데이터로 미리보기 생성

#### 🎯 스마트한 부분 검증

- **📋 단계별 독립 검증**: 각 단계마다 해당 필드들만 선택적 검증
- **🚦 진행 가능 여부 실시간 판단**: 현재 단계 완료 상태에 따른 네비게이션 제어
- **⚠️ 사용자 친화적 에러 표시**: 단계별로 관련된 에러만 표시하여 혼란 최소화

#### 🚀 뛰어난 성능 최적화

- **🎪 Uncontrolled Components**: 불필요한 리렌더링 최소화로 멀티스텝에서도 빠른 반응성
- **📊 선택적 Watch**: 필요한 필드만 감시하여 성능 보장
- **🧠 지능적 Dirty Field 추적**: 실제 변경된 필드만 추적하여 효율성 극대화

#### 🔧 프로그래매틱 제어의 우수성

- **📤 setValue()**: Bridge 시스템에서 단계간 데이터 자동 전송
- **👀 watch()**: 실시간 미리보기 패널과의 완벽한 동기화
- **✅ trigger()**: 특정 시점에 원하는 필드들만 선택적 검증

### 🏗️ 멀티스텝 폼 구현의 핵심 패턴

#### 🔄 단계 기반 렌더링

```typescript
// 🎯 조건부 필드 렌더링 - 현재 단계에서만 해당 컴포넌트 마운트
{
  currentStep === 1 && <UserInfoStep />;
}
{
  currentStep === 2 && <BlogBasicStep />;
}
{
  currentStep === 3 && <ModularBlogEditor />;
}
{
  currentStep === 4 && <BlogMediaStep />;
}
```

#### 📊 진행률 추적 시스템

```typescript
// 🎯 실시간 완성도 계산
const completionRate = calculateCompletionRate(watchedValues, currentStep);
const canProceed = validateStepCompletion(currentStep, formValues);
```

#### 🌉 Bridge를 통한 자동 데이터 전송

```typescript
// 🎯 단계 전환 시 데이터 자동 동기화
const handleStepTransition = (newStep) => {
  setValue('stepData', processedData); // 즉시 반영
  syncWithZustand(getValues()); // 글로벌 상태 동기화
};
```

### 🎯 멀티스텝 폼에서만 나타나는 React Hook Form의 장점

#### 🔄 복잡한 데이터 흐름 단순화

- **전통적 멀티스텝**: 각 단계마다 별도 상태 관리 → 복잡한 Props 전달 → 동기화 문제
- **React Hook Form**: 단일 폼 상태 → 자동 동기화 → 단순한 데이터 흐름

#### ⚡ 성능상 이점

- **페이지 네비게이션**: 상태 유지로 빠른 단계 전환
- **메모리 효율성**: 필요한 필드만 DOM에 마운트하면서도 데이터는 유지
- **배치 업데이트**: 여러 필드 변경을 효율적으로 일괄 처리

#### 🎯 사용자 경험 향상

- **데이터 손실 방지**: 실수로 뒤로가기를 해도 입력 내용 보존
- **즉시 검증**: 단계 이동 전에 현재 단계 완료 상태 확인
- **스마트 네비게이션**: 완료되지 않은 단계로의 이동 제한

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
