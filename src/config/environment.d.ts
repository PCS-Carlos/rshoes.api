export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_PORT: number;
      JWT_SECRET: string;
      POSTHOG_HOST?: string;
      POSTHOG_PROJECT_ID?: string;
      POSTHOG_PERSONAL_API_KEY?: string;
    }
  }
}