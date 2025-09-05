
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { InvitationStatus } from '@prisma/client';

/**
 * GET /api/invitations
 * Retrieves all pending business invitations for the currently authenticated user.
 */
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendingInvitations = await prisma.businessUser.findMany({
      where: {
        userId: session.user.id,
        status: InvitationStatus.PENDING,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(pendingInvitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
