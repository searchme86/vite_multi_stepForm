// src/components/multiStepForm/utils/debug/infiniteLoopDetector.ts

interface LoopDetectionConfig {
  readonly maxRenderCount: number;
  readonly timeWindow: number;
  readonly componentName: string;
  readonly enableBrowserAlert: boolean;
  readonly enableAutoReload: boolean;
}

interface RenderTracker {
  count: number;
  lastResetTime: number;
  firstRenderTime: number;
  warnings: string[];
}

interface ComponentState {
  [componentName: string]: RenderTracker;
}

// 🚨 전역 상태 추적
const globalComponentState: ComponentState = {};

const DEFAULT_CONFIG: LoopDetectionConfig = {
  maxRenderCount: 50,
  timeWindow: 5000,
  componentName: 'Unknown',
  enableBrowserAlert: true,
  enableAutoReload: false,
};

// 🔧 환경 감지 함수
const isDevelopmentMode = (): boolean => {
  try {
    // Node.js 환경 변수 체크
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }

    // 브라우저 환경에서 호스트명 체크
    if (typeof window !== 'undefined' && window.location) {
      const { hostname } = window.location;
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.local')
      );
    }

    return false;
  } catch (error) {
    return false;
  }
};

// 🔧 콘솔 로깅 함수 (개발 모드에서만 동작)
const logWarningMessage = (
  level: string,
  message: string,
  data: Record<string, unknown>
) => {
  if (!isDevelopmentMode()) return;

  switch (level) {
    case 'INFO':
      console.info(message, data);
      break;
    case 'WARN':
      console.warn(message, data);
      break;
    case 'ERROR':
      console.error(message, data);
      break;
    default:
      console.log(message, data);
      break;
  }
};

// 🔧 무한루프 감지기 생성
const createInfiniteLoopDetector = (
  config: Partial<LoopDetectionConfig> = {}
) => {
  const finalConfig: LoopDetectionConfig = { ...DEFAULT_CONFIG, ...config };
  const { componentName } = finalConfig;

  // 컴포넌트별 트래커 초기화
  if (!globalComponentState[componentName]) {
    globalComponentState[componentName] = {
      count: 0,
      lastResetTime: Date.now(),
      firstRenderTime: Date.now(),
      warnings: [],
    };
  }

  const tracker = globalComponentState[componentName];

  return {
    // 🚨 렌더링 감지 및 체크
    checkRender: (): boolean => {
      if (!isDevelopmentMode()) return false; // 프로덕션에서는 비활성화

      const currentTime = Date.now();
      const {
        maxRenderCount,
        timeWindow,
        enableBrowserAlert,
        enableAutoReload,
      } = finalConfig;

      // 시간 윈도우가 지나면 리셋
      if (currentTime - tracker.lastResetTime > timeWindow) {
        console.log(`🔄 [LOOP_DETECTOR] ${componentName} 렌더링 카운터 리셋`);
        tracker.count = 0;
        tracker.lastResetTime = currentTime;
        tracker.warnings = [];
      }

      tracker.count++;

      // 경고 단계들
      const warningThresholds = [
        { threshold: maxRenderCount * 0.5, level: 'INFO' },
        { threshold: maxRenderCount * 0.7, level: 'WARN' },
        { threshold: maxRenderCount * 0.9, level: 'ERROR' },
      ];

      for (const warning of warningThresholds) {
        if (
          tracker.count === Math.floor(warning.threshold) &&
          !tracker.warnings.includes(warning.level)
        ) {
          tracker.warnings.push(warning.level);

          const message = `${
            warning.level === 'INFO'
              ? 'ℹ️'
              : warning.level === 'WARN'
              ? '⚠️'
              : '🚨'
          } [LOOP_DETECTOR] ${componentName} 렌더링 ${warning.level}`;

          const logData = {
            renderCount: tracker.count,
            maxRenderCount,
            percentage: ((tracker.count / maxRenderCount) * 100).toFixed(1),
            timeElapsed: currentTime - tracker.firstRenderTime,
            stackTrace:
              warning.level === 'ERROR' ? new Error().stack : undefined,
            timestamp: new Date().toISOString(),
          };

          // 🔧 타입 안전한 콘솔 로깅
          logWarningMessage(warning.level, message, logData);
        }
      }

      // 🚨 무한루프 감지
      if (tracker.count > maxRenderCount) {
        const errorInfo = {
          componentName,
          renderCount: tracker.count,
          timeWindow,
          timeElapsed: currentTime - tracker.firstRenderTime,
          stackTrace: new Error().stack,
          timestamp: new Date().toISOString(),
          globalState: Object.keys(globalComponentState).map((name) => ({
            name,
            count: globalComponentState[name].count,
          })),
        };

        console.error(
          '🚨 [INFINITE_LOOP_DETECTED] 무한 렌더링 감지!',
          errorInfo
        );

        // 브라우저 알림 (개발 모드에서만)
        if (enableBrowserAlert && typeof window !== 'undefined') {
          const message = `🚨 무한 렌더링 감지!\n\n컴포넌트: ${componentName}\n렌더링 횟수: ${
            tracker.count
          }\n시간: ${(errorInfo.timeElapsed / 1000).toFixed(
            1
          )}초\n\n개발자 도구 콘솔을 확인하세요.`;

          if (enableAutoReload) {
            const shouldReload = window.confirm(
              message + '\n\n페이지를 새로고침하시겠습니까?'
            );
            if (shouldReload) {
              window.location.reload();
            }
          } else {
            window.alert(message);
          }
        }

        return true; // 무한루프 감지됨
      }

      return false; // 정상
    },

    // 📊 현재 상태 조회
    getStats: () => ({
      renderCount: tracker.count,
      timeElapsed: Date.now() - tracker.firstRenderTime,
      warnings: [...tracker.warnings],
      isNearLimit: tracker.count > finalConfig.maxRenderCount * 0.8,
    }),

    // 🔄 수동 리셋
    reset: () => {
      if (!isDevelopmentMode()) return;
      console.log(`🔄 [LOOP_DETECTOR] ${componentName} 수동 리셋`);
      tracker.count = 0;
      tracker.lastResetTime = Date.now();
      tracker.firstRenderTime = Date.now();
      tracker.warnings = [];
    },
  };
};

// 🚨 React Hook 버전
import React from 'react';

const useInfiniteLoopDetector = (
  componentName: string,
  config: Partial<LoopDetectionConfig> = {}
) => {
  const detector = React.useMemo(
    () => createInfiniteLoopDetector({ ...config, componentName }),
    [componentName]
  );

  // 매 렌더링마다 체크
  const isInfiniteLoop = detector.checkRender();

  // 무한루프 감지 시 에러 발생 (개발 모드에서만)
  if (isInfiniteLoop && isDevelopmentMode()) {
    throw new Error(
      `무한 렌더링이 감지되어 컴포넌트 실행을 중단합니다: ${componentName}`
    );
  }

  return {
    stats: detector.getStats(),
    reset: detector.reset,
  };
};

// 🔧 간단한 무한루프 감지 함수 (기존 코드 호환용)
const detectSimpleInfiniteLoop = (() => {
  let renderCount = 0;
  let lastRenderTime = Date.now();
  const LOOP_THRESHOLD = 30;
  const TIME_WINDOW = 3000;

  return (componentName: string): boolean => {
    if (!isDevelopmentMode()) return false; // 프로덕션에서는 비활성화

    const currentTime = Date.now();

    if (currentTime - lastRenderTime > TIME_WINDOW) {
      renderCount = 0;
      lastRenderTime = currentTime;
    }

    renderCount++;

    if (renderCount === 15) {
      console.warn(`⚠️ [LOOP_WARNING] ${componentName} 렌더링 15회 도달!`);
    }

    if (renderCount === 25) {
      console.error(
        `🚨 [LOOP_ERROR] ${componentName} 렌더링 25회 도달! 무한루프 의심!`
      );
    }

    if (renderCount > LOOP_THRESHOLD) {
      console.error('🚨 [INFINITE_LOOP_DETECTED] 무한 렌더링 감지!', {
        componentName,
        renderCount,
        timeElapsed: currentTime - lastRenderTime,
        stackTrace: new Error().stack,
        timestamp: new Date().toISOString(),
      });

      if (typeof window !== 'undefined') {
        const shouldReload = window.confirm(
          `🚨 무한 렌더링이 감지되었습니다!\n\n컴포넌트: ${componentName}\n렌더링 횟수: ${renderCount}\n\n개발자 도구 콘솔을 확인하고 페이지를 새로고침하시겠습니까?`
        );
        if (shouldReload) {
          window.location.reload();
        }
      }

      return true;
    }

    return false;
  };
})();

// 🔧 Hook 감지 함수 (기존 코드 호환용)
const detectInfiniteLoop = (() => {
  let renderCount = 0;
  let lastRenderTime = Date.now();
  const INFINITE_LOOP_THRESHOLD = 50;
  const INFINITE_LOOP_TIME_WINDOW = 5000;

  return (): boolean => {
    if (!isDevelopmentMode()) return false; // 프로덕션에서는 비활성화

    const currentTime = Date.now();

    if (currentTime - lastRenderTime > INFINITE_LOOP_TIME_WINDOW) {
      renderCount = 0;
      lastRenderTime = currentTime;
    }

    renderCount++;

    if (renderCount > INFINITE_LOOP_THRESHOLD) {
      console.error('🚨 [INFINITE_LOOP_DETECTED] 무한 렌더링 감지!', {
        renderCount,
        timeWindow: currentTime - lastRenderTime,
        stackTrace: new Error().stack,
        timestamp: new Date().toISOString(),
      });

      if (typeof window !== 'undefined') {
        const shouldStop = window.confirm(
          `🚨 무한 렌더링이 감지되었습니다!\n렌더링 횟수: ${renderCount}\n개발자 도구를 확인하세요.\n\n페이지를 새로고침하시겠습니까?`
        );
        if (shouldStop) {
          window.location.reload();
        }
      }

      return true;
    }

    return false;
  };
})();

// 🔧 훅 상태 추적기
interface HookStateTracker {
  [hookName: string]: {
    callCount: number;
    lastCallTime: number;
    states: Record<string, unknown>;
    dependencies: unknown[];
  };
}

const globalHookState: HookStateTracker = {};

const createHookStateTracker = (hookName: string) => {
  if (!isDevelopmentMode()) {
    // 프로덕션에서는 빈 함수들 반환
    return {
      trackCall: () => {},
      trackState: () => {},
      getStats: () => ({
        hookName,
        callCount: 0,
        lastCallTime: 0,
        states: {},
        dependencies: [],
      }),
    };
  }

  if (!globalHookState[hookName]) {
    globalHookState[hookName] = {
      callCount: 0,
      lastCallTime: Date.now(),
      states: {},
      dependencies: [],
    };
  }

  const tracker = globalHookState[hookName];

  return {
    // 🔄 훅 호출 추적
    trackCall: (dependencies: unknown[] = []) => {
      tracker.callCount++;
      tracker.lastCallTime = Date.now();

      // 의존성 변화 감지
      const depsChanged =
        JSON.stringify(dependencies) !== JSON.stringify(tracker.dependencies);

      if (depsChanged) {
        console.log(`🔄 [HOOK_TRACKER] ${hookName} 의존성 변화 감지:`, {
          callCount: tracker.callCount,
          oldDeps: tracker.dependencies,
          newDeps: dependencies,
          timestamp: new Date().toISOString(),
        });
        tracker.dependencies = [...dependencies];
      } else if (tracker.callCount > 10) {
        console.warn(
          `⚠️ [HOOK_TRACKER] ${hookName} 의존성 변화 없이 ${tracker.callCount}회 호출됨`
        );
      }
    },

    // 📊 상태 업데이트 추적
    trackState: (stateName: string, value: unknown) => {
      const oldValue = tracker.states[stateName];
      const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(value);

      if (hasChanged) {
        console.log(`📊 [HOOK_TRACKER] ${hookName}.${stateName} 상태 변화:`, {
          oldValue,
          newValue: value,
          timestamp: new Date().toISOString(),
        });
        tracker.states[stateName] = value;
      }
    },

    // 📈 통계 조회
    getStats: () => ({
      hookName,
      callCount: tracker.callCount,
      lastCallTime: tracker.lastCallTime,
      states: { ...tracker.states },
      dependencies: [...tracker.dependencies],
    }),
  };
};

// 🚨 전역 상태 모니터링
const getGlobalInfiniteLoopStats = () => {
  if (!isDevelopmentMode()) {
    return {
      components: [],
      hooks: [],
      timestamp: new Date().toISOString(),
    };
  }

  return {
    components: Object.entries(globalComponentState).map(([name, tracker]) => ({
      name,
      renderCount: tracker.count,
      warnings: tracker.warnings,
      timeElapsed: Date.now() - tracker.firstRenderTime,
    })),
    hooks: Object.entries(globalHookState).map(([name, tracker]) => ({
      name,
      callCount: tracker.callCount,
      lastCallTime: tracker.lastCallTime,
      stateCount: Object.keys(tracker.states).length,
    })),
    timestamp: new Date().toISOString(),
  };
};

// 🔧 디버깅용 콘솔 명령어 (개발 모드에서만 등록)
if (typeof window !== 'undefined' && isDevelopmentMode()) {
  (window as any).debugInfiniteLoop = getGlobalInfiniteLoopStats;
  (window as any).resetAllLoopDetectors = () => {
    Object.keys(globalComponentState).forEach((name) => {
      const tracker = globalComponentState[name];
      tracker.count = 0;
      tracker.lastResetTime = Date.now();
      tracker.warnings = [];
    });
    console.log('🔄 모든 루프 감지기가 리셋되었습니다.');
  };
}

if (isDevelopmentMode()) {
  console.log('📄 [INFINITE_LOOP_DETECTOR] ✅ 무한루프 감지 시스템 로드 완료');
  console.log(
    '💡 [TIP] 브라우저 콘솔에서 window.debugInfiniteLoop() 실행으로 현재 상태 확인 가능'
  );
}

// ✅ 단일 export 구문으로 통합 (중복 제거)
export {
  detectSimpleInfiniteLoop,
  detectInfiniteLoop,
  createInfiniteLoopDetector,
  useInfiniteLoopDetector,
  createHookStateTracker,
  getGlobalInfiniteLoopStats,
};
