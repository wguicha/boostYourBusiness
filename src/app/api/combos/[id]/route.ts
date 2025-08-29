import { NextRequest, NextResponse } from "next/server"; // Combined import
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET /api/combos/[id] - Fethes a single combo by ID
// ...
export async function GET(req: NextRequest, context: any) { // Using 'any' as a last resort workaround
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params; // Corrected

  try {
    const combo = await prisma.combo.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!combo) {
      return NextResponse.json({ error: "Combo not found" }, { status: 404 });
    }

    // Ensure the combo belongs to the user's business
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness || combo.businessId !== userBusiness.businessId) {
      return NextResponse.json({ error: "Unauthorized access to combo" }, { status: 403 });
    }

    return NextResponse.json(combo);
  } catch (error) {
    console.error("Error fetching combo:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PUT /api/combos/[id] - Updates an existing combo
export async function PUT(req: NextRequest, context: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  const body = await req.json();
  const { name, price, products } = body;

  if (!name || !price || !products || !Array.isArray(products)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: "User not associated with a business" }, { status: 400 });
    }

    const existingCombo = await prisma.combo.findUnique({
      where: { id },
    });

    if (!existingCombo || existingCombo.businessId !== userBusiness.businessId) {
      return NextResponse.json({ error: "Combo not found or unauthorized" }, { status: 404 });
    }

    const updatedCombo = await prisma.$transaction(async (tx) => {
      // 1. Update the Combo record
      const combo = await tx.combo.update({
        where: { id },
        data: {
          name,
          price,
        },
      });

      // 2. Delete existing ComboProduct records for this combo
      await tx.comboProduct.deleteMany({
        where: { comboId: id },
      });

      // 3. Create new ComboProduct records
      const comboProductsData = products.map((p: { id: string; quantity: number }) => ({
        comboId: combo.id,
        productId: p.id,
        quantity: p.quantity,
      }));

      await tx.comboProduct.createMany({
        data: comboProductsData,
      });

      return combo;
    });

    // Refetch the updated combo with its relations to return it in the response
    const updatedComboWithProducts = await prisma.combo.findUnique({
        where: { id: updatedCombo.id },
        include: {
            products: {
                include: {
                    product: true
                }
            }
        }
    });

    return NextResponse.json(updatedComboWithProducts);
  } catch (error) {
    console.error("Error updating combo:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE /api/combos/[id] - Deletes a combo
export async function DELETE(req: NextRequest, context: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params; // Corrected

  try {
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: "User not associated with a business" }, { status: 400 });
    }

    const existingCombo = await prisma.combo.findUnique({
      where: { id },
    });

    if (!existingCombo || existingCombo.businessId !== userBusiness.businessId) {
      return NextResponse.json({ error: "Combo not found or unauthorized" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete associated SaleItem records first if any (due to onDelete: Restrict in SaleItem)
      // This might not be strictly necessary if SaleItem.comboId is nullable and not restricted
      // but it's safer to consider if a combo is part of a sale.
      // For now, assuming onDelete: Restrict on SaleItem.combo means we can't delete a combo if it's in a sale.
      // If SaleItem.comboId is set to onDelete: SetNull, then this step is not needed.
      // Based on schema, it's Restrict, so we need to handle it or ensure no sales exist.
      // For simplicity, we'll let Prisma throw an error if it's restricted and in a sale.

      // Delete ComboProduct records first
      await tx.comboProduct.deleteMany({
        where: { comboId: id },
      });

      // Then delete the Combo itself
      await tx.combo.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Combo deleted successfully" });
  } catch (error) {
    console.error("Error deleting combo:", error);
    // Check for PrismaClientKnownRequestError for specific error codes like P2003 (Foreign key constraint failed)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete combo because it is part of existing sales." },
        { status: 409 } // Conflict
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
