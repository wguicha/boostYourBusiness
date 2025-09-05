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

// GET /api/combos - Fetches all combos for a specific business
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden: You are not a member of this business." }, { status: 403 });
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
    const serializableCombos = combos.map(combo => ({
      ...combo,
      price: combo.price.toString(),
      products: combo.products.map(cp => ({
        ...cp,
        product: {
          ...cp.product,
          price: cp.product.price.toString(),
        },
      })),
    }));
    return NextResponse.json(serializableCombos);
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/combos - Creates a new combo for a specific business
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (!name || !price || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCombo = await prisma.$transaction(async (tx) => {
      const combo = await tx.combo.create({
        data: {
          name,
          price,
          businessId, // Use the validated businessId
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
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
