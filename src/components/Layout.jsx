import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, Store, Users, Repeat2, Clock, Calendar } from 'lucide-react';

const ownerTabs = [
  { to: '/stores', label: 'Stores', icon: Store },
  { to: '/employees', label: 'Team', icon: Users },
  { to: '/schedule', label: 'Shifts', icon: CalendarDays },
  { to: '/calendar', label: 'Schedule', icon: Calendar },
];

const employeeTabs = [
  { to: '/stores', label: 'Stores', icon: Store },
  { to: '/profile', label: 'Profile', icon: Users },
  { to: '/my-schedule', label: 'Shifts', icon: Clock },
  { to: '/calendar', label: 'Schedule', icon: Calendar },
];

export default function Layout() {
  const { user } = useAuth();
  const tabs = user?.role === 'admin' ? ownerTabs : employeeTabs;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-accent/40 backdrop-blur supports-[backdrop-filter]:bg-accent/30">
        <div className="mx-auto max-w-md flex">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`
              }
            >
              <t.icon className="w-5 h-5" />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}