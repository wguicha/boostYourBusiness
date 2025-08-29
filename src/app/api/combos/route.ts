import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET /api/combos - Fetches all combos for the user's business
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userWithBusiness = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      businesses: {
        include: {
          business: true,
        },
      },
    },
  });

  const businessId = userWithBusiness?.businesses[0]?.businessId;

  if (!businessId) {
    return NextResponse.json(
      { error: "User is not associated with a business" },
      { status: 400 }
    );
  }

  try {
    const combos = await prisma.combo.findMany({
      where: { businessId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(combos);
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST /api/combos - Creates a new combo
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userWithBusiness = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      businesses: {
        include: {
          business: true,
        },
      },
    },
  });

  const businessId = userWithBusiness?.businesses[0]?.businessId;

  if (!businessId) {
    return NextResponse.json(
      { error: "User is not associated with a business" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { name, price, products } = body;

    if (!name || !price || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate that all products exist and have enough quantity for the combo creation (optional, good practice)
    // For now, we'll just create the combo. Inventory check will be crucial on sale.

    const newCombo = await prisma.$transaction(async (tx) => {
      const combo = await tx.combo.create({
        data: {
          name,
          price,
          businessId,
        },
      });

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

    // Refetch the created combo with its relations to return it in the response
    const createdComboWithProducts = await prisma.combo.findUnique({
        where: { id: newCombo.id },
        include: {
            products: {
                include: {
                    product: true
                }
            }
        }
    });

    return NextResponse.json(createdComboWithProducts, { status: 201 });
  } catch (error) {
    console.error("Error creating combo:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
