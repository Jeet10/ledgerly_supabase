const escapeHtml = value =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const sanitizePdfText = value =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')

const triggerDownload = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const buildSimplePdf = ({ title, subtitle, rows }) => {
  const pageWidth = 595
  const pageHeight = 842
  const left = 40
  const top = 46
  const lineHeight = 16
  const bottom = 50
  const maxLinesPerPage = Math.floor((pageHeight - top - bottom) / lineHeight)
  const lines = [title, subtitle, '', 'Type | Amount | Member | Date | Note', ...rows]
  const pages = []
  for (let index = 0; index < lines.length; index += maxLinesPerPage) {
    pages.push(lines.slice(index, index + maxLinesPerPage))
  }

  const objects = []
  const addObject = value => {
    objects.push(value)
    return objects.length
  }
  const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const contentObjectIds = []

  pages.forEach(pageLines => {
    const textCommands = pageLines
      .map((line, lineIndex) => `1 0 0 1 ${left} ${pageHeight - top - lineIndex * lineHeight} Tm (${sanitizePdfText(line)}) Tj`)
      .join('\n')
    const stream = `BT\n/F1 10 Tf\n${textCommands}\nET`
    const streamBytes = new TextEncoder().encode(stream).length
    const contentId = addObject(`<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream`)
    contentObjectIds.push(contentId)
  })

  const pagesObjectId = objects.length + pages.length + 1
  const pageObjectIds = contentObjectIds.map(contentId =>
    addObject(
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >>`
    )
  )
  addObject(`<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`)
  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

export const downloadFilteredExcel = ({ exportRows, summary, filterSummaryLabel, exportFileBaseName }) => {
  if (exportRows.length === 0) return false

  const tableRows = exportRows
    .map(
      row =>
        `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.amount)}</td><td>${escapeHtml(row.member)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.note)}</td></tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      h1 { margin-bottom: 4px; }
      p { color: #4b5563; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
      th { background: #eef2ff; }
    </style>
  </head>
  <body>
    <h1>GrowwHigh Transactions</h1>
    <p>Showing ${escapeHtml(String(summary.transactionCount))} transactions for ${escapeHtml(filterSummaryLabel)}</p>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Amount</th>
          <th>Member</th>
          <th>Date</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`

  triggerDownload(html, `${exportFileBaseName}.xls`, 'application/vnd.ms-excel;charset=utf-8;')
  return true
}

export const downloadFilteredPdf = ({ exportRows, summary, filterSummaryLabel, filterMemberName, exportFileBaseName }) => {
  if (exportRows.length === 0) return false

  const pdfRows = exportRows.map(row => {
    const noteText = row.note.length > 34 ? `${row.note.slice(0, 31)}...` : row.note
    return `${row.type.padEnd(8)} | ${row.amount.padEnd(12)} | ${row.member.padEnd(14)} | ${row.date.padEnd(20)} | ${noteText}`
  })
  const pdf = buildSimplePdf({
    title: 'GrowwHigh Transactions',
    subtitle: `${summary.transactionCount} shown | ${filterSummaryLabel} | ${filterMemberName === 'all' ? 'All members' : filterMemberName}`,
    rows: pdfRows,
  })
  triggerDownload(pdf, `${exportFileBaseName}.pdf`, 'application/pdf')
  return true
}
