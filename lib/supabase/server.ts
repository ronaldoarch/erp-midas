import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export async function createSupabaseServerClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anonKey) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
	}
    return createServerClient(url, anonKey, {
        cookies: {
            async get(name: string) {
                try {
                    const cookieStore = await cookies();
                    return cookieStore.get(name)?.value;
                } catch {
                    return undefined;
                }
            },
            async set(name: string, value: string, options: CookieOptions) {
                try {
                    const cookieStore = await cookies();
                    cookieStore.set({ name, value, ...options });
                } catch {}
            },
            async remove(name: string, options: CookieOptions) {
                try {
                    const cookieStore = await cookies();
                    cookieStore.set({ name, value: "", ...options });
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

export type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

