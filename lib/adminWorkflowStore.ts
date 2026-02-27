import { prisma } from "@/lib/prisma";

export type AdminUserPayload = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export async function ensureAdminWorkflowTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS role_definitions (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS org_units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      level INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS policy_user_access (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_type TEXT NOT NULL DEFAULT 'VIEW',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(policy_id, user_id)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS workflow_definitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flow_type TEXT NOT NULL,
      org_unit_id TEXT,
      sla_hours INTEGER DEFAULT 24,
      is_active BOOLEAN DEFAULT TRUE,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      approval_mode TEXT NOT NULL,
      required_approvals INTEGER DEFAULT 1,
      role_name TEXT,
      user_ids TEXT,
      condition_json TEXT,
      sla_hours INTEGER DEFAULT 24,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS policy_workflow_map (
      policy_id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      mapped_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS approval_instances (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      step_id TEXT NOT NULL,
      assigned_user_id TEXT,
      committee_group TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      due_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS policy_comments (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      commenter_id TEXT NOT NULL,
      commenter_name TEXT,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function getAccessiblePolicyIds(userId: string): Promise<string[]> {
  await ensureAdminWorkflowTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ policy_id: string }>>(
    `SELECT policy_id FROM policy_user_access WHERE user_id = $1`,
    userId
  );
  return rows.map((r) => r.policy_id);
}
