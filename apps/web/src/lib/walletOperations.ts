import { createHash, randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/apiError';

export type WalletOperationType = 'deposit_forward' | 'withdraw' | 'buy' | 'sell';
export type WalletOperationStatus = 'pending' | 'submitted' | 'confirmed' | 'failed' | 'reconciliation_required';

export interface WalletOperation {
  id: string;
  user_id: string;
  operation_type: WalletOperationType;
  idempotency_key: string;
  request_hash: string;
  status: WalletOperationStatus;
  provider_order_id: string | null;
  transaction_id: string | null;
  transaction_hash: string | null;
  request: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_code: string | null;
  attempts: number;
  reconciled_at: string | null;
  created_at: string;
  updated_at: string;
}

function hashRequest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Persist an operation before any external side effect. A partial unique
 * index prevents two active money actions of the same type for one user,
 * including requests that race across serverless instances.
 */
export async function beginWalletOperation(
  supabase: SupabaseClient,
  input: {
    userId: string;
    type: WalletOperationType;
    request: Record<string, unknown>;
    idempotencyKey?: string | null;
  }
): Promise<{ operation: WalletOperation; started: boolean }> {
  const requestHash = hashRequest(input.request);
  const key = input.idempotencyKey?.trim() || randomUUID();

  const { data: prior, error: priorError } = await supabase
    .from('wallet_operations')
    .select('*')
    .eq('user_id', input.userId)
    .eq('operation_type', input.type)
    .eq('idempotency_key', key)
    .maybeSingle();
  if (priorError) throw priorError;
  if (prior) {
    if (prior.request_hash !== requestHash) {
      throw new ApiError(409, 'idempotency_key_reused', 'This request key was already used for a different wallet action.');
    }
    // A prior attempt under this exact key that already reached a terminal
    // failure is safe to retry — nothing is in flight for it. Reset the
    // same row (preserving the audit trail) instead of permanently
    // refusing every future retry that reuses this key.
    if (prior.status === 'failed') {
      const { data: reset, error: resetError } = await supabase
        .from('wallet_operations')
        .update({ status: 'pending', error_code: null, result: null, updated_at: new Date().toISOString() })
        .eq('id', prior.id)
        .select('*')
        .single();
      if (resetError) throw resetError;
      return { operation: reset as WalletOperation, started: true };
    }
    return { operation: prior as WalletOperation, started: false };
  }

  const { data: created, error: createError } = await supabase
    .from('wallet_operations')
    .insert({
      user_id: input.userId,
      operation_type: input.type,
      idempotency_key: key,
      request_hash: requestHash,
      request: input.request,
      status: 'pending',
    })
    .select('*')
    .single();

  if (!createError) return { operation: created as WalletOperation, started: true };

  // A concurrent request may have won either the same-input lookup or the
  // one-active-operation index. Return that durable row; never resubmit.
  if (createError.code === '23505') {
    const { data: active, error: activeError } = await supabase
      .from('wallet_operations')
      .select('*')
      .eq('user_id', input.userId)
      .eq('operation_type', input.type)
      .in('status', ['pending', 'submitted', 'reconciliation_required'])
      .limit(1)
      .maybeSingle();
    if (activeError) throw activeError;
    if (active) {
      if (active.request_hash !== requestHash) {
        throw new ApiError(409, 'wallet_action_in_progress', 'Another wallet action is still processing. Wait before starting a different one.');
      }
      return { operation: active as WalletOperation, started: false };
    }
  }
  throw createError;
}

export async function updateWalletOperation(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Omit<WalletOperation, 'id' | 'user_id' | 'operation_type' | 'request_hash'>>
): Promise<void> {
  const { error } = await supabase
    .from('wallet_operations')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function operationInProgress(): ApiError {
  return new ApiError(409, 'wallet_action_in_progress', 'This wallet action is already processing. Check your wallet balance before trying again.');
}

/**
 * Deletes an operation row that never had any on-chain footprint (no
 * transaction submitted, no provider action started) — e.g. a deposit-wrap
 * attempted before the funds had actually arrived. There's nothing to
 * reconcile and nothing to record as a real failure, so undo the
 * reservation entirely: this also frees the one-active-per-type slot
 * immediately, instead of leaving a row that would either misreport a
 * genuine no-op as 'failed' in the audit ledger, or — if left 'pending' —
 * block every future attempt of this type forever, since nothing ever
 * transitions a 'pending' row out of the active set on its own.
 */
export async function abandonWalletOperation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('wallet_operations').delete().eq('id', id);
  if (error) throw error;
}
