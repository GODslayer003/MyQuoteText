// backend/src/services/report/ReportService.js
const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

class ReportService {
    constructor() {
        // Correct absolute path provided by user
        this.logoPath = 'D:\\ReactJS PRO-jects\\DrDesignProject\\MyQuoteText\\client\\src\\assets\\logo.png';
    }

    /**
     * Generate a professional PDF report for a job result
     * @param {Object} job - The job document
     * @param {Object} result - The analysis result document
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateProfessionalReport(job, result, effectiveTier = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const displayTier = effectiveTier || job.tier;
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    bufferPages: true,
                    info: {
                        Title: `Professional Quote Analysis - ${job.jobId}`,
                        Author: 'MyQuoteMate',
                        Subject: 'Quote Verification & Risk Assessment'
                    }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;
                const centerX = pageWidth / 2;

                // Client Metadata Resolution
                let clientName = 'Valued Client';
                let clientEmail = '-';

                if (job.userId) {
                    clientName = job.userId.fullName || `${job.userId.firstName} ${job.userId.lastName}`.trim() || 'Valued Client';
                    clientEmail = job.userId.email;
                } else if (job.leadId) {
                    clientEmail = job.leadId.email;
                }

                // Fallback to metadata if provided
                if (job.metadata?.name) clientName = job.metadata.name;
                if (job.metadata?.email) clientEmail = job.metadata.email;

                // --- HELPER: HEADER & FOOTER ---
                const addDecorations = (pageNum, totalPages) => {
                    // Header (Centered)
                    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('MYQUOTEMATE - PROFESSIONAL QUOTE ANALYSIS REPORT', 0, 30, { align: 'center', width: pageWidth });
                    doc.moveTo(50, 45).lineTo(pageWidth - 50, 45).stroke('#f1f5f9');

                    // Footer (Centered)
                    doc.moveTo(50, pageHeight - 50).lineTo(pageWidth - 50, pageHeight - 50).stroke('#f1f5f9');
                    doc.fontSize(8).fillColor('#94a3b8').text(
                        `MyQuoteMate Analysis Report © 2026 | Prepared for ${clientEmail} | Page ${pageNum} of ${totalPages}`,
                        0,
                        pageHeight - 35,
                        { align: 'center', width: pageWidth }
                    );
                };

                // --- PAGE 1: PROFESSIONAL COVER PAGE ---
                // Logo (Centered)
                if (fs.existsSync(this.logoPath)) {
                    doc.image(this.logoPath, centerX - 60, 150, { width: 120 });
                } else {
                    doc.fontSize(32).fillColor('#f97316').font('Helvetica-Bold').text('MyQuoteMate', 0, 150, { align: 'center', width: pageWidth });
                }

                doc.moveDown(4);
                const tierLabel = `MyQuoteMate (${displayTier.toUpperCase()} VERSION)`;
                doc.fontSize(16).fillColor('#4b5563').font('Helvetica-Bold').text(tierLabel, 0, doc.y, { align: 'center', width: pageWidth });

                doc.moveDown(6);
                doc.fontSize(12).fillColor('#9ca3af').font('Helvetica').text('PREPARED FOR', 0, doc.y, { align: 'center', width: pageWidth });
                doc.moveDown(0.5);
                doc.fontSize(22).fillColor('#111827').font('Helvetica-Bold').text(clientName, 0, doc.y, { align: 'center', width: pageWidth });
                doc.fontSize(14).fillColor('#4b5563').font('Helvetica').text(clientEmail, 0, doc.y, { align: 'center', width: pageWidth });

                doc.moveDown(4);
                doc.fontSize(10).fillColor('#d1d5db').text(`REPORT REF: ${job.jobId}`, 0, doc.y, { align: 'center', width: pageWidth });
                doc.text(`DATE GENERATED: ${new Date().toLocaleDateString('en-AU', { dateStyle: 'long' })}`, 0, doc.y, { align: 'center', width: pageWidth });

                doc.rect(centerX - 80, doc.y + 50, 160, 3).fill('#f97316');

                // --- PAGE 2: EXECUTIVE SUMMARY & CLASSIFICATION ---
                doc.addPage();
                doc.moveDown(3);
                doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text('1. Executive Overview', { align: 'center' });
                doc.moveDown(2);

                doc.fillColor('#374151').fontSize(13).font('Helvetica').text(result.summary, 75, doc.y, { align: 'justify', width: 445, lineGap: 5 });

                doc.moveDown(4);
                doc.fillColor('#111827').fontSize(18).font('Helvetica-Bold').text('Project Details & Classification', { align: 'center' });
                doc.moveDown(1.5);

                const projectTable = {
                    headers: [
                        { label: "Attribute", property: 'attr', width: 180 },
                        { label: "Detected Value", property: 'val', width: 265 }
                    ],
                    rows: [
                        ["Ref Number", job.jobId.substring(0, 12).toUpperCase()],
                        ["Business/Supplier", result.contractorProfile?.name || "Detected from document"],
                        ["Industry Segment", result.relevance?.topic || "Construction/Renovation"],
                        ["Analysis Accuracy", `${result.analysisAccuracy || 80}%`]
                    ]
                };

                await doc.table(projectTable, {
                    x: 75,
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11).fillColor('#475569'),
                    prepareRow: () => doc.font("Helvetica").fontSize(11).fillColor('#1e293b'),
                    padding: 12
                });

                // --- PAGE 3: FINANCIAL ANALYSIS ---
                doc.addPage();
                doc.moveDown(3);
                doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text('2. Financial Insights', { align: 'center' });
                doc.moveDown(2);

                const totalAmount = result.costs?.overall ? `$${result.costs.overall.toLocaleString()} ${result.costs.currency || 'AUD'}` : 'Contact Supplier';
                doc.rect(75, doc.y, 445, 80).fill('#f8fafc').stroke('#e2e8f0');
                doc.fillColor('#0369a1').fontSize(12).font('Helvetica-Bold').text('TOTAL REPORTED PROJECT VALUE', 100, doc.y + 22);
                doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text(totalAmount, 100, doc.y + 6);

                doc.moveDown(5);
                doc.fillColor('#111827').fontSize(18).text('Itemized Cost Allocation', { align: 'center' });
                doc.moveDown(1.5);

                const costItems = result.costBreakdown || [];
                if (costItems.length > 0) {
                    const costTable = {
                        headers: [
                            { label: "Description", width: 245 },
                            { label: "Category", width: 100 },
                            { label: "Amount (AUD)", width: 100, align: 'right' }
                        ],
                        rows: costItems.map(item => [
                            item.description || 'General Item',
                            item.category || 'General',
                            `$${(item.totalPrice || 0).toLocaleString()}`
                        ])
                    };

                    await doc.table(costTable, {
                        x: 75,
                        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11).fillColor('#111827'),
                        prepareRow: () => doc.font("Helvetica").fontSize(11).fillColor('#374151'),
                        padding: 10
                    });
                } else {
                    doc.rect(75, doc.y, 445, 45).fill('#fffaf0');
                    doc.fillColor('#9a6300').fontSize(11).font('Helvetica-Oblique').text('Note: Individual line items were not detectable. Pricing analysis is based on the aggregate total provided.', 90, doc.y + 15, { width: 415 });
                }

                // --- PAGE 4: RISK ASSESSMENT (RED FLAGS) ---
                doc.addPage();
                doc.moveDown(3);
                doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text('3. Risk & Verdict Analysis', { align: 'center' });
                doc.moveDown(2);

                // Convert score to 10 scale if it's 100
                let scoreValue = result.verdictScore || 0;
                if (scoreValue > 10) scoreValue = scoreValue / 10;
                const scoreDisplay = `${scoreValue.toFixed(1)}/10`;
                const scoreColor = scoreValue >= 8 ? '#10b981' : (scoreValue >= 6 ? '#f59e0b' : '#ef4444');

                doc.rect(75, doc.y, 445, 100).fill('#fdfdfd').stroke('#f1f5f9');
                doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('PROPRIETARY QUOTE INTEGRITY SCORE', 100, doc.y + 18);
                doc.fillColor(scoreColor).fontSize(26).text(scoreDisplay, 100, doc.y + 6, { continued: true });
                doc.fontSize(16).font('Helvetica-Bold').text(`  [${result.verdict.toUpperCase()}]`, { continued: false });
                doc.fillColor('#475569').fontSize(11).font('Helvetica').text(result.verdictJustification || 'No detailed analysis provided.', 100, doc.y + 6, { width: 400, lineGap: 3 });

                doc.moveDown(6);
                doc.fillColor('#111827').fontSize(18).text('Identified Risks & Red Flags', { align: 'center' });
                doc.moveDown(1.5);

                if (result.redFlags && result.redFlags.length > 0) {
                    for (const flag of result.redFlags) {
                        const flagColor = flag.severity === 'high' ? '#dc2626' : (flag.severity === 'medium' ? '#d97706' : '#2563eb');
                        doc.fontSize(14).fillColor(flagColor).font('Helvetica-Bold').text(flag.title || flag.category || 'Risk Factor', 75);
                        doc.fontSize(9).fillColor('#94a3b8').text(`SEVERITY: ${flag.severity.toUpperCase()} | CATEGORY: ${flag.category || 'GENERAL'}`, 75);
                        doc.moveDown(0.3);
                        doc.fontSize(12).fillColor('#374151').font('Helvetica').text(flag.description, 75, doc.y, { align: 'justify', width: 445 });
                        if (flag.recommendation) {
                            doc.moveDown(0.3);
                            doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('RECOM: ', { continued: true }).font('Helvetica').text(flag.recommendation);
                        }
                        doc.moveDown(1.5);
                        doc.moveTo(75, doc.y).lineTo(520, doc.y).stroke('#f1f5f9');
                        doc.moveDown();
                    }
                }

                // --- PAGE 5: STRATEGIC GUIDANCE ---
                doc.addPage();
                doc.moveDown(3);
                doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text('4. Strategic Next Steps', { align: 'center' });
                doc.moveDown(2);

                doc.fontSize(12).fillColor('#4b5563').text('To minimize project risk, we recommend addressing these points with the contractor before moving forward.', 75, doc.y, { width: 445, align: 'center' });
                doc.moveDown(3);

                const questionsRows = (result.questionsToAsk || []).map(q => [
                    q.question || (typeof q === 'string' ? q : "N/A"),
                    (q.importance || 'Standard').toUpperCase()
                ]);

                if (questionsRows.length > 0) {
                    const qTable = {
                        headers: [
                            { label: "Strategic Question for Contractor", width: 340 },
                            { label: "Priority", width: 105 }
                        ],
                        rows: questionsRows
                    };

                    await doc.table(qTable, {
                        x: 75,
                        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11).fillColor('#1e40af'),
                        prepareRow: () => doc.font("Helvetica").fontSize(11).fillColor('#374151'),
                        padding: 12
                    });
                }

                doc.moveDown(5);
                doc.rect(75, doc.y, 445, 110).fill('#f9fafb').stroke('#f3f4f6');
                doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold').text('Core Recommendations', 100, doc.y + 20);
                doc.moveDown(0.7);
                const steps = [
                    'Capture all price variations in a formal written contract.',
                    'Verify contractor licence status on your state\'s register.',
                    'Set clear project milestones and linked payment dates.'
                ];
                steps.forEach((step, idx) => {
                    doc.fontSize(11).fillColor('#4b5563').font('Helvetica').text(`- ${step}`, 100, doc.y + 2);
                });

                // --- GLOBAL DECORATIONS (HEADERS/FOOTERS) ---
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);

                    // CRITICAL: Disable auto-page-break during decoration to prevent appending extra empty pages
                    const oldMargin = doc.page.margins.bottom;
                    doc.page.margins.bottom = 0;

                    addDecorations(i + 1, range.count);

                    // Restore for safety (though doc is about to end)
                    doc.page.margins.bottom = oldMargin;
                }

                doc.end();
            } catch (error) {
                logger.error('PDF Generation Error:', error);
                reject(error);
            }
        });
    }
}

module.exports = new ReportService();
