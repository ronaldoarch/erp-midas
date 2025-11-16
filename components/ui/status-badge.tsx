const MAP: Record<string, { text: string; color: string }> = {
	active: { text: "Ativo", color: "bg-emerald-100 text-emerald-700" },
	expiring: { text: "A vencer", color: "bg-amber-100 text-amber-700" },
	expired: { text: "Vencido", color: "bg-rose-100 text-rose-700" },
	cancelled: { text: "Cancelado", color: "bg-zinc-200 text-zinc-700" },
	open: { text: "Em aberto", color: "bg-amber-100 text-amber-700" },
	paid: { text: "Pago", color: "bg-emerald-100 text-emerald-700" },
	overdue: { text: "Vencida", color: "bg-rose-100 text-rose-700" },
};

export function StatusBadge({ status }: { status: string }) {
	const cfg = MAP[status] || { text: status, color: "bg-zinc-100 text-zinc-700" };
	return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.text}</span>;
}


