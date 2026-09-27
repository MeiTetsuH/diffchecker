import { writeFileSync } from 'node:fs';
import XLSX from 'xlsx';

// Synthetic data used in the README screenshots; no real inventory is included.
const before = [
  ['SKU', 'Item', 'Stock', 'Price', 'Status'],
  ['007', 'Mechanical keyboard', 12, 89.9, 'In stock'],
  ['008', 'USB-C hub', 20, 49, 'In stock'],
  ['009', 'Monitor arm', 6, 79, 'Limited'],
  ['010', 'Cable organizer', 15, 12.5, 'In stock'],
  ['011', 'Desk lamp', 8, 39, 'In stock'],
  ['012', 'Docking station', 4, null, 'Check price'],
  ['013', 'Laptop stand', 10, 29.9, 'In stock'],
];
const after = [
  before[0],
  ['007', 'Mechanical keyboard', 10, 84.9, 'Sale'],
  before[2],
  ['009', 'Monitor arm', 9, 79, 'In stock'],
  before[5],
  before[6],
  before[7],
  ['014', 'Wireless mouse', 18, 24.9, 'New'],
];

for (const [name, rows, error] of [['before', before, 7], ['after', after, 42]]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  for (let row = 1; row < rows.length; row += 1) {
    sheet[`D${row + 1}`] = rows[row][0] === '012'
      ? { t: 'e', v: error }
      : { t: 'n', v: rows[row][3], z: '"$"0.00' };
  }
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Inventory');
  writeFileSync(new URL(`./inventory-${name}.xlsx`, import.meta.url), XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));
}
