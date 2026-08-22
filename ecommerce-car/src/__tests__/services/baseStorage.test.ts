import { baseStorage, authStorageAdapter } from '../../services/storage/baseStorage';

describe('Base Storage & Auth Storage Adapter Suite', () => {
  beforeEach(() => {
    baseStorage.clear();
  });

  // HAPPY CASES
  it('sets and retrieves string items correctly', () => {
    baseStorage.setItem('test_key', 'hello_world');
    expect(baseStorage.getItem('test_key')).toBe('hello_world');
  });

  it('sets and retrieves complex JSON object strings', () => {
    const data = { userId: 'u123', name: 'John Doe', preferences: { theme: 'dark' } };
    baseStorage.setItem('user_pref', JSON.stringify(data));
    const retrieved = baseStorage.getItem('user_pref');
    expect(retrieved).not.toBeNull();
    expect(JSON.parse(retrieved!)).toEqual(data);
  });

  it('removes stored items correctly', () => {
    baseStorage.setItem('key_to_delete', 'val');
    expect(baseStorage.getItem('key_to_delete')).toBe('val');
    baseStorage.removeItem('key_to_delete');
    expect(baseStorage.getItem('key_to_delete')).toBeNull();
  });

  it('clears all items in storage', () => {
    baseStorage.setItem('k1', 'v1');
    baseStorage.setItem('k2', 'v2');
    baseStorage.clear();
    expect(baseStorage.getItem('k1')).toBeNull();
    expect(baseStorage.getItem('k2')).toBeNull();
  });

  // AUTH STORAGE ADAPTER TESTS
  it('authStorageAdapter proxies calls to baseStorage', () => {
    authStorageAdapter.setItem('supabase.auth.token', 'jwt-token-xyz');
    expect(authStorageAdapter.getItem('supabase.auth.token')).toBe('jwt-token-xyz');
    authStorageAdapter.removeItem('supabase.auth.token');
    expect(authStorageAdapter.getItem('supabase.auth.token')).toBeNull();
  });

  // EDGE & UNHAPPY CASES
  it('returns null for non-existing keys', () => {
    expect(baseStorage.getItem('non_existing_key_12345')).toBeNull();
  });

  it('handles empty string values without error', () => {
    baseStorage.setItem('empty_key', '');
    expect(baseStorage.getItem('empty_key')).toBe('');
  });

  it('handles repeated set and overwrite on same key', () => {
    baseStorage.setItem('repeated_key', 'initial');
    baseStorage.setItem('repeated_key', 'updated');
    expect(baseStorage.getItem('repeated_key')).toBe('updated');
  });

  it('handles removing non-existing key gracefully without throwing', () => {
    expect(() => baseStorage.removeItem('never_existed')).not.toThrow();
  });
});
