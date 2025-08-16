import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireApiUser } from '@/lib/apiAuth';
import { ROLE_PERMISSIONS } from '@/lib/rbac';

const SAFE_FIELDS =
  '_id firstName lastName email phone role gender disability state emailVerified createdAt updatedAt';

export async function PATCH(req, { params }) {
  const me = await requireApiUser().catch(() => null);
  if (!me) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  let body = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    // ignore parse errors -> body stays {}
  }

  const {
    firstName, lastName, email, phone,
    gender, disability, state,
    password, role
  } = body || {};

  const isAdmin = me.role === 'Admin';
  const isSelf = String(me._id) === String(params.id);

  // Only Admin can edit anyone; non-admin can edit only themselves (no role change)
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const update = {};
  if (firstName !== undefined) update.firstName = firstName;
  if (lastName  !== undefined) update.lastName  = lastName;
  if (email     !== undefined) update.email     = String(email).toLowerCase();
  if (phone     !== undefined) update.phone     = phone;
  if (gender    !== undefined) update.gender    = gender;
  if (disability!== undefined) update.disability= Boolean(disability);
  if (state     !== undefined) update.state     = state;
  if (password)                update.password  = password; // hashed by pre('findOneAndUpdate')

  if (role !== undefined) {
    if (!isAdmin) {
      return NextResponse.json({ message: 'Only Admin can change roles' }, { status: 403 });
    }
    const allowedRoles = Object.keys(ROLE_PERMISSIONS);
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }
    update.role = role;
  }

  // Ensure unique email if changing it
  if (update.email) {
    const exists = await User.findOne({ email: update.email, _id: { $ne: params.id } }).lean();
    if (exists) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }
  }

  // Use findByIdAndUpdate (triggers findOneAndUpdate hooks)
  const updated = await User.findByIdAndUpdate(params.id, update, {
    new: true,
    runValidators: true,
    context: 'query'
  })
    .select(SAFE_FIELDS)
    .lean();

  if (!updated) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  return NextResponse.json({ message: 'User updated', data: updated });
}

export async function DELETE(req, { params }) {
  const me = await requireApiUser().catch(() => null);
  if (!me) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (me.role !== 'Admin') {
    return NextResponse.json({ message: 'Admin only' }, { status: 403 });
  }

  if (String(me._id) === String(params.id)) {
    return NextResponse.json({ message: 'You cannot delete your own account' }, { status: 400 });
  }

  await dbConnect();
  const deleted = await User.findByIdAndDelete(params.id).lean();
  if (!deleted) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  return NextResponse.json({ message: 'User deleted' });
}
