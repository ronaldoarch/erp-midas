import type { ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

const nav = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/clients", label: "Clients" },
	{ href: "/contracts", label: "Contracts" },
	{ href: "/invoices", label: "Invoices" },
	{ href: "/tasks", label: "Tasks" },
	{ href: "/files", label: "Files" },
	{ href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<div className="flex">
				<aside className="hidden md:flex md:w-64 lg:w-72 xl:w-80 flex-col gap-2 border-r border-zinc-200/70 dark:border-zinc-800 p-4 sticky top-0 h-screen">
					<div className="text-2xl font-bold tracking-tight">Midas</div>
					<nav className="mt-4 space-y-1">
						{nav.map((item) => (
							<Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
								{item.label}
							</Link>
						))}
					</nav>
				</aside>
				<main className="flex-1">
					<header className="sticky top-0 z-10 border-b border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
						<div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
								<input placeholder="Buscar..." className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-2 pl-9 pr-3 outline-none" />
							</div>
						</div>
					</header>
					<div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
				</main>
			</div>
		</div>
	);
}


