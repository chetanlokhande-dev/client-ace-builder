/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Generic, typed CRUD helpers over Supabase.
 * RLS in the database is the source of truth for access control —
 * these helpers just provide a consistent API + logging.
 */

type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;

type Row<T extends TableName> = Tables[T]["Row"];
type Insert<T extends TableName> = Tables[T]["Insert"];
type Update<T extends TableName> = Tables[T]["Update"];

export interface ListOptions<T extends TableName> {
  filters?: Partial<Record<keyof Row<T>, unknown>>;
  search?: { column: keyof Row<T>; value: string };
  orderBy?: { column: keyof Row<T>; ascending?: boolean };
  page?: number;
  pageSize?: number;
}

const log = (op: string, table: string, extra?: unknown) => {
  if (import.meta.env.DEV) console.debug(`[db] ${op} ${table}`, extra ?? "");
};

export async function getAll<T extends TableName>(
  table: T,
  opts: ListOptions<T> = {},
): Promise<{ data: Row<T>[]; count: number | null }> {
  log("getAll", table, opts);
  let query: any = (supabase.from(table as any) as any).select("*", { count: "exact" });

  if (opts.filters) {
    for (const [k, v] of Object.entries(opts.filters)) {
      if (v !== undefined && v !== null) query = query.eq(k, v as never);
    }
  }
  if (opts.search?.value) {
    query = query.ilike(opts.search.column as string, `%${opts.search.value}%`);
  }
  if (opts.orderBy) {
    query = query.order(opts.orderBy.column as string, {
      ascending: opts.orderBy.ascending ?? true,
    });
  }
  if (opts.page !== undefined && opts.pageSize !== undefined) {
    const from = opts.page * opts.pageSize;
    query = query.range(from, from + opts.pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as Row<T>[], count };
}

export async function getById<T extends TableName>(table: T, id: string): Promise<Row<T> | null> {
  log("getById", table, id);
  const { data, error } = await (supabase.from(table as any) as any).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Row<T> | null;
}

export async function createRecord<T extends TableName>(table: T, values: Insert<T>): Promise<Row<T>> {
  log("create", table, values);
  const { data, error } = await (supabase.from(table as any) as any).insert(values).select().single();
  if (error) throw error;
  return data as unknown as Row<T>;
}

export async function updateRecord<T extends TableName>(
  table: T,
  id: string,
  values: Update<T>,
): Promise<Row<T>> {
  log("update", table, { id, values });
  const { data, error } = await (supabase.from(table as any) as any)
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Row<T>;
}

export async function deleteRecord<T extends TableName>(table: T, id: string): Promise<void> {
  log("delete", table, id);
  const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
  if (error) throw error;
}