"use server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { getUserOrgId } from "../utils/auth";

export async function createClientWithContract(args: { name: string; niche?: string; mrr: number; dueDay: number; dueYear: number; legal_name?: string }) {
    let orgId: string | null = null;
    try {
        orgId = await getUserOrgId();
    } catch {}
    if (!orgId) {
        orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
    }
    if (!orgId) throw new Error("org_id não encontrado (configure NEXT_PUBLIC_DEFAULT_ORG_ID no .env.local)");
    const supabase = createSupabaseServiceRoleClient();
    const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({ legal_name: args.legal_name ?? args.name, fantasy_name: args.name, org_id: orgId, tags: args.niche ? [args.niche] : null })
        .select("id")
        .single();
    if (clientErr) throw clientErr;
    const startDate = new Date();
    const now = new Date();
    const targetMonth = now.getMonth();
    let endDate = new Date(args.dueYear, targetMonth, Math.min(Math.max(args.dueDay, 1), 31));
    if (endDate <= now) {
        endDate = new Date(args.dueYear, targetMonth + 1, Math.min(Math.max(args.dueDay, 1), 31));
    }
    const { error: contractErr } = await supabase.from("contracts").insert({
        org_id: orgId,
        client_id: client.id,
        title: `Contrato ${args.name}`,
        status: "active",
        billing_cycle: "monthly",
        mrr: args.mrr,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
    });
    if (contractErr) throw contractErr;
}

export async function toggleClientStatus(clientId: string, contractId: string, isActive: boolean) {
    let orgId: string | null = null;
    try {
        orgId = await getUserOrgId();
    } catch {}
    if (!orgId) {
        orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
    }
    if (!orgId) throw new Error("org_id não encontrado");
    
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
        .from("contracts")
        .update({ status: isActive ? "active" : "cancelled" })
        .eq("id", contractId)
        .eq("org_id", orgId)
        .select();
    
    if (error) {
        console.error("Erro ao atualizar contrato:", error);
        throw error;
    }
    
    return { success: true, data };
}
