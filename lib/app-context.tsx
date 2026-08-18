import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_STATE_STORAGE_KEY, setActiveAcademyId, setSessionToken } from "@/lib/tenant-storage";

export type AppRole = "player" | "coach" | "head_coach" | "admin";

interface AppState {
  role: AppRole;
  profileId: number | null;
  userName: string;
  isSetup: boolean;
  accountId: number | null;
  username: string;
  academyId: number | null;
  academyName: string;
  academySlug: string;
}

interface AccountLoginPayload {
  id: number;
  username: string;
  role: string;
  displayName: string | null;
  playerId: number | null;
  coachId: number | null;
  sessionToken?: string;
}

interface AppContextType extends AppState {
  setRole: (role: AppRole) => void;
  setProfileId: (id: number | null) => void;
  setUserName: (name: string) => void;
  setAcademy: (academy: { id: number; name: string; slug: string } | null) => Promise<void>;
  completeSetup: (role: AppRole, name: string, profileId?: number) => Promise<void>;
  loginWithAccount: (account: AccountLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_STATE: AppState = {
  role: "player",
  profileId: null,
  userName: "",
  isSetup: false,
  accountId: null,
  username: "",
  academyId: null,
  academyName: "",
  academySlug: "",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  useEffect(() => {
    AsyncStorage.getItem(APP_STATE_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setState({ ...DEFAULT_STATE, ...parsed });
        } catch {
          setState(DEFAULT_STATE);
        }
      }
    });
  }, []);

  const saveState = useCallback(async (newState: AppState) => {
    setState(newState);
    await AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const setRole = useCallback((role: AppRole) => {
    setState((prev) => {
      const next = { ...prev, role };
      AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setProfileId = useCallback((id: number | null) => {
    setState((prev) => {
      const next = { ...prev, profileId: id };
      AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    setState((prev) => {
      const next = { ...prev, userName: name };
      AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAcademy = useCallback(async (academy: { id: number; name: string; slug: string } | null) => {
    await setActiveAcademyId(academy?.id ?? null);
    setState((prev) => {
      const next = {
        ...prev,
        academyId: academy?.id ?? null,
        academyName: academy?.name ?? "",
        academySlug: academy?.slug ?? "",
      };
      AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeSetup = useCallback(async (role: AppRole, name: string, profileId?: number) => {
    await saveState({
      ...state,
      role,
      profileId: profileId ?? null,
      userName: name,
      isSetup: true,
    });
  }, [saveState, state]);

  const loginWithAccount = useCallback(async (account: AccountLoginPayload) => {
    if (account.sessionToken) await setSessionToken(account.sessionToken);
    await setActiveAcademyId(null);
    const role = account.role as AppRole;
    const profileId = role === "player" ? account.playerId : account.coachId;
    await saveState({
      ...DEFAULT_STATE,
      role,
      profileId: profileId ?? null,
      userName: account.displayName || account.username,
      isSetup: true,
      accountId: account.id,
      username: account.username,
    });
  }, [saveState]);

  const logout = useCallback(async () => {
    await setSessionToken(null);
    await setActiveAcademyId(null);
    await saveState(DEFAULT_STATE);
  }, [saveState]);

  return (
    <AppContext.Provider value={{ ...state, setRole, setProfileId, setUserName, setAcademy, completeSetup, loginWithAccount, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
