import { STORAGE_KEYS } from '../config/constants';
import storageService from './storage.service';

export const tokenService = {
  getAccessToken: () => storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (token: string) => storageService.set(STORAGE_KEYS.ACCESS_TOKEN, token),
  removeAccessToken: () => storageService.remove(STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: () => storageService.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string) => storageService.set(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeRefreshToken: () => storageService.remove(STORAGE_KEYS.REFRESH_TOKEN),

  getUser: <T>() => storageService.get<T>(STORAGE_KEYS.USER),
  setUser: <T>(user: T) => storageService.set(STORAGE_KEYS.USER, user),
  removeUser: () => storageService.remove(STORAGE_KEYS.USER),

  clear: () => {
    storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storageService.remove(STORAGE_KEYS.USER);
  },
};
export default tokenService;
