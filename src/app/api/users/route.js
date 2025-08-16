import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requirePerm } from '@/lib/auth/requirePerm';
import { requireApiUser } from '@/lib/apiAuth';
import { PERMS, ROLE_PERMISSIONS } from '@/lib/rbac';

const SAFE_FIELDS =
  '_id firstName lastName email phone role gender disability state emailVerified createdAt updatedAt';

export async function GET() {
  const gate = await requirePerm(PERMS.VIEW_USERS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  await dbConnect();
  const users = await User.find().select(SAFE_FIELDS).lean();
  return NextResponse.json({ data: users });
}

export async function POST(req) {
  // Only Admin can create users
  const me = await requireApiUser().catch(() => null);
  if (!me || me.role !== 'Admin') {
    return NextResponse.json({ message: 'Admin only' }, { status: 403 });
  }

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
    password,
    role = 'Guest',
    gender = 'Other',
    disability = false,
    state = ''
  } = body || {};

  if (!firstName || !lastName || !email || !phone || !password) {
    return NextResponse.json(
      { message: 'firstName, lastName, email, phone, password are required' },
      { status: 400 }
    );
  }

  // Validate target role against your RBAC map
  const allowedRoles = Object.keys(ROLE_PERMISSIONS);
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  }

  // Unique email check
  const exists = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (exists) {
    return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
  }

  const created = await User.create({
    firstName,
    lastName,
    email: String(email).toLowerCase(),
    phone,
    role,
    gender,
    disability: Boolean(disability),
    state,
    password // hashed by pre('save')
  });

  const safe = await User.findById(created._id).select(SAFE_FIELDS).lean();
  return NextResponse.json(safe, { status: 201 });
}
