import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the business associated with the user
    // Assuming a user is primarily associated with one business for display purposes in the header
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!userBusiness || !userBusiness.business) {
      return NextResponse.json({ businessName: 'Boost Your Business' }); // Default if no business found
    }

    return NextResponse.json({ businessName: userBusiness.business.name });
  } catch (error) {
    console.error('Error fetching business name:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
