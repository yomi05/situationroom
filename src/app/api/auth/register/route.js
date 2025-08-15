import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NIGERIA_STATES } from '@/lib/constants/nigeriaStates';

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
const phoneOk = (v) => /^\+?[0-9]{7,15}$/.test(v || '');
const genders = ['Male','Female','Other'];

function validate(body) {
  const errors = {};
  const firstName = body.firstName?.trim();
  const lastName  = body.lastName?.trim();
  const email     = body.email?.toLowerCase().trim();
  const phone     = body.phone?.trim();
  const password  = body.password;
  const gender    = body.gender;
  const state     = body.state;

  if (!firstName) errors.firstName = 'First name is required';
  if (!lastName)  errors.lastName  = 'Last name is required';

  if (!email) errors.email = 'Email is required';
  else if (!emailOk(email)) errors.email = 'Enter a valid email';

  if (!phone) errors.phone = 'Phone is required';
  else if (!phoneOk(phone)) errors.phone = 'Enter a valid phone number';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';

  if (!state) errors.state = 'Select a state';
  else if (!NIGERIA_STATES.includes(state)) errors.state = 'Invalid state';

  if (gender && !genders.includes(gender)) errors.gender = 'Invalid gender';

  return errors;
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    // Validate payload (422)
    const errors = validate(body);
    if (Object.keys(errors).length) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 422 });
    }

    // Check existing (409)
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { message: 'Email already registered', errors: { email: 'Email already registered' } },
        { status: 409 }
      );
    }

    // Create (201)
    const user = await User.create({
      firstName: body.firstName.trim(),
      lastName:  body.lastName.trim(),
      email,
      phone:     body.phone.trim(),
      password:  body.password,          // hashed by model pre-save
      gender:    body.gender || 'Other',
      disability: !!body.disability,
      state:     body.state
    });

    return NextResponse.json({
      message: 'Registration successful',
      data: { id: user._id.toString(), email: user.email }
    }, { status: 201 });

  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
