import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY  = 'immocam_access_token';
const REFRESH_TOKEN_KEY = 'immocam_refresh_token';
const USER_KEY          = 'immocam_user';
const DRAFT_KEY         = 'immocam_annonce_draft';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private get storage(): Storage | null {
    return typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;
  }

  getAccessToken(): string | null  { return this.storage?.getItem(ACCESS_TOKEN_KEY) ?? null; }
  getRefreshToken(): string | null { return this.storage?.getItem(REFRESH_TOKEN_KEY) ?? null; }
  setTokens(access: string, refresh: string): void {
    this.storage?.setItem(ACCESS_TOKEN_KEY, access);
    this.storage?.setItem(REFRESH_TOKEN_KEY, refresh);
  }
  clearTokens(): void {
    this.storage?.removeItem(ACCESS_TOKEN_KEY);
    this.storage?.removeItem(REFRESH_TOKEN_KEY);
    this.storage?.removeItem(USER_KEY);
  }
  setUser(user: any): void { this.storage?.setItem(USER_KEY, JSON.stringify(user)); }
  getUser<T>(): T | null {
    const raw = this.storage?.getItem(USER_KEY) ?? null;
    return raw ? JSON.parse(raw) as T : null;
  }
  saveDraft(data: any): void { this.storage?.setItem(DRAFT_KEY, JSON.stringify(data)); }
  getDraft<T>(): T | null {
    const raw = this.storage?.getItem(DRAFT_KEY) ?? null;
    return raw ? JSON.parse(raw) as T : null;
  }
  clearDraft(): void { this.storage?.removeItem(DRAFT_KEY); }
  hasDraft(): boolean { return !!this.storage?.getItem(DRAFT_KEY); }
  isLoggedIn(): boolean { return !!this.getAccessToken() && !!this.getUser(); }
  clear(): void { this.clearTokens(); }
}
