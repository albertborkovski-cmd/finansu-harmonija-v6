import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ProfileSettings from './ProfileSettings';
import Companies from './Companies';
import CompanyDetail from './CompanyDetail';
import OcrView from './OcrView';
import SchedulesView from './SchedulesView?version=schedule-save-v2';
import RunsManagementView from './RunsManagementView';
import DataStoresView from './DataStoresView';
import SecretVaultView from './SecretVaultView';
import NodeManagementView from './NodeManagementView';
import WorkspaceView, { type WorkspaceTask } from './WorkspaceView';
import MachineLearningView from './ml';
import ModelsView from './ml/ModelsView';
import DashboardsView from './DashboardsView';
import NotificationsView from './NotificationsView';
import HelpFaqView from './HelpFaqView';
import AutomationSecurityAccessView from './AutomationSecurityAccessView';
import ResourceSecurityAccessView, { type SecurityAccessTarget } from './ResourceSecurityAccessView';
import AdministrationView, { type AdministrationSection } from './AdministrationView';
import AutomationProcessDetailView, { type OcrProcess } from './AutomationProcessDetailView';
import { supabase, type Company } from '../lib/supabase';

interface User {
  role: string;
  name: string;
  email: string;
  phone: string;
}

const initialUser: User = {
  role: 'Accountant',
  name: 'John Brick',
  email: 'johnbrick@sdk.finance',
  phone: '+38 056 457 98 89',
};

export default function Dashboard() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user] = useState<User>(initialUser);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCompanyMenu, setSelectedCompanyMenu] = useState('overview');
  const [automationProcessFromNode, setAutomationProcessFromNode] = useState<OcrProcess | null>(null);
  const [automationRunIdFromNode, setAutomationRunIdFromNode] = useState<string | null>(null);
  const [automationReturnMenu, setAutomationReturnMenu] = useState('ocr-nodes');
  const [securityAccessTarget, setSecurityAccessTarget] = useState<SecurityAccessTarget | null>(null);
  const [securityAccessReturnMenu, setSecurityAccessReturnMenu] = useState('ocr');

  useEffect(() => {
    const showRefreshFeedback = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;

      const title = button.title.trim().toUpperCase();
      const ariaLabel = (button.getAttribute('aria-label') ?? '').trim().toUpperCase();
      const isRefreshAll =
        button.dataset.buttonFamily === 'refresh-all' ||
        title === 'REFRESH ALL' ||
        ariaLabel === 'REFRESH ALL' ||
        ariaLabel.startsWith('REFRESH ALL ');

      if (!isRefreshAll) return;

      const appMain =
        button.closest<HTMLElement>('[data-app-main]') ??
        document.querySelector<HTMLElement>('[data-app-main]');
      if (!appMain) return;

      // Render the feedback above the visible menu instead of animating the
      // scroll container itself. Filtering/transforming the scroll container
      // makes browsers re-composite its native scrollbar and can visibly move
      // the thumb even though the underlying scroll position did not change.
      document.querySelectorAll('[data-refresh-all-feedback]').forEach(element => element.remove());

      const bounds = appMain.getBoundingClientRect();
      const feedback = document.createElement('div');
      feedback.dataset.refreshAllFeedback = 'true';
      feedback.className = 'refresh-all-screen-feedback';
      feedback.style.left = `${bounds.left}px`;
      feedback.style.top = `${bounds.top}px`;
      feedback.style.width = `${bounds.width}px`;
      feedback.style.height = `${bounds.height}px`;
      document.body.appendChild(feedback);

      const removeFeedback = () => feedback.remove();
      feedback.addEventListener('animationend', removeFeedback, { once: true });
      window.setTimeout(removeFeedback, 700);
    };

    document.addEventListener('click', showRefreshFeedback, true);
    return () => document.removeEventListener('click', showRefreshFeedback, true);
  }, []);

  const handleMenuClick = (menu: string) => {
    setAutomationProcessFromNode(null);
    setAutomationRunIdFromNode(null);
    setSecurityAccessTarget(null);
    setActiveMenu(menu);
  };

  const openSecurityAccess = (target: SecurityAccessTarget, returnMenu: string) => {
    setSecurityAccessTarget(target);
    setSecurityAccessReturnMenu(returnMenu);
    setActiveMenu('ocr-admin-groups');
  };

  const openCompany = (company: Company, menu = 'overview') => {
    setSelectedCompanyMenu(menu);
    setSelectedCompany(company);
  };

  const completeWorkspaceTask = async (task: WorkspaceTask) => {
    const companyName = task.fields.companyName.trim();
    const { data: companyRows } = await supabase.from('companies').select('*');
    let company = (companyRows as unknown as Company[] | null)?.find(
      row => row.name.trim().toLocaleLowerCase() === companyName.toLocaleLowerCase(),
    );

    if (!company) {
      const companyId = `ocr-company-${companyName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || task.id}`;
      company = {
        id: companyId,
        name: companyName,
        company_code: task.fields.invoiceNumber || `OCR-${task.id}`,
        vat_code: '',
        client_since: new Date().getFullYear(),
        action_required: 0,
      };
      await supabase.from('companies').upsert(company, { onConflict: 'id' });
    }

    const numericTotal = Number(task.fields.totalAmount.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    const taxRate = Number(task.fields.taxRate.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    const amountWithoutVat = taxRate > 0 ? numericTotal / (1 + taxRate / 100) : numericTotal;
    const vat = numericTotal - amountWithoutVat;
    const purpose = task.products
      .map(product => [product.name, product.description].filter(Boolean).join(' — '))
      .filter(Boolean)
      .join('; ');

    await supabase.from('documents').upsert({
      id: `workspace-document-${task.id}`,
      company_id: company.id,
      receive_date: new Date().toLocaleDateString('lt-LT'),
      client_counterparty: company.name,
      document_type: task.documentType || 'Invoice',
      source: 'OCR Workspace',
      total_amount: `${numericTotal.toFixed(2)} €`,
      due_end_date: task.fields.dueDate,
      file_case: task.name,
      order_no: task.sourceRunId,
      number: task.fields.invoiceNumber,
      type: 'Invoice',
      document_date: task.fields.invoiceDate,
      document_purpose: purpose || task.description,
      invoice_contract_date: task.fields.invoiceDate,
      operation_date: task.fields.invoiceDate,
      expense_account: '',
      vat_classifier: '',
      currency: 'EUR',
      amount_without_vat: `${amountWithoutVat.toFixed(2)} €`,
      vat: `${vat.toFixed(2)} €`,
      vat_percent: `${taxRate.toFixed(2)}%`,
      department_code: '',
      object_project: task.sourceRunId,
      valid_form: 'OCR validated',
      accountable_responsible: task.createdBy,
      cost_center: '',
      series: 'OCR',
      status: 'Pending',
      created_at: new Date().toISOString(),
      image_url: null,
    }, { onConflict: 'id' });

    openCompany(company, 'documents');
  };

  if (selectedCompany) {
    return (
      <CompanyDetail
        company={selectedCompany}
        initialMenu={selectedCompanyMenu}
        onBack={() => {
          setSelectedCompany(null);
          setSelectedCompanyMenu('overview');
        }}
      />
    );
  }

  const renderContent = () => {
    if (securityAccessTarget) {
      return (
        <ResourceSecurityAccessView
          target={securityAccessTarget}
          onBack={() => {
            setSecurityAccessTarget(null);
            setActiveMenu(securityAccessReturnMenu);
          }}
        />
      );
    }
    if (automationProcessFromNode) {
      return (
        <AutomationProcessDetailView
          process={automationProcessFromNode}
          initialRunId={automationRunIdFromNode ?? undefined}
          onBack={() => {
            setAutomationProcessFromNode(null);
            setAutomationRunIdFromNode(null);
            setActiveMenu(automationReturnMenu);
          }}
        />
      );
    }
    if (activeMenu === 'profile') return <ProfileSettings user={user} />;
    if (activeMenu === 'dashboard') return <Companies onViewDetails={company => openCompany(company)} />;
    if (activeMenu === 'notifications') return <NotificationsView />;
    if (activeMenu === 'info') return <HelpFaqView />;
    if (activeMenu === 'ocr-schedules') return <SchedulesView />;
    if (activeMenu === 'ocr-runs') return <RunsManagementView />;
    if (activeMenu === 'ocr-datastores') {
      return <DataStoresView onNavigateToAdministration={target => openSecurityAccess(target, 'ocr-datastores')} />;
    }
    if (activeMenu === 'ocr-secrets') return <SecretVaultView onNavigateToAdministration={target => openSecurityAccess(target, 'ocr-secrets')} />;
    if (activeMenu === 'ocr-nodes') {
      return (
        <NodeManagementView
          onNavigateToAutomationProcess={(process, run) => {
            setAutomationProcessFromNode(process);
            setAutomationRunIdFromNode(run?.id ?? null);
            setAutomationReturnMenu('ocr-nodes');
            setActiveMenu('ocr');
          }}
          onNavigateToSecurityAccess={target => openSecurityAccess(target, 'ocr-nodes')}
        />
      );
    }
    if (activeMenu === 'ocr-workspace') return <WorkspaceView onCompleteToCompany={completeWorkspaceTask} />;
    if (activeMenu === 'ocr-ml-models') return <ModelsView />;
    if (activeMenu === 'ocr-ml' || activeMenu === 'ocr-ml-documents') return <MachineLearningView onOpenAutomationProcess={(processId, processName, runId) => {
      setAutomationProcessFromNode({
        id: processId,
        name: processName,
        description: 'Automation process',
        capabilities: '—',
        createdBy: 'RPA platform',
        creationDate: '10.04.2026 12:22',
        modifiedBy: 'RPA platform',
        modifiedDate: '10.04.2026 12:22',
      });
      setAutomationRunIdFromNode(runId ?? null);
      setAutomationReturnMenu('ocr-ml-documents');
      setActiveMenu('ocr');
    }} />;
    if (activeMenu === 'ocr-dashboards') return <DashboardsView />;
    if (activeMenu === 'ocr-admin-groups') return <AutomationSecurityAccessView />;
    const administrationSections: Record<string, AdministrationSection> = {
      'ocr-admin': 'human-task-types',
      'ocr-admin-human-task-types': 'human-task-types',
      'ocr-admin-document-types': 'document-types',
      'ocr-admin-users': 'users',
      'ocr-admin-notifications': 'notifications',
      'ocr-admin-monitoring': 'monitoring',
      'ocr-admin-configuration': 'configuration',
      'ocr-admin-logs': 'logs',
      'ocr-admin-activity': 'activity',
      'ocr-admin-license': 'license',
    };
    if (administrationSections[activeMenu]) return <AdministrationView section={administrationSections[activeMenu]} />;
    if (activeMenu === 'ocr' || activeMenu.startsWith('ocr-')) {
      return <OcrView onNavigateToAdministration={target => openSecurityAccess(target, 'ocr')} />;
    }
    return (
      <div className="flex flex-1 items-center justify-center text-[#7288A3] font-montserrat font-medium text-[14px]">
        Coming soon
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-shrink-0 overflow-y-auto">
        <Sidebar
          isExpanded={isMenuExpanded}
          onToggle={() => setIsMenuExpanded(!isMenuExpanded)}
          activeMenu={activeMenu}
          onMenuClick={handleMenuClick}
        />
      </div>
      <div data-app-main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
