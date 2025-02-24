import { NextResponse } from 'next/server';
import { createContractor } from '@/lib/auth';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  companyName: z.string().min(2),
  phoneNumber: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = RegisterSchema.parse(body);

    const contractor = await createContractor(validatedData);

    return NextResponse.json({
      message: 'Contractor registered successfully',
      contractor: {
        id: contractor.id,
        email: contractor.email,
        name: contractor.name,
        companyName: contractor.companyName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
