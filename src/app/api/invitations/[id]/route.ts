
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { InvitationStatus } from '@prisma/client';

/**
 * PUT /api/invitations/{id}
 * Accepts a pending invitation for the current user to join a business.
 * The {id} in the URL corresponds to the businessId.
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const businessId = params.id; // The ID from the URL is the businessId

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invitation = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: session.user.id,
        },
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or already accepted.' }, { status: 404 });
    }

    const updatedMembership = await prisma.businessUser.update({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: session.user.id,
        },
      },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/invitations/{id}
 * Rejects (deletes) a pending invitation for the current user.
 * The {id} in the URL corresponds to the businessId.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const businessId = params.id; // The ID from the URL is the businessId

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invitation = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: session.user.id,
        },
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    await prisma.businessUser.delete({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: session.user.id,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
