import { NextResponse } from 'next/server';
import { validateContractor } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { email, password } = LoginSchema.parse(body);

    const contractor = await validateContractor(email, password);

    return NextResponse.json({
      message: 'Logged in successfully',
      contractor: {
        id: contractor.id,
        email: contractor.email,
        name: contractor.name,
        companyName: contractor.company_name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
