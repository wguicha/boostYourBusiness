
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/businesses
 * Retrieves all businesses associated with the currently authenticated user.
 */
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const businesses = await prisma.business.findMany({
      where: {
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        users: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/businesses
 * Creates a new business and assigns the current user as its OWNER.
 */
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Use a transaction to ensure both operations succeed or fail together
    const newBusiness = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name,
        },
      });

      await tx.businessUser.create({
        data: {
          businessId: business.id,
          userId: session.user.id!,
          role: 'OWNER',
        },
      });

      return business;
    });

    return NextResponse.json(newBusiness, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
