const ENV_KEYS = [
  'BASE_API_URL',
] as const;

type EnvConfig = {
  [K in typeof ENV_KEYS[number]]: string;
};

const getEnvVariables = (): EnvConfig => {
  return ENV_KEYS.reduce((acc, key) => {
    const value = import.meta.env[`VITE_${key}` as `VITE_${typeof key}`];
    acc[key] = value || '';
    return acc;
  }, {} as EnvConfig);
}

const env = getEnvVariables();

export const {
  BASE_API_URL,
} = env;
