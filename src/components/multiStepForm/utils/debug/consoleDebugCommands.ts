// src/components/multiStepForm/utils/debug/consoleDebugCommands.ts

import { getGlobalInfiniteLoopStats } from './infiniteLoopDetector';

interface DebugCommandResult {
  success: boolean;
  data?: unknown;
  message: string;
  timestamp: string;
}

interface SystemHealthCheck {
  react: {
    version: string;
    isDevMode: boolean;
    hasStrictMode: boolean;
  };
  hooks: {
    totalCalls: number;
    suspiciousHooks: string[];
    recommendations: string[];
  };
  components: {
    totalComponents: number;
    infiniteLoopComponents: string[];
    healthyComponents: string[];
  };
  performance: {
    renderTime: number;
    memoryUsage: number;
    suggestions: string[];
  };
  multiStepForm: {
    isInitialized: boolean;
    currentStep: unknown;
    errors: string[];
    warnings: string[];
  };
}

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

// 🔧 React 정보 수집 (타입 안전)
const getReactInfo = () => {
  if (!isDevelopmentMode()) {
    return {
      version: 'Production',
      isDevMode: false,
      hasStrictMode: false,
    };
  }

  try {
    const globalWindow = window as any;
    const react = globalWindow.React;
    const reactVersion = react?.version ?? 'Unknown';
    const isDevMode =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname.includes('dev'));

    return {
      version: reactVersion,
      isDevMode,
      hasStrictMode: !!document.querySelector('[data-reactroot]'),
    };
  } catch (error) {
    return {
      version: 'Error',
      isDevMode: false,
      hasStrictMode: false,
    };
  }
};

// 🔧 성능 정보 수집 (타입 안전)
const getPerformanceInfo = () => {
  if (!isDevelopmentMode()) {
    return {
      renderTime: -1,
      memoryUsage: -1,
      suggestions: ['성능 정보는 개발 모드에서만 제공됩니다.'],
    };
  }

  try {
    const renderStart = performance.now();
    const performanceWithMemory = performance as any;
    const memoryInfo = performanceWithMemory.memory;
    const renderTime = performance.now() - renderStart;

    const suggestions: string[] = [];

    const memoryThreshold = 50 * 1024 * 1024; // 50MB
    const renderTimeThreshold = 100; // 100ms

    if (memoryInfo?.usedJSHeapSize > memoryThreshold) {
      suggestions.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
    }

    if (renderTime > renderTimeThreshold) {
      suggestions.push(
        '렌더링 시간이 오래 걸립니다. 컴포넌트 최적화를 고려하세요.'
      );
    }

    return {
      renderTime,
      memoryUsage: memoryInfo?.usedJSHeapSize ?? 0,
      suggestions,
    };
  } catch (error) {
    return {
      renderTime: -1,
      memoryUsage: -1,
      suggestions: ['성능 정보를 수집할 수 없습니다.'],
    };
  }
};

// 🔧 멀티스텝 폼 상태 수집 (구체적 타입 검증)
const getMultiStepFormInfo = () => {
  try {
    const formContainer =
      document.querySelector('[data-testid="multistep-container"]') ??
      document.querySelector('.multistep-form') ??
      document.querySelector('[class*="MultiStep"]');

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!formContainer) {
      errors.push('멀티스텝 폼 컨테이너를 찾을 수 없습니다.');
    }

    // localStorage 확인 (개발 모드에서만)
    if (isDevelopmentMode()) {
      try {
        const formDataKey = 'multi-step-form-storage';
        const formData = localStorage.getItem(formDataKey);
        if (!formData) {
          warnings.push('localStorage에 폼 데이터가 없습니다.');
        }
      } catch (storageError) {
        errors.push('localStorage 접근에 실패했습니다.');
      }

      // React DevTools 확인 (타입 안전)
      const globalWindow = window as any;
      const reactDevTools = globalWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!reactDevTools) {
        warnings.push('React DevTools가 설치되지 않았습니다.');
      }
    }

    return {
      isInitialized: !!formContainer,
      currentStep: 'Unknown',
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isInitialized: false,
      currentStep: 'Error',
      errors: ['멀티스텝 폼 정보 수집 중 오류가 발생했습니다.'],
      warnings: [],
    };
  }
};

// 🔧 시스템 건강 상태 체크
const performSystemHealthCheck = (): SystemHealthCheck => {
  if (!isDevelopmentMode()) {
    return {
      react: getReactInfo(),
      hooks: { totalCalls: 0, suspiciousHooks: [], recommendations: [] },
      components: {
        totalComponents: 0,
        infiniteLoopComponents: [],
        healthyComponents: [],
      },
      performance: getPerformanceInfo(),
      multiStepForm: {
        isInitialized: false,
        currentStep: 'Production',
        errors: [],
        warnings: [],
      },
    };
  }

  console.log('🏥 [HEALTH_CHECK] 시스템 건강 상태 검사 시작...');

  const loopStats = getGlobalInfiniteLoopStats();

  const react = getReactInfo();
  const performance = getPerformanceInfo();
  const multiStepForm = getMultiStepFormInfo();

  // 훅 분석 (구체적 타입 처리)
  const totalHookCalls = loopStats.hooks.reduce(
    (sum, hook) => sum + hook.callCount,
    0
  );
  const suspiciousHookThreshold = 100;
  const suspiciousHooks = loopStats.hooks
    .filter((hook) => hook.callCount > suspiciousHookThreshold)
    .map((hook) => hook.name);

  const hookRecommendations: string[] = [];
  if (suspiciousHooks.length > 0) {
    hookRecommendations.push(
      `다음 훅들이 과도하게 호출되고 있습니다: ${suspiciousHooks.join(', ')}`
    );
  }
  const totalHookCallThreshold = 500;
  if (totalHookCalls > totalHookCallThreshold) {
    hookRecommendations.push(
      '전체 훅 호출 횟수가 높습니다. 의존성 배열을 확인하세요.'
    );
  }

  // 컴포넌트 분석 (구체적 임계값)
  const infiniteLoopThreshold = 50;
  const healthyComponentThreshold = 10;

  const infiniteLoopComponents = loopStats.components
    .filter((comp) => comp.renderCount > infiniteLoopThreshold)
    .map((comp) => comp.name);

  const healthyComponents = loopStats.components
    .filter((comp) => comp.renderCount <= healthyComponentThreshold)
    .map((comp) => comp.name);

  const healthCheck: SystemHealthCheck = {
    react,
    hooks: {
      totalCalls: totalHookCalls,
      suspiciousHooks,
      recommendations: hookRecommendations,
    },
    components: {
      totalComponents: loopStats.components.length,
      infiniteLoopComponents,
      healthyComponents,
    },
    performance,
    multiStepForm,
  };

  console.log('✅ [HEALTH_CHECK] 시스템 건강 상태 검사 완료');
  return healthCheck;
};

// 🚨 긴급 복구 명령어들
const emergencyCommands = {
  // 🔄 페이지 새로고침
  reload: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    console.log('🔄 [EMERGENCY] 페이지 새로고침 실행');
    window.location.reload();
    return {
      success: true,
      message: '페이지를 새로고침합니다...',
      timestamp: new Date().toISOString(),
    };
  },

  // 🧹 localStorage 정리 (구체적 타입 검증)
  clearStorage: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      console.log('🧹 [EMERGENCY] localStorage 정리 시작');
      const storageKeys = Object.keys(localStorage);
      const clearedKeys: string[] = [];

      const keyPatternsToClean = ['form', 'step', 'debug'];

      for (const key of storageKeys) {
        const shouldCleanKey = keyPatternsToClean.some((pattern) =>
          key.includes(pattern)
        );

        if (shouldCleanKey) {
          localStorage.removeItem(key);
          clearedKeys.push(key);
        }
      }

      console.log('✅ [EMERGENCY] localStorage 정리 완료:', clearedKeys);
      return {
        success: true,
        data: clearedKeys,
        message: `${clearedKeys.length}개의 항목을 정리했습니다.`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [EMERGENCY] localStorage 정리 실패:', error);
      return {
        success: false,
        message: 'localStorage 정리에 실패했습니다.',
        timestamp: new Date().toISOString(),
      };
    }
  },

  // 🔧 강제 리렌더링 (타입 안전)
  forceRerender: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      console.log('🔧 [EMERGENCY] 강제 리렌더링 시도');

      // React DevTools가 있으면 사용 (타입 안전)
      const globalWindow = window as any;
      const reactDevTools = globalWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (
        reactDevTools &&
        typeof reactDevTools.onCommitFiberRoot === 'function'
      ) {
        reactDevTools.onCommitFiberRoot();
      }

      // 커스텀 이벤트 발생
      const forceRerenderEvent = new CustomEvent('forceRerender', {
        detail: { timestamp: Date.now() },
      });
      window.dispatchEvent(forceRerenderEvent);

      return {
        success: true,
        message: '강제 리렌더링을 시도했습니다.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [EMERGENCY] 강제 리렌더링 실패:', error);
      return {
        success: false,
        message: '강제 리렌더링에 실패했습니다.',
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// 🔍 정보 조회 명령어들
const infoCommands = {
  // 📊 전체 상태 조회
  status: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    console.log('📊 [INFO] 전체 상태 조회');
    const data = getGlobalInfiniteLoopStats();
    return {
      success: true,
      data,
      message: '전체 상태 정보입니다.',
      timestamp: new Date().toISOString(),
    };
  },

  // 🏥 건강 상태 체크
  health: (): DebugCommandResult => {
    console.log('🏥 [INFO] 건강 상태 체크');
    const data = performSystemHealthCheck();
    return {
      success: true,
      data,
      message: '시스템 건강 상태입니다.',
      timestamp: new Date().toISOString(),
    };
  },

  // 🔄 렌더링 통계 (구체적 타입 변환)
  renders: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    console.log('🔄 [INFO] 렌더링 통계 조회');
    const loopStats = getGlobalInfiniteLoopStats();

    const componentsWithStats = loopStats.components.map((comp) => ({
      name: comp.name,
      renders: comp.renderCount,
      warnings: comp.warnings,
      timeElapsed: `${(comp.timeElapsed / 1000).toFixed(1)}초`,
    }));

    const highRenderThreshold = 20;
    const highRenderComponents = loopStats.components.filter(
      (c) => c.renderCount > highRenderThreshold
    );

    const totalRenderCount = loopStats.components.reduce(
      (sum, c) => sum + c.renderCount,
      0
    );
    const averageRenders =
      loopStats.components.length > 0
        ? Math.round(totalRenderCount / loopStats.components.length)
        : 0;

    const data = {
      components: componentsWithStats,
      summary: {
        totalComponents: loopStats.components.length,
        highRenderComponents: highRenderComponents.length,
        averageRenders,
      },
    };

    return {
      success: true,
      data,
      message: '렌더링 통계입니다.',
      timestamp: new Date().toISOString(),
    };
  },

  // 🪝 훅 통계 (구체적 타입 변환)
  hooks: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    console.log('🪝 [INFO] 훅 통계 조회');
    const loopStats = getGlobalInfiniteLoopStats();

    const hooksWithStats = loopStats.hooks.map((hook) => ({
      name: hook.name,
      calls: hook.callCount,
      stateCount: hook.stateCount,
      lastCall: new Date(hook.lastCallTime).toLocaleTimeString(),
    }));

    const totalCalls = loopStats.hooks.reduce((sum, h) => sum + h.callCount, 0);
    const suspiciousHookThreshold = 50;
    const suspiciousHooksCount = loopStats.hooks.filter(
      (h) => h.callCount > suspiciousHookThreshold
    ).length;

    const data = {
      hooks: hooksWithStats,
      summary: {
        totalHooks: loopStats.hooks.length,
        totalCalls,
        suspiciousHooks: suspiciousHooksCount,
      },
    };

    return {
      success: true,
      data,
      message: '훅 통계입니다.',
      timestamp: new Date().toISOString(),
    };
  },
};

// 🔧 도구 명령어들
const toolCommands = {
  // 📋 도움말
  help: (): DebugCommandResult => {
    const helpText = `
🚨 MultiStepForm 디버깅 명령어 도움말

📊 정보 조회:
• debugMSF.info.status()  - 전체 상태 조회 (개발 모드만)
• debugMSF.info.health()  - 시스템 건강 상태
• debugMSF.info.renders() - 렌더링 통계 (개발 모드만)
• debugMSF.info.hooks()   - 훅 호출 통계 (개발 모드만)

🚨 긴급 복구:
• debugMSF.emergency.reload()       - 페이지 새로고침 (개발 모드만)
• debugMSF.emergency.clearStorage() - localStorage 정리 (개발 모드만)
• debugMSF.emergency.forceRerender() - 강제 리렌더링 (개발 모드만)

🔧 도구:
• debugMSF.tools.help()    - 이 도움말
• debugMSF.tools.monitor() - 실시간 모니터링 시작 (개발 모드만)
• debugMSF.tools.export()  - 디버그 정보 내보내기 (개발 모드만)

💡 팁:
• 무한로딩 시 debugMSF.info.health() 먼저 실행
• 대부분 기능은 개발 환경에서만 동작합니다
• 결과는 브라우저 콘솔에 표시됩니다
• 모든 명령어는 () 괄호와 함께 실행하세요
    `;

    console.log(helpText);
    return {
      success: true,
      data: helpText,
      message: '도움말을 콘솔에 출력했습니다.',
      timestamp: new Date().toISOString(),
    };
  },

  // 📈 실시간 모니터링 (타입 안전)
  monitor: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    console.log('📈 [MONITOR] 실시간 모니터링 시작');

    const monitoringInterval = 2000; // 2초
    const autoStopDelay = 300000; // 5분

    const intervalId = setInterval(() => {
      const stats = getGlobalInfiniteLoopStats();
      const suspiciousRenderThreshold = 30;
      const suspiciousComponents = stats.components.filter(
        (c) => c.renderCount > suspiciousRenderThreshold
      );

      if (suspiciousComponents.length > 0) {
        const componentSummary = suspiciousComponents
          .map((c) => `${c.name}(${c.renderCount}회)`)
          .join(', ');

        console.warn(
          '⚠️ [MONITOR] 의심스러운 컴포넌트 감지:',
          componentSummary
        );
      }
    }, monitoringInterval);

    // 5분 후 자동 중지
    setTimeout(() => {
      clearInterval(intervalId);
      console.log('📈 [MONITOR] 모니터링 자동 종료');
    }, autoStopDelay);

    const globalWindow = window as any;
    globalWindow.__DEBUG_MONITOR_INTERVAL__ = intervalId;

    return {
      success: true,
      message: '실시간 모니터링을 시작했습니다. (5분 후 자동 종료)',
      timestamp: new Date().toISOString(),
    };
  },

  // 📤 디버그 정보 내보내기 (타입 안전)
  export: (): DebugCommandResult => {
    if (!isDevelopmentMode()) {
      return {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      console.log('📤 [EXPORT] 디버그 정보 내보내기');

      const localStorageData: Record<string, string> = {};
      const storageKeys = Object.keys(localStorage);
      const relevantKeyPatterns = ['form', 'step'];

      for (const key of storageKeys) {
        const isRelevantKey = relevantKeyPatterns.some((pattern) =>
          key.includes(pattern)
        );

        if (isRelevantKey) {
          const value = localStorage.getItem(key);
          const truncatedValue = value ? value.substring(0, 100) + '...' : '';
          localStorageData[key] = truncatedValue;
        }
      }

      const debugData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stats: getGlobalInfiniteLoopStats(),
        health: performSystemHealthCheck(),
        localStorage: localStorageData,
      };

      const jsonString = JSON.stringify(debugData, null, 2);

      // 클립보드에 복사 시도 (타입 안전)
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        navigator.clipboard.writeText(jsonString);
        console.log('📋 디버그 정보가 클립보드에 복사되었습니다.');
      }

      // 파일 다운로드 링크 생성
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `multistep-debug-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        data: debugData,
        message: '디버그 정보를 내보냈습니다.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [EXPORT] 내보내기 실패:', error);
      return {
        success: false,
        message: '디버그 정보 내보내기에 실패했습니다.',
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// 🌐 전역 디버깅 객체 등록
const debugMSF = {
  info: infoCommands,
  emergency: emergencyCommands,
  tools: toolCommands,
};

// 🔧 초기화 함수 - 개발 모드에서만 콘솔 명령어 등록
const initializeDebugCommands = () => {
  if (!isDevelopmentMode() || typeof window === 'undefined') {
    return;
  }

  const globalWindow = window as any;
  globalWindow.debugMSF = debugMSF;

  // 단축 명령어들
  globalWindow.msfStatus = infoCommands.status;
  globalWindow.msfHealth = infoCommands.health;
  globalWindow.msfHelp = toolCommands.help;
  globalWindow.msfReload = emergencyCommands.reload;

  console.log(`
🚨 MultiStepForm 디버깅 시스템이 활성화되었습니다!

📋 빠른 명령어:
• msfStatus() - 상태 확인
• msfHealth() - 건강 체크
• msfHelp()   - 도움말
• msfReload() - 새로고침

📚 전체 명령어: debugMSF.tools.help()
  `);
};

// 브라우저 콘솔에 등록 (개발 모드에서만)
if (typeof window !== 'undefined' && isDevelopmentMode()) {
  initializeDebugCommands();
}

// ✅ 단일 export 구문으로 통합 (중복 제거)
export default debugMSF;
export { initializeDebugCommands };

if (isDevelopmentMode()) {
  console.log('📄 [CONSOLE_DEBUG] ✅ 브라우저 콘솔 디버깅 시스템 로드 완료');
}
