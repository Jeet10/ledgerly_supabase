import { supabase } from '../../../lib/supabaseClient'

export const fetchTransactions = async userId =>
  supabase
    .from('transactions')
    .select('id,amount,type,note,transaction_date,created_at,member_name,deleted_at,delete_scheduled_for,last_restored_at,last_restored_by_email')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })

export const fetchDeletedTransactions = async userId =>
  supabase
    .from('transactions')
    .select('id,amount,type,note,transaction_date,created_at,member_name,deleted_at,delete_scheduled_for,last_restored_at,last_restored_by_email')
    .eq('owner_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

export const fetchRestoreEvents = async userId =>
  supabase
    .from('transaction_restore_events')
    .select('id,transaction_id,restored_at,restored_by_email,deleted_at,original_transaction_date,note,member_name,amount,type')
    .eq('owner_id', userId)
    .order('restored_at', { ascending: false })
    .limit(12)

export const fetchMembers = async userId => supabase.from('members').select('name').eq('owner_id', userId).order('name')
