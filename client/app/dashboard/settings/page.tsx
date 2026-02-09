'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUnlink = async () => {
        if (!confirm("Are you sure you want to unlink your Google Account? You will need to sign in again to re-link.")) return;

        setLoading(true);
        setMessage('');

        try {
            const userId = (session?.user as any)?.id;
            if (!userId) {
                setMessage("User ID not found. Please refresh.");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/unlink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Account unlinked successfully. Signing out...");
                setTimeout(() => {
                    signOut({ callbackUrl: '/' });
                }, 2000);
            } else {
                setMessage(`Error: ${data.error || 'Failed to unlink'}`);
            }
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return <div className="p-8">Please login.</div>;
    }

    return (
        <div className="p-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Settings</h1>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6">
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="Profile" className="w-16 h-16 rounded-full" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
                            {session?.user?.name?.[0]}
                        </div>
                    )}
                    <div>
                        <p className="text-lg font-medium text-gray-900">{session?.user?.name}</p>
                        <p className="text-gray-500">{session?.user?.email}</p>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Account Actions</h3>

                    <button
                        onClick={handleUnlink}
                        disabled={loading}
                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Unlink Google Account'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                        This will remove your Google ID and Avatar from your profile. You can re-link by logging in again.
                    </p>

                    {message && (
                        <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
