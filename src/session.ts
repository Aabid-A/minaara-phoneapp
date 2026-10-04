import { useEffect } from 'react';
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { queryClient } from './query-client';
export const useSession = create<{ ready: boolean; session: Session | null; error: string | null; authPending: boolean }>(() => ({ ready: false, session: null, error: null, authPending: false }));
export function useInitializeSession() {
  useEffect(() => {
    if (!supabase) { useSession.setState({ ready: true }); return; }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        const previous = useSession.getState().session?.user.id;
        if (previous !== session?.user.id) queryClient.clear();
        useSession.setState({ session, ready: true, error: null });
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) useSession.setState({ ready: true, session: data.session, error: error?.message ?? null });
    }).catch(() => { if (active) useSession.setState({ ready: true, error: 'Could not restore your session. Please sign in again.' }); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
}
