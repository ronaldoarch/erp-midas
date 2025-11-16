"use server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getUserOrgId } from "../utils/auth";
import { startOfMonth } from "date-fns";

function assertOrgId(orgId: string | null): asserts orgId is string {
	if (!orgId) throw new Error("org_id não encontrado para o usuário");
}

export async function createClient(data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("clients").insert({ ...data, org_id: orgId });
	if (error) throw error;
}

export async function updateClient(id: string, data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("clients").update({ ...data, org_id: orgId }).eq("id", id);
	if (error) throw error;
}

export async function deleteClient(id: string) {
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("clients").delete().eq("id", id);
	if (error) throw error;
}

export async function createContact(clientId: string, data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("contacts").insert({ ...data, client_id: clientId, org_id: orgId });
	if (error) throw error;
}

export async function updateContact(id: string, data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("contacts").update({ ...data, org_id: orgId }).eq("id", id);
	if (error) throw error;
}

export async function deleteContact(id: string) {
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("contacts").delete().eq("id", id);
	if (error) throw error;
}

export async function createContract(data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("contracts").insert({ ...data, org_id: orgId });
	if (error) throw error;
}

export async function createClientWithContract(args: { name: string; niche?: string; mrr: number; dueDay: number; dueYear: number; legal_name?: string }) {
    const orgId = await getUserOrgId();
    assertOrgId(orgId);
    // usa service role para evitar dependência de cookies em server action
    const supabase = createSupabaseServiceRoleClient();
    // cria cliente
    const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({ legal_name: args.legal_name ?? null, fantasy_name: args.name, org_id: orgId, tags: args.niche ? [args.niche] : null })
        .select("id")
        .single();
    if (clientErr) throw clientErr;
    // datas do contrato: mensal, define apenas dia e ano do primeiro vencimento
    const startDate = new Date();
    const now = new Date();
    const targetMonth = now.getMonth();
    let endDate = new Date(args.dueYear, targetMonth, Math.min(Math.max(args.dueDay, 1), 31));
    // se a data já passou neste mês/ano, jogar para o próximo mês
    if (endDate <= now) {
        endDate = new Date(args.dueYear, targetMonth + 1, Math.min(Math.max(args.dueDay, 1), 31));
    }
    // cria contrato ativo mensal
    const { error: contractErr } = await supabase.from("contracts").insert({
        org_id: orgId,
        client_id: client.id,
        status: "active",
        billing_cycle: "monthly",
        mrr: args.mrr,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
    });
    if (contractErr) throw contractErr;
}

export async function updateContract(id: string, data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("contracts").update({ ...data, org_id: orgId }).eq("id", id);
	if (error) throw error;
}

export async function cancelContract(id: string) {
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("contracts").update({ status: "cancelled" }).eq("id", id);
	if (error) throw error;
}

export async function generateMonthlyInvoices() {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = createSupabaseServiceRoleClient();
	const { data: contracts, error } = await supabase
		.from("contracts")
		.select("id,mrr,billing_cycle,status,client_id")
		.eq("org_id", orgId)
		.eq("status", "active")
		.eq("billing_cycle", "monthly");
	if (error) throw error;
	const firstDay = startOfMonth(new Date());
	const referenceMonth = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, "0")}`;
	const dueDate = new Date(firstDay);
	dueDate.setDate(5);
	for (const c of contracts || []) {
		await supabase
			.from("invoices")
			.insert({
				org_id: orgId,
				contract_id: c.id,
				client_id: (c as any).client_id,
				amount: (c as any).mrr,
				reference_month: referenceMonth,
				issue_date: firstDay.toISOString(),
				due_date: dueDate.toISOString(),
			})
			.select()
			.limit(1)
			.neq("id", null);
	}
}

export async function markInvoicePaid(invoiceId: string, amount: number, method: string) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = createSupabaseServiceRoleClient();
	const { error } = await supabase
		.from("payments")
		.insert({ org_id: orgId, invoice_id: invoiceId, amount, method, received_at: new Date().toISOString() });
	if (error) throw error;
}

export async function createTask(data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("tasks").insert({ ...data, org_id: orgId });
	if (error) throw error;
}

export async function updateTask(id: string, data: any) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("tasks").update({ ...data, org_id: orgId }).eq("id", id);
	if (error) throw error;
}

export async function moveTask(id: string, status: string) {
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
	if (error) throw error;
}

export async function uploadFile(args: { contractId?: string; clientId?: string; filePath: string; contentType?: string }) {
	const orgId = await getUserOrgId();
	assertOrgId(orgId);
	const supabase = createSupabaseServiceRoleClient();
	const filename = args.filePath.split("/").pop()!;
	const storagePath = `${orgId}/${Date.now()}_${filename}`;
	const { data: signed, error: signErr } = await supabase.storage
		.from("erp-files")
		.createSignedUploadUrl(storagePath, { upsert: true });
	if (signErr) throw signErr;
	await supabase.from("files").insert({
		org_id: orgId,
		client_id: args.clientId || null,
		contract_id: args.contractId || null,
		path: storagePath,
		name: filename,
	});
	return signed;
}


