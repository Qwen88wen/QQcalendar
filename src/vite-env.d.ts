/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_USER_QQROU_PASSWORD: string;
  readonly VITE_USER_QQFANG_PASSWORD: string;
  readonly VITE_USER_QQWEN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
