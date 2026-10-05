import { validateTransaction, localDateString } from './accounting.js';

// CSV state machine: commas/newlines inside quoted fields are content, not separators.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('Invalid quote in CSV.');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field);
      field = '';
      closed = false;
      if (char !== ',') {
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        if (char === '\r' && input[i + 1] === '\n') i++;
      }
    } else {
      if (closed && char.trim())
        throw new Error('Unexpected text after a quoted CSV field.');
      if (!closed) field += char;
    }
  }
  if (quoted) throw new Error('Unclosed quoted CSV field.');
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function previewCSV(text, accounts, categories, existing = []) {
  const rows = parseCSV(text);
  if (rows.length < 2)
    throw new Error('CSV needs a header and at least one transaction.');
  const headers = rows.shift().map((value) => value.trim().toLowerCase());
  if (new Set(headers).size !== headers.length)
    throw new Error('CSV headers must be unique.');
  for (const key of ['date', 'type', 'category', 'amount', 'account'])
    if (!headers.includes(key)) throw new Error(`Missing CSV column: ${key}.`);
  const signatures = new Set(existing.map(transactionSignature));
  const transactions = [];
  const errors = [];
  rows.forEach((values, index) => {
    try {
      if (values.length !== headers.length)
        throw new Error('Column count does not match the header.');
      const row = Object.fromEntries(
        headers.map((header, i) => [header, values[i]])
      );
      const matches = accounts.filter(
        (a) =>
          a.id === row.account.trim() ||
          a.name.trim().toLowerCase() === row.account.trim().toLowerCase()
      );
      if (matches.length !== 1)
        throw new Error(`Account “${row.account}” is unknown or ambiguous.`);
      const inputType = row.type.trim().toLowerCase();
      const type = inputType === 'refund' ? 'income' : inputType;
      const kind = inputType;
      const categoryType = kind === 'refund' ? 'expense' : type;
      const category = (categories[categoryType] || []).find((c) =>
        [c.id, c.label, c.key]
          .filter(Boolean)
          .some(
            (name) => name.toLowerCase() === row.category.trim().toLowerCase()
          )
      );
      if (!category)
        throw new Error(
          `Unknown category “${row.category}”; use a category ID from transaction export.`
        );
      const transaction = validateTransaction(
        {
          type,
          kind,
          amount: row.amount.trim(),
          accountId: matches[0].id,
          categoryId: category.id,
          date: row.date.trim(),
          description: row.description || row.note || '',
        },
        accounts
      );
      const signature = transactionSignature(transaction);
      if (signatures.has(signature))
        throw new Error(
          'Duplicate transaction; already present or repeated in this file.'
        );
      signatures.add(signature);
      transactions.push(transaction);
    } catch (error) {
      errors.push({ row: index + 2, message: error.message });
    }
  });
  return { transactions, errors };
}

export function transactionSignature(t) {
  return JSON.stringify([
    localDateString(t.date),
    t.kind || t.type,
    Number(t.amount),
    t.accountId,
    t.categoryId,
    t.description || t.note || '',
  ]);
}

export function exportCSV(transactions, accounts) {
  const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = [
    ['Date', 'Type', 'Category', 'Amount', 'Description', 'Account'],
  ];
  // Internal accounting entries belong in the full backup, not an income/expense import.
  for (const t of transactions.filter(
    (item) => !item.kind || ['income', 'expense', 'refund'].includes(item.kind)
  ))
    rows.push([
      localDateString(t.date),
      t.kind === 'refund' ? 'refund' : t.type,
      t.categoryId,
      t.amount,
      t.description || t.note || '',
      t.accountId,
    ]);
  return rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
