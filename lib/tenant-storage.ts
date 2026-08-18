import AsyncStorage from "@react-native-async-storage/async-storage";

export const APP_STATE_STORAGE_KEY = "hanuman_app_state";
export const SESSION_TOKEN_STORAGE_KEY = "hanuman_saas_session_token";
export const ACTIVE_ACADEMY_STORAGE_KEY = "hanuman_active_academy_id";

export async function getSessionToken() {
  return AsyncStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
}

export async function setSessionToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
  } else {
    await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }
}

export async function getActiveAcademyId() {
  const value = await AsyncStorage.getItem(ACTIVE_ACADEMY_STORAGE_KEY);
  const academyId = Number(value);
  return Number.isInteger(academyId) && academyId > 0 ? academyId : null;
}

export async function setActiveAcademyId(academyId: number | null) {
  if (academyId) {
    await AsyncStorage.setItem(ACTIVE_ACADEMY_STORAGE_KEY, String(academyId));
  } else {
    await AsyncStorage.removeItem(ACTIVE_ACADEMY_STORAGE_KEY);
  }
}
