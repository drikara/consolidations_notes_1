import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        scores: true,
        faceToFaceScores: {
          include: {
            juryMember: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    // Calculate averages
    const phase1Scores = candidate.faceToFaceScores.filter((s) => s.phase === 1)
    const phase2Scores = candidate.faceToFaceScores.filter((s) => s.phase === 2)
    const avgPhase1 =
      phase1Scores.length > 0
        ? (phase1Scores.reduce((sum, s) => sum + Number(s.score), 0) / phase1Scores.length).toFixed(2)
        : "N/A"
    const avgPhase2 =
      phase2Scores.length > 0
        ? (phase2Scores.reduce((sum, s) => sum + Number(s.score), 0) / phase2Scores.length).toFixed(2)
        : "N/A"

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fiche Candidat - ${candidate.fullName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #FF6B00;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #FF6B00;
      margin: 0;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      background-color: #FF6B00;
      color: white;
      padding: 10px;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .info-item {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    .info-label {
      font-weight: bold;
      color: #333;
    }
    .info-value {
      color: #666;
    }
    .score-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .score-table th {
      background-color: #f5f5f5;
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
    }
    .score-table td {
      padding: 10px;
      border: 1px solid #ddd;
    }
    .decision {
      font-weight: bold;
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .decision.recrute {
      background-color: #d4edda;
      color: #155724;
    }
    .decision.non-recrute {
      background-color: #f8d7da;
      color: #721c24;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FICHE DE CONSOLIDATION DES NOTES</h1>
    <p>Candidat: ${candidate.fullName}</p>
    <p>Date d'édition: ${new Date().toLocaleDateString("fr-FR")}</p>
  </div>

  <div class="section">
    <div class="section-title">INFORMATIONS PERSONNELLES</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nom complet:</span>
        <span class="info-value">${candidate.fullName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Téléphone:</span>
        <span class="info-value">${candidate.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email:</span>
        <span class="info-value">${candidate.email}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date de naissance:</span>
        <span class="info-value">${candidate.birthDate.toLocaleDateString("fr-FR")} (${candidate.age} ans)</span>
      </div>
      <div class="info-item">
        <span class="info-label">Diplôme:</span>
        <span class="info-value">${candidate.diploma}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Établissement:</span>
        <span class="info-value">${candidate.institution}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Lieu d'habitation:</span>
        <span class="info-value">${candidate.location}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Métier:</span>
        <span class="info-value">${candidate.metier}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Disponibilité:</span>
        <span class="info-value">${candidate.availability}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date entretien:</span>
        <span class="info-value">${candidate.interviewDate ? candidate.interviewDate.toLocaleDateString("fr-FR") : "N/A"}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">PHASE 1 - ENTRETIEN INITIAL</div>
    <table class="score-table">
      <tr>
        <th>Critère</th>
        <th>Note</th>
      </tr>
      <tr>
        <td>Qualité de la voix</td>
        <td>${candidate.scores?.voiceQuality ? Number(candidate.scores.voiceQuality) + "/5" : "N/A"}</td>
      </tr>
      <tr>
        <td>Communication verbale</td>
        <td>${candidate.scores?.verbalCommunication ? Number(candidate.scores.verbalCommunication) + "/5" : "N/A"}</td>
      </tr>
      <tr>
        <td>Moyenne Face à Face Phase 1</td>
        <td><strong>${avgPhase1}/5</strong></td>
      </tr>
      <tr>
        <td>Décision FF Phase 1</td>
        <td><strong>${candidate.scores?.phase1FfDecision || "N/A"}</strong></td>
      </tr>
      <tr>
        <td>Test Psychotechnique</td>
        <td>${candidate.scores?.psychotechnicalTest ? Number(candidate.scores.psychotechnicalTest) + "/10" : "N/A"}</td>
      </tr>
      <tr>
        <td><strong>Décision Phase 1</strong></td>
        <td><strong>${candidate.scores?.phase1Decision || "N/A"}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">PHASE 2 - ÉPREUVES TECHNIQUES</div>
    <table class="score-table">
      <tr>
        <th>Critère</th>
        <th>Note</th>
      </tr>
      <tr>
        <td>Rapidité de saisie</td>
        <td>${candidate.scores?.typingSpeed ? candidate.scores.typingSpeed + " MPM" : "N/A"}</td>
      </tr>
      <tr>
        <td>Précision de saisie</td>
        <td>${candidate.scores?.typingAccuracy ? Number(candidate.scores.typingAccuracy) + "%" : "N/A"}</td>
      </tr>
      <tr>
        <td>Test Excel</td>
        <td>${candidate.scores?.excelTest ? Number(candidate.scores.excelTest) + "/5" : "N/A"}</td>
      </tr>
      <tr>
        <td>Dictée</td>
        <td>${candidate.scores?.dictation ? Number(candidate.scores.dictation) + "/20" : "N/A"}</td>
      </tr>
      <tr>
        <td>Simulation Vente</td>
        <td>${candidate.scores?.salesSimulation ? Number(candidate.scores.salesSimulation) + "/5" : "N/A"}</td>
      </tr>
      <tr>
        <td>Exercice d'Analyse</td>
        <td>${candidate.scores?.analysisExercise ? Number(candidate.scores.analysisExercise) + "/10" : "N/A"}</td>
      </tr>
      <tr>
        <td>Moyenne Face à Face Phase 2</td>
        <td><strong>${avgPhase2}/5</strong></td>
      </tr>
      <tr>
        <td>Décision FF Phase 2</td>
        <td><strong>${candidate.scores?.phase2FfDecision || "N/A"}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">DÉCISION FINALE</div>
    <p style="font-size: 18px; text-align: center; margin: 20px 0;">
      <span class="decision ${candidate.scores?.finalDecision === "RECRUTÉ" ? "recrute" : "non-recrute"}">
        ${candidate.scores?.finalDecision || "EN ATTENTE"}
      </span>
    </p>
    ${candidate.scores?.comments ? `<p><strong>Commentaires:</strong><br>${candidate.scores.comments}</p>` : ""}
  </div>

  <div class="footer">
    <p>Document généré automatiquement par le système de consolidation des notes de recrutement</p>
    <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
  </div>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
