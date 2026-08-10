import { useState } from 'react';
import { ArrowLeft, User, Menu, LogOut } from 'lucide-react';
import type { Company } from '../lib/supabase';
import Documents from './Documents';
import DashboardView from './DashboardView';
import InvoicesView from './invoices';
import CompanyClientInformation from './CompanyClientInformation';

interface CompanyDetailProps {
  company: Company;
  onBack: () => void;
  initialMenu?: string;
}

const mainMenuItems = [
  { id: 'overview',      label: 'Dashboard' },
  { id: 'documents',     label: 'Documents' },
  { id: 'invoices',      label: 'Invoices' },
  { id: 'reports',       label: 'Debts' },
  { id: 'services',      label: 'Reconciliation' },
  { id: 'settings',      label: 'Reports' },
  { id: 'notifications', label: 'Action history' },
  { id: 'activity',      label: 'Company/Client information' },
];

const contactMenuItems = [
  { id: 'contacts', label: 'Support' },
  { id: 'partners', label: 'Help' },
  { id: 'team',     label: 'FAQ' },
];

export default function CompanyDetail({ company, onBack, initialMenu = 'overview' }: CompanyDetailProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeMenu, setActiveMenu] = useState(initialMenu);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Blue strip */}
      <div className="w-12 min-h-screen bg-[#E6F2F6] flex flex-col justify-between items-center py-4 z-10 flex-shrink-0">
        <div className="flex items-center justify-center w-12 h-8">
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#D0E8EF] transition-colors">
            <User size={16} className="text-[#7288A3]" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="w-12 h-8 flex items-center justify-center hover:bg-[#D0E8EF] rounded transition-colors"
          >
            <Menu size={16} className="text-[#006080]" />
          </button>
          <button className="w-12 h-8 flex items-center justify-center hover:bg-[#D0E8EF] rounded transition-colors" title="Logout">
            <LogOut size={16} className="text-[#006080] rotate-90" />
          </button>
        </div>
      </div>

      {/* White panel */}
      <div
        className="min-h-screen bg-white border-r-2 border-[#E6F2F6] flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0"
        style={{ width: isExpanded ? '288px' : '68px' }}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Back button */}
          <div className="flex items-center px-2 py-[6px] h-8 flex-shrink-0 overflow-hidden mb-2">
            <button
              onClick={onBack}
              className="flex flex-row items-center gap-2 hover:opacity-70 transition-opacity"
              title="Back"
            >
              <ArrowLeft size={11} className="text-[#007EA7] flex-shrink-0" style={{ strokeWidth: 2.5 }} />
              {isExpanded && (
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#007EA7] whitespace-nowrap">
                  Back
                </span>
              )}
            </button>
          </div>

          {/* Company name */}
          {isExpanded && (
            <div className="px-2 py-0 flex-shrink-0 mb-2">
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#161616] whitespace-nowrap truncate block">
                Client: {company.name}
              </span>
            </div>
          )}

          {/* Main menu — grows to fill space */}
          <nav className="flex flex-col gap-0 flex-1 overflow-y-auto">
            {mainMenuItems.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  title={!isExpanded ? item.label : undefined}
                  className={`h-9 flex flex-row items-center justify-between rounded transition-colors overflow-hidden ${
                    isExpanded ? 'w-full px-3' : 'w-9 justify-center px-[10px]'
                  } ${isActive ? 'bg-[#007EA7]' : 'hover:bg-[#F0F7FA]'}`}
                >
                  {isExpanded && (
                    <span className={`font-montserrat font-medium text-[14px] leading-5 whitespace-nowrap ${isActive ? 'text-white' : 'text-[#10233A]'}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Contact menu items — pinned to bottom */}
          <div className="flex flex-col gap-0 flex-shrink-0">
            {contactMenuItems.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  title={!isExpanded ? item.label : undefined}
                  className={`h-9 flex flex-row items-center rounded transition-colors overflow-hidden ${
                    isExpanded ? 'w-full px-3' : 'w-9 justify-center px-[10px]'
                  } ${isActive ? 'bg-[#007EA7]' : 'hover:bg-[#F0F7FA]'}`}
                >
                  {isExpanded && (
                    <span className={`font-montserrat font-medium text-[14px] leading-5 whitespace-nowrap ${isActive ? 'text-white' : 'text-[#10233A]'}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div data-app-main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-white">
        {activeMenu === 'documents' ? (
          <Documents companyId={company.id} />
        ) : activeMenu === 'overview' ? (
          <DashboardView clientName={company.name} />
        ) : activeMenu === 'invoices' ? (
          <InvoicesView />
        ) : activeMenu === 'activity' ? (
          <CompanyClientInformation company={company} />
        ) : (
          <div className="px-9 py-14">
            <CompanyOverview company={company} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-montserrat font-medium text-[11px] leading-4 text-[#7288A3] uppercase tracking-wide">{label}</span>
      <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">{value || '—'}</span>
    </div>
  );
}

function CompanyOverview({ company }: { company: Company }) {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-montserrat font-semibold text-[24px] leading-8 text-[#10233A]">{company.name}</h1>
        <span className="font-montserrat font-medium text-[13px] leading-5 text-[#7288A3]">Company overview</span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Company code',   value: company.company_code },
          { label: 'VAT code',       value: company.vat_code },
          { label: 'Client since',   value: company.client_since },
          { label: 'Action required', value: company.action_required },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-3 px-5 py-4 bg-[#F8FDFF] border border-[#E6F2F6] rounded-xl">
            <InfoRow label={label} value={value} />
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      {['Documents', 'Transactions'].map(section => (
        <div key={section} className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">{section}</span>
            <span className="font-montserrat font-medium text-[13px] leading-5 text-[#007EA7] cursor-pointer hover:underline">View all</span>
          </div>
          <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-[#D3E1EC]">
            <span className="font-montserrat font-medium text-[13px] text-[#7288A3]">No {section.toLowerCase()} yet</span>
          </div>
        </div>
      ))}
    </div>
  );
}
