
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * DELETE /api/businesses/{id}/members/{userId}
 * Removes a user from a business. Only the business owner can perform this action.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } } // Changed businessId to id
) {
  const session = await auth();
  const { id: businessId, userId: memberIdToRemove } = params; // Destructure id as businessId

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Verify the current user is an OWNER of the business
    const currentUserMembership = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: session.user.id,
        },
        role: Role.OWNER,
      },
    });

    if (!currentUserMembership) {
      return NextResponse.json({ error: 'Forbidden: Only owners can remove members.' }, { status: 403 });
    }

    // 2. An owner cannot remove themselves
    if (session.user.id === memberIdToRemove) {
      return NextResponse.json({ error: 'Owners cannot remove themselves. Please delete the business instead or transfer ownership.' }, { status: 400 });
    }

    // 3. Find the membership to be deleted
    const membershipToRemove = await prisma.businessUser.findUnique({
        where: {
            businessId_userId: {
                businessId: businessId,
                userId: memberIdToRemove,
            }
        }
    });

    if (!membershipToRemove) {
        return NextResponse.json({ error: 'Member not found in this business.' }, { status: 404 });
    }

    // 4. Delete the BusinessUser record
    await prisma.businessUser.delete({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: memberIdToRemove,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
