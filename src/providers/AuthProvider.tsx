"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Farm, BuyerProfile } from "@/types/database";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  farm: Farm | null;
  buyerProfile: BuyerProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  farm: null,
  buyerProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadProfile = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const profile = profileData as Profile | null;
    setProfile(profile);

    if (profile?.role === "farmer") {
      const { data: farmData } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", userId)
        .single();
      setFarm(farmData as Farm | null);
    } else if (profile?.role === "buyer") {
      const { data: buyerData } = await supabase
        .from("buyer_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setBuyerProfile(buyerData as BuyerProfile | null);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadProfile(user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        loadProfile(newUser.id);
      } else {
        setProfile(null);
        setFarm(null);
        setBuyerProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFarm(null);
    setBuyerProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, farm, buyerProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
