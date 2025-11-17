import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
		const year = Number(searchParams.get("year")) || new Date().getFullYear();

		const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
		if (!orgId) return NextResponse.json({ error: "org_id não configurado" }, { status: 400 });

		const supabase = createSupabaseServiceRoleClient();

		// Busca clientes com contratos - SEM cache
		let query = supabase
			.from("clients")
			.select(
				`
				id,
				fantasy_name,
				legal_name,
				phone,
				responsible_employee,
				contracts(id, status, mrr, end_date, title)
			`
			)
			.eq("org_id", orgId);

		// Se mês e ano foram especificados, filtra por data de vencimento
		if (month && year) {
			const startDate = new Date(year, month - 1, 1).toISOString();
			const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
			query = query.gte("contracts.end_date", startDate).lte("contracts.end_date", endDate);
		}

		// Força buscar dados atualizados sem cache
		const { data, error } = await query.order("fantasy_name", { ascending: true });

		if (error) throw error;

		// Adiciona headers para evitar cache
		return NextResponse.json(data || [], { 
			status: 200,
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
			}
		});
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || "Erro ao buscar clientes" }, { status: 500 });
	}
}

