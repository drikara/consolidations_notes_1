import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    const existing = await prisma.juryMember.findUnique({
      where: { userId: data.user_id },
    })

    if (existing) {
      return NextResponse.json({ error: "Cet utilisateur est déjà membre du jury" }, { status: 400 })
    }

    const juryMember = await prisma.juryMember.create({
      data: {
        userId: data.user_id,
        fullName: data.full_name,
        roleType: data.role_type,
      },
    })

    return NextResponse.json(juryMember)
  } catch (error) {
    console.error("[v0] Error creating jury member:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const juryMembers = await prisma.juryMember.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(juryMembers)
  } catch (error) {
    console.error("[v0] Error fetching jury members:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
