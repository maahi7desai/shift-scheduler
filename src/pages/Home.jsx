import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'admin' ? '/schedule' : '/my-schedule', { replace: true });
  }, [user]);

  return null;
}