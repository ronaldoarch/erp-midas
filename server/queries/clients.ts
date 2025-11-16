"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgId } from "../utils/auth";

export type ListClientsParams = {
	q?: string;
	tags?: string[];
	limit?: number;
	offset?: number;
};

export async function listClients(params: ListClientsParams = {}) {
	const orgId = await getUserOrgId();
	if (!orgId) return { data: [], count: 0 };
	const supabase = await createSupabaseServerClient();
	let query = supabase
		.from("clients")
		.select("*", { count: "exact" })
		.eq("org_id", orgId)
		.order("created_at", { ascending: false });
	if (params.q) {
		query = query.or(`legal_name.ilike.%${params.q}%,fantasy_name.ilike.%${params.q}%`);
	}
	if (params.tags?.length) {
		query = query.contains("tags", params.tags);
	}
	if (typeof params.limit === "number") query = query.limit(params.limit);
	if (typeof params.offset === "number") query = query.range(params.offset, (params.offset || 0) + (params.limit || 50) - 1);
	const { data, count, error } = await query;
	if (error) throw error;
	return { data: data || [], count: count || 0 };
}

export async function getClientByIdWithRelations(id: string) {
	const orgId = await getUserOrgId();
	if (!orgId) return null;
	const supabase = await createSupabaseServerClient();
	const { data, error } = await supabase
		.from("clients")
		.select(
			`*,
			contacts(*),
			contracts(*),
			invoices(*),
			files(*)
			`
		)
		.eq("org_id", orgId)
		.eq("id", id)
		.maybeSingle();
	if (error) throw error;
	return data as any;
}


