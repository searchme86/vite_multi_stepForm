// bridges/common/logger.ts

// 🔧 Node.js process 타입 정의
interface NodeProcess {
  env?: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
}

// 🔧 전역 타입 확장
declare global {
  var process: NodeProcess | undefined;
  var bridgeLoggerTimings: Map<string, number> | undefined;
}

// 🔧 로그 레벨 정의
type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

// 🔧 로그 항목 인터페이스
interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly context: string;
  readonly timestamp: number;
  readonly data?: Record<string, unknown>;
}

// 🔧 로그 설정 인터페이스
interface LoggerConfiguration {
  readonly enabledInProduction: boolean;
  readonly enabledInDevelopment: boolean;
  readonly enabledLevels: readonly LogLevel[];
  readonly maxLogHistorySize: number;
  readonly performanceSensitiveContexts: readonly string[];
  readonly consoleOutput: boolean;
  readonly fileOutput: boolean;
}

// 🔧 환경 타입 정의
type EnvironmentType = 'production' | 'development' | 'test';

// 🔧 Node.js 환경 감지 함수
function detectNodeEnvironment(): EnvironmentType {
  const processObject = globalThis.process;
  const hasProcess = processObject !== undefined && processObject !== null;

  if (!hasProcess) {
    console.debug(
      '🔍 [ENV_DETECT] Node.js process 객체 없음 - 브라우저 환경으로 추정'
    );
    return 'development';
  }

  const processEnv = processObject.env;
  const hasProcessEnv = processEnv !== undefined && processEnv !== null;

  if (!hasProcessEnv) {
    console.debug('🔍 [ENV_DETECT] process.env 없음 - development로 설정');
    return 'development';
  }

  const nodeEnvValue = processEnv.NODE_ENV;
  const hasNodeEnv = typeof nodeEnvValue === 'string';

  if (!hasNodeEnv) {
    console.debug('🔍 [ENV_DETECT] NODE_ENV 없음 - development로 설정');
    return 'development';
  }

  const envMap = new Map<string, EnvironmentType>([
    ['production', 'production'],
    ['test', 'test'],
    ['development', 'development'],
  ]);

  const detectedEnv = envMap.get(nodeEnvValue);
  const finalEnv = detectedEnv ? detectedEnv : 'development';

  console.debug(`🔍 [ENV_DETECT] NODE_ENV: ${nodeEnvValue} → ${finalEnv}`);
  return finalEnv;
}

// 🔧 브라우저 환경 감지 함수
function detectBrowserEnvironment(): EnvironmentType {
  const hasWindow = typeof window !== 'undefined';

  if (!hasWindow) {
    console.debug('🔍 [ENV_DETECT] window 객체 없음 - development로 설정');
    return 'development';
  }

  const { location } = window;
  const hasLocation = location !== null && location !== undefined;

  if (!hasLocation) {
    console.debug('🔍 [ENV_DETECT] location 객체 없음 - development로 설정');
    return 'development';
  }

  const { hostname = '' } = location;
  const hostnameLowerCase = hostname.toLowerCase();

  const developmentHostPatterns = new Set<string>(['localhost', '127.0.0.1']);

  const isDevelopmentHost = developmentHostPatterns.has(hostnameLowerCase);
  const isLocalNetworkHost =
    hostnameLowerCase.startsWith('192.168.') ||
    hostnameLowerCase.startsWith('10.');

  const shouldUseDevelopment = isDevelopmentHost || isLocalNetworkHost;
  const detectedEnv = shouldUseDevelopment ? 'development' : 'production';

  console.debug(`🔍 [ENV_DETECT] hostname: ${hostname} → ${detectedEnv}`);
  return detectedEnv;
}

// 🔧 환경 감지 함수
function detectCurrentEnvironment(): EnvironmentType {
  // Early Return: Node.js 환경 우선 체크
  const processObject = globalThis.process;
  const hasProcess = processObject !== undefined && processObject !== null;

  const finalEnvironment = hasProcess
    ? detectNodeEnvironment()
    : detectBrowserEnvironment();

  console.debug(`🔍 [ENV_DETECT] 최종 환경: ${finalEnvironment}`);
  return finalEnvironment;
}

// 🔧 기본 로거 설정 생성
function createDefaultLoggerConfiguration(): LoggerConfiguration {
  const currentEnvironment = detectCurrentEnvironment();

  const environmentConfigMap = new Map<
    EnvironmentType,
    Partial<LoggerConfiguration>
  >([
    [
      'production',
      {
        enabledInProduction: true,
        enabledInDevelopment: false,
        enabledLevels: ['ERROR'],
        maxLogHistorySize: 100,
        consoleOutput: false,
        fileOutput: false,
      },
    ],
    [
      'development',
      {
        enabledInProduction: false,
        enabledInDevelopment: true,
        enabledLevels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
        maxLogHistorySize: 500,
        consoleOutput: true,
        fileOutput: false,
      },
    ],
    [
      'test',
      {
        enabledInProduction: false,
        enabledInDevelopment: false,
        enabledLevels: ['ERROR', 'WARN'],
        maxLogHistorySize: 100,
        consoleOutput: false,
        fileOutput: false,
      },
    ],
  ]);

  const environmentConfig = environmentConfigMap.get(currentEnvironment);
  const baseConfig = environmentConfig
    ? environmentConfig
    : environmentConfigMap.get('development')!;

  const defaultConfiguration: LoggerConfiguration = {
    enabledInProduction: baseConfig.enabledInProduction!,
    enabledInDevelopment: baseConfig.enabledInDevelopment!,
    enabledLevels: baseConfig.enabledLevels!,
    maxLogHistorySize: baseConfig.maxLogHistorySize!,
    performanceSensitiveContexts: [
      'EXTRACTOR',
      'TRANSFORMER',
      'VALIDATOR',
      'TYPE_GUARD',
      'LOOP_OPERATION',
      'RENDER_CYCLE',
    ],
    consoleOutput: baseConfig.consoleOutput!,
    fileOutput: baseConfig.fileOutput!,
  };

  console.debug('🔍 [LOGGER_CONFIG] 기본 설정 생성 완료', defaultConfiguration);
  return defaultConfiguration;
}

// 🔧 로그 레벨 우선순위 검사
function checkLogLevelPriority(
  targetLevel: LogLevel,
  enabledLevels: readonly LogLevel[]
): boolean {
  const levelPriorityMap = new Map<LogLevel, number>([
    ['ERROR', 4],
    ['WARN', 3],
    ['INFO', 2],
    ['DEBUG', 1],
  ]);

  const targetPriority = levelPriorityMap.get(targetLevel);

  // Early Return: 유효하지 않은 레벨
  if (targetPriority === undefined) {
    console.debug(`🔍 [LOG_LEVEL] 유효하지 않은 레벨: ${targetLevel}`);
    return false;
  }

  const enabledPriorities = enabledLevels
    .map((level) => levelPriorityMap.get(level))
    .filter((priority): priority is number => priority !== undefined);

  const hasEnabledPriorities = enabledPriorities.length > 0;
  if (!hasEnabledPriorities) {
    console.debug('🔍 [LOG_LEVEL] 활성화된 레벨 없음');
    return false;
  }

  const minimumEnabledPriority = Math.min(...enabledPriorities);
  const shouldLogLevel = targetPriority >= minimumEnabledPriority;

  console.debug(
    `🔍 [LOG_LEVEL] ${targetLevel}(${targetPriority}) >= ${minimumEnabledPriority} = ${shouldLogLevel}`
  );
  return shouldLogLevel;
}

// 🔧 성능 민감 컨텍스트 검사
function checkPerformanceSensitiveContext(
  context: string,
  performanceSensitiveContexts: readonly string[]
): boolean {
  const contextUpperCase = context.toUpperCase();
  const sensitiveContextsSet = new Set(
    performanceSensitiveContexts.map((ctx) => ctx.toUpperCase())
  );

  const contextWords = contextUpperCase.split('_');
  const isPerformanceSensitive = contextWords.some((word) =>
    sensitiveContextsSet.has(word)
  );

  console.debug(
    `🔍 [PERFORMANCE] 컨텍스트 ${context} 성능민감: ${isPerformanceSensitive}`
  );
  return isPerformanceSensitive;
}

// 🔧 로그 데이터 정제 함수
function sanitizeLogData(rawData: unknown): Record<string, unknown> {
  // Early Return: null 또는 undefined
  const isNullish = rawData === null || rawData === undefined;
  if (isNullish) {
    console.debug('🔍 [SANITIZE] null/undefined 데이터');
    return {};
  }

  // Early Return: 원시 타입
  const isPrimitive = typeof rawData !== 'object';
  if (isPrimitive) {
    console.debug('🔍 [SANITIZE] 원시 타입 데이터');
    return { value: rawData };
  }

  // Early Return: 배열
  const isArray = Array.isArray(rawData);
  if (isArray) {
    const slicedItems = rawData.slice(0, 10);
    console.debug(`🔍 [SANITIZE] 배열 데이터 (처음 ${slicedItems.length}개)`);
    return { items: slicedItems };
  }

  try {
    const dataObject = rawData;
    const sanitizedData: Record<string, unknown> = {};

    // 🔧 Reflect.ownKeys로 모든 키 추출
    const objectKeys = Reflect.ownKeys(dataObject);
    const stringKeys = objectKeys.filter(
      (key): key is string => typeof key === 'string'
    );

    const limitedKeys = stringKeys.slice(0, 20);
    console.debug(
      `🔍 [SANITIZE] 객체 키 개수: ${stringKeys.length} → ${limitedKeys.length}`
    );

    limitedKeys.forEach((key) => {
      try {
        const value = Reflect.get(dataObject, key);
        const valueType = typeof value;

        const nonSerializableTypes = new Set(['function', 'symbol']);
        const isNonSerializableType = nonSerializableTypes.has(valueType);
        const isWeakCollection =
          value instanceof WeakMap || value instanceof WeakSet;
        const isSerializable = !isNonSerializableType && !isWeakCollection;

        sanitizedData[key] = isSerializable ? value : '[Non-serializable]';
      } catch (propertyError) {
        console.debug(`🔍 [SANITIZE] 프로퍼티 접근 에러: ${key}`);
        sanitizedData[key] = '[Error accessing property]';
      }
    });

    return sanitizedData;
  } catch (sanitizationError) {
    console.debug('🔍 [SANITIZE] 정제 과정 에러');
    return { error: 'Failed to sanitize log data' };
  }
}

// 🔧 로그 항목 생성 함수
function createLogEntry(
  level: LogLevel,
  message: string,
  context: string,
  data?: unknown
): LogEntry {
  const hasData = data !== undefined && data !== null;
  const sanitizedData = hasData ? sanitizeLogData(data) : undefined;

  const logEntry: LogEntry = {
    level,
    message,
    context,
    timestamp: Date.now(),
    data: sanitizedData,
  };

  console.debug(`🔍 [LOG_ENTRY] 생성: ${level} - ${context}`);
  return logEntry;
}

// 🔧 콘솔 출력 함수
function outputToConsole(logEntry: LogEntry): void {
  const { level, message, context, timestamp, data } = logEntry;
  const timeString = new Date(timestamp).toISOString();
  const contextPrefix = `[${context}]`;
  const fullMessage = `${timeString} ${contextPrefix} ${message}`;

  const hasValidData =
    data !== undefined && data !== null && Object.keys(data).length > 0;

  const logData = hasValidData ? data : '';

  const consoleMethodMap = new Map<LogLevel, Function>([
    ['ERROR', console.error],
    ['WARN', console.warn],
    ['INFO', console.log],
    ['DEBUG', console.debug],
  ]);

  const iconMap = new Map<LogLevel, string>([
    ['ERROR', '❌'],
    ['WARN', '⚠️'],
    ['INFO', 'ℹ️'],
    ['DEBUG', '🔍'],
  ]);

  const consoleMethod = consoleMethodMap.get(level);
  const icon = iconMap.get(level);

  const finalMethod = consoleMethod ? consoleMethod : console.log;
  const finalIcon = icon ? icon : '📝';

  finalMethod(`${finalIcon} ${fullMessage}`, logData);
}

// 🔧 타이밍 맵 생성 함수
function createTimingMap(): Map<string, number> {
  const newTimingMap = new Map<string, number>();
  console.debug('🔍 [TIMING] 새로운 타이밍 맵 생성');
  return newTimingMap;
}

// 🔧 전역 타이밍 맵 접근 함수
function getGlobalTimingMap(): Map<string, number> {
  const existingMap = globalThis.bridgeLoggerTimings;
  const hasExistingMap = existingMap !== undefined && existingMap !== null;

  if (hasExistingMap) {
    return existingMap;
  }

  const newTimingMap = createTimingMap();
  globalThis.bridgeLoggerTimings = newTimingMap;

  return newTimingMap;
}

// 🔧 로거 클래스
class BridgeLogger {
  private readonly configuration: LoggerConfiguration;
  private readonly logHistory: LogEntry[];
  private readonly currentEnvironment: string;

  constructor(customConfiguration?: Partial<LoggerConfiguration>) {
    const defaultConfig = createDefaultLoggerConfiguration();

    const hasCustomConfig =
      customConfiguration !== undefined && customConfiguration !== null;

    this.configuration = hasCustomConfig
      ? { ...defaultConfig, ...customConfiguration }
      : defaultConfig;

    this.logHistory = [];
    this.currentEnvironment = detectCurrentEnvironment();

    console.debug('🔍 [LOGGER] BridgeLogger 인스턴스 생성', {
      environment: this.currentEnvironment,
      config: this.configuration,
    });
  }

  private shouldLogInCurrentEnvironment(): boolean {
    const isProduction = this.currentEnvironment === 'production';
    const isDevelopment = this.currentEnvironment === 'development';
    const isTest = this.currentEnvironment === 'test';

    const { enabledInProduction, enabledInDevelopment } = this.configuration;

    const shouldLog = isProduction
      ? enabledInProduction
      : isDevelopment
      ? enabledInDevelopment
      : isTest
      ? false
      : enabledInDevelopment;

    console.debug(
      `🔍 [ENV_CHECK] ${this.currentEnvironment} 환경 로깅 여부: ${shouldLog}`
    );
    return shouldLog;
  }

  private shouldLogLevel(level: LogLevel): boolean {
    const { enabledLevels } = this.configuration;
    const result = checkLogLevelPriority(level, enabledLevels);

    console.debug(`🔍 [LEVEL_CHECK] ${level} 레벨 로깅 여부: ${result}`);
    return result;
  }

  private shouldSkipPerformanceSensitive(context: string): boolean {
    const { performanceSensitiveContexts } = this.configuration;
    const isPerformanceSensitive = checkPerformanceSensitiveContext(
      context,
      performanceSensitiveContexts
    );

    const isProduction = this.currentEnvironment === 'production';
    const shouldSkip = isProduction && isPerformanceSensitive;

    console.debug(`🔍 [PERF_CHECK] 성능민감 컨텍스트 스킵: ${shouldSkip}`);
    return shouldSkip;
  }

  private addToHistory(logEntry: LogEntry): void {
    const { maxLogHistorySize } = this.configuration;

    this.logHistory.push(logEntry);

    const shouldTrimHistory = this.logHistory.length > maxLogHistorySize;
    if (shouldTrimHistory) {
      const excessCount = this.logHistory.length - maxLogHistorySize;
      this.logHistory.splice(0, excessCount);
      console.debug(`🔍 [HISTORY] 히스토리 정리: ${excessCount}개 항목 제거`);
    }
  }

  private executeLog(
    level: LogLevel,
    message: string,
    context: string,
    data?: unknown
  ): void {
    // Early Return: 환경별 비활성화
    const shouldLogInEnvironment = this.shouldLogInCurrentEnvironment();
    if (!shouldLogInEnvironment) {
      return;
    }

    // Early Return: 레벨별 비활성화
    const shouldLogThisLevel = this.shouldLogLevel(level);
    if (!shouldLogThisLevel) {
      return;
    }

    // Early Return: 성능 민감 컨텍스트 스킵
    const shouldSkipForPerformance =
      this.shouldSkipPerformanceSensitive(context);
    if (shouldSkipForPerformance) {
      return;
    }

    const logEntry = createLogEntry(level, message, context, data);

    // 히스토리에 추가
    this.addToHistory(logEntry);

    // 콘솔 출력
    const { consoleOutput } = this.configuration;
    const shouldOutputToConsole = consoleOutput;
    if (shouldOutputToConsole) {
      outputToConsole(logEntry);
    }
  }

  // 🔧 공개 로깅 메서드들
  error(message: string, context: string, data?: unknown): void {
    this.executeLog('ERROR', message, context, data);
  }

  warn(message: string, context: string, data?: unknown): void {
    this.executeLog('WARN', message, context, data);
  }

  info(message: string, context: string, data?: unknown): void {
    this.executeLog('INFO', message, context, data);
  }

  debug(message: string, context: string, data?: unknown): void {
    this.executeLog('DEBUG', message, context, data);
  }

  // 🔧 유틸리티 메서드들
  getLogHistory(): readonly LogEntry[] {
    const copiedHistory = [...this.logHistory];
    console.debug(`🔍 [HISTORY] 히스토리 조회: ${copiedHistory.length}개 항목`);
    return copiedHistory;
  }

  getConfiguration(): LoggerConfiguration {
    const copiedConfig = { ...this.configuration };
    console.debug('🔍 [CONFIG] 설정 조회', copiedConfig);
    return copiedConfig;
  }

  getCurrentEnvironment(): string {
    console.debug(`🔍 [ENV] 현재 환경: ${this.currentEnvironment}`);
    return this.currentEnvironment;
  }

  clearHistory(): void {
    const previousCount = this.logHistory.length;
    this.logHistory.splice(0, this.logHistory.length);
    console.debug(`🔍 [HISTORY] 히스토리 초기화: ${previousCount}개 항목 제거`);
  }

  // 🔧 성능 측정용 메서드
  timeStart(operationName: string, context: string): void {
    const startTime = Date.now();
    const timeKey = `${context}_${operationName}`;

    const timingMap = getGlobalTimingMap();
    timingMap.set(timeKey, startTime);

    console.debug(`🔍 [TIMING] 타이밍 시작: ${operationName} (${context})`);
    this.debug(`타이밍 시작: ${operationName}`, context);
  }

  timeEnd(operationName: string, context: string): void {
    const endTime = Date.now();
    const timeKey = `${context}_${operationName}`;

    const timingMap = getGlobalTimingMap();
    const startTime = timingMap.get(timeKey);

    const hasStartTime = startTime !== undefined;
    if (!hasStartTime) {
      console.debug(
        `🔍 [TIMING] 시작 시간 없음: ${operationName} (${context})`
      );
      this.warn(`시작 시간 없음: ${operationName}`, context);
      return;
    }

    const duration = endTime - startTime;
    timingMap.delete(timeKey);

    console.debug(`🔍 [TIMING] 타이밍 완료: ${operationName} (${duration}ms)`);
    this.info(`타이밍 완료: ${operationName}`, context, {
      duration: `${duration}ms`,
    });
  }
}

// 🔧 전역 로거 인스턴스 생성
const bridgeLogger = new BridgeLogger();

// 🔧 편의 함수들
export function logError(
  message: string,
  context: string,
  data?: unknown
): void {
  bridgeLogger.error(message, context, data);
}

export function logWarn(
  message: string,
  context: string,
  data?: unknown
): void {
  bridgeLogger.warn(message, context, data);
}

export function logInfo(
  message: string,
  context: string,
  data?: unknown
): void {
  bridgeLogger.info(message, context, data);
}

export function logDebug(
  message: string,
  context: string,
  data?: unknown
): void {
  bridgeLogger.debug(message, context, data);
}

export function logTimeStart(operationName: string, context: string): void {
  bridgeLogger.timeStart(operationName, context);
}

export function logTimeEnd(operationName: string, context: string): void {
  bridgeLogger.timeEnd(operationName, context);
}

// 🔧 로거 설정 함수들
export function createCustomLogger(
  configuration?: Partial<LoggerConfiguration>
): BridgeLogger {
  return new BridgeLogger(configuration);
}

export function getGlobalLogger(): BridgeLogger {
  return bridgeLogger;
}

export function configureGlobalLogger(
  configuration: Partial<LoggerConfiguration>
): void {
  const newLogger = new BridgeLogger(configuration);

  // 전역 참조 업데이트
  Object.setPrototypeOf(bridgeLogger, Object.getPrototypeOf(newLogger));
  Object.assign(bridgeLogger, newLogger);

  console.debug('🔍 [CONFIG] 전역 로거 설정 업데이트 완료');
}

// 🔧 환경별 로거 프리셋
export function createProductionLogger(): BridgeLogger {
  return new BridgeLogger({
    enabledInProduction: true,
    enabledInDevelopment: true,
    enabledLevels: ['ERROR'],
    maxLogHistorySize: 50,
    consoleOutput: false,
    fileOutput: true,
  });
}

export function createDevelopmentLogger(): BridgeLogger {
  return new BridgeLogger({
    enabledInProduction: false,
    enabledInDevelopment: true,
    enabledLevels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
    maxLogHistorySize: 1000,
    consoleOutput: true,
    fileOutput: false,
  });
}

export function createTestLogger(): BridgeLogger {
  return new BridgeLogger({
    enabledInProduction: false,
    enabledInDevelopment: false,
    enabledLevels: ['ERROR', 'WARN'],
    maxLogHistorySize: 100,
    consoleOutput: false,
    fileOutput: false,
  });
}

// 🔧 타입 내보내기
export type { LogLevel, LogEntry, LoggerConfiguration };
export { BridgeLogger };

// 🔧 기본 내보내기
export default bridgeLogger;
