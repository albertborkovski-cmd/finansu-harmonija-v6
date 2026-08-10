export interface Company {
  id: string;
  name: string;
  company_code: string;
  vat_code: string;
  client_since: number;
  action_required: number;
}

export interface DbDocument {
  id: string;
  company_id?: string;
  receive_date: string;
  client_counterparty: string;
  document_type: string;
  source: string;
  total_amount: string;
  due_end_date: string;
  file_case: string;
  order_no: string;
  number: string;
  type: string;
  document_date: string;
  document_purpose: string;
  invoice_contract_date: string;
  operation_date: string;
  expense_account: string;
  vat_classifier: string;
  currency: string;
  amount_without_vat: string;
  vat: string;
  vat_percent: string;
  department_code: string;
  object_project: string;
  valid_form: string;
  accountable_responsible: string;
  cost_center: string;
  series: string;
  status: string;
  created_at: string;
  image_url: string | null;
}

type LocalRow = Record<string, unknown>;
type LocalResult = { data: LocalRow[] | null; error: { message: string } | null };

const STORAGE_PREFIX = 'finansu-harmonija-v4:data:';
const FILE_PREFIX = 'finansu-harmonija-v4:file:';

const COMPANY_SEED: Company[] = [
  ['John Brick', 'ec6940fg5698', 2019, 0], ['Alice Stone', 'ab1234cd5678', 2021, 3],
  ['Bob Morris', 'xy9876zw5432', 2020, 1], ['Carol White', 'mn3456op7890', 2022, 0],
  ['David Lane', 'qr2345st6789', 2018, 2], ['Emma Clarke', 'gh5678ij9012', 2023, 0],
  ['Frank Hughes', 'cd3456ef7890', 2017, 5], ['Grace Kim', 'wx8901yz2345', 2022, 0],
  ['Henry Ford', 'op4567qr8901', 2020, 1], ['Iris Taylor', 'ij0123kl4567', 2021, 0],
  ['James Wilson', 'ef7890gh1234', 2019, 3], ['Karen Scott', 'st2345uv6789', 2023, 0],
  ['Leo Nolan', 'uv6789wx0123', 2018, 2], ['Mia Turner', 'yz4567ab8901', 2022, 0],
  ['Noah Reed', 'bc8901de2345', 2016, 7],
].map(([name, code, since, action], index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name: String(name),
  company_code: String(code),
  vat_code: String(code),
  client_since: Number(since),
  action_required: Number(action),
}));

const COUNTERPARTIES = ['UAB Robolabs', 'MB Technologijos', 'UAB Sprendimų grupė', 'UAB IT Sprendimai'];
const DOCUMENT_TYPES = ['VAT invoice', 'Credit note', 'Receipt', 'Advance invoice'];
const STATUSES = ['Pending', 'Paid', 'Overdue', 'Draft'];

const DOCUMENT_SEED: DbDocument[] = COMPANY_SEED.flatMap((company, companyIndex) =>
  [0, 1].map((offset) => {
    const index = companyIndex * 2 + offset;
    const day = String((index % 27) + 1).padStart(2, '0');
    const month = String((Math.floor(index / 5) % 9) + 1).padStart(2, '0');
    const net = 220 + index * 173;
    const vat = Math.round(net * 0.21 * 100) / 100;
    const series = ['TTP', 'CR', 'EXP', 'ADV'][index % 4];
    return {
      id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      company_id: company.id,
      receive_date: `${day}.${month}.2025`,
      client_counterparty: COUNTERPARTIES[index % COUNTERPARTIES.length],
      document_type: DOCUMENT_TYPES[index % DOCUMENT_TYPES.length],
      source: ['Email', 'Upload', 'Manual'][index % 3],
      total_amount: `${(net + vat).toFixed(2)} €`,
      due_end_date: `${String(((index + 14) % 27) + 1).padStart(2, '0')}.${month}.2025`,
      file_case: `${series}947${String(index).padStart(4, '0')}.pdf`,
      order_no: `ORD-${String(941 - index).padStart(4, '0')}`,
      number: `${series}-${String(index + 1).padStart(3, '0')}`,
      type: index % 2 ? 'Expense' : 'Income',
      document_date: `${day}.${month}.2025`,
      document_purpose: ['Services', 'Consulting', 'Correction', 'Office supplies'][index % 4],
      invoice_contract_date: `01.${month}.2025`,
      operation_date: `${day}.${month}.2025`,
      expense_account: index % 2 ? '5000' : '6000',
      vat_classifier: 'PVM1',
      currency: 'EUR',
      amount_without_vat: `${net.toFixed(2)} €`,
      vat: `${vat.toFixed(2)} €`,
      vat_percent: '21%',
      department_code: `DEP-0${(index % 3) + 1}`,
      object_project: `PROJ-${['A', 'B', 'C'][index % 3]}`,
      valid_form: 'Standard',
      accountable_responsible: ['J. Pavardenis', 'A. Varduonis', 'K. Jonaitis'][index % 3],
      cost_center: `CC-${((index % 3) + 1) * 100}`,
      series,
      status: STATUSES[index % STATUSES.length],
      created_at: new Date(2025, Number(month) - 1, Number(day), 12, index).toISOString(),
      image_url: null,
    };
  })
);

const TABLE_SEEDS: Record<string, LocalRow[]> = {
  companies: COMPANY_SEED as unknown as LocalRow[],
  documents: DOCUMENT_SEED as unknown as LocalRow[],
  lookup_values: [],
  document_history: [],
};

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readTable(table: string): LocalRow[] {
  const seed = TABLE_SEEDS[table] ?? [];
  if (!storageAvailable()) return structuredClone(seed);
  const key = `${STORAGE_PREFIX}${table}`;
  const stored = window.localStorage.getItem(key);
  if (stored) {
    try { return JSON.parse(stored) as LocalRow[]; } catch { /* restore the seed below */ }
  }
  const initial = structuredClone(seed);
  window.localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

function writeTable(table: string, rows: LocalRow[]) {
  if (storageAvailable()) window.localStorage.setItem(`${STORAGE_PREFIX}${table}`, JSON.stringify(rows));
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

class LocalQuery {
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private values: LocalRow | LocalRow[] | null = null;
  private filters: Array<{ key: string; value: unknown }> = [];
  private columns = '*';
  private orderBy: { key: string; ascending: boolean } | null = null;
  private conflictColumns: string[] = [];

  constructor(private table: string) {}

  select(columns = '*') { this.operation = 'select'; this.columns = columns; return this; }
  insert(values: LocalRow | LocalRow[]) { this.operation = 'insert'; this.values = values; return this; }
  update(values: LocalRow) { this.operation = 'update'; this.values = values; return this; }
  delete() { this.operation = 'delete'; return this; }
  upsert(values: LocalRow | LocalRow[], options?: { onConflict?: string }) {
    this.operation = 'upsert';
    this.values = values;
    this.conflictColumns = options?.onConflict?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
    return this;
  }
  eq(key: string, value: unknown) { this.filters.push({ key, value }); return this; }
  order(key: string, options?: { ascending?: boolean }) {
    this.orderBy = { key, ascending: options?.ascending !== false };
    return this;
  }

  private matches(row: LocalRow) {
    return this.filters.every(filter => row[filter.key] === filter.value);
  }

  private async execute(): Promise<LocalResult> {
    try {
      let rows = readTable(this.table);
      if (this.operation === 'select') {
        let selected = rows.filter(row => this.matches(row));
        if (this.orderBy) {
          const { key, ascending } = this.orderBy;
          selected = [...selected].sort((left, right) => {
            const a = String(left[key] ?? '');
            const b = String(right[key] ?? '');
            return (ascending ? 1 : -1) * a.localeCompare(b, undefined, { numeric: true });
          });
        }
        if (this.columns !== '*') {
          const keys = this.columns.split(',').map(value => value.trim()).filter(Boolean);
          selected = selected.map(row => Object.fromEntries(keys.map(key => [key, row[key]])));
        }
        return { data: structuredClone(selected), error: null };
      }

      if (this.operation === 'insert') {
        const created = (Array.isArray(this.values) ? this.values : [this.values]).filter(Boolean).map(value => ({
          id: (value as LocalRow).id ?? createId(),
          created_at: (value as LocalRow).created_at ?? new Date().toISOString(),
          ...(value as LocalRow),
        }));
        rows = [...rows, ...created];
        writeTable(this.table, rows);
        return { data: created, error: null };
      }

      if (this.operation === 'update') {
        const updated: LocalRow[] = [];
        rows = rows.map(row => {
          if (!this.matches(row)) return row;
          const next = { ...row, ...(this.values as LocalRow), updated_at: new Date().toISOString() };
          updated.push(next);
          return next;
        });
        writeTable(this.table, rows);
        return { data: updated, error: null };
      }

      if (this.operation === 'delete') {
        const deleted = rows.filter(row => this.matches(row));
        writeTable(this.table, rows.filter(row => !this.matches(row)));
        return { data: deleted, error: null };
      }

      const incoming = (Array.isArray(this.values) ? this.values : [this.values]).filter(Boolean) as LocalRow[];
      const saved: LocalRow[] = [];
      for (const value of incoming) {
        const existingIndex = rows.findIndex(row => this.conflictColumns.length > 0 && this.conflictColumns.every(key => row[key] === value[key]));
        if (existingIndex >= 0) {
          rows[existingIndex] = { ...rows[existingIndex], ...value };
          saved.push(rows[existingIndex]);
        } else {
          const created = { id: value.id ?? createId(), created_at: value.created_at ?? new Date().toISOString(), ...value };
          rows.push(created);
          saved.push(created);
        }
      }
      writeTable(this.table, rows);
      return { data: saved, error: null };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : 'Local data error' } };
    }
  }

  then(onFulfilled?: (result: LocalResult) => unknown, onRejected?: (reason: unknown) => unknown) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

const uploadedFiles = new Map<string, string>();

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('File could not be read'));
    reader.readAsDataURL(file);
  });
}

function localBucket(bucket: string) {
  return {
    async upload(path: string, file: File) {
      try {
        const dataUrl = await fileToDataUrl(file);
        const key = `${bucket}:${path}`;
        uploadedFiles.set(key, dataUrl);
        try { window.localStorage.setItem(`${FILE_PREFIX}${key}`, dataUrl); } catch { /* large files remain available for this session */ }
        return { data: { path }, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : 'Upload failed' } };
      }
    },
    getPublicUrl(path: string) {
      const key = `${bucket}:${path}`;
      const publicUrl = uploadedFiles.get(key) ?? (storageAvailable() ? window.localStorage.getItem(`${FILE_PREFIX}${key}`) : null) ?? '';
      return { data: { publicUrl } };
    },
  };
}

/**
 * Local Supabase-compatible adapter. Data is stored in this browser profile on
 * this computer, so the prototype keeps working without an external service.
 */
export const supabase = {
  from(table: string) { return new LocalQuery(table); },
  storage: { from(bucket: string) { return localBucket(bucket); } },
  auth: { async signOut() { return { error: null }; } },
};
