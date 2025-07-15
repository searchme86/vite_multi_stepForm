// 📁 imageUpload/utils/loggerUtils.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level: LogLevel;
  category: string;
  data?: Record<string, unknown>;
  timestamp?: boolean;
}

interface LoggerInterface {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 🔧 순환 참조 안전한 JSON 변환 함수 추가
const safeStringify = (data: Record<string, unknown>): string => {
  const seen = new WeakSet();

  try {
    return JSON.stringify(
      data,
      (key, value) => {
        // 🔧 HTML 엘리먼트나 React 관련 객체 필터링
        if (typeof value === 'object' && value !== null) {
          // React Fiber 관련 속성 제외
          if (key.startsWith('__react') || key.startsWith('_react')) {
            return '[React Internal]';
          }

          // HTML 엘리먼트 필터링
          if (value instanceof HTMLElement) {
            return `[HTMLElement: ${value.tagName}]`;
          }

          // Event 객체 필터링
          if (value instanceof Event) {
            return {
              type: value.type,
              timeStamp: value.timeStamp,
              target: '[Event Target]',
            };
          }

          // SyntheticEvent 필터링 (React 이벤트)
          if (value && typeof value === 'object' && 'nativeEvent' in value) {
            return {
              type: value.type || 'SyntheticEvent',
              timeStamp: value.timeStamp || Date.now(),
              target: '[SyntheticEvent Target]',
            };
          }

          // 순환 참조 체크
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }

        return value;
      },
      2
    );
  } catch (error) {
    // JSON 변환 실패 시 안전한 대체
    return `[Stringify Error: ${
      error instanceof Error ? error.message : 'Unknown'
    }]`;
  }
};

// 환경에 따른 로그 레벨 설정
const getCurrentLogLevel = (): LogLevel => {
  // 브라우저 환경에서 개발/프로덕션 구분
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location?.hostname === 'localhost' ||
      window.location?.hostname === '127.0.0.1' ||
      window.location?.hostname.includes('dev'));

  const isProduction = !isDevelopment;

  console.log('🔧 [LOGGER] 환경 설정:', {
    isDevelopment,
    isProduction,
    hostname:
      typeof window !== 'undefined' ? window.location?.hostname : 'server',
    timestamp: new Date().toLocaleTimeString(),
  });

  // 프로덕션에서는 warn 이상만, 개발에서는 debug 포함 모두
  return isProduction ? 'warn' : 'debug';
};

const CURRENT_LOG_LEVEL = getCurrentLogLevel();

export const createLogger = (defaultCategory: string): LoggerInterface => {
  const shouldLogLevel = (level: LogLevel): boolean => {
    const currentLevelValue = LOG_LEVELS[CURRENT_LOG_LEVEL] ?? LOG_LEVELS.warn;
    const requestedLevelValue = LOG_LEVELS[level] ?? LOG_LEVELS.error;

    return requestedLevelValue >= currentLevelValue;
  };

  const formatLogMessage = (message: string, options: LogOptions): string => {
    const { category, timestamp = true } = options;
    const timeStamp = timestamp ? new Date().toLocaleTimeString() : '';
    const categoryUpper = category.toUpperCase();

    return `[${categoryUpper}] ${message} ${timeStamp}`;
  };

  const createLogFunction = (
    level: LogLevel,
    icon: string,
    consoleMethod: 'log' | 'warn' | 'error'
  ) => {
    return (message: string, data?: Record<string, unknown>) => {
      if (!shouldLogLevel(level)) {
        return;
      }

      const formattedMessage = formatLogMessage(message, {
        level,
        category: defaultCategory,
        data,
      });

      const logOutput = `${icon} ${formattedMessage}`;
      const logData = data ?? {};

      // 구조분해할당으로 console 메서드 접근
      const { [consoleMethod]: logMethod } = console;

      if (typeof logMethod === 'function') {
        if (Object.keys(logData).length > 0) {
          // 🔧 안전한 JSON 변환 사용
          try {
            // 간단한 데이터는 직접 출력
            if (Object.keys(logData).length < 5) {
              logMethod(logOutput, logData);
            } else {
              // 복잡한 데이터는 안전한 문자열로 변환
              const safeDataString = safeStringify(logData);
              logMethod(`${logOutput}\n${safeDataString}`);
            }
          } catch (outputError) {
            // 최후의 안전장치
            logMethod(`${logOutput} [Data logging failed: ${outputError}]`);
          }
        } else {
          logMethod(logOutput);
        }
      }
    };
  };

  const debugLogger = createLogFunction('debug', '🔧', 'log');
  const infoLogger = createLogFunction('info', 'ℹ️', 'log');
  const warnLogger = createLogFunction('warn', '⚠️', 'warn');
  const errorLogger = createLogFunction('error', '❌', 'error');

  console.log('🚀 [LOGGER] createLogger 초기화 완료:', {
    category: defaultCategory,
    currentLogLevel: CURRENT_LOG_LEVEL,
    levelValue: LOG_LEVELS[CURRENT_LOG_LEVEL],
    safeJsonEnabled: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    debug: debugLogger,
    info: infoLogger,
    warn: warnLogger,
    error: errorLogger,
  };
};

// 로그 레벨 유틸리티 함수들
export const getLogLevel = (): LogLevel => CURRENT_LOG_LEVEL;

export const isLogLevelEnabled = (level: LogLevel): boolean => {
  const currentLevelValue = LOG_LEVELS[CURRENT_LOG_LEVEL] ?? LOG_LEVELS.warn;
  const requestedLevelValue = LOG_LEVELS[level] ?? LOG_LEVELS.error;

  return requestedLevelValue >= currentLevelValue;
};

export type { LogLevel, LoggerInterface };
