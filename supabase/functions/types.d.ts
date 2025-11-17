declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export type ServeHandler = (request: Request) => Response | Promise<Response>;

  export interface ServeInit {
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { port: number; hostname: string }) => void;
  }

  export function serve(handler: ServeHandler, options?: ServeInit): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

interface DenoEnv {
  get(key: string): string | undefined;
}

declare const Deno: {
  env: DenoEnv;
};

export {};
