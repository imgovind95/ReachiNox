'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Clock,
  Send,
  ChevronDown,
  Plus,
  Settings,
  Inbox
} from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState({ scheduled: 0, sent: 0, inbox: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const { data: session } = useSession(); // Access session here

  useEffect(() => {
    async function fetchCounts() {
      if (!session?.user) return;

      // 1. Fetch Sent/Scheduled
      if ((session.user as any).id) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/${(session.user as any).id}`);
          if (res.ok) {
            const data = await res.json();
            const now = new Date();

            const scheduled = data.filter((job: any) => {
              if (job.status === 'PENDING' || job.status === 'DELAYED') {
                return new Date(job.scheduledAt) > now;
              }
              return false;
            }).length;

            const sent = data.filter((job: any) => {
              if (job.status === 'COMPLETED' || job.status === 'FAILED') return true;
              if (job.status === 'PENDING' || job.status === 'DELAYED') {
                return new Date(job.scheduledAt) <= now;
              }
              return false;
            }).length;

            // Update only scheduled and sent, keep inbox as is
            setCounts(prev => ({ ...prev, scheduled, sent }));
          }
        } catch (err) {
          console.error("Failed to fetch schedule counts", err);
          // Do not reset counts on error
        }
      }

      // 2. Fetch Inbox Count
      if (session.user.email) {
        try {
          const resInbox = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/inbox/${session.user.email}`);
          if (resInbox.ok) {
            const dataInbox = await resInbox.json();
            // Update only inbox, keep others as is
            setCounts(prev => ({ ...prev, inbox: dataInbox.length }));
          }
        } catch (err) {
          console.error("Failed to fetch inbox count", err);
          // Do not reset counts on error
        }
      }
    }

    if (session) fetchCounts();

    // Listen for global refresh event (from ComposePage etc)
    const handleRefresh = () => {
      if (session) fetchCounts();
    };
    window.addEventListener('refresh-sidebar', handleRefresh);

    // Poll every 8s (User requested)
    const interval = setInterval(() => {
      if (session && !document.hidden) fetchCounts();
    }, 8000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-sidebar', handleRefresh);
    };
  }, [session]);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userImage, setUserImage] = useState('');

  useEffect(() => {
    if (session?.user) {
      // Initialize with session data
      setUserName(session.user.name || '');
      setUserEmail(session.user.email || '');
      setUserImage(session.user.image || '');

      // If name is missing or "undefined", fetch it
      if ((session.user as any).id) {
        const shouldFetch = !session.user.name || session.user.name === 'undefined';
        if (shouldFetch) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user/${(session.user as any).id}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.name) {
                setUserName(data.name);
                if (data.avatar) setUserImage(data.avatar);
              }
            })
            .catch(err => console.error("Failed to fetch user details", err));
        }
      }
    }
  }, [session]);

  const navItems = [
    { name: 'Scheduled', icon: Clock, path: '/dashboard/scheduled', count: counts.scheduled },
    { name: 'Sent', icon: Send, path: '/dashboard/sent', count: counts.sent },
    { name: 'Inbox', icon: Inbox, path: '/dashboard/inbox', count: counts.inbox },
  ];

  return (
    <div className="w-64 bg-gray-50 h-screen border-r border-gray-200 flex flex-col p-4 flex-shrink-0">


      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tighter text-gray-900">ReachInbox</h1>
      </div>

      {/* Connection Warning */}
      {session && !session.user.id && (
        <div className="mb-4 bg-red-50 border border-red-200 p-2 rounded text-xs text-red-600">
          ⚠️ <strong>Connection Error</strong><br />
          Backend sync failed. Please <strong>Logout</strong> and Login again.
        </div>
      )}





      {/* Compose Button */}
      <Link
        href="/dashboard/compose"
        className="w-full bg-white border-2 border-green-500 text-green-600 font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 mb-8 hover:bg-green-50 transition-colors shadow-sm"
      >
        <span className="text-lg">+</span> Compose
      </Link>

      {/* Navigation */}
      <div className="flex-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Core</h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.path}
                prefetch={true}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-green-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-500'} />
                  {item.name}
                </div>
                <span className={clsx("text-xs", isActive ? "text-gray-900" : "text-gray-400")}>
                  {item.count}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Dropdown */}
      <div className="relative mt-4">
        <div
          onClick={() => setShowMenu(!showMenu)}
          className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {userImage ? (
              <img
                src={userImage}
                alt="User"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold uppercase">
                {(userName?.[0] || userEmail?.[0] || 'U')}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">{userName || 'User'}</span>
              <span className="text-xs text-gray-500 truncate">{userEmail || 'user@example.com'}</span>
            </div>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>

        {/* Dropdown Menu (Opens Upwards) */}
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden py-1">

            <Link
              href="/dashboard/settings"
              onClick={() => setShowMenu(false)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <div className="w-8 flex justify-center"><Settings size={16} /></div>
              Settings
            </Link>
            <div className="h-px bg-gray-100 my-1"></div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <div className="w-8 flex justify-center">→</div>
              Logout
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
