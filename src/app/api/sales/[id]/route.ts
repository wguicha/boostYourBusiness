import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from '@/lib/prisma';

async function verifyUserMembership(userId: string, businessId: string) {
  const membership = await prisma.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId }, status: 'ACCEPTED' },
  });
  return membership;
}

// PUT /api/sales/{id} - Updates a sale
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saleId = params.id;
  try {
    const body = await req.json();
    const { paymentMethod, items, businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const membership = await verifyUserMembership(session.user.id, businessId);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For simplicity, this update only changes the payment method.
    // A full implementation would handle item changes within a transaction.
    const updatedSale = await prisma.sale.update({
      where: { id: saleId, businessId: businessId },
      data: { paymentMethod },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error(`Error updating sale ${saleId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/sales/{id} - Deletes a sale
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saleId = params.id;
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Prisma's cascading delete will handle SaleItems.
    await prisma.sale.delete({ where: { id: saleId, businessId: businessId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting sale ${saleId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}