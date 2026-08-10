import { useState } from 'react';
import { User, Menu, LogOut, Home, MessageSquare, Bell, Settings, FolderOpen, ChevronDown, ScanText, ClipboardList, CalendarDays, Database, ShieldCheck, Users2, Monitor, BrainCircuit, LayoutDashboard, Cog } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  activeMenu: string;
  onMenuClick: (menu: string) => void;
}

interface SubMenuItem {
  id: string;
  label: string;
}

const mainMenuItems = [
  { id: 'dashboard', label: 'Companies', icon: Home },
  { id: 'messages', label: 'Chats', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'info', label: 'FAQ', icon: FolderOpen },
  { id: 'ocr', label: 'OCR', icon: ScanText },
];

const ocrSubMenuItems = [
  { id: 'ocr', label: 'Automation processes', icon: ScanText },
  { id: 'ocr-runs', label: 'Runs management', icon: ClipboardList },
  { id: 'ocr-schedules', label: 'Schedules', icon: CalendarDays },
  { id: 'ocr-datastores', label: 'Data stores', icon: Database },
  { id: 'ocr-secrets', label: 'Secret vault', icon: ShieldCheck },
  { id: 'ocr-nodes', label: 'Node management', icon: Users2 },
  { id: 'ocr-workspace', label: 'Workspace', icon: Monitor },
  { id: 'ocr-ml', label: 'Machine learning', icon: BrainCircuit, hasDropdown: true },
  { id: 'ocr-dashboards', label: 'Dashboards', icon: LayoutDashboard },
  { id: 'ocr-admin', label: 'Administration', icon: Cog, hasDropdown: true },
];

const mlSubItems: SubMenuItem[] = [
  { id: 'ocr-ml-documents', label: 'Document sets' },
  { id: 'ocr-ml-models', label: 'Models' },
];

const adminSubItems: SubMenuItem[] = [
  { id: 'ocr-admin-human-task-types', label: 'Human Task Types' },
  { id: 'ocr-admin-document-types', label: 'Document Types' },
  { id: 'ocr-admin-users', label: 'User Management' },
  { id: 'ocr-admin-groups', label: 'Group Management' },
  { id: 'ocr-admin-notifications', label: 'Notification Management' },
  { id: 'ocr-admin-monitoring', label: 'Monitoring' },
  { id: 'ocr-admin-configuration', label: 'CS Configuration' },
  { id: 'ocr-admin-logs', label: 'Logs' },
  { id: 'ocr-admin-activity', label: 'Activity Log' },
  { id: 'ocr-admin-license', label: 'License Management' },
];

const CLIENT_NAME = 'Client name';

function isOcrSection(activeMenu: string) {
  return activeMenu === 'ocr' || activeMenu.startsWith('ocr-');
}

function isMlActive(activeMenu: string) {
  return activeMenu === 'ocr-ml' || activeMenu.startsWith('ocr-ml-');
}

function isAdminActive(activeMenu: string) {
  return activeMenu === 'ocr-admin' || activeMenu.startsWith('ocr-admin-');
}

function StepperDot({ isActive, isFirst, isLast }: { isActive: boolean; isFirst: boolean; isLast: boolean }) {
  return (
    <div className="flex flex-col items-center w-1 self-stretch">
      <div
        className="flex-1 w-0"
        style={{
          borderLeft: '1px solid #007EA7',
          opacity: isFirst ? 0 : 0.2,
        }}
      />
      <div
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{
          background: '#007EA7',
          opacity: isActive ? 1 : 0.2,
        }}
      />
      <div
        className="flex-1 w-0"
        style={{
          borderLeft: '1px solid #007EA7',
          opacity: isLast ? 0 : 0.2,
        }}
      />
    </div>
  );
}

export default function Sidebar({ isExpanded, onToggle, activeMenu, onMenuClick }: SidebarProps) {
  const [mlExpanded, setMlExpanded] = useState(isMlActive(activeMenu));
  const [adminExpanded, setAdminExpanded] = useState(isAdminActive(activeMenu));
  const menuItems = isOcrSection(activeMenu) ? ocrSubMenuItems : mainMenuItems;

  const handleMenuClick = (id: string) => {
    if (id === 'ocr-ml') {
      setMlExpanded(!mlExpanded);
      if (!isMlActive(activeMenu)) {
        onMenuClick('ocr-ml-documents');
      }
    } else if (id === 'ocr-admin') {
      setAdminExpanded(!adminExpanded);
      if (!isAdminActive(activeMenu)) {
        onMenuClick('ocr-admin-human-task-types');
      }
    } else {
      onMenuClick(id);
    }
  };

  return (
    <div className="flex">
      {/* Blue strip */}
      <div className="w-12 min-h-screen bg-[#E6F2F6] flex flex-col justify-between items-center py-4 z-10">
        <div className="flex items-center justify-center w-12 h-8">
          <button
            onClick={() => onMenuClick('profile')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#D0E8EF] transition-colors"
          >
            <User size={16} className="text-[#7288A3]" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onToggle}
            className="w-12 h-8 flex items-center justify-center hover:bg-[#D0E8EF] rounded transition-colors"
          >
            <Menu size={16} className="text-[#006080]" />
          </button>
          <button
            className="w-12 h-8 flex items-center justify-center hover:bg-[#D0E8EF] rounded transition-colors"
            title="Logout"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut size={16} className="text-[#006080] rotate-90" />
          </button>
        </div>
      </div>

      {/* White panel */}
      <div
        className="min-h-screen bg-white border-r-2 border-[#E6F2F6] flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0"
        style={{ width: isExpanded ? '288px' : '36px' }}
      >
        <div className="flex flex-col h-full" style={{ width: isExpanded ? 288 : 36 }}>
          {/* Header */}
          {isExpanded && (
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center px-[9px] py-[6px] h-8">
                <span className="font-montserrat font-semibold text-[16px] leading-5 text-[#10233A] whitespace-nowrap">
                  {CLIENT_NAME}
                </span>
              </div>
            </div>
          )}

          {/* Menu items */}
          <nav className={`flex flex-col gap-0 ${isExpanded ? 'px-4' : 'px-0 pt-2'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'ocr-ml'
                ? isMlActive(activeMenu)
                : item.id === 'ocr-admin'
                  ? isAdminActive(activeMenu)
                  : activeMenu === item.id;
              const hasDropdown = 'hasDropdown' in item && item.hasDropdown;
              const showMlSub = item.id === 'ocr-ml' && mlExpanded && isExpanded;
              const showAdminSub = item.id === 'ocr-admin' && adminExpanded && isExpanded;

              return (
                <div key={item.id}>
                  {isExpanded ? (
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`h-9 w-full flex flex-row items-center justify-between px-2 rounded transition-colors ${
                        isActive ? 'bg-[#007EA7]' : 'hover:bg-[#F0F7FA]'
                      }`}
                    >
                      <div className="flex flex-row items-center gap-2">
                        <Icon size={16} className={isActive ? 'text-white' : 'text-[#7288A3]'} />
                        <span className={`font-montserrat font-medium text-[14px] leading-5 whitespace-nowrap ${isActive ? 'text-white' : 'text-[#10233A]'}`}>
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`flex-shrink-0 transition-transform ${hasDropdown ? 'opacity-100' : 'opacity-0'} ${isActive ? 'text-white' : 'text-[#10233A]'} ${showMlSub || showAdminSub ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      title={item.label}
                      className={`w-9 h-9 flex items-center justify-center rounded transition-colors mx-auto ${
                        isActive ? 'bg-[#007EA7]' : 'hover:bg-[#F0F7FA]'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : 'text-[#7288A3]'} />
                    </button>
                  )}

                  {/* ML sub-items */}
                  {showMlSub && (
                    <div className="mt-1.5 flex flex-col gap-0.5 pb-1 pl-[14px]">
                      {mlSubItems.map((sub, idx) => {
                        const isSubActive = activeMenu === sub.id;
                        return (
                          <div key={sub.id} className="flex h-8 flex-row items-center gap-[14px]">
                            <StepperDot
                              isActive={isSubActive}
                              isFirst={idx === 0}
                              isLast={idx === mlSubItems.length - 1}
                            />
                            <button
                              onClick={() => onMenuClick(sub.id)}
                              className={`flex h-8 min-w-0 flex-1 items-center rounded-md px-3 transition-colors ${
                                isSubActive ? 'bg-[#007EA7]' : 'hover:bg-[#F0F7FA]'
                              }`}
                            >
                              <span className={`font-montserrat font-medium text-[14px] leading-5 whitespace-nowrap ${
                                isSubActive ? 'text-white' : 'text-[#10233A]'
                              }`}>
                                {sub.label}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showAdminSub && (
                    <div className="mt-1.5 flex flex-col gap-0.5 pb-1 pl-[14px]">
                      {adminSubItems.map((sub, idx) => {
                        const isSubActive = activeMenu === sub.id || (activeMenu === 'ocr-admin' && idx === 0);
                        return (
                          <div key={sub.id} className="flex h-8 flex-row items-center gap-[14px]">
                            <StepperDot
                              isActive={isSubActive}
                              isFirst={idx === 0}
                              isLast={idx === adminSubItems.length - 1}
                            />
                            <button
                              onClick={() => onMenuClick(sub.id)}
                              className={`flex h-8 min-w-0 flex-1 items-center rounded-md px-3 transition-colors ${
                                isSubActive ? 'bg-[#007EA7]' : 'hover:bg-[#F0F7FA]'
                              }`}
                            >
                              <span className={`font-montserrat font-medium text-[14px] leading-5 whitespace-nowrap ${
                                isSubActive ? 'text-white' : 'text-[#10233A]'
                              }`}>
                                {sub.label}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
