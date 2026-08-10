import { useState } from 'react';
import { ChevronDown, MessageSquare, Paperclip, X } from 'lucide-react';
import type { Company } from '../lib/supabase';
import { PageActionButton, PageHeader } from './PageHeader';

const TABS = [
  'Company',
  'Contacts',
  'Address',
  'Taxes',
  'Banking',
  'Accounting settings',
  'Representatives',
  'Permissions',
  'Files',
  'Client information',
];

interface FieldDefinition {
  key: string;
  label: string;
  value: string;
  type?: 'select' | 'text';
  options?: string[];
  showTools?: boolean;
}

function ClientField({ field, onChange }: { field: FieldDefinition; onChange: (value: string) => void }) {
  const controlClass = 'h-[42px] w-full rounded-lg border border-[#D3E1EC] bg-white px-[14px] font-montserrat text-[14px] font-medium leading-5 text-[#10233A] outline-none transition-colors focus:border-[#1B55E9]';

  return (
    <label className="flex h-[70px] w-full flex-col gap-2">
      <span className="font-montserrat text-[14px] font-semibold leading-5 text-[#10233A]">{field.label}</span>
      <span className="relative flex h-[42px] items-center">
        {field.type === 'select' ? (
          <>
            <select aria-label={field.label} value={field.value} onChange={event => onChange(event.target.value)} className={`${controlClass} appearance-none pr-10`}>
              {(field.options ?? []).map(option => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-[14px] text-[#7288A3]" />
          </>
        ) : (
          <>
            <input aria-label={field.label} value={field.value} onChange={event => onChange(event.target.value)} className={`${controlClass} ${field.showTools ? 'pr-[76px]' : ''}`} />
            {field.showTools && (
              <span className="absolute right-[14px] flex items-center gap-3 text-[#7288A3]">
                <button type="button" aria-label={`Attach file to ${field.label}`} className="flex h-6 w-6 items-center justify-center hover:text-[#007EA7]"><Paperclip size={16} /></button>
                <button type="button" aria-label={`Add comment to ${field.label}`} className="flex h-6 w-6 items-center justify-center hover:text-[#1B55E9]"><MessageSquare size={16} /></button>
              </span>
            )}
          </>
        )}
      </span>
    </label>
  );
}

export default function CompanyClientInformation({ company }: { company: Company }) {
  const [activeTab, setActiveTab] = useState('Client information');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [fields, setFields] = useState<FieldDefinition[]>([
    { key: 'status', label: 'Company status', value: 'Active', type: 'select', options: ['Active', 'Inactive', 'Pending review'] },
    { key: 'legalName', label: 'Legal company name', value: company.name, showTools: true },
    { key: 'companyCode', label: 'Company code', value: company.company_code, showTools: true },
    { key: 'vatCode', label: 'Company VAT code', value: company.vat_code, showTools: true },
    { key: 'clientType', label: 'Client type', value: 'Legal entity', type: 'select', options: ['Legal entity', 'Individual', 'Non-profit organization'] },
    { key: 'address', label: 'Registered address', value: 'Vilnius, Lithuania', showTools: true },
    { key: 'email', label: 'Primary email', value: 'finance@company.lt', showTools: true },
    { key: 'phone', label: 'Phone number', value: '+370 600 00000', showTools: true },
    { key: 'website', label: 'Website', value: 'www.company.lt', showTools: true },
    { key: 'clientSince', label: 'Client since', value: String(company.client_since) },
    { key: 'accountant', label: 'Assigned accountant', value: 'Viltvidas Voronkovas', type: 'select', options: ['Viltvidas Voronkovas', 'Alice Stone', 'John Smith'] },
    { key: 'companyType', label: 'Company type', value: 'UAB', type: 'select', options: ['UAB', 'MB', 'AB', 'Individual activity'] },
    { key: 'serviceScope', label: 'Service scope', value: 'Full accounting', type: 'select', options: ['Full accounting', 'Payroll', 'Document processing'] },
    { key: 'kyc', label: 'KYC status', value: 'Verified', type: 'select', options: ['Verified', 'Review required', 'Not verified'] },
    { key: 'notes', label: 'Client notes', value: 'Priority client. Monthly reporting required.', showTools: true },
  ]);

  const updateField = (key: string, value: string) => {
    setSaved(false);
    setFields(current => current.map(field => field.key === key ? { ...field, value } : field));
  };

  return (
    <div className="relative flex min-h-full flex-col items-start gap-8 bg-white px-[72px] py-14">
      <PageHeader
        title={company.name}
        className="max-w-[1440px]"
        actions={<><PageActionButton onClick={() => setConfirmReset(true)}>Reset KYC status</PageActionButton><PageActionButton onClick={() => setSaved(true)}>Update client information</PageActionButton></>}
      />

      <div className="flex w-full max-w-[1440px] flex-col gap-6">
        <div className="flex h-10 items-start gap-6 overflow-x-auto border-b border-[#E5EDF9]">
          {TABS.map(tab => (
            <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`flex h-10 flex-shrink-0 flex-col justify-between whitespace-nowrap font-montserrat text-[16px] font-medium leading-[22px] ${activeTab === tab ? 'text-[#007EA7]' : 'text-[#10233A]'}`}>
              <span>{tab}</span>
              <span className={`h-0.5 w-full ${activeTab === tab ? 'bg-[#007EA7]' : 'bg-transparent'}`} />
            </button>
          ))}
        </div>

        {activeTab === 'Client information' ? (
          <div className="flex w-[560px] max-w-full flex-col gap-6">
            {fields.map(field => <ClientField key={field.key} field={field} onChange={value => updateField(field.key, value)} />)}
            {saved && <span role="status" className="font-montserrat text-[13px] font-medium text-[#2EA96B]">Client information updated</span>}
          </div>
        ) : (
          <div className="flex h-48 w-[560px] max-w-full items-center justify-center rounded-lg border border-dashed border-[#D3E1EC] font-montserrat text-[14px] font-medium text-[#7288A3]">{activeTab} information</div>
        )}
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10233A]/20 p-6" onMouseDown={() => setConfirmReset(false)}>
          <div role="dialog" aria-modal="true" aria-label="Reset KYC status" className="flex w-[440px] flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.102)]" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="font-montserrat text-[22px] font-semibold leading-8 text-[#10233A]">Reset KYC status</h2><button type="button" aria-label="Close Reset KYC status" onClick={() => setConfirmReset(false)} className="text-[#7288A3]"><X size={24} /></button></div>
            <p className="font-montserrat text-[14px] font-medium leading-5 text-[#10233A]">Are you sure that you want to reset the KYC status for {company.name}?</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="h-[42px] rounded-lg border-2 border-[#D3E1EC] px-4 font-montserrat text-[16px] font-semibold text-[#7288A3]">Cancel</button><button type="button" onClick={() => { updateField('kyc', 'Not verified'); setConfirmReset(false); }} className="h-[42px] rounded-lg bg-[#F59E0B] px-4 font-montserrat text-[16px] font-semibold text-white">Reset</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
