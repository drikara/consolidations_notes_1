import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    const juryMember = await prisma.juryMember.update({
      where: { id: Number.parseInt(id) },
      data: {
        fullName: data.full_name,
        roleType: data.role_type,
      },
    })

    return NextResponse.json(juryMember)
  } catch (error) {
    console.error("[v0] Error updating jury member:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    await prisma.juryMember.delete({
      where: { id: Number.parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting jury member:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
