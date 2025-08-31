import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/combos/[id] - Fetches a single combo by ID
export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

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

    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness || combo.businessId !== userBusiness.businessId) {
      return NextResponse.json(
        { error: "Unauthorized access to combo" },
        { status: 403 }
      );
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
export async function PUT(req: NextRequest, context: RouteContext) {
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
      return NextResponse.json(
        { error: "User not associated with a business" },
        { status: 400 }
      );
    }

    const existingCombo = await prisma.combo.findUnique({
      where: { id },
    });

    if (!existingCombo || existingCombo.businessId !== userBusiness.businessId) {
      return NextResponse.json(
        { error: "Combo not found or unauthorized" },
        { status: 404 }
      );
    }

    const updatedCombo = await prisma.$transaction(async (tx) => {
      const combo = await tx.combo.update({
        where: { id },
        data: {
          name,
          price,
        },
      });

      await tx.comboProduct.deleteMany({
        where: { comboId: id },
      });

      const comboProductsData = products.map(
        (p: { id: string; quantity: number }) => ({
          comboId: combo.id,
          productId: p.id,
          quantity: p.quantity,
        })
      );

      await tx.comboProduct.createMany({
        data: comboProductsData,
      });

      return combo;
    });

    const updatedComboWithProducts = await prisma.combo.findUnique({
      where: { id: updatedCombo.id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
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
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness) {
      return NextResponse.json(
        { error: "User not associated with a business" },
        { status: 400 }
      );
    }

    const existingCombo = await prisma.combo.findUnique({
      where: { id },
    });

    if (!existingCombo || existingCombo.businessId !== userBusiness.businessId) {
      return NextResponse.json(
        { error: "Combo not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.comboProduct.deleteMany({
        where: { comboId: id },
      });

      await tx.combo.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Combo deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting combo:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
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
