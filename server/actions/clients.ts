"use server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getUserOrgId } from "../utils/auth";

export async function createClientWithContract(args: {
    name: string;
    niche?: string;
    mrr: number;
    dueDay: number;
    dueYear: number;
    legal_name?: string;
    phone?: string;
    responsible_employee?: string;
}) {
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
        .insert({
            legal_name: args.legal_name ?? args.name,
            fantasy_name: args.name,
            org_id: orgId,
            tags: args.niche ? [args.niche] : null,
            phone: args.phone ?? null,
            responsible_employee: args.responsible_employee ?? null,
        })
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
    } catch (err) {
        console.log("getUserOrgId falhou, usando DEFAULT_ORG_ID", err);
    }
    if (!orgId) {
        orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
    }
    if (!orgId) {
        console.error("org_id não encontrado. Verifique NEXT_PUBLIC_DEFAULT_ORG_ID");
        throw new Error("org_id não encontrado");
    }
    
    const supabase = createSupabaseServiceRoleClient();
    const newStatus = isActive ? "active" : "cancelled";
    
    console.log(`Tentando atualizar contrato ${contractId} para status: ${newStatus}, orgId: ${orgId}`);
    
    // Primeiro verifica se o contrato existe
    const { data: existing, error: checkError } = await supabase
        .from("contracts")
        .select("id, status, org_id")
        .eq("id", contractId)
        .maybeSingle();
    
    if (checkError) {
        console.error("Erro ao verificar contrato:", checkError);
        throw checkError;
    }
    
    if (!existing) {
        console.error(`Contrato ${contractId} não encontrado`);
        throw new Error("Contrato não encontrado");
    }
    
    console.log(`Contrato encontrado. Status atual: ${existing.status}, org_id: ${existing.org_id}`);
    
    // Atualiza o contrato
    const { data, error } = await supabase
        .from("contracts")
        .update({ status: newStatus })
        .eq("id", contractId)
        .select();
    
    if (error) {
        console.error("Erro ao atualizar contrato:", error);
        throw error;
    }
    
    if (!data || data.length === 0) {
        console.error("Contrato não foi atualizado - nenhum dado retornado");
        throw new Error("Contrato não encontrado ou não foi atualizado");
    }
    
    console.log(`Contrato atualizado com sucesso. Novo status: ${data[0].status}`);
    
    return { success: true, data: data[0] };
}

export async function updateClient(clientId: string, data: {
    fantasy_name?: string;
    legal_name?: string;
    phone?: string;
    responsible_employee?: string;
    tags?: string[];
}) {
    let orgId: string | null = null;
    try {
        orgId = await getUserOrgId();
    } catch {}
    if (!orgId) {
        orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
    }
    if (!orgId) throw new Error("org_id não encontrado");
    
    const supabase = createSupabaseServiceRoleClient();
    const { data: updated, error } = await supabase
        .from("clients")
        .update(data)
        .eq("id", clientId)
        .eq("org_id", orgId)
        .select();
    
    if (error) throw error;
    if (!updated || updated.length === 0) {
        throw new Error("Cliente não encontrado");
    }
    
    return { success: true, data: updated[0] };
}

export async function updateContract(contractId: string, data: {
    title?: string;
    mrr?: number;
    end_date?: string;
    start_date?: string;
    billing_cycle?: string;
}) {
    let orgId: string | null = null;
    try {
        orgId = await getUserOrgId();
    } catch {}
    if (!orgId) {
        orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
    }
    if (!orgId) throw new Error("org_id não encontrado");
    
    const supabase = createSupabaseServiceRoleClient();
    const { data: updated, error } = await supabase
        .from("contracts")
        .update(data)
        .eq("id", contractId)
        .eq("org_id", orgId)
        .select();
    
    if (error) throw error;
    if (!updated || updated.length === 0) {
        throw new Error("Contrato não encontrado");
    }
    
    return { success: true, data: updated[0] };
}
