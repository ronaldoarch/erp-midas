"use client";
import { useState, useEffect } from "react";
import { listInvoices } from "@/server/queries/invoices";
import { markInvoicePaid } from "@/server/actions/index";
import { Currency } from "@/components/ui/currency";

type Invoice = {
	id: string;
	amount: number;
	issue_date: string;
	due_date: string;
	reference_month: string;
	status?: string;
	clients: {
		fantasy_name?: string;
		legal_name?: string;
	};
	payments?: Array<{
		amount: number;
		method: string;
		received_at: string;
	}>;
};

export default function InvoicesPage() {
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
	const [paymentForm, setPaymentForm] = useState({ amount: "", method: "pix" });

	useEffect(() => {
		fetchInvoices();
	}, []);

	async function fetchInvoices() {
		setLoading(true);
		setError(null);
		try {
			const result = await listInvoices();
			setInvoices(result.data as Invoice[]);
		} catch (err: any) {
			setError(err?.message || "Erro ao carregar faturas");
		} finally {
			setLoading(false);
		}
	}

	async function handleMarkAsPaid(invoiceId: string, invoiceAmount: number) {
		setError(null);
		const amount = paymentForm.amount ? parseFloat(paymentForm.amount) : invoiceAmount;
		if (!amount || amount <= 0) {
			setError("Valor do pagamento inválido");
			return;
		}
		setPayingInvoice(invoiceId);
		try {
			await markInvoicePaid(invoiceId, amount, paymentForm.method);
			setPaymentForm({ amount: "", method: "pix" });
			setPayingInvoice(null);
			await fetchInvoices(); // Recarrega a lista
		} catch (err: any) {
			setError(err?.message || "Erro ao marcar como pago");
			setPayingInvoice(null);
		}
	}

	function getClientName(invoice: Invoice) {
		return invoice.clients?.fantasy_name || invoice.clients?.legal_name || "Cliente desconhecido";
	}

	function getTotalPaid(invoice: Invoice) {
		if (!invoice.payments || invoice.payments.length === 0) return 0;
		return invoice.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
	}

	function isFullyPaid(invoice: Invoice) {
		return getTotalPaid(invoice) >= invoice.amount;
	}

	return (
		<div className="max-w-7xl">
			<h1 className="text-2xl font-semibold mb-4">Faturas</h1>

			{error && (
				<div className="mb-4 p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400">
					{error}
				</div>
			)}

			{loading ? (
				<div className="text-zinc-500">Carregando...</div>
			) : invoices.length === 0 ? (
				<div className="text-zinc-500">Nenhuma fatura encontrada.</div>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-zinc-800">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-zinc-900">
								<th className="px-4 py-2 text-left">Cliente</th>
								<th className="px-4 py-2 text-left">Valor</th>
								<th className="px-4 py-2 text-left">Mês Referência</th>
								<th className="px-4 py-2 text-left">Vencimento</th>
								<th className="px-4 py-2 text-left">Pago</th>
								<th className="px-4 py-2 text-left">Status</th>
								<th className="px-4 py-2 text-left">Ações</th>
							</tr>
						</thead>
						<tbody>
							{invoices.map((invoice) => {
								const totalPaid = getTotalPaid(invoice);
								const fullyPaid = isFullyPaid(invoice);
								const showPaymentForm = payingInvoice === invoice.id;
								return (
									<tr key={invoice.id} className="border-t border-zinc-800">
										<td className="px-4 py-2">{getClientName(invoice)}</td>
										<td className="px-4 py-2">
											<Currency value={invoice.amount} />
										</td>
										<td className="px-4 py-2">{invoice.reference_month || "-"}</td>
										<td className="px-4 py-2">
											{invoice.due_date
												? new Date(invoice.due_date).toLocaleDateString("pt-BR")
												: "-"}
										</td>
										<td className="px-4 py-2">
											<Currency value={totalPaid} />
											{totalPaid > 0 && (
												<span className="text-xs text-zinc-500 block">
													de <Currency value={invoice.amount} />
												</span>
											)}
										</td>
										<td className="px-4 py-2">
											{fullyPaid ? (
												<span className="px-2 py-1 rounded bg-green-900/30 text-green-400">
													Pago
												</span>
											) : (
												<span className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">
													Pendente
												</span>
											)}
										</td>
										<td className="px-4 py-2">
											{!fullyPaid ? (
												showPaymentForm ? (
													<div className="space-y-2 w-64">
														<input
															type="number"
															step="0.01"
															placeholder={`Valor (padrão: ${invoice.amount.toFixed(2)})`}
															value={paymentForm.amount}
															onChange={(e) =>
																setPaymentForm({ ...paymentForm, amount: e.target.value })
															}
															className="w-full rounded border border-zinc-700 bg-black p-2 text-sm"
														/>
														<select
															value={paymentForm.method}
															onChange={(e) =>
																setPaymentForm({ ...paymentForm, method: e.target.value })
															}
															className="w-full rounded border border-zinc-700 bg-black p-2 text-sm"
														>
															<option value="pix">PIX</option>
															<option value="boleto">Boleto</option>
															<option value="transferencia">Transferência</option>
															<option value="dinheiro">Dinheiro</option>
															<option value="outro">Outro</option>
														</select>
														<div className="flex gap-2">
															<button
																onClick={() => handleMarkAsPaid(invoice.id, invoice.amount)}
																disabled={payingInvoice === invoice.id}
																className="flex-1 rounded bg-green-600 px-3 py-1 text-sm disabled:opacity-50"
															>
																Confirmar
															</button>
															<button
																onClick={() => {
																	setPayingInvoice(null);
																	setPaymentForm({ amount: "", method: "pix" });
																}}
																className="flex-1 rounded border border-zinc-700 px-3 py-1 text-sm"
															>
																Cancelar
															</button>
														</div>
													</div>
												) : (
													<button
														onClick={() => setPayingInvoice(invoice.id)}
														className="rounded bg-green-600 px-3 py-1 text-sm hover:bg-green-700"
													>
														Marcar como Pago
													</button>
												)
											) : (
												<span className="text-zinc-500 text-xs">Completo</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
