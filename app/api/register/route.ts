import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { email, password, isAdmin } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
        }
        const supabase = createSupabaseServiceRoleClient();
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: isAdmin ? { role: "admin" } : {},
        });
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ user: data.user }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
    }
}




