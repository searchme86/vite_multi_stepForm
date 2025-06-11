export const preventDefault = (event: Event): void => {
  console.log('🔧 eventUtils: preventDefault 호출');
  event.preventDefault();
};

export const stopPropagation = (event: Event): void => {
  console.log('🔧 eventUtils: stopPropagation 호출');
  event.stopPropagation();
};

export const preventDefaultAndStop = (event: Event): void => {
  console.log('🔧 eventUtils: preventDefault + stopPropagation 호출');
  event.preventDefault();
  event.stopPropagation();
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  console.log('🔧 eventUtils: throttle 함수 생성', delay);

  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      console.log('🔧 eventUtils: throttle 즉시 실행');
      lastExecTime = currentTime;
      return func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        console.log('🔧 eventUtils: throttle 지연 실행');
        lastExecTime = Date.now();
        func(...args);
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  console.log('🔧 eventUtils: debounce 함수 생성', delay);

  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    console.log('🔧 eventUtils: debounce 호출');

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      console.log('🔧 eventUtils: debounce 실행');
      func(...args);
    }, delay);
  }) as T;
};

export const createEventHandler = <T extends Event>(
  handler: (event: T) => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    throttle?: number;
    debounce?: number;
  } = {}
): ((event: T) => void) => {
  console.log('🔧 eventUtils: 이벤트 핸들러 생성', options);

  let processedHandler = handler;

  if (options.debounce) {
    processedHandler = debounce(processedHandler, options.debounce);
  } else if (options.throttle) {
    processedHandler = throttle(processedHandler, options.throttle);
  }

  return (event: T) => {
    if (options.preventDefault) {
      event.preventDefault();
    }

    if (options.stopPropagation) {
      event.stopPropagation();
    }

    processedHandler(event);
  };
};
