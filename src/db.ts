import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function initDb() {
  await prisma.$connect();
}

export async function insertAnnonce(annonce: {
  type?: string;
  prix?: string;
  ville?: string;
  pieces?: string;
  surface?: string;
  lien?: string;
  agence: string;
  description?: string;
  photos?: string[];
}) {
  if (!annonce.lien) return;
  try {
    await prisma.annonce.upsert({
      where: { lien: annonce.lien },
      create: {
        type: annonce.type ?? null,
        prix: annonce.prix ?? null,
        ville: annonce.ville ?? null,
        pieces: annonce.pieces ?? null,
        surface: annonce.surface ?? null,
        lien: annonce.lien,
        agence: annonce.agence,
        description: annonce.description ?? null,
        photos: (annonce.photos ?? []) as unknown as object,
        // created_at/date_scraped default via Prisma schema
      },
      update: {
        type: annonce.type ?? null,
        prix: annonce.prix ?? null,
        ville: annonce.ville ?? null,
        pieces: annonce.pieces ?? null,
        surface: annonce.surface ?? null,
        agence: annonce.agence,
        description: annonce.description ?? null,
        photos: (annonce.photos ?? []) as unknown as object,
        date_scraped: new Date(),
      },
    });
  } catch (err) {
    console.error("Erreur insertion annonce (Prisma):", err);
  }
}

export async function deleteMissingAnnonces(
  agence: string,
  liensActuels: string[]
) {
  if (liensActuels.length === 0) return;

  await prisma.annonce.deleteMany({
    where: {
      agence,
      lien: { notIn: liensActuels },
    },
  });
}

export async function closeDb() {
  await prisma.$disconnect();
}
