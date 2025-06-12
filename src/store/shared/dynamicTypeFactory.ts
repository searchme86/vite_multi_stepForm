type Capitalize<S extends string> = S extends `${infer T}${infer U}`
  ? `${Uppercase<T>}${U}`
  : S;

export type GetterMethodName<K extends keyof any> = `get${Capitalize<
  string & K
>}`;
export type SetterMethodName<K extends keyof any> = `set${Capitalize<
  string & K
>}`;

export type GetterMethods<T> = {
  [K in keyof T as GetterMethodName<K>]: () => T[K];
};

export type SetterMethods<T> = {
  [K in keyof T as SetterMethodName<K>]: (value: T[K]) => void;
};

export type DynamicStoreMethods<T> = GetterMethods<T> & SetterMethods<T>;

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const createDynamicMethods = <T extends Record<string, any>>(
  initialState: T
): DynamicStoreMethods<T> => {
  const methods: any = {};
  const keys = Object.keys(initialState) as Array<keyof T>;

  keys.forEach(<K extends keyof T>(key: K) => {
    const keyStr = String(key);
    const getterName = `get${capitalize(keyStr)}` as GetterMethodName<K>;
    const setterName = `set${capitalize(keyStr)}` as SetterMethodName<K>;

    methods[getterName] = () => {
      throw new Error(
        `${String(getterName)} method must be implemented in store`
      );
    };

    methods[setterName] = (value: T[K]) => {
      throw new Error(
        `${String(setterName)} method must be implemented in store`
      );
    };
  });

  return methods as DynamicStoreMethods<T>;
};
