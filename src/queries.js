// Data layer for DekSites CRM.
// Every call goes straight to Postgres through PostgREST. Row Level
// Security (supabase/schema.sql) decides what each signed-in user can
// see or change. There is deliberately no authorization logic here:
// never trust the client. Names are resolved from the profiles list,
// so we keep selects embed-free to avoid FK-alias surprises.

import { supabase } from './supabase'

// ---------------- auth ----------------
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data
}

// ---------------- profiles ----------------
export async function listEmployees() {
  const { data, error } = await supabase
    .from('profiles').select('id, full_name, username, role, active').order('full_name')
  if (error) throw error
  return data ?? []
}

// Creating an auth user needs the service role, so it runs in the
// create-employee Edge Function (supabase/functions). This invokes it.
export async function createEmployee({ email, password, full_name, username }) {
  const { data, error } = await supabase.functions.invoke('create-employee', {
    body: { email, password, full_name, username },
  })
  if (error) throw error
  return data
}

// ---------------- leads ----------------
export async function listLeads() {
  const { data, error } = await supabase
    .from('leads').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Empty strings break Postgres date columns. Sanitize to null.
function clean(obj) {
  const out = { ...obj }
  for (const k in out) { if (out[k] === '') out[k] = null }
  return out
}

export async function createLead(lead) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('leads').insert({ ...clean(lead), created_by: user?.id }).select().single()
  if (error) throw error
  return data
}

// Owner bulk import: created_by and assigned_to set to the chosen employee.
export async function bulkCreateLeads(leads) {
  const { data, error } = await supabase
    .from('leads').insert(leads.map(l => clean(l))).select()
  if (error) throw error
  return data ?? []
}

// Setting status to 'closed_won' auto-creates a client via DB trigger.
export async function updateLead(id, patch) {
  const { data, error } = await supabase
    .from('leads').update(clean(patch)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error // employees hit a policy error here, by design
}

export async function leadHistory(leadId) {
  const { data, error } = await supabase
    .from('lead_history').select('*').eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ---------------- clients ----------------
export async function listClients() {
  const { data, error } = await supabase
    .from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateClient(id, patch) {
  const { data, error } = await supabase
    .from('clients').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error // employees hit a policy error here, by design
}

// ---------------- activity ----------------
export async function recentActivity(limit = 100) {
  const { data, error } = await supabase
    .from('activity_log').select('*')
    .order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}
