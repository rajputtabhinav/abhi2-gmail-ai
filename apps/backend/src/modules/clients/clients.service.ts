import type { CreateClientInput, LeadStatus, UpdateClientInput } from "@abhi2/shared";
import { query } from "../../config/db";

export async function listClients(userId: string, filters: { status?: string; q?: string }) {
  const params: unknown[] = [userId];
  const clauses = ["user_id = $1", "is_deleted = false"];

  if (filters.status) {
    params.push(filters.status);
    clauses.push(`lead_status = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q.toLowerCase()}%`);
    clauses.push(`(lower(name) LIKE $${params.length} OR lower(email) LIKE $${params.length} OR lower(COALESCE(company, '')) LIKE $${params.length})`);
  }

  const result = await query(
    `
      SELECT id, user_id AS "userId", name, company, email, phone, notes,
             lead_status AS "leadStatus", is_deleted AS "isDeleted",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM clients
      WHERE ${clauses.join(" AND ")}
      ORDER BY updated_at DESC
      LIMIT 200
    `,
    params,
  );
  return result.rows;
}

export async function createClient(userId: string, input: CreateClientInput) {
  const result = await query(
    `
      INSERT INTO clients (user_id, name, company, email, phone, notes, lead_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, email) DO UPDATE
      SET name = EXCLUDED.name,
          company = EXCLUDED.company,
          phone = EXCLUDED.phone,
          notes = EXCLUDED.notes,
          lead_status = EXCLUDED.lead_status,
          is_deleted = false,
          updated_at = now()
      RETURNING id, user_id AS "userId", name, company, email, phone, notes,
                lead_status AS "leadStatus", is_deleted AS "isDeleted",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [userId, input.name, input.company ?? null, input.email, input.phone ?? null, input.notes ?? null, input.leadStatus],
  );
  return result.rows[0];
}

export async function getClient(userId: string, id: string) {
  const result = await query(
    `
      SELECT id, user_id AS "userId", name, company, email, phone, notes,
             lead_status AS "leadStatus", is_deleted AS "isDeleted",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM clients
      WHERE user_id = $1 AND id = $2 AND is_deleted = false
    `,
    [userId, id],
  );
  return result.rows[0] ?? null;
}

export async function updateClient(userId: string, id: string, input: UpdateClientInput) {
  const current = await getClient(userId, id);
  if (!current) return null;
  const merged = { ...current, ...input };
  const result = await query(
    `
      UPDATE clients
      SET name = $3, company = $4, email = $5, phone = $6, notes = $7, lead_status = $8, updated_at = now()
      WHERE user_id = $1 AND id = $2 AND is_deleted = false
      RETURNING id, user_id AS "userId", name, company, email, phone, notes,
                lead_status AS "leadStatus", is_deleted AS "isDeleted",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [userId, id, merged.name, merged.company, merged.email, merged.phone, merged.notes, merged.leadStatus],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteClient(userId: string, id: string) {
  await query("UPDATE clients SET is_deleted = true, updated_at = now() WHERE user_id = $1 AND id = $2", [userId, id]);
}

export async function clientCountsByStatus(userId: string) {
  const result = await query<{ lead_status: LeadStatus; count: string }>(
    "SELECT lead_status, COUNT(*) FROM clients WHERE user_id = $1 AND is_deleted = false GROUP BY lead_status",
    [userId],
  );
  return result.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.lead_status] = Number(row.count);
    return acc;
  }, {});
}
