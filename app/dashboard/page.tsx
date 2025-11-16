import { getDashboardStats } from "@/server/queries/dashboard";
import Link from "next/link";
import { Currency } from "@/components/ui/currency";

export default async function DashboardPage() {
	const stats = await getDashboardStats();
	return (
		<div className="grid gap-6">
			<div className="flex gap-4 mb-4">
				<Link href="/clients" className="rounded-xl bg-orange-500 text-black px-6 py-3 font-medium hover:bg-orange-400">
					Clientes
				</Link>
				<Link href="/contracts" className="rounded-xl border border-zinc-800 px-6 py-3 font-medium hover:bg-zinc-900">
					Contratos
				</Link>
				<Link href="/invoices" className="rounded-xl border border-zinc-800 px-6 py-3 font-medium hover:bg-zinc-900">
					Faturas
				</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
				<div className="text-sm text-zinc-500">Total faturado</div>
				<div className="text-2xl font-semibold mt-2">
					<Currency value={stats.mrrTotal} />
				</div>
			</div>
				<div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
					<div className="text-sm text-zinc-500">Contratos Ativos</div>
					<div className="text-2xl font-semibold mt-2">{stats.activeContracts}</div>
				</div>
				<div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
					<div className="text-sm text-zinc-500">Faturas Vencidas</div>
					<div className="text-2xl font-semibold mt-2">{stats.overdueInvoices}</div>
				</div>
				<div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
					<div className="text-sm text-zinc-500">Contratos a Vencer</div>
					<div className="text-2xl font-semibold mt-2">{stats.expiringContracts}</div>
				</div>
			</div>
			<div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
				<div className="text-sm text-zinc-500 mb-2">Tarefas do dia</div>
				<div className="text-zinc-500">Sem tarefas.</div>
			</div>
		</div>
	);
}


