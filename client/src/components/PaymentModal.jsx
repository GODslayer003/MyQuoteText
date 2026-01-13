import React, { useState } from 'react';
import {
    X,
    CreditCard,
    CheckCircle,
    ShieldCheck,
    Lock,
    Zap
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

const PaymentModal = ({ isOpen, onClose, plan = 'Standard', price = 7.99, onSuccess }) => {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState('summary'); // summary, processing, success
    const [paymentMethod, setPaymentMethod] = useState('card');

    if (!isOpen) return null;

    const handlePayment = async () => {
        setIsProcessing(true);
        setStep('processing');

        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setStep('success');

            // Auto close after success
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 2500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        Secure Checkout
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'summary' && (
                        <>
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-orange-600 fill-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to {plan}</h2>
                                <p className="text-gray-600">Unlock detailed analysis and premium insights</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">{plan} Report</span>
                                    <span className="font-bold text-gray-900">${price}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Processing Fee</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="border-t border-gray-200 my-3"></div>
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>Total</span>
                                    <span>${price}</span>
                                </div>
                            </div>

                            {/* Mock Payment Methods */}
                            <div className="space-y-3 mb-8">
                                <div
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-orange-600' : 'text-gray-400'}`} />
                                    <span className="font-medium text-gray-900">Credit / Debit Card</span>
                                    <div className="ml-auto flex gap-1">
                                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
                            >
                                Pay ${price} Securely
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                <Lock className="w-3 h-3" />
                                Payments processed securely by Stripe
                            </div>
                        </>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
                            <p className="text-gray-600">Please wait while we confirm your transaction...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                            <p className="text-gray-600 mb-6">Your premium features have been unlocked.</p>
                            <div className="text-sm text-gray-500">Redirecting...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
