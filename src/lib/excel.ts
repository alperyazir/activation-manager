import writeXlsxFile from 'write-excel-file/browser'
import readXlsxFile from 'read-excel-file/browser'
import dataValidationFeature from '@onparallel/write-excel-file-data-validation'

export interface ExcelColumn<T> {
  header: string
  value: (row: T) => string | number | null
  width?: number
}

export async function exportToExcel<T>(
  fileName: string,
  columns: ExcelColumn<T>[],
  rows: T[],
) {
  const headerRow = columns.map((c) => ({
    value: c.header,
    fontWeight: 'bold' as const,
  }))
  const dataRows = rows.map((row) =>
    columns.map((c) => {
      const v = c.value(row)
      return { value: v == null ? '' : String(v), type: String }
    }),
  )
  const data = [headerRow, ...dataRows]
  // write-excel-file'ın BROWSER sürümü { toBlob, toFile } döndürür;
  // indirmeyi tetiklemek için .toFile(fileName) çağrılmalı.
  const write = writeXlsxFile as unknown as (
    d: unknown,
    o: unknown,
  ) => { toFile: (name: string) => Promise<void> }
  await write(data, { columns: columns.map((c) => ({ width: c.width ?? 20 })) }).toFile(
    fileName,
  )
}

// İçe aktarma için örnek şablon indirir.
// Sütunlar: Kod · Durum (açılır liste) · Son Kullanma Tarihi · Kullanım Tarihi
// Duruma göre 3 örnek (placeholder) satır. NOT: içe aktarımda yalnızca "Kod"
// sütunu kullanılır; Durum/Kullanım sistem tarafından yönetilir (referans amaçlı).
export async function downloadCodeTemplate() {
  const header = ['Kod', 'Durum', 'Son Kullanma Tarihi', 'Kullanım Tarihi'].map(
    (h) => ({ value: h, fontWeight: 'bold' as const }),
  )
  const examples = [
    ['VT-ORNEK-0001', 'Aktif', '31.12.2026', ''],
    ['VT-ORNEK-0002', 'Kullanıldı', '31.12.2026', '15.09.2026 10:30'],
    ['VT-ORNEK-0003', 'Pasif', '', ''],
  ]
  const rows = examples.map((r) => r.map((v) => ({ value: v, type: String })))
  const data = [header, ...rows]

  const sheetOptions = {
    columns: [{ width: 22 }, { width: 14 }, { width: 20 }, { width: 20 }],
    // Durum sütununda (2. sütun) açılır liste
    dataValidation: [
      {
        cellRange: { from: { row: 2, column: 2 }, to: { row: 500, column: 2 } },
        validation: {
          type: 'list',
          values: ['Aktif', 'Kullanıldı', 'Pasif'],
        },
      },
    ],
  }

  const write = writeXlsxFile as unknown as (
    d: unknown,
    o: unknown,
    opt: unknown,
  ) => { toFile: (name: string) => Promise<void> }
  await write(data, sheetOptions, { features: [dataValidationFeature] }).toFile(
    'kod-sablonu.xlsx',
  )
}

// İlk sütundaki kodları okur (başlık satırını atlar)
export async function readCodesFromExcel(file: File): Promise<string[]> {
  const read = readXlsxFile as unknown as (
    f: File,
    o?: unknown,
  ) => Promise<unknown>
  const raw = await read(file, { sheet: 1 })
  // Browser sürümü bazen [{ sheet, data: rows }] döndürür; ilk sayfanın
  // satırlarını çıkar, düz dizi ise olduğu gibi kullan.
  let rows = raw as unknown[][]
  if (
    Array.isArray(raw) &&
    raw.length > 0 &&
    raw[0] &&
    typeof raw[0] === 'object' &&
    !Array.isArray(raw[0]) &&
    'data' in (raw[0] as Record<string, unknown>)
  ) {
    rows = (raw[0] as { data: unknown[][] }).data
  }
  const codes: string[] = []
  rows.forEach((row, idx) => {
    const cell = row?.[0]
    if (cell == null) return
    const val = String(cell).trim()
    if (!val) return
    // İlk satır başlık olabilir; "kod"/"code" içeriyorsa atla
    if (idx === 0 && /kod|code/i.test(val)) return
    codes.push(val)
  })
  return codes
}
