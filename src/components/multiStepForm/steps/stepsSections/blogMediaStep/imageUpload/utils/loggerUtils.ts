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
          logMethod(logOutput, logData);
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
