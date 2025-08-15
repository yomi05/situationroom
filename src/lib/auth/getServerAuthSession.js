//situationroom\src\lib\auth\getServerAuthSession.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export const getServerAuthSession = () => getServerSession(authOptions);
