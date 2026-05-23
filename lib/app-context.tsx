import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppRole = "player" | "coach" | "head_coach" | "admin";

interface AppState {
  role: AppRole;
  profileId: number | null; // playerId or coachId
  userName: string;
  isSetup: boolean;
  accountId: number | null; // user_accounts.id for login system
  username: string; // login username
}

interface AppContextType extends AppState {
  setRole: (role: AppRole) => void;
  setProfileId: (id: number | null) => void;
  setUserName: (name: string) => void;
  completeSetup: (role: AppRole, name: string, profileId?: number) => Promise<void>;
  loginWithAccount: (account: { id: number; username: string; role: string; displayName: string | null; playerId: number | null; coachId: number | null }) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "hanuman_app_state";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    role: "player",
    profileId: null,
    userName: "",
    isSetup: false,
    accountId: null,
    username: "",
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setState({ ...state, ...parsed });
        } catch {}
      }
    });
  }, []);

  const saveState = useCallback(async (newState: AppState) => {
    setState(newState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const setRole = useCallback((role: AppRole) => {
    setState((prev) => {
      const next = { ...prev, role };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setProfileId = useCallback((id: number | null) => {
    setState((prev) => {
      const next = { ...prev, profileId: id };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    setState((prev) => {
      const next = { ...prev, userName: name };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeSetup = useCallback(async (role: AppRole, name: string, profileId?: number) => {
    const newState: AppState = {
      role,
      profileId: profileId ?? null,
      userName: name,
      isSetup: true,
      accountId: state.accountId,
      username: state.username,
    };
    await saveState(newState);
  }, [saveState, state.accountId, state.username]);

  const loginWithAccount = useCallback(async (account: { id: number; username: string; role: string; displayName: string | null; playerId: number | null; coachId: number | null }) => {
    const role = account.role as AppRole;
    const profileId = role === "player" ? account.playerId : account.coachId;
    const newState: AppState = {
      role,
      profileId: profileId ?? null,
      userName: account.displayName || account.username,
      isSetup: true,
      accountId: account.id,
      username: account.username,
    };
    await saveState(newState);
  }, [saveState]);

  const logout = useCallback(async () => {
    const newState: AppState = {
      role: "player",
      profileId: null,
      userName: "",
      isSetup: false,
      accountId: null,
      username: "",
    };
    await saveState(newState);
  }, [saveState]);

  return (
    <AppContext.Provider value={{ ...state, setRole, setProfileId, setUserName, completeSetup, loginWithAccount, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
