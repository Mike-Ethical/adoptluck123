import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseConfigured = Boolean(url && serviceRoleKey);
export const supabaseAdmin = supabaseConfigured
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export type PersistedState = {
  users: any[];
  pets: any[];
  inventory: any[];
  matches: any[];
  featuredMatches: any[];
  chatMessages: any[];
  giveaways: any[];
  auditLogs: any[];
  deliveryOrders: any[];
  settings?: { discordLink?: string };
};

const TABLES: Array<[keyof PersistedState, string]> = [
  ['users', 'amp_users'],
  ['pets', 'amp_pets'],
  ['inventory', 'amp_inventory'],
  ['matches', 'amp_matches'],
  ['featuredMatches', 'amp_featured_matches'],
  ['chatMessages', 'amp_chat_messages'],
  ['giveaways', 'amp_giveaways'],
  ['auditLogs', 'amp_audit_logs'],
  ['deliveryOrders', 'amp_delivery_orders'],
];

export async function loadPersistedState(): Promise<PersistedState | null> {
  if (!supabaseAdmin) return null;

  const result: PersistedState = {
    users: [], pets: [], inventory: [], matches: [], featuredMatches: [],
    chatMessages: [], giveaways: [], auditLogs: [], deliveryOrders: [], settings: {}
  };

  try {
    for (const [key, table] of TABLES) {
      const { data, error } = await supabaseAdmin.from(table).select('id,data');
      if (error) throw new Error(`${table}: ${error.message}`);
      (result[key] as any[]) = (data || []).map((row: any) => row.data).filter(Boolean);
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('amp_settings').select('key,value');
    if (settingsError) throw new Error(`amp_settings: ${settingsError.message}`);
    result.settings = Object.fromEntries((settings || []).map((row: any) => [row.key, row.value]));

    return result;
  } catch (error) {
    console.error('[Supabase] Failed to load state:', error);
    return null;
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistRunning = false;
let persistQueued = false;

export function schedulePersist(getState: () => PersistedState) {
  if (!supabaseAdmin) return;
  persistQueued = true;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow(getState);
  }, 350);
}

export async function persistNow(getState: () => PersistedState) {
  if (!supabaseAdmin) return;
  if (persistRunning) {
    persistQueued = true;
    return;
  }
  persistRunning = true;
  persistQueued = false;
  try {
    const state = getState();

    for (const [key, table] of TABLES) {
      const rows = ((state[key] as any[]) || []).map((item: any) => ({
        id: String(item.id),
        data: item,
        updated_at: new Date().toISOString(),
      }));
      const { error: deleteError } = await supabaseAdmin.from(table).delete().neq('id', '__never__');
      if (deleteError) throw new Error(`${table} delete: ${deleteError.message}`);
      if (rows.length) {
        const { error } = await supabaseAdmin.from(table).insert(rows);
        if (error) throw new Error(`${table} insert: ${error.message}`);
      }
    }

    const settings = state.settings || {};
    const settingRows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value ?? ''),
      updated_at: new Date().toISOString(),
    }));
    const { error: settingDeleteError } = await supabaseAdmin.from('amp_settings').delete().neq('key', '__never__');
    if (settingDeleteError) throw new Error(`amp_settings delete: ${settingDeleteError.message}`);
    if (settingRows.length) {
      const { error } = await supabaseAdmin.from('amp_settings').insert(settingRows);
      if (error) throw new Error(`amp_settings insert: ${error.message}`);
    }

    console.log('[Supabase] State persisted.');
  } catch (error) {
    console.error('[Supabase] Failed to persist state:', error);
  } finally {
    persistRunning = false;
    if (persistQueued) {
      persistQueued = false;
      schedulePersist(getState);
    }
  }
}
