import { requireApiUser } from '@/lib/apiAuth';
import { hasPerm } from '@/lib/rbac';
import { getServerAuthSession } from '@/lib/auth/getServerAuthSession';

/**
 * Gate a single permission for API routes (App Router).
 * Returns a uniform object so route handlers can early-return cleanly.
 *
 * Usage in a route:
 *   const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
 *   if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });
 */
export async function requirePerm(perm) {
  try {
    // Ensures the user is authenticated and loads DB user with role
    const user = await requireApiUser();
    const role = user.role || 'Guest';

    if (!hasPerm(role, perm)) {
      return { ok: false, status: 403, json: { message: 'Forbidden' }, role, user };
    }

    // Optional: session, if the route needs more profile fields
    const session = await getServerAuthSession();
    return { ok: true, role, user, session };
  } catch (err) {
    const status = err.statusCode || 401;
    return { ok: false, status, json: { message: err.message || 'Unauthorized' } };
  }
}

/**
 * Gate ANY of the given permissions.
 * Example:
 *   const gate = await requireAnyPerm([PERMS.UPDATE_PARTIES, PERMS.UPDATE_VOTERS_REGISTRATION]);
 */
export async function requireAnyPerm(perms = []) {
  try {
    const user = await requireApiUser();
    const role = user.role || 'Guest';

    const allowed = perms.some((p) => hasPerm(role, p));
    if (!allowed) {
      return { ok: false, status: 403, json: { message: 'Forbidden' }, role, user };
    }

    const session = await getServerAuthSession();
    return { ok: true, role, user, session };
  } catch (err) {
    const status = err.statusCode || 401;
    return { ok: false, status, json: { message: err.message || 'Unauthorized' } };
  }
}

/**
 * Optional: server-component guard (use inside server components/actions).
 * Returns { ok, role, user } or throws if not allowed.
 */
export async function ensurePerm(perm) {
  const gate = await requirePerm(perm);
  if (!gate.ok) {
    const e = new Error(gate.json.message);
    e.statusCode = gate.status;
    throw e;
  }
  return gate;
}
