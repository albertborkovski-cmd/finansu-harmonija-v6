import { useState } from 'react';
import { Info, Copy, RefreshCw, CheckCircle, XCircle, AlertCircle, HelpCircle, Upload, BarChart2, LineChart, PieChart, Settings } from 'lucide-react';

// ── SVG Line Chart ──────────────────────────────────────────────────────────
function SvgLineChart({ data, color, height = 150 }: { data: number[]; color: string; height?: number }) {
  const w = 600;
  const h = height;
  const pad = { top: 8, bottom: 8, left: 0, right: 0 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);
    const y = pad.top + ((max - v) / range) * (h - pad.top - pad.bottom);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const areaClose = `${pts[pts.length - 1].split(',')[0]},${h} ${pts[0].split(',')[0]},${h}`;
  const areaPath = `M ${pts[0]} L ${pts.slice(1).join(' L ')} L ${areaClose} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120, strokeWidth = 14, centerText, centerSub }: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  centerSub?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let offset = -90;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E6F2F6" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * 2 * Math.PI * r;
        const gap = (1 - pct) * 2 * Math.PI * r;
        const rot = offset;
        offset += pct * 360;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rot} ${cx} ${cy})`}
            strokeLinecap="round"
          />
        );
      })}
      {centerText && (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Montserrat" fontWeight="600" fontSize="16" fill="#10233A">{centerText}</text>
          {centerSub && <text x={cx} y={cy + 16} textAnchor="middle" fontFamily="Montserrat" fontSize="10" fill="#7288A3">{centerSub}</text>}
        </>
      )}
    </svg>
  );
}

// ── Chart grid lines background ──────────────────────────────────────────────
function ChartGrid({ lines = 5 }: { lines?: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="w-full border-t border-[#E2E2E2]" />
      ))}
    </div>
  );
}

// ── Month Selector ───────────────────────────────────────────────────────────
function MonthSelector({ months, active, onSelect }: { months: string[]; active: string; onSelect: (m: string) => void }) {
  return (
    <div className="flex flex-row items-center gap-0 bg-[#F8FDFF] rounded-lg p-1">
      {months.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`px-[6px] py-[3px] rounded font-montserrat font-medium text-[12px] leading-[18px] transition-colors ${
            active === m ? 'bg-[#007EA7] text-white' : 'text-[#7288A3]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ── Year Selector ────────────────────────────────────────────────────────────
function YearSelector({ years, active, onSelect }: { years: string[]; active: string; onSelect: (y: string) => void }) {
  return (
    <div className="flex flex-row items-center gap-0 bg-white rounded-lg p-1 border border-[#E6F2F6]">
      {years.map((y) => (
        <button
          key={y}
          onClick={() => onSelect(y)}
          className={`px-[6px] py-[3px] rounded font-montserrat font-medium text-[12px] leading-[18px] transition-colors ${
            active === y ? 'bg-[#007EA7] text-white' : 'text-[#7288A3]'
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-3xl p-6 flex flex-col gap-4 ${className}`}
      style={{ boxShadow: '2px 0px 16px #E3EEFF' }}
    >
      {children}
    </div>
  );
}

// ── Card header ──────────────────────────────────────────────────────────────
function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <h2 className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">{title}</h2>
      {right}
    </div>
  );
}

// ── Radio ────────────────────────────────────────────────────────────────────
function Radio({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <div className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 ${checked ? 'border-[#007EA7]' : 'border-[#A1B6C6]'}`}>
        {checked && <div className="w-[9px] h-[9px] rounded-full bg-[#007EA7]" />}
      </div>
      <span className={`font-montserrat font-medium text-[14px] leading-5 ${checked ? 'text-[#007EA7]' : 'text-[#7288A3]'}`}>{label}</span>
    </button>
  );
}

// ── INCOME & EXPENSE monthly data ────────────────────────────────────────────
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const INCOME_DATA: Record<string, number[]> = {
  '2023': [8200, 9100, 8700, 10200, 9800, 11400, 10100, 12300, 11700, 10900, 12800, 14200],
  '2024': [10500, 11200, 10800, 12400, 11900, 13600, 12200, 14500, 13900, 13100, 15200, 16800],
  '2025': [12800, 13500, 13100, 14900, 14400, 16100, 14700, 17200, 16600, 15800, 17900, 19400],
};
const EXPENSE_DATA: Record<string, number[]> = {
  '2023': [5100, 5800, 5500, 6400, 6100, 7200, 6400, 7800, 7400, 6900, 8100, 9000],
  '2024': [6800, 7500, 7200, 8100, 7800, 9100, 8000, 9600, 9200, 8600, 10200, 11400],
  '2025': [8100, 8900, 8600, 9700, 9400, 10800, 9500, 11400, 10900, 10200, 12100, 13500],
};
const REVENUE_DATA: Record<string, number[]> = {
  '2023': [3100, 3300, 3200, 3800, 3700, 4200, 3700, 4500, 4300, 4000, 4700, 5200],
  '2024': [3700, 3700, 3600, 4300, 4100, 4500, 4200, 4900, 4700, 4500, 5000, 5400],
  '2025': [4700, 4600, 4500, 5200, 5000, 5300, 5200, 5800, 5700, 5600, 5800, 5900],
};

// ── VAT table data ───────────────────────────────────────────────────────────
const VAT_ROWS = [
  { label: 'VAT payable', output: '2 148.00', input: '658.14', total: '1 489.86' },
  { label: 'VAT deductible', output: '—', input: '1 025.00', total: '-1 025.00' },
  { label: 'VAT to pay', output: '—', input: '—', total: '464.86' },
];

export default function DashboardView({ clientName }: { clientName?: string }) {
  const [activeMonth, setActiveMonth] = useState('Nov');
  const [activeYear3, setActiveYear3] = useState('2024');
  const [activeYear4, setActiveYear4] = useState('2024');
  const [activeYear5, setActiveYear5] = useState('2024');
  const [activeYear6, setActiveYear6] = useState('2024');
  const [chartMode3, setChartMode3] = useState<'monthly' | 'quarterly'>('monthly');
  const [chartMode5, setChartMode5] = useState<'monthly' | 'quarterly'>('monthly');
  const [chartMode6, setChartMode6] = useState<'monthly' | 'quarterly'>('monthly');
  const [showPersonal, setShowPersonal] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const incomeData = INCOME_DATA[activeYear3] ?? INCOME_DATA['2024'];
  const expenseData = EXPENSE_DATA[activeYear3] ?? EXPENSE_DATA['2024'];
  const revenueData = REVENUE_DATA[activeYear5] ?? REVENUE_DATA['2024'];
  const expData6 = EXPENSE_DATA[activeYear6] ?? EXPENSE_DATA['2024'];

  return (
    <div className="flex flex-col gap-8 px-[72px] py-14 min-w-0 bg-white min-h-full">
      {/* Title row */}
      <div className="flex flex-row items-center gap-2">
        <h1 className="font-montserrat font-semibold text-[36px] leading-[46px] text-[#10233A]">Dashboard</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Alert card */}
        {!alertDismissed && (
          <div className="bg-white rounded-2xl p-4 flex flex-col gap-4" style={{ boxShadow: '2px 0px 16px #E3EEFF' }}>
            <p className="font-montserrat font-semibold text-[16px] leading-[18px] text-[#007EA7]">
              It seems like you forgot to pay for our services. Please take your time and pay whenever you have time.
            </p>
            <div className="flex flex-row items-end justify-between gap-4 flex-wrap">
              <div className="flex flex-row items-stretch gap-3 flex-wrap">
                {/* Name */}
                <div className="flex flex-col gap-[2px]">
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Name</span>
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] whitespace-nowrap">{clientName ?? 'UAB Meso group'}</span>
                </div>
                <div className="w-px self-stretch bg-[#D3E1EC] hidden sm:block" />
                {/* Pay tax date */}
                <div className="flex flex-col gap-[2px]">
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Pay tax date</span>
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] whitespace-nowrap">10.12.2025</span>
                </div>
                <div className="w-px self-stretch bg-[#D3E1EC] hidden sm:block" />
                {/* Tax to pay */}
                <div className="flex flex-col gap-[2px]">
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Tax to pay</span>
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] whitespace-nowrap">€1,025.00</span>
                </div>
                <div className="w-px self-stretch bg-[#D3E1EC] hidden sm:block" />
                {/* Document status */}
                <div className="flex flex-col gap-[2px]">
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Document status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4550] flex-shrink-0" />
                    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">Declined</span>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-row items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="flex items-center justify-center px-2 py-1.5 border-2 border-[#D3E1EC] rounded"
                >
                  <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3]">Dismiss</span>
                </button>
                <button data-system-action="true" className="flex items-center justify-center px-2 py-1.5 bg-[#007EA7] rounded">
                  <span className="font-montserrat font-semibold text-[12px] leading-4 text-white">Mark as paid</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2×3 card grid */}
        <div className="flex flex-row flex-wrap gap-6">

          {/* ── Card 1: Incoming documents ─────────────────────────────── */}
          <Card className="flex-1 min-w-[320px]" >
            <div className="flex flex-col gap-2">
              <CardHeader
                title="Incoming documents"
                right={<Info size={20} className="text-[#007EA7] flex-shrink-0" />}
              />
              <div className="flex items-center gap-1">
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#161616]">Or send it to:</span>
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">demo@meso.lt</span>
                <button className="ml-1"><Copy size={14} className="text-[#007EA7]" /></button>
              </div>
            </div>

            {/* Drop zone */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-dashed border-[#7288A3] rounded-lg p-8 bg-white min-h-[120px]">
              <Upload size={28} className="text-[#7288A3]" />
              <p className="font-montserrat font-medium italic text-[16px] leading-6 text-[#7288A3] text-center">
                Click to browse files or drag & drop files here
              </p>
            </div>

            {/* Status row */}
            <div className="flex flex-row flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <RefreshCw size={14} className="text-[#EEB648]" />
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">In process: <strong>4</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#01BF92]" />
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Accept: 0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle size={14} className="text-[#D90310]" />
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Reject: 0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="text-[#FF6200]" />
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Exceptional: 0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#007EA7]" />
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Needs info: 0</span>
              </div>
            </div>
          </Card>

          {/* ── Card 2: VAT / Tax overview ──────────────────────────────── */}
          <Card className="flex-1 min-w-[320px]">
            <div className="flex flex-col gap-2">
              <CardHeader
                title="Value Added Tax (VAT)"
                right={
                  <MonthSelector
                    months={['Sep', 'Oct', 'Nov']}
                    active={activeMonth}
                    onSelect={setActiveMonth}
                  />
                }
              />
              <span className="font-montserrat font-normal text-[16px] leading-5 text-[#10233A]">
                Tax period: {activeMonth} 2025
              </span>
            </div>

            <div className="flex flex-row gap-4 flex-1">
              {/* VAT table */}
              <div className="flex-1 flex flex-col gap-0 min-w-0">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A] mb-2">Summary</span>
                <div className="flex flex-col gap-0">
                  {/* Header */}
                  <div className="flex flex-row items-center bg-[#F8FDFF] rounded-t-lg px-3 py-2 gap-2">
                    <span className="flex-1 font-montserrat font-medium text-[11px] text-[#7288A3]">Type</span>
                    <span className="w-[70px] font-montserrat font-medium text-[11px] text-[#7288A3] text-right">Output</span>
                    <span className="w-[70px] font-montserrat font-medium text-[11px] text-[#7288A3] text-right">Input</span>
                    <span className="w-[70px] font-montserrat font-medium text-[11px] text-[#7288A3] text-right">Total</span>
                  </div>
                  {VAT_ROWS.map((row, i) => (
                    <div
                      key={i}
                      className={`flex flex-row items-center px-3 py-2 gap-2 ${i % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}
                    >
                      <span className="flex-1 font-montserrat font-normal text-[12px] text-[#10233A] truncate">{row.label}</span>
                      <span className="w-[70px] font-montserrat font-normal text-[12px] text-[#10233A] text-right">{row.output}</span>
                      <span className="w-[70px] font-montserrat font-normal text-[12px] text-[#10233A] text-right">{row.input}</span>
                      <span className="w-[70px] font-montserrat font-semibold text-[12px] text-[#10233A] text-right">{row.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remaining days donut */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A] text-center">Remaining days</span>
                <DonutChart
                  segments={[{ value: 18, color: '#007EA7' }, { value: 12, color: '#E6F2F6' }]}
                  size={110}
                  strokeWidth={12}
                  centerText="18"
                  centerSub="days left"
                />
                <span className="font-montserrat font-normal text-[12px] text-[#7288A3] text-center">Until 10.12.2025</span>
              </div>
            </div>

            {/* Orange alert */}
            <div className="flex items-center justify-center px-4 py-2.5 rounded-lg" style={{ background: 'rgba(204,79,0,0.1)', border: '1px solid #CC4F00' }}>
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#CC4F00] text-center">
                Awaiting confirmation from the tax authority
              </span>
            </div>
          </Card>

          {/* ── Card 3: Income & Expenses ───────────────────────────────── */}
          <Card className="flex-1 min-w-[320px]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <h2 className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Income & Expenses</h2>
                <div className="flex items-center gap-3">
                  <YearSelector years={['2023', '2024', '2025']} active={activeYear3} onSelect={setActiveYear3} />
                  <div className="flex items-center gap-2">
                    <button><LineChart size={14} className="text-[#161616]" /></button>
                    <button><BarChart2 size={14} className="text-[#767676]" /></button>
                    <button><Settings size={14} className="text-[#767676]" /></button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Radio checked={chartMode3 === 'monthly'} label="Monthly" onClick={() => setChartMode3('monthly')} />
                <Radio checked={chartMode3 === 'quarterly'} label="Quarterly" onClick={() => setChartMode3('quarterly')} />
                <span className="font-montserrat font-normal text-[16px] text-[#10233A] ml-2">EUR</span>
              </div>
            </div>

            {/* Chart */}
            <div className="relative flex-1 min-h-[140px]">
              <ChartGrid />
              <div className="absolute inset-0 flex flex-col justify-end">
                <div className="relative h-full">
                  <div className="absolute inset-0">
                    <SvgLineChart data={incomeData} color="#007EA7" height={130} />
                  </div>
                  <div className="absolute inset-0">
                    <SvgLineChart data={expenseData} color="#CC4F00" height={130} />
                  </div>
                </div>
              </div>
              {/* X axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                {MONTHS_SHORT.map((m) => (
                  <span key={m} className="font-montserrat text-[10px] text-[#767676]">{m}</span>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[#007EA7]" />
                <span className="font-montserrat text-[12px] text-[#10233A]">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[#CC4F00]" />
                <span className="font-montserrat text-[12px] text-[#10233A]">Expenses</span>
              </div>
            </div>
          </Card>

          {/* ── Card 4: Payment structure ───────────────────────────────── */}
          <Card className="flex-1 min-w-[320px]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <h2 className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Payment structure</h2>
                <div className="flex items-center gap-3">
                  <YearSelector years={['2023', '2024', '2025']} active={activeYear4} onSelect={setActiveYear4} />
                  <div className="flex items-center gap-2">
                    <button><PieChart size={14} className="text-[#161616]" /></button>
                    <button><BarChart2 size={14} className="text-[#767676]" /></button>
                    <button><Settings size={14} className="text-[#767676]" /></button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPersonal(!showPersonal)}
                  className="flex items-center"
                >
                  <div className={`w-[30px] h-[18px] rounded-full relative transition-colors ${showPersonal ? 'bg-[#007EA7]' : 'bg-[#A1B6C6]'}`}>
                    <div className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform ${showPersonal ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                  </div>
                </button>
                <span className="font-montserrat font-medium text-[14px] text-[#7288A3]">Show only personal amount</span>
              </div>
            </div>

            {/* Donut charts row */}
            <div className="flex flex-row items-center justify-center gap-8 flex-1">
              {/* Pending vs Overdue */}
              <div className="flex flex-col items-center gap-3">
                <DonutChart
                  segments={[
                    { value: 26, color: '#BB6BD9' },
                    { value: 74, color: '#1B2FE0' },
                  ]}
                  size={120}
                  strokeWidth={14}
                  centerText="26%"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-[#BB6BD9]" />
                    <span className="font-montserrat text-[12px] text-[#10233A]">Pending payments</span>
                    <span className="font-montserrat font-medium text-[12px] text-[#10233A] ml-1">26%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-[#1B2FE0]" />
                    <span className="font-montserrat text-[12px] text-[#10233A]">Overdue payments</span>
                    <span className="font-montserrat font-medium text-[12px] text-[#10233A] ml-1">74%</span>
                  </div>
                </div>
              </div>

              {/* Breakdown donut */}
              <div className="flex flex-col items-center gap-3">
                <DonutChart
                  segments={[
                    { value: 75, color: '#007EA7' },
                    { value: 25, color: '#CC4F00' },
                  ]}
                  size={120}
                  strokeWidth={14}
                  centerText="€500"
                  centerSub="total"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm bg-[#CC4F00]" />
                    <div className="flex flex-col">
                      <span className="font-montserrat font-normal text-[14px] text-[#10233A]">Pending payments</span>
                      <span className="font-montserrat font-semibold text-[14px] text-[#10233A]">€125</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm bg-[#007EA7]" />
                    <div className="flex flex-col">
                      <span className="font-montserrat font-normal text-[14px] text-[#10233A]">Overdue payments</span>
                      <span className="font-montserrat font-semibold text-[14px] text-[#10233A]">€375</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Card 5: Revenue dynamics ────────────────────────────────── */}
          <Card className="flex-1 min-w-[320px]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <h2 className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Revenue dynamics</h2>
                <div className="flex items-center gap-3">
                  <YearSelector years={['2023', '2024', '2025']} active={activeYear5} onSelect={setActiveYear5} />
                  <div className="flex items-center gap-2">
                    <button><LineChart size={14} className="text-[#161616]" /></button>
                    <button><BarChart2 size={14} className="text-[#767676]" /></button>
                    <button><Settings size={14} className="text-[#767676]" /></button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Radio checked={chartMode5 === 'monthly'} label="For months" onClick={() => setChartMode5('monthly')} />
                <Radio checked={chartMode5 === 'quarterly'} label="In quarters" onClick={() => setChartMode5('quarterly')} />
                <span className="font-montserrat font-normal text-[16px] text-[#10233A] ml-2">EUR</span>
              </div>
            </div>

            <div className="relative flex-1 min-h-[140px]">
              <ChartGrid />
              <div className="absolute inset-0">
                <SvgLineChart data={revenueData} color="#007EA7" height={130} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                {MONTHS_SHORT.map((m) => (
                  <span key={m} className="font-montserrat text-[10px] text-[#767676]">{m}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[#007EA7]" />
                <span className="font-montserrat text-[12px] text-[#10233A]">Net revenue</span>
              </div>
            </div>
          </Card>

          {/* ── Card 6: Expense analysis ────────────────────────────────── */}
          <Card className="flex-1 min-w-[320px]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <h2 className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Expense analysis</h2>
                <div className="flex items-center gap-3">
                  <YearSelector years={['2023', '2024', '2025']} active={activeYear6} onSelect={setActiveYear6} />
                  <div className="flex items-center gap-2">
                    <button><LineChart size={14} className="text-[#161616]" /></button>
                    <button><BarChart2 size={14} className="text-[#767676]" /></button>
                    <button><Settings size={14} className="text-[#767676]" /></button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Radio checked={chartMode6 === 'monthly'} label="For months" onClick={() => setChartMode6('monthly')} />
                <Radio checked={chartMode6 === 'quarterly'} label="In quarters" onClick={() => setChartMode6('quarterly')} />
                <span className="font-montserrat font-normal text-[16px] text-[#10233A] ml-2">EUR</span>
              </div>
            </div>

            <div className="relative flex-1 min-h-[140px]">
              <ChartGrid />
              <div className="absolute inset-0">
                <SvgLineChart data={expData6} color="#CC4F00" height={130} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                {MONTHS_SHORT.map((m) => (
                  <span key={m} className="font-montserrat text-[10px] text-[#767676]">{m}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[#CC4F00]" />
                <span className="font-montserrat text-[12px] text-[#10233A]">Total expenses</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
