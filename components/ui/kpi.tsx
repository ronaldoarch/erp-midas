export function KpiCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
			<div className="text-sm text-zinc-500">{label}</div>
			<div className="text-2xl font-semibold mt-2">{value}</div>
		</div>
	);
}


