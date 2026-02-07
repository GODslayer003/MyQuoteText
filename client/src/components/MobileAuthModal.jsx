import React, { useState } from 'react';
import {
    X,
    Phone,
    ArrowRight,
    Shield,
    MessageSquare,
    CheckCircle,
    User,
    Mail,
    Lock,
    Loader2
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'react-hot-toast';

const MobileAuthModal = ({ isOpen, onClose, onSuccess, initialEmail = '' }) => {
    const { register, login } = useAuth();
    const [step, setStep] = useState('mobile'); // mobile, otp, signup
    const [loading, setLoading] = useState(false);

    // Data State
    const [countryCode, setCountryCode] = useState('+61');
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [userDetails, setUserDetails] = useState({
        firstName: '',
        lastName: '',
        email: initialEmail || '',
        password: '',
        confirmPassword: ''
    });

    if (!isOpen) return null;

    // --- Step 1: Mobile Input Logic ---
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!mobileNumber || mobileNumber.length < 9) {
            toast.error('Please enter a valid mobile number');
            return;
        }

        setLoading(true);
        // TODO: Integrate Clicksend here
        // Mock API call to send OTP
        setTimeout(() => {
            setLoading(false);
            toast.success(`OTP sent to ${countryCode} ${mobileNumber}`);
            console.log('Mock OTP: 123456'); // For dev testing
            setStep('otp');
        }, 1500);
    };

    // --- Step 2: OTP Verification Logic ---
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length !== 6) {
            toast.error('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        // Mock verification
        setTimeout(() => {
            setLoading(false);
            if (enteredOtp === '123456') {
                toast.success('Mobile verified successfully!');
                setStep('signup');
            } else {
                toast.error('Invalid code. Try 123456');
            }
        }, 1500);
    };

    // --- Step 3: Signup Logic ---
    const handleSignup = async (e) => {
        e.preventDefault();

        if (userDetails.password !== userDetails.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!userDetails.email || !userDetails.firstName || !userDetails.password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Create user object with mobile number included
            const userData = {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                email: userDetails.email,
                password: userDetails.password,
                phone: `${countryCode}${mobileNumber}`, // Add phone to user profile
                isPhoneVerified: true
            };

            // Call AuthProvider register
            const result = await register(userData);

            if (result.success) {
                toast.success('Account created successfully!');
                if (onSuccess) onSuccess(result.user);
                onClose();
            } else {
                toast.error(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Something went wrong during signup');
        } finally {
            setLoading(false);
        }
    };

    const countryCodes = [
        { code: '+61', country: 'AU', flag: '🇦🇺' },
        { code: '+1', country: 'US', flag: '🇺🇸' },
        { code: '+44', country: 'UK', flag: '🇬🇧' },
        { code: '+91', country: 'IN', flag: '🇮🇳' },
        { code: '+64', country: 'NZ', flag: '🇳🇿' },
        { code: '+1', country: 'CA', flag: '🇨🇦' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-600" />
                        {step === 'mobile' ? 'Verify Mobile' : step === 'otp' ? 'Enter Code' : 'Complete Setup'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        <div className={`h-1 flex-1 rounded-full ${step === 'mobile' ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${step === 'otp' ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${step === 'signup' ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                    </div>

                    {step === 'mobile' && (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-8 h-8 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Enter your mobile number</h2>
                                <p className="text-gray-500 text-sm mt-1">We'll send you a verification code to secure your account.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Mobile Number</label>
                                <div className="flex gap-2">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="flex-shrink-0 w-[80px] px-2 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                    >
                                        {countryCodes.map((c) => (
                                            <option key={c.country} value={c.code}>
                                                {c.flag} {c.code}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Mobile number"
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Send Code <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <div className="space-y-6 text-center">
                            <div>
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Enter Verification Code</h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    Sent to {countryCode} {mobileNumber} <br />
                                    <button onClick={() => setStep('mobile')} className="text-orange-600 font-medium hover:underline">Change Number</button>
                                </p>
                            </div>

                            <div className="flex justify-center gap-2 my-4">
                                {otp.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        value={data}
                                        onChange={(e) => handleOtpChange(e.target, index)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                                e.target.previousSibling.focus();
                                            }
                                        }}
                                        className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                            </button>

                            <div className="text-xs text-gray-400">
                                Did not receive code? <button onClick={handleSendOtp} className="text-gray-600 font-bold hover:text-black">Resend</button>
                            </div>
                        </div>
                    )}

                    {step === 'signup' && (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Almost Done!</h2>
                                <p className="text-gray-500 text-sm">Please complete your profile to continue.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={userDetails.firstName}
                                            onChange={(e) => setUserDetails({ ...userDetails, firstName: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={userDetails.lastName}
                                        onChange={(e) => setUserDetails({ ...userDetails, lastName: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={userDetails.email}
                                        onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={userDetails.password}
                                        onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={userDetails.confirmPassword}
                                        onChange={(e) => setUserDetails({ ...userDetails, confirmPassword: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Confirm password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Continue'}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MobileAuthModal;
