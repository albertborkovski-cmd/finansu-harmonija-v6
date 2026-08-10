import { useState, useMemo } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import UnsubscribeModal from './UnsubscribeModal';
import { SaveButton } from './ScopedActionButtons';

interface ProfileSettingsProps {
  user: {
    role: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface ProfileErrors {
  fullName: string;
  email: string;
  phone: string;
}

interface PasswordErrors {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface TouchedFields {
  fullName: boolean;
  email: boolean;
  phone: boolean;
}

interface PasswordTouched {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  // Profile form state
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [role, setRole] = useState(user.role);

  // Original values for tracking changes
  const [originalProfile, setOriginalProfile] = useState({
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });

  // Display state (what shows in banner)
  const [displayProfile, setDisplayProfile] = useState({
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  const [touched, setTouched] = useState<TouchedFields>({
    fullName: false,
    email: false,
    phone: false,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState<PasswordTouched>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Security toggles
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [phoneNotifications, setPhoneNotifications] = useState(false);
  const [dualAuth, setDualAuth] = useState(false);
  const [reportNotifications, setReportNotifications] = useState(true);

  // Unsubscribe modal state
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [pendingToggleOff, setPendingToggleOff] = useState<(() => void) | null>(null);

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!email.includes('@')) {
      return 'Email must contain @ symbol';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 8) {
      return 'Please enter a valid phone number';
    }
    return '';
  };

  const validateFullName = (name: string): string => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  };

  const validateCurrentPassword = (password: string): string => {
    if (!password) {
      return 'Current password is required';
    }
    return '';
  };

  const validateNewPassword = (password: string): string => {
    if (!password) {
      return 'New password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateConfirmPassword = (confirm: string, newPass: string): string => {
    if (!confirm) {
      return 'Please confirm your password';
    }
    if (confirm !== newPass) {
      return 'Passwords do not match';
    }
    return '';
  };

  // Profile errors
  const profileErrors: ProfileErrors = useMemo(() => ({
    fullName: touched.fullName ? validateFullName(fullName) : '',
    email: touched.email ? validateEmail(email) : '',
    phone: touched.phone ? validatePhone(phone) : '',
  }), [fullName, email, phone, touched]);

  // Password errors
  const passwordErrors: PasswordErrors = useMemo(() => ({
    currentPassword: passwordTouched.currentPassword ? validateCurrentPassword(currentPassword) : '',
    newPassword: passwordTouched.newPassword ? validateNewPassword(newPassword) : '',
    confirmPassword: passwordTouched.confirmPassword ? validateConfirmPassword(confirmPassword, newPassword) : '',
  }), [currentPassword, newPassword, confirmPassword, passwordTouched]);

  // Check if profile has changes
  const hasProfileChanges = useMemo(() => {
    return (
      fullName !== originalProfile.fullName ||
      email !== originalProfile.email ||
      phone !== originalProfile.phone ||
      role !== originalProfile.role
    );
  }, [fullName, email, phone, role, originalProfile]);

  // Check if profile is valid
  const isProfileValid = useMemo(() => {
    return (
      validateFullName(fullName) === '' &&
      validateEmail(email) === '' &&
      validatePhone(phone) === ''
    );
  }, [fullName, email, phone]);

  // Check if password form is valid and has changes
  const isPasswordValid = useMemo(() => {
    return (
      validateCurrentPassword(currentPassword) === '' &&
      validateNewPassword(newPassword) === '' &&
      validateConfirmPassword(confirmPassword, newPassword) === '' &&
      newPassword.length > 0
    );
  }, [currentPassword, newPassword, confirmPassword]);

  // Handle blur for profile fields
  const handleProfileBlur = (field: keyof TouchedFields) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle blur for password fields
  const handlePasswordBlur = (field: keyof PasswordTouched) => {
    setPasswordTouched(prev => ({ ...prev, [field]: true }));
  };

  // Save profile
  const handleSaveProfile = async () => {
    setTouched({ fullName: true, email: true, phone: true });

    if (!isProfileValid) {
      return;
    }

    setIsSavingProfile(true);
    setProfileSaved(false);

    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update display profile (banner)
    setDisplayProfile({
      role,
      name: fullName,
      email,
      phone,
    });

    // Update original values
    setOriginalProfile({
      fullName,
      email,
      phone,
      role,
    });

    setIsSavingProfile(false);
    setProfileSaved(true);
    setTouched({ fullName: false, email: false, phone: false });

    // Hide success message after 3 seconds
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Save password
  const handleSavePassword = async () => {
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!isPasswordValid) {
      return;
    }

    setIsSavingPassword(true);
    setPasswordSaved(false);

    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear password fields after save
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordTouched({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });

    setIsSavingPassword(false);
    setPasswordSaved(true);

    // Hide success message after 3 seconds
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  // Handle notification toggle - show confirmation when trying to disable
  const handleReportNotificationsToggle = () => {
    if (reportNotifications) {
      // Trying to turn OFF - show confirmation modal
      setPendingToggleOff(() => () => setReportNotifications(false));
      setShowUnsubscribeModal(true);
    } else {
      // Turning ON - no confirmation needed
      setReportNotifications(true);
    }
  };

  const handleUnsubscribeConfirm = () => {
    if (pendingToggleOff) {
      pendingToggleOff();
    }
    setShowUnsubscribeModal(false);
    setPendingToggleOff(null);
  };

  const handleUnsubscribeCancel = () => {
    setShowUnsubscribeModal(false);
    setPendingToggleOff(null);
  };

  return (
    <div className="flex-1 bg-[#FCFCFD] p-14 flex flex-col gap-8 min-h-full">
      {/* Header */}
      <div className="flex items-end gap-4">
        <h1 className="text-[36px] font-semibold text-[#10233A] leading-[46px]">
          Profile settings
        </h1>
      </div>

      {/* User info banner */}
      <div className="w-full bg-white border border-[#D3E1EC] rounded-lg p-4">
        <div className="w-full bg-[#F6F7FF] rounded p-2 flex items-center gap-3">
          <div className="flex flex-col gap-0.5 w-[164px]">
            <span className="text-[12px] font-medium text-[#10233A]">Role</span>
            <span className="text-[12px] text-[#10233A]">{displayProfile.role}</span>
          </div>
          <div className="flex flex-col gap-0.5 w-[164px]">
            <span className="text-[12px] font-medium text-[#10233A]">Name</span>
            <span className="text-[12px] text-[#10233A]">{displayProfile.name}</span>
          </div>
          <div className="flex flex-col gap-0.5 w-[164px]">
            <span className="text-[12px] font-medium text-[#10233A]">Email</span>
            <span className="text-[12px] text-[#10233A]">{displayProfile.email}</span>
          </div>
          <div className="flex flex-col gap-0.5 w-[164px]">
            <span className="text-[12px] font-medium text-[#10233A]">Phone</span>
            <span className="text-[12px] text-[#10233A]">{displayProfile.phone}</span>
          </div>
        </div>
      </div>

      {/* Success messages */}
      {profileSaved && (
        <div className="w-fit px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check size={16} className="text-green-600" />
          <span className="text-sm text-green-700">Profile updated successfully</span>
        </div>
      )}
      {passwordSaved && (
        <div className="w-fit px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check size={16} className="text-green-600" />
          <span className="text-sm text-green-700">Password changed successfully</span>
        </div>
      )}

      {/* Settings cards */}
      <div className="flex gap-8 flex-wrap xl:flex-nowrap">
        {/* Profile Information Card */}
        <div className="flex-1 min-w-[336px] bg-white border border-[#D3E1EC] rounded-lg p-6">
          <div className="flex flex-col gap-6">
            <h2 className="text-[22px] font-semibold text-[#10233A]">
              Profile information
            </h2>

            <div className="flex flex-col gap-6">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  Full name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleProfileBlur('fullName')}
                    className={`w-full h-[42px] px-3.5 py-[11px] pr-10 border rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none transition-colors ${
                      profileErrors.fullName
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D3E1EC] focus:border-main-blue'
                    }`}
                  />
                  {profileErrors.fullName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {profileErrors.fullName && (
                  <p className="text-xs text-red-500">{profileErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleProfileBlur('email')}
                    className={`w-full h-[42px] px-3.5 py-[11px] pr-10 border rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none transition-colors ${
                      profileErrors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D3E1EC] focus:border-main-blue'
                    }`}
                  />
                  {profileErrors.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {profileErrors.email && (
                  <p className="text-xs text-red-500">{profileErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  Phone number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => handleProfileBlur('phone')}
                    className={`w-full h-[42px] px-3.5 py-[11px] pr-10 border rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none transition-colors ${
                      profileErrors.phone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D3E1EC] focus:border-main-blue'
                    }`}
                  />
                  {profileErrors.phone && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {profileErrors.phone && (
                  <p className="text-xs text-red-500">{profileErrors.phone}</p>
                )}
              </div>

              {/* Role */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-[42px] px-3.5 py-[11px] border border-[#D3E1EC] rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-main-blue transition-colors"
                />
              </div>
            </div>

            <SaveButton
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges || !isProfileValid || isSavingProfile}
              className="w-full"
            >
              {isSavingProfile ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </SaveButton>
          </div>
        </div>

        {/* Password Card */}
        <div className="flex-1 min-w-[336px] bg-white border border-[#D3E1EC] rounded-lg p-6">
          <div className="flex flex-col gap-6">
            <h2 className="text-[22px] font-semibold text-[#10233A]">
              Password
            </h2>

            <div className="flex flex-col gap-6">
              {/* Current Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onBlur={() => handlePasswordBlur('currentPassword')}
                    placeholder="Enter current password"
                    className={`w-full h-[42px] px-3.5 py-[11px] pr-16 border rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none transition-colors ${
                      passwordErrors.currentPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D3E1EC] focus:border-main-blue'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {passwordErrors.currentPassword && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-[#7288A3] hover:text-[#10233A] transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => handlePasswordBlur('newPassword')}
                    placeholder="Enter new password"
                    className={`w-full h-[42px] px-3.5 py-[11px] pr-16 border rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none transition-colors ${
                      passwordErrors.newPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D3E1EC] focus:border-main-blue'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {passwordErrors.newPassword && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-[#7288A3] hover:text-[#10233A] transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#10233A]">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handlePasswordBlur('confirmPassword')}
                    placeholder="Confirm new password"
                    className={`w-full h-[42px] px-3.5 py-[11px] pr-16 border rounded-lg text-sm font-medium text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none transition-colors ${
                      passwordErrors.confirmPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D3E1EC] focus:border-main-blue'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {passwordErrors.confirmPassword && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[#7288A3] hover:text-[#10233A] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <SaveButton
              onClick={handleSavePassword}
              disabled={!isPasswordValid || isSavingPassword}
              className="w-full"
            >
              {isSavingPassword ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </SaveButton>
          </div>
        </div>

        {/* Security Card */}
        <div className="flex-1 min-w-[336px] bg-white border border-[#D3E1EC] rounded-lg p-6">
          <div className="flex flex-col gap-6">
            <h2 className="text-[22px] font-semibold text-[#10233A]">
              Security
            </h2>

            {/* Authorization notifications */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#10233A]">
                Authorization notifications
              </h3>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#7288A3]">Email</span>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`w-[30px] h-[18px] rounded-full transition-colors relative ${
                      emailNotifications ? 'bg-main-blue' : 'bg-[#A1B6C6]'
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${
                        emailNotifications ? 'right-[2px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#7288A3]">Phone</span>
                  <button
                    onClick={() => setPhoneNotifications(!phoneNotifications)}
                    className={`w-[30px] h-[18px] rounded-full transition-colors relative ${
                      phoneNotifications ? 'bg-main-blue' : 'bg-[#A1B6C6]'
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${
                        phoneNotifications ? 'right-[2px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Dual authentication */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#10233A]">
                Dual authentication
              </h3>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#7288A3]">Enable</span>
                <button
                  onClick={() => setDualAuth(!dualAuth)}
                  className={`w-[30px] h-[18px] rounded-full transition-colors relative ${
                    dualAuth ? 'bg-main-blue' : 'bg-[#A1B6C6]'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${
                      dualAuth ? 'right-[2px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="flex-1 min-w-[336px] bg-white border border-[#D3E1EC] rounded-lg p-6">
          <div className="flex flex-col gap-6">
            <h2 className="text-[22px] font-semibold text-[#10233A]">
              Notifications
            </h2>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#10233A]">
                Reports
              </h3>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#7288A3]">
                  Report name notification
                </span>
                <button
                  onClick={handleReportNotificationsToggle}
                  className={`w-[30px] h-[18px] rounded-full transition-colors relative ${
                    reportNotifications ? 'bg-main-blue' : 'bg-[#A1B6C6]'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${
                      reportNotifications ? 'right-[2px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsubscribe Confirmation Modal */}
      <UnsubscribeModal
        isOpen={showUnsubscribeModal}
        reportName={fullName}
        onConfirm={handleUnsubscribeConfirm}
        onCancel={handleUnsubscribeCancel}
      />
    </div>
  );
}
