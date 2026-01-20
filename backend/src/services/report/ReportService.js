// backend/src/services/report/ReportService.js

const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

class ReportService {
    constructor() {
        // Correct absolute path for the logo
        this.logoPath = 'D:\\ReactJS PRO-jects\\DrDesignProject\\MyQuoteText\\client\\src\\assets\\logo.png';
    }

    /**
     * Generate a professional 5-page PDF report
     * @param {Object} job - The job document
     * @param {Object} result - The analysis result document
     * @param {string} effectiveTier - The calculated tier for branding
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateProfessionalReport(job, result, effectiveTier = 'Free') {
        return new Promise(async (resolve, reject) => {
            try {
                const displayTier = (effectiveTier || job.tier || 'Free').toUpperCase();

                const doc = new PDFDocument({
                    margin: 0, // We'll manage margins manually for full-page control
                    size: 'A4',
                    bufferPages: true,
                    info: {
                        Title: `MyQuoteMate Analysis - ${job.jobId}`,
                        Author: 'MyQuoteMate AI',
                        Subject: 'Quote Verification & Risk Assessment'
                    }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;
                const centerX = pageWidth / 2;

                // Color Palette
                const ORANGE = '#f97316';
                const DARK = '#0f172a';
                const GRAY = '#64748b';
                const LIGHT_GRAY = '#f8fafc';
                const WHITE = '#ffffff';

                // Client Metadata Resolution
                let clientName = 'Valued Client';
                let clientEmail = '-';

                if (job.userId) {
                    clientName = job.userId.fullName || `${job.userId.firstName} ${job.userId.lastName}`.trim() || 'Valued Client';
                    clientEmail = job.userId.email;
                } else if (job.leadId) {
                    clientEmail = job.leadId.email;
                }
                if (job.metadata?.name) clientName = job.metadata.name;
                if (job.metadata?.email) clientEmail = job.metadata.email;

                // --- HELPER: PAGE SHELL (Header/Footer/Logo) ---
                const addPageShell = (pageNum, title) => {
                    // Header Line
                    doc.moveTo(40, 60).lineTo(pageWidth - 40, 60).lineWidth(1).stroke(ORANGE);

                    // Logo Top Left
                    if (fs.existsSync(this.logoPath)) {
                        doc.image(this.logoPath, 40, 20, { height: 28 });
                    } else {
                        doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(16).text('MyQuoteMate', 40, 25);
                    }

                    // Page Tag Top Right
                    const tagWidth = 80;
                    doc.save();
                    doc.fillColor(ORANGE).fillOpacity(0.1).rect(pageWidth - 40 - tagWidth, 22, tagWidth, 22).fill();
                    doc.restore();
                    doc.fillColor(ORANGE).font('Helvetica').fontSize(9).text(`PAGE ${pageNum}`, pageWidth - 40 - tagWidth, 28, { align: 'center', width: tagWidth });

                    // Section Title
                    if (title) {
                        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(22).text(title.toUpperCase(), 40, 85);
                        doc.rect(40, 115, 60, 3).fill(ORANGE);
                    }

                    // Footer
                    doc.moveTo(40, pageHeight - 60).lineTo(pageWidth - 40, pageHeight - 60).lineWidth(0.5).stroke(`${GRAY}33`);
                    doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(
                        `MyQuoteMate Analysis | Ref: ${job.jobId.substring(0, 8).toUpperCase()} | © 2026 Professional AI Report`,
                        0,
                        pageHeight - 45,
                        { align: 'center', width: pageWidth }
                    );
                };

                // =====================================================================
                // PAGE 1: PROFESSIONAL COVER PAGE
                // =====================================================================
                // Background Gradient/Shape
                doc.rect(0, 0, pageWidth, pageHeight).fill('#F9FAFB');

                // Abstract Shapes (Circles)
                doc.save();
                doc.fillColor(ORANGE).fillOpacity(0.05).circle(pageWidth, 0, 300).fill();
                doc.circle(0, pageHeight, 200).fill();
                doc.restore();

                // Main Logo
                if (fs.existsSync(this.logoPath)) {
                    doc.image(this.logoPath, centerX - 75, 140, { width: 150 });
                } else {
                    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(36).text('MyQuoteMate', 0, 150, { align: 'center', width: pageWidth });
                }

                doc.moveDown(5);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(32).text('Quote Analysis &\nRisk Assessment', 0, 300, { align: 'center', width: pageWidth, lineGap: 8 });
                doc.fillColor(ORANGE).fontSize(14).font('Helvetica').text('Advanced AI Forensic Review', 0, 385, { align: 'center', width: pageWidth });

                // Tier Badge
                doc.rect(centerX - 110, 425, 220, 32).fill(DARK);
                doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text(`${displayTier} ANALYTIC VERSION`, centerX - 110, 436, { align: 'center', width: 220 });

                // Client Card (White Box)
                doc.rect(centerX - 160, 500, 320, 180).fill(WHITE).stroke(`${DARK}11`);
                doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(9).text('OFFICIAL REPORT DATA', centerX - 160, 515, { align: 'center', width: 320 });
                doc.moveTo(centerX - 130, 530).lineTo(centerX + 130, 530).lineWidth(0.5).stroke(`${GRAY}22`);

                const cardY = 555;
                const labelX = centerX - 130;
                doc.fillColor(GRAY).font('Helvetica').fontSize(10).text('CLIENT:', labelX, cardY);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(12).text(clientName.toUpperCase(), labelX, cardY + 15);

                doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(10).text('REPORT ID:', labelX, cardY + 45);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(12).text(job.jobId.substring(0, 16).toUpperCase(), labelX, cardY + 60);

                doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(10).text('ISSUE DATE:', labelX, cardY + 95);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(12).text(new Date().toLocaleDateString('en-AU', { dateStyle: 'long' }).toUpperCase(), labelX, cardY + 110);

                // Footer Status
                doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(9).text('✓ AUDITED BY MYQUOTEMATE AI ENGINE', 0, 770, { align: 'center', width: pageWidth });

                // =====================================================================
                // PAGE 2: THE MYQUOTEMATE PROCESS
                // =====================================================================
                doc.addPage();
                addPageShell(2, 'Test Methodology & Process');

                const introText = "MyQuoteMate employs a multi-stage validation framework to ensure quote integrity. We cross-reference document metadata, textual logic, and market benchmarks to provide a non-biased assessment of your project's financial and operational risks.";
                doc.fillColor(DARK).font('Helvetica').fontSize(13).text(introText, 40, 155, { width: pageWidth - 100, align: 'justify', lineGap: 6 });

                doc.moveDown(4);

                const steps = [
                    { title: "Structural Extraction", desc: "Digital and physical quote patterns are deconstructed into machine-readable data streams." },
                    { title: "Contextual Analysis", desc: "Our AI evaluates the 'hidden' logic behind the pricing—checking for common contractor tactics." },
                    { title: "Risk Identification", desc: "Over 40 distinct risk markers are checked, including compliance gaps and price elasticity." },
                    { title: "Report Finalization", desc: "The analysis is verified and formatted into this expert narrative for client empowerment." }
                ];

                let stepY = doc.y + 20;
                steps.forEach((step, idx) => {
                    // Number Circle
                    doc.save();
                    doc.fillColor(ORANGE).circle(60, stepY + 18, 18).fill();
                    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16).text(idx + 1, 42, stepY + 10, { width: 36, align: 'center' });
                    doc.restore();

                    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(14).text(step.title, 95, stepY + 4);
                    doc.fillColor(GRAY).font('Helvetica').fontSize(11).text(step.desc, 95, stepY + 22, { width: pageWidth - 150, lineGap: 2 });

                    stepY += 80;
                });

                // Support Box
                doc.rect(40, pageHeight - 190, pageWidth - 80, 90).fill(`${ORANGE}05`).stroke(ORANGE);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(13).text('Professional Support', 60, pageHeight - 175);
                doc.fillColor(GRAY).font('Helvetica').fontSize(10).text('Need assistance interpreting these findings? Contact our support team.', 60, pageHeight - 158);
                doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(11).text('support@myquotemate.com.au', 60, pageHeight - 130);

                // =====================================================================
                // PAGE 3: ANALYTICAL SUMMARY (GRID)
                // =====================================================================
                doc.addPage();
                addPageShell(3, 'Executive Analysis Snapshot');

                // Grid (2x2)
                const gridX = 40;
                const gridY = 160;
                const boxW = (pageWidth - 100) / 2;
                const boxH = 95;

                const scoreVal = (result.verdictScore > 10 ? result.verdictScore / 10 : result.verdictScore) || 0;
                const metrics = [
                    { label: "Document Status", val: "Verified Authenticity", icon: "✓", color: "#10b981" },
                    { label: "Analytic Depth", val: displayTier, icon: "🔍", color: DARK },
                    { label: "Detected Risks", val: `${result.redFlags?.length || 0} Identification(s)`, icon: "!", color: result.redFlags?.length > 0 ? '#ef4444' : '#10b981' },
                    { label: "Quote Integrity", val: `${scoreVal.toFixed(1)} / 10.0`, icon: "★", color: scoreVal >= 8 ? '#10b981' : (scoreVal >= 6 ? '#f59e0b' : '#ef4444') }
                ];

                metrics.forEach((m, idx) => {
                    const bx = gridX + (idx % 2) * (boxW + 20);
                    const by = gridY + Math.floor(idx / 2) * (boxH + 20);

                    doc.rect(bx, by, boxW, boxH).fill(WHITE).stroke(`${DARK}11`);
                    doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(9).text(m.label.toUpperCase(), bx + 15, by + 20);
                    doc.fillColor(m.color).font('Helvetica-Bold').fontSize(16).text(m.val, bx + 15, by + 45);

                    doc.save();
                    doc.fillColor(m.color).fillOpacity(0.1).circle(bx + boxW - 25, by + 25, 12).fill();
                    doc.restore();
                    doc.fillColor(m.color).fontSize(10).text(m.icon, bx + boxW - 31, by + 20, { width: 12, align: 'center' });
                });

                // Narrative Summary
                doc.moveDown(13);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(16).text('Interpretive Narrative');
                doc.save();
                doc.fillColor(LIGHT_GRAY).rect(40, doc.y + 8, pageWidth - 80, 160).fill();
                doc.restore();
                doc.fillColor(DARK).font('Helvetica').fontSize(12).text(result.summary, 60, doc.y + 25, { width: pageWidth - 120, align: 'justify', lineGap: 5 });

                // =====================================================================
                // PAGE 4: DETAILED FINDINGS (COSTS & RISKS)
                // =====================================================================
                doc.addPage();
                addPageShell(4, 'Detailed Observation Log');

                doc.moveDown(5);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(17).text('Quote Financial Structure');
                doc.moveDown(0.5);

                const totalValue = result.costs?.overall ? `$${result.costs.overall.toLocaleString()} AUD` : 'N/A';

                const costItems = result.costBreakdown || [];
                const costTableData = {
                    headers: [
                        { label: "ANALYZED ITEM", property: 'desc', width: 280 },
                        { label: "CATEGORY", property: 'cat', width: 110 },
                        { label: "AMOUNT", property: 'price', width: 120, align: 'right' }
                    ],
                    rows: costItems.length > 0 ?
                        costItems.slice(0, 12).map(item => [item.description?.toUpperCase() || 'GENERAL ITEM', item.category?.toUpperCase() || 'STANDARD', `$${(item.totalPrice || 0).toLocaleString()}`]) :
                        [["BASE QUOTE ANALYSIS", "CONSOLIDATED", totalValue]]
                };

                await doc.table(costTableData, {
                    x: 40,
                    prepareHeader: () => {
                        doc.font("Helvetica-Bold").fontSize(9);
                        return doc;
                    },
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font("Helvetica").fontSize(10).fillColor(DARK);
                        return doc;
                    },
                });

                doc.moveDown(2);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(17).text('Risk Matrix & Red Flags');
                doc.moveDown(0.5);

                if (result.redFlags && result.redFlags.length > 0) {
                    result.redFlags.slice(0, 4).forEach(flag => {
                        const sCol = flag.severity === 'high' ? '#ef4444' : ORANGE;
                        doc.fillColor(sCol).font('Helvetica-Bold').fontSize(12).text(`[!] ${flag.title || flag.category}`);
                        doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(flag.description, { width: pageWidth - 100, align: 'justify' });
                        doc.moveDown(0.4);
                    });
                } else {
                    doc.fillColor('#10b981').font('Helvetica').fontSize(11).text('No critical security or financial red flags detected in this document.');
                }

                // =====================================================================
                // PAGE 5: STRATEGIC GUIDANCE & EXPERT NOTE
                // =====================================================================
                doc.addPage();
                addPageShell(5, 'Strategic Guidance');

                doc.moveDown(5);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(16).text('Immediate Recommendations');
                doc.moveDown(1);

                const recList = result.questionsToAsk && result.questionsToAsk.length > 0 ?
                    result.questionsToAsk.slice(0, 3).map(q => ({ t: q.question, d: "Ask the contractor to clarify this specific point to ensure price stability." })) :
                    [
                        { t: "Request Detailed Breakdown", d: "Ask for a more granular list of materials and labor if not provided." },
                        { t: "Confirm Insurance", d: "Request certificates of currency for public liability and workers compensation." }
                    ];

                recList.forEach(r => {
                    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(12).text(`▶ ${r.t}`);
                    doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(r.d, { width: pageWidth - 100 });
                    doc.moveDown(0.8);
                });

                doc.moveDown(4);
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(16).text('Professional Verdict');
                doc.save();
                doc.fillColor(WHITE).stroke(DARK).rect(40, doc.y + 8, pageWidth - 80, 120).fillAndStroke();
                doc.restore();

                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(18).text(result.verdict.toUpperCase(), 0, doc.y + 25, { align: 'center', width: pageWidth });
                doc.fillColor(GRAY).font('Helvetica-Oblique').fontSize(11).text(
                    result.verdictJustification || "The quote displays standard patterns. Proceed with typical due diligence.",
                    60,
                    doc.y + 10,
                    { width: pageWidth - 120, align: 'center' }
                );

                // Professional Seal Background
                doc.save();
                doc.fillColor(ORANGE).fillOpacity(0.03).circle(pageWidth - 80, pageHeight - 150, 60).fill();
                doc.restore();

                doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(
                    "NOTICE: This report is generated by MyQuoteMate AI Analysis. It is a decision-support tool, not a substitute for legal advice. MyQuoteMate does not guarantee the performance of any contractor analyzed in this report.",
                    40,
                    pageHeight - 90,
                    { width: pageWidth - 80, align: 'center' }
                );
                doc.text("END OF PROFESSIONAL REPORT", 0, pageHeight - 40, { align: 'center', width: pageWidth });

                // Finalize decorations across all pages
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);
                    // Headers/Footers are already added per-page by addPageShell in this new structure
                    // but we could do any final global touches here.
                }

                doc.end();
            } catch (error) {
                logger.error('Professional PDF Generation Error:', error);
                reject(error);
            }
        });
    }
}

module.exports = new ReportService();