
import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, ShieldCheck, ScanLine } from 'lucide-react';
import { verifyAadhaar } from '../../services/verification';

interface Props {
    onVerified: (data: { name: string }) => void;
}

export const AadhaarVerificationStep: React.FC<Props> = ({ onVerified }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        dob: '', // DD-MM-YYYY
        last4: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please upload your Aadhaar QR code image.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const result = await verifyAadhaar(file, formData.name, formData.dob, formData.last4);

            if (result.status === 'SUCCESS') {
                onVerified({ name: result.extracted?.name || formData.name });
            } else {
                let msg = result.message;
                if (result.details) {
                    const failures = [];
                    if (!result.details.name_match) failures.push('Name');
                    if (!result.details.dob_match) failures.push('DOB');
                    if (!result.details.last_4_match) failures.push('Last 4 Digits');
                    msg = `Mismatch found in: ${failures.join(', ')}`;
                }
                setError(msg);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">Identity Verification</h2>
                <p className="text-slate-500 text-sm">To ensure the safety of our alumni network, we require a quick Aadhaar verification. Your data is processed securely and not stored.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* File Upload */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">1. Upload Aadhaar QR</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 ${preview ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {preview ? (
                                <div className="relative">
                                    <img src={preview} alt="Aadhaar Preview" className="h-48 object-contain rounded-lg shadow-sm" />
                                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                        <CheckCircle className="w-5 h-5 text-green-500 block" />
                                    </div>
                                    <p className="text-xs text-center mt-2 text-slate-400">Click to change</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                                        <ScanLine className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">Click to upload image</p>
                                        <p className="text-xs text-slate-400 mt-1">Accepts JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manual Inputs */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">2. Verify Details</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name (as on Aadhaar)</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-300 transition-colors placeholder:text-slate-300"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</label>
                                <input
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-300 transition-colors placeholder:text-slate-300"
                                    placeholder="DD-MM-YYYY"
                                    pattern="\d{2}-\d{2}-\d{4}"
                                    title="Format: DD-MM-YYYY"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Last 4 Digits of Aadhaar</label>
                                <input
                                    name="last4"
                                    value={formData.last4}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-300 transition-colors placeholder:text-slate-300 tracking-widest font-mono"
                                    placeholder="XXXX"
                                    maxLength={4}
                                    pattern="\d{4}"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:scale-[1.02] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Verify Identity
                                <ShieldCheck className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-6 max-w-md mx-auto leading-relaxed">
                By verifying, you confirm that the provided Aadhaar details belong to you. We verify this against the digital signature in the QR code.
            </p>
        </div>
    );
};
