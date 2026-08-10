import { useState, useMemo } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

interface FormErrors {
  email: string;
  password: string;
}

interface TouchedFields {
  email: boolean;
  password: boolean;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const errors: FormErrors = useMemo(() => ({
    email: touched.email ? validateEmail(email) : '',
    password: touched.password ? validatePassword(password) : '',
  }), [email, password, touched]);

  const isFormValid = useMemo(() => {
    return validateEmail(email) === '' && validatePassword(password) === '';
  }, [email, password]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ email: true, password: true });

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Login submitted:', { email, password });
    setIsSubmitting(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col items-center justify-center p-8">
      <form className="w-full max-w-[368px] flex flex-col items-center gap-12" onSubmit={handleSubmit}>
        {/* Logo */}
        <img
          src={`${import.meta.env.BASE_URL}image.png`}
          alt="Finansų Harmonija"
          style={{ width: '188.86px', height: '64px' }}
          className="object-contain"
        />

        {/* Login Card */}
        <div className="w-full flex flex-col gap-6">
          {/* Form Container */}
          <div className="bg-white border border-border-grey rounded-lg p-6 flex flex-col gap-8">
            <div className="flex flex-col items-end gap-6">
              {/* Email Input */}
              <div className="w-full flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-grey-500">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="Enter your email"
                    className={`w-full h-[42px] px-3.5 py-[11px] border rounded-lg text-sm font-medium text-grey-500 placeholder:text-grey-600 focus:outline-none transition-colors ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border-grey focus:border-main-blue'
                    }`}
                  />
                  {errors.email && touched.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.email && touched.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="w-full flex flex-col gap-2 relative">
                <label htmlFor="password" className="text-sm font-semibold text-grey-500">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter password"
                    className={`w-full h-[42px] px-3.5 py-[12px] pr-16 border rounded-lg text-sm font-medium text-grey-500 placeholder:text-grey-600 focus:outline-none transition-colors ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border-grey focus:border-main-blue'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {errors.password && touched.password && (
                      <AlertCircle size={18} className="text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-grey hover:text-grey-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {errors.password && touched.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <a
                href="#"
                className="text-sm font-medium text-grey-700 hover:text-main-blue transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full h-12 rounded-lg font-semibold text-base transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? 'bg-main-blue text-white hover:bg-[#006A8F] active:scale-[0.98]'
                  : 'bg-btn-disabled text-btn-disabled-text cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </div>

          {/* Create Account Link */}
          <p className="text-center text-sm font-medium text-black">
            Do not have an account?{' '}
            <a
              href="#"
              className="text-main-blue hover:underline font-semibold"
            >
              Create your account
            </a>
          </p>

          {/* Footer Links - Frame 34005 */}
          <div className="w-[402px] flex flex-col items-center gap-6">
            {/* Frame 34004 - Links Row */}
            <div className="w-[402px] h-6 flex items-start gap-6">
              <a
                href="#"
                className="w-[112px] h-6 text-base font-medium leading-6 text-grey-700 hover:text-main-blue transition-colors flex items-center justify-center"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="w-[133px] h-6 text-base font-medium leading-6 text-grey-700 hover:text-main-blue transition-colors flex items-center justify-center"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="w-[109px] h-6 text-base font-medium leading-6 text-grey-700 hover:text-main-blue transition-colors flex items-center justify-center"
              >
                Cookie Policy
              </a>
            </div>
            {/* Copyright */}
            <p className="w-[300px] h-14 text-base font-medium leading-6 text-grey-500 text-center flex items-center justify-center">
              Copyright © 2019-2024, TechFin UAB. All rights reserved.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
