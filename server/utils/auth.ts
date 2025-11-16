"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
	const supabase = await createSupabaseServerClient();
	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) return null;
	return data.user;
}

export async function getUserOrgId(): Promise<string | null> {
	const supabase = await createSupabaseServerClient();
	const { data: auth } = await supabase.auth.getUser();
	const userId = auth?.user?.id;
	if (!userId) return null;
	const { data } = await supabase.from("profiles").select("org_id").eq("id", userId).maybeSingle();
	return (data as any)?.org_id ?? null;
}


