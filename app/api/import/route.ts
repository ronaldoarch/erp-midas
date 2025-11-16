import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File;
		const url = formData.get("url") as string | null;

		let workbook: XLSX.WorkBook;
		let buffer: Buffer;

		if (url) {
			// Para Google Sheets, converter para formato de exportação
			let exportUrl = url;
			if (url.includes("docs.google.com/spreadsheets")) {
				// Extrai o ID da planilha
				const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
				if (match && match[1]) {
					const sheetId = match[1];
					exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&id=${sheetId}&gid=0`;
				} else {
					// Fallback: tenta substituir /edit por /export
					exportUrl = url.replace(/\/edit.*$/, "/export?format=xlsx");
				}
			}
			
			const response = await fetch(exportUrl, {
				headers: {
					"User-Agent": "Mozilla/5.0",
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text().catch(() => "");
				throw new Error(`Erro ao baixar arquivo da URL: ${response.status} ${response.statusText}. ${errorText.substring(0, 100)}`);
			}
			
			buffer = Buffer.from(await response.arrayBuffer());
		} else if (file) {
			const arrayBuffer = await file.arrayBuffer();
			buffer = Buffer.from(arrayBuffer);
		} else {
			return NextResponse.json({ error: "Arquivo ou URL é obrigatório" }, { status: 400 });
		}

		workbook = XLSX.read(buffer, { type: "buffer" });
		const firstSheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[firstSheetName];

		// Lê como array de arrays primeiro para ter controle sobre a primeira linha
		const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "", header: 1 }) as any[][];

		if (!rawData || rawData.length === 0) {
			return NextResponse.json({ error: "Planilha vazia ou inválida" }, { status: 400 });
		}

		// A primeira linha contém os cabeçalhos
		const headers = rawData[0] || [];

		// Converte para formato de objeto usando os cabeçalhos reais
		const data = rawData
			.slice(1)
			.map((row) => {
				const obj: any = {};
				headers.forEach((header, index) => {
					const headerKey = String(header || "").trim();
					if (headerKey) {
						obj[headerKey] = row[index] || "";
					}
				});
				return obj;
			})
			.filter((row) => {
				// Remove linhas completamente vazias
				return Object.values(row).some((val) => String(val || "").trim() !== "");
			});

		if (data.length === 0) {
			return NextResponse.json({ error: "Nenhum dado válido encontrado na planilha" }, { status: 400 });
		}

		return NextResponse.json({ data, columns: Object.keys(data[0] || {}) }, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || "Erro ao processar planilha" }, { status: 500 });
	}
}
