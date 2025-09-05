
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * POST /api/businesses/{id}/invite
 * Invites a user (by email) to join a specific business.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const businessId = params.id;

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
      },
    });

    if (currentUserMembership?.role !== Role.OWNER) {
      return NextResponse.json({ error: 'Forbidden: Only owners can invite users.' }, { status: 403 });
    }

    // 2. Get the email of the user to invite from the request body
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 3. Find the user to invite
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return NextResponse.json({ error: 'User with that email not found.' }, { status: 404 });
    }
    
    if (userToInvite.id === session.user.id) {
        return NextResponse.json({ error: 'You cannot invite yourself.' }, { status: 400 });
    }

    // 4. Check if the user is already in the business
    const existingMembership = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId: businessId,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this business.' }, { status: 409 });
    }

    // 5. Create the invitation (a BusinessUser record with PENDING status)
    const newInvitation = await prisma.businessUser.create({
      data: {
        businessId: businessId,
        userId: userToInvite.id,
        role: Role.EMPLOYEE, // Invited users start as employees
        status: 'PENDING',
        assignedBy: session.user.id,
      },
    });

    return NextResponse.json(newInvitation, { status: 201 });

  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
