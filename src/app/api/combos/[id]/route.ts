import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from '@/lib/prisma';

// Helper function to verify user's membership in a business
async function verifyUserMembership(userId: string, businessId: string) {
  const membership = await prisma.businessUser.findUnique({
    where: {
      businessId_userId: { businessId, userId },
      status: 'ACCEPTED',
    },
  });
  return membership;
}

// PUT /api/combos/{id} - Updates an existing combo
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comboId = params.id;
  try {
    const body = await req.json();
    const { name, price, products, businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const membership = await verifyUserMembership(session.user.id, businessId);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this business." }, { status: 403 });
    }

    if (!name || !price || !products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedCombo = await prisma.$transaction(async (tx) => {
      // First, update the combo details
      const combo = await tx.combo.update({
        where: { id: comboId, businessId: businessId }, // Ensure combo belongs to the business
        data: { name, price },
      });

      // Then, update the products within the combo
      // Easiest way is to delete old ones and create new ones
      await tx.comboProduct.deleteMany({ where: { comboId: comboId } });

      const comboProductsData = products.map((p: { id: string; quantity: number }) => ({
        comboId: combo.id,
        productId: p.id,
        quantity: p.quantity,
      }));

      await tx.comboProduct.createMany({ data: comboProductsData });

      return combo;
    });

    return NextResponse.json(updatedCombo);
  } catch (error) {
    console.error(`Error updating combo ${comboId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/combos/{id} - Deletes a combo
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comboId = params.id;
  // Since DELETE requests can't have a body in some clients, we get businessId from query params
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required in query parameters" }, { status: 400 });
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden: You are not a member of this business." }, { status: 403 });
  }

  try {
    // The schema is set to cascade delete, so ComboProducts will be deleted automatically.
    await prisma.combo.delete({
      where: { id: comboId, businessId: businessId }, // Ensure combo belongs to the business
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting combo ${comboId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}