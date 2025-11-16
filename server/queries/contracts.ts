"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgId } from "../utils/auth";

export type ListContractsParams = {
	status?: string[];
	limit?: number;
	offset?: number;
};

export async function listContracts(params: ListContractsParams = {}) {
	const orgId = await getUserOrgId();
	if (!orgId) return { data: [], count: 0 };
	const supabase = createSupabaseServerClient();
	let query = supabase
		.from("contracts")
		.select("*", { count: "exact" })
		.eq("org_id", orgId)
		.order("created_at", { ascending: false });
	if (params.status?.length) query = query.in("status", params.status);
	if (typeof params.limit === "number") query = query.limit(params.limit);
	if (typeof params.offset === "number") query = query.range(params.offset, (params.offset || 0) + (params.limit || 50) - 1);
	const { data, count, error } = await query;
	if (error) throw error;
	return { data: data || [], count: count || 0 };
}


