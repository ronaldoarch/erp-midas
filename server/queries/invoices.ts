"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgId } from "../utils/auth";

export type ListInvoicesParams = {
	status?: string[];
	clientId?: string;
	from?: string;
	to?: string;
	limit?: number;
	offset?: number;
};

export async function listInvoices(params: ListInvoicesParams = {}) {
	const orgId = await getUserOrgId();
	if (!orgId) return { data: [], count: 0 };
	const supabase = await createSupabaseServerClient();
	let query = supabase
		.from("invoices")
		.select("*", { count: "exact" })
		.eq("org_id", orgId)
		.order("issue_date", { ascending: false });
	if (params.status?.length) query = query.in("status", params.status);
	if (params.clientId) query = query.eq("client_id", params.clientId);
	if (params.from) query = query.gte("issue_date", params.from);
	if (params.to) query = query.lte("issue_date", params.to);
	if (typeof params.limit === "number") query = query.limit(params.limit);
	if (typeof params.offset === "number") query = query.range(params.offset, (params.offset || 0) + (params.limit || 50) - 1);
	const { data, count, error } = await query;
	if (error) throw error;
	return { data: data || [], count: count || 0 };
}


