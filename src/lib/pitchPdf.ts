import jsPDF from "jspdf";
import type { PitchData } from "@/components/pitchforge/PitchPreview";

export const downloadPitchPdf = (pitch: PitchData) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // H1 title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const titleLines = doc.splitTextToSize(pitch.title || "Pitch", maxW);
  ensureSpace(titleLines.length * 26);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 26 + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(`Industry: ${pitch.industry}`, margin, y);
  y += 22;
  doc.setTextColor(20);

  const section = (heading: string, body: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(heading, margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(body, maxW);
    lines.forEach((line: string) => {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 15;
    });
    y += 10;
  };

  section("Intro", pitch.intro);
  section("About", pitch.about);
  section("Projects", pitch.projects);
  section("Skills", pitch.skills.join(" · "));
  section("Value", pitch.value);
  section("Closing", pitch.closing);

  const safeTitle = (pitch.title || "pitch").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${safeTitle}.pdf`);
};
