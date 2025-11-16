import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anonKey) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
	}
    return createServerClient(url, anonKey, {
        cookies: {
            get(name: string) {
                try {
                    const cookieStore = cookies();
                    if (typeof cookieStore.get === "function") {
                        return cookieStore.get(name)?.value;
                    }
                    // Fallback: usar getAll() se get() não estiver disponível
                    return cookieStore.getAll().find((c) => c.name === name)?.value;
                } catch {
                    return undefined;
                }
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookies().set({ name, value, ...options });
                } catch {}
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookies().set({ name, value: "", ...options });
                } catch {}
            },
        },
    });
}

export function createSupabaseServiceRoleClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceKey) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
	}
    // Usa o client oficial do supabase-js para evitar necessidade de cookies no contexto server-only
    return createSupabaseJsClient(url, serviceKey);
}

export type SupabaseServer = ReturnType<typeof createSupabaseServerClient>;

