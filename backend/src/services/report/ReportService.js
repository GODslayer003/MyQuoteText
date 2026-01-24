// backend/src/services/report/ReportService.js

const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

class ReportService {
    constructor() {
        // Logo path - corrected to match actual location
        this.logoPath = path.join(__dirname, '..', '..', '..', '..', 'client', 'src', 'assets', 'logo.png');

        // Color schemes for tiers
        this.colors = {
            standard: {
                primary: '#f97316',      // Orange
                secondary: '#fb923c',
                accent: '#fdba74',
                dark: '#ea580c'
            },
            premium: {
                primary: '#000000',      // Black
                secondary: '#1f2937',
                accent: '#fbbf24',       // Gold
                dark: '#111827'
            },
            neutral: {
                dark: '#1f2937',
                gray: '#6b7280',
                lightGray: '#d1d5db',
                white: '#ffffff',
                background: '#f9fafb'
            }
        };
    }

    /**
     * Draw a crown icon (for Premium)
     */
    drawCrown(doc, x, y, size, color) {
        doc.save();
        doc.fillColor(color);

        // Crown base
        doc.polygon(
            [x, y + size],
            [x + size, y + size],
            [x + size * 0.9, y + size * 0.4],
            [x + size * 0.7, y + size * 0.6],
            [x + size * 0.5, y],
            [x + size * 0.3, y + size * 0.6],
            [x + size * 0.1, y + size * 0.4]
        ).fill();

        // Crown jewels (circles)
        doc.circle(x + size * 0.2, y + size * 0.5, size * 0.08).fill();
        doc.circle(x + size * 0.5, y + size * 0.15, size * 0.08).fill();
        doc.circle(x + size * 0.8, y + size * 0.5, size * 0.08).fill();

        doc.restore();
    }

    /**
     * Draw a star icon
     */
    drawStar(doc, x, y, size, color) {
        doc.save();
        doc.fillColor(color);

        const points = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const radius = i % 2 === 0 ? size : size * 0.4;
            points.push([
                x + radius * Math.cos(angle),
                y + radius * Math.sin(angle)
            ]);
        }

        doc.polygon(...points).fill();
        doc.restore();
    }

    /**
     * Draw a donut chart to visualize categorical data
     */
    drawDonutChart(doc, x, y, radius, data, colors) {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            // Placeholder for no data
            doc.save();
            doc.fillColor('#f3f4f6')
                .circle(x, y, radius)
                .fill();
            doc.fillColor('#9ca3af')
                .font('Helvetica')
                .fontSize(10)
                .text('No risks detected', x - 40, y - 5, { width: 80, align: 'center' });
            doc.restore();
            return;
        }

        let startAngle = -Math.PI / 2;
        const thickness = radius * 0.4;

        data.forEach((item, idx) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            // Draw segment using a series of lines/curves to simulate an arc if needed, 
            // but PDFKit has arc methods.
            doc.save();
            doc.fillColor(item.color || '#cbd5e1');

            // Path for the arc segment
            const innerRadius = radius - thickness;

            // Outer arc
            doc.moveTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle))
                .arc(x, y, radius, startAngle, endAngle, false)
                // Line to inner arc
                .lineTo(x + innerRadius * Math.cos(endAngle), y + innerRadius * Math.sin(endAngle))
                // Inner arc (reverse)
                .arc(x, y, innerRadius, endAngle, startAngle, true)
                .fill();

            doc.restore();
            startAngle = endAngle;
        });

        // Center text (Total)
        doc.fillColor('#111827')
            .font('Helvetica-Bold')
            .fontSize(16)
            .text(total.toString(), x - 20, y - 10, { width: 40, align: 'center' });
        doc.fillColor('#6b7280')
            .font('Helvetica')
            .fontSize(8)
            .text('TOTAL RISKS', x - 30, y + 8, { width: 60, align: 'center' });
    }

    /**
     * Draw a risk spectrum (Low to High)
     */
    drawRiskSpectrum(doc, x, y, width, height, value) {
        // Linear gradient simulated with segments
        const segments = 20;
        const segWidth = width / segments;

        doc.save();
        for (let i = 0; i < segments; i++) {
            const ratio = i / segments;
            // Green to Red interpolation
            const r = Math.floor(16 + ratio * (239 - 16));
            const g = Math.floor(185 + ratio * (68 - 185));
            const b = Math.floor(129 + ratio * (68 - 129));
            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

            doc.fillColor(color)
                .rect(x + i * segWidth, y, segWidth, height)
                .fill();
        }

        // Marker
        const markerX = x + (value / 100) * width;
        doc.fillColor('#111827')
            .strokeColor('#ffffff')
            .lineWidth(2)
            .moveTo(markerX, y - 5)
            .lineTo(markerX - 6, y - 15)
            .lineTo(markerX + 6, y - 15)
            .closePath()
            .fillAndStroke();

        // Labels
        doc.fillColor('#6b7280')
            .font('Helvetica')
            .fontSize(8)
            .text('LOW RISK', x, y + height + 5)
            .text('HIGH RISK', x + width - 50, y + height + 5, { align: 'right' });

        doc.restore();
    }

    /**
     * Draw a simple chart/graph for visual enhancement
     */
    drawCostDistributionChart(doc, x, y, width, height, costBreakdown) {
        // Calculate category totals
        const categories = {};
        (costBreakdown || []).forEach(item => {
            const cat = (item.category || 'Other').toUpperCase();
            categories[cat] = (categories[cat] || 0) + (item.totalPrice || item.amount || 0);
        });

        const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
        if (total === 0) return;

        // Draw simple bar chart
        const catNames = Object.keys(categories);
        const barHeight = (height - (catNames.length - 1) * 10) / catNames.length;
        const maxValue = Math.max(...Object.values(categories));

        catNames.forEach((cat, idx) => {
            const value = categories[cat];
            const barWidth = (value / maxValue) * (width - 100);
            const barY = y + idx * (barHeight + 10);

            // Bar background
            doc.save();
            doc.fillColor('#e5e7eb')
                .rect(x + 100, barY, width - 100, barHeight)
                .fill();
            doc.restore();

            // Bar fill
            doc.save();
            doc.fillColor('#f97316')
                .rect(x + 100, barY, barWidth, barHeight)
                .fill();
            doc.restore();

            // Label
            doc.fillColor('#374151')
                .font('Helvetica')
                .fontSize(9)
                .text(cat, x, barY + barHeight / 2 - 4, { width: 90, align: 'left' });

            // Value
            doc.fillColor('#111827')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text(`$${value.toLocaleString()}`, x + 100 + barWidth + 5, barY + barHeight / 2 - 4);
        });
    }

    /**
     * Main entry point - Generate professional PDF report
     */
    async generateProfessionalReport(job, result, effectiveTier = 'standard') {
        return new Promise(async (resolve, reject) => {
            try {
                const tier = effectiveTier.toLowerCase();
                const colors = tier === 'premium' ? this.colors.premium : this.colors.standard;

                logger.info(`Generating ${tier} PDF report for job ${job.jobId}`);

                const doc = new PDFDocument({
                    margin: 0,
                    size: 'A4',
                    bufferPages: true,
                    info: {
                        Title: `MyQuoteMate Analysis - ${job.jobId}`,
                        Author: 'MyQuoteMate AI',
                        Subject: 'Quote Analysis & Risk Assessment Report'
                    }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Get user/client information
                const clientInfo = this.extractClientInfo(job);

                // Generate all pages
                await this.generatePage1Cover(doc, job, result, tier, colors, clientInfo);
                await this.generatePage2Summary(doc, job, result, tier, colors, clientInfo);
                await this.generatePage3CostBreakdown(doc, job, result, tier, colors);
                await this.generatePage4RiskAnalysis(doc, job, result, tier, colors);

                if (tier === 'premium') {
                    await this.generatePage5Benchmarking(doc, job, result, tier, colors);
                }

                await this.generatePage6Recommendations(doc, job, result, tier, colors);
                await this.generatePage7Appendix(doc, job, result, tier, colors);

                doc.end();

            } catch (error) {
                logger.error('PDF generation failed:', error);
                reject(error);
            }
        });
    }

    /**
     * Extract client information from job
     */
    extractClientInfo(job) {
        let clientName = 'Valued Client';
        let clientEmail = 'Not provided';

        if (job.userId) {
            if (job.userId.fullName) {
                clientName = job.userId.fullName;
            } else if (job.userId.firstName || job.userId.lastName) {
                clientName = `${job.userId.firstName || ''} ${job.userId.lastName || ''}`.trim();
            }
            clientEmail = job.userId.email || clientEmail;
        } else if (job.leadId) {
            clientEmail = job.leadId.email || clientEmail;
        }

        if (job.metadata?.name) clientName = job.metadata.name;
        if (job.metadata?.email) clientEmail = job.metadata.email;

        return { clientName, clientEmail };
    }

    /**
     * Add header to page (logo + page number)
     */
    addHeader(doc, pageNum, tier, colors) {
        const pageWidth = doc.page.width;

        // Header Background bar
        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.03)
            .rect(0, 0, pageWidth, 80)
            .fill();
        doc.restore();

        // Logo
        if (fs.existsSync(this.logoPath)) {
            try {
                doc.image(this.logoPath, 40, 15, { height: 50 });
            } catch (err) {
                // Fallback to text
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(22)
                    .text('MyQuoteMate', 40, 30);
            }
        } else {
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(22)
                .text('MyQuoteMate', 40, 30);
        }

        // Page number badge
        const badgeWidth = 90;
        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.1)
            .roundedRect(pageWidth - 40 - badgeWidth, 28, badgeWidth, 24, 12)
            .fill();
        doc.restore();

        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(`SECTION ${pageNum}`, pageWidth - 40 - badgeWidth, 35, {
                width: badgeWidth,
                align: 'center'
            });

        // Header line
        doc.moveTo(40, 75)
            .lineTo(pageWidth - 40, 75)
            .lineWidth(1.5)
            .strokeColor(colors.primary)
            .strokeOpacity(0.2)
            .stroke();
    }

    /**
     * Add footer to page
     */
    addFooter(doc, jobId) {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;

        // Footer line
        doc.moveTo(40, pageHeight - 60)
            .lineTo(pageWidth - 40, pageHeight - 60)
            .lineWidth(1)
            .strokeColor(this.colors.neutral.lightGray)
            .stroke();

        // Disclaimer
        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(8)
            .text(
                'This report is informational and based on the provided quote. Confirm details with the supplier before proceeding.',
                40,
                pageHeight - 50,
                { width: pageWidth - 80, align: 'center' }
            );

        // Reference ID
        doc.fillColor(this.colors.neutral.gray)
            .fontSize(7)
            .text(
                `Report ID: ${jobId.substring(0, 12).toUpperCase()} | Generated by MyQuoteMate AI`,
                40,
                pageHeight - 35,
                { width: pageWidth - 80, align: 'center' }
            );
    }

    /**
     * PAGE 1: Cover Page
     */
    async generatePage1Cover(doc, job, result, tier, colors, clientInfo) {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const centerX = pageWidth / 2;

        // Background
        doc.rect(0, 0, pageWidth, pageHeight)
            .fill(this.colors.neutral.background);

        // Decorative circles
        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.05)
            .circle(pageWidth, 0, 300)
            .fill()
            .circle(0, pageHeight, 200)
            .fill();
        doc.restore();

        // Logo (larger on cover)
        if (fs.existsSync(this.logoPath)) {
            try {
                doc.image(this.logoPath, centerX - 110, 100, { width: 220 });
            } catch (err) {
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(42)
                    .text('MyQuoteMate', 0, 140, { align: 'center', width: pageWidth });
            }
        } else {
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(42)
                .text('MyQuoteMate', 0, 140, { align: 'center', width: pageWidth });
        }

        // Main title
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(36)
            .text('Quote Analysis &', 0, 260, { align: 'center', width: pageWidth });

        doc.text('Risk Assessment', 0, 300, { align: 'center', width: pageWidth });

        // Subtitle
        doc.fillColor(colors.primary)
            .font('Helvetica')
            .fontSize(16)
            .text('Professional AI-Powered Report', 0, 355, { align: 'center', width: pageWidth });

        // Tier badge
        const tierLabel = tier === 'premium' ? 'PREMIUM ANALYSIS' : 'STANDARD ANALYSIS';
        const badgeY = 410;

        doc.save();
        doc.fillColor(tier === 'premium' ? '#000000' : colors.primary)
            .roundedRect(centerX - 120, badgeY, 240, 40, 20)
            .fill();
        doc.restore();

        if (tier === 'premium') {
            // Add golden crown for premium
            this.drawCrown(doc, centerX - 105, badgeY + 10, 20, '#fbbf24');

            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(13)
                .text(tierLabel, centerX - 75, badgeY + 13, { width: 180, align: 'center' });
        } else {
            // Add star for standard
            this.drawStar(doc, centerX - 100, badgeY + 20, 10, '#ffffff');

            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(13)
                .text(tierLabel, centerX - 85, badgeY + 13, { width: 180, align: 'center' });
        }

        // Client information card
        const cardY = 490;
        doc.save();
        doc.fillColor('#ffffff')
            .roundedRect(centerX - 180, cardY, 360, 200, 12)
            .fill()
            .strokeColor(this.colors.neutral.lightGray)
            .lineWidth(1)
            .stroke();
        doc.restore();

        // Card header
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('REPORT INFORMATION', centerX - 160, cardY + 20, { width: 320, align: 'center' });

        doc.moveTo(centerX - 140, cardY + 40)
            .lineTo(centerX + 140, cardY + 40)
            .lineWidth(1)
            .strokeColor(this.colors.neutral.lightGray)
            .stroke();

        // Client details
        const detailsY = cardY + 60;
        const labelX = centerX - 140;

        // Client name
        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text('Client:', labelX, detailsY);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text(clientInfo.clientName, labelX, detailsY + 18, { width: 280 });

        // Email
        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text('Email:', labelX, detailsY + 50);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text(clientInfo.clientEmail, labelX, detailsY + 68, { width: 280 });

        // Report ID
        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text('Report ID:', labelX, detailsY + 100);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text(job.jobId.substring(0, 20).toUpperCase(), labelX, detailsY + 118);

        // Generation date
        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text('Generated:', labelX + 180, detailsY + 100);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text(new Date().toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }), labelX + 180, detailsY + 118, { width: 100 });

        // Status indicator
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('✓ Analysis Complete', 0, 740, { align: 'center', width: pageWidth });

        // Add new page for next section
        doc.addPage();
    }

    /**
     * PAGE 2: Executive Summary
     */
    async generatePage2Summary(doc, job, result, tier, colors, clientInfo) {
        this.addHeader(doc, 2, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Executive Summary', 40, currentY);

        // Underline
        doc.moveTo(40, currentY + 38)
            .lineTo(160, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        // Key metrics grid (2x2)
        const gridStartY = currentY;
        const boxWidth = (pageWidth - 100) / 2;
        const boxHeight = 100;
        const gap = 20;

        const verdictScore = result.verdictScore || 0;
        const normalizedScore = verdictScore > 10 ? verdictScore / 10 : verdictScore;

        const metrics = [
            {
                label: 'QUOTE INTEGRITY',
                value: `${normalizedScore.toFixed(1)}/10`,
                color: normalizedScore >= 8 ? '#10b981' : normalizedScore >= 6 ? '#f59e0b' : '#ef4444',
                icon: '&'
            },
            {
                label: 'RISK LEVEL',
                value: result.redFlags?.length > 3 ? 'High' : result.redFlags?.length > 1 ? 'Medium' : 'Low',
                color: result.redFlags?.length > 3 ? '#ef4444' : result.redFlags?.length > 1 ? '#f59e0b' : '#10b981',
                icon: '!'
            },
            {
                label: 'TOTAL COST',
                value: `$${(result.overallCost || result.costs?.overall || 0).toLocaleString()}`,
                color: colors.primary,
                icon: '$'
            },
            {
                label: 'CONFIDENCE',
                value: `${result.confidence || 95}%`,
                color: '#3b82f6',
                icon: '•'
            }
        ];

        metrics.forEach((metric, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = 40 + col * (boxWidth + gap);
            const y = gridStartY + row * (boxHeight + gap);

            // Box
            doc.save();
            doc.fillColor('#ffffff')
                .roundedRect(x, y, boxWidth, boxHeight, 8)
                .fill()
                .strokeColor(this.colors.neutral.lightGray)
                .lineWidth(1)
                .stroke();
            doc.restore();

            // Label
            doc.fillColor(this.colors.neutral.gray)
                .font('Helvetica')
                .fontSize(11)
                .text(metric.label, x + 20, y + 20);

            // Value
            doc.fillColor(metric.color)
                .font('Helvetica-Bold')
                .fontSize(24)
                .text(metric.value, x + 20, y + 45);

            // Icon circle (properly aligned)
            doc.save();
            doc.fillColor(metric.color)
                .fillOpacity(0.1)
                .circle(x + boxWidth - 35, y + 50, 18)
                .fill();
            doc.restore();

            doc.fillColor(metric.color)
                .font('Helvetica-Bold')
                .fontSize(20)
                .text(metric.icon, x + boxWidth - 43, y + 40, { width: 16, align: 'center' });
        });

        currentY = gridStartY + 2 * (boxHeight + gap) + 30;

        // Summary text
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Analysis Overview', 40, currentY);

        currentY += 25;

        const summaryText = result.summary || 'Quote analysis completed successfully.';
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica')
            .fontSize(11)
            .text(summaryText, 40, currentY, {
                width: pageWidth - 80,
                align: 'justify',
                lineGap: 4
            });

        currentY = doc.y + 20;

        // Verdict justification
        if (result.verdictJustification) {
            doc.fillColor(this.colors.neutral.dark)
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('Price Verdict', 40, currentY);

            currentY += 25;

            doc.save();
            doc.fillColor(colors.primary)
                .fillOpacity(0.05)
                .roundedRect(40, currentY, pageWidth - 80, 80, 8)
                .fill();
            doc.restore();

            doc.fillColor(this.colors.neutral.dark)
                .font('Helvetica')
                .fontSize(11)
                .text(result.verdictJustification, 55, currentY + 15, {
                    width: pageWidth - 110,
                    align: 'justify',
                    lineGap: 4
                });
        }

        this.addFooter(doc, job.jobId);
        doc.addPage();
    }

    /**
     * PAGE 3: Detailed Cost Breakdown
     */
    async generatePage3CostBreakdown(doc, job, result, tier, colors) {
        this.addHeader(doc, 3, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Cost Breakdown', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(200, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        // Cost breakdown table
        const costItems = result.costBreakdown || [];

        if (costItems.length > 0) {
            const tableData = {
                headers: [
                    { label: 'ITEM DESCRIPTION', property: 'desc', width: 240 },
                    { label: 'CATEGORY', property: 'cat', width: 100 },
                    { label: 'AMOUNT', property: 'price', width: 130, align: 'right' }
                ],
                rows: costItems.slice(0, 15).map(item => [
                    (item.description || 'General Item').substring(0, 50),
                    (item.category || 'General').toUpperCase(),
                    `$${(item.totalPrice || item.amount || 0).toLocaleString()}`
                ])
            };

            await doc.table(tableData, {
                x: 40,
                y: currentY,
                prepareHeader: () => {
                    doc.font('Helvetica-Bold')
                        .fontSize(9)
                        .fillColor(colors.primary);
                    return doc;
                },
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font('Helvetica')
                        .fontSize(10)
                        .fillColor(this.colors.neutral.dark);
                    return doc;
                }
            });

            currentY = doc.y + 30;

            // Add cost distribution chart if space available
            if (currentY < 500 && costItems.length > 1) {
                doc.fillColor(this.colors.neutral.dark)
                    .font('Helvetica-Bold')
                    .fontSize(12)
                    .text('Cost Distribution by Category', 40, currentY);

                currentY += 25;
                this.drawCostDistributionChart(doc, 40, currentY, pageWidth - 80, 150, costItems);
                currentY += 160;
            }
        } else {
            doc.fillColor(this.colors.neutral.gray)
                .font('Helvetica')
                .fontSize(11)
                .text('No detailed cost breakdown available for this quote.', 40, currentY, {
                    width: pageWidth - 80,
                    align: 'center'
                });
            currentY += 50;
        }

        // Total summary box
        const totalCost = result.overallCost || result.costs?.overall ||
            costItems.reduce((sum, item) => sum + (item.totalPrice || item.amount || 0), 0);

        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.1)
            .roundedRect(40, currentY, pageWidth - 80, 60, 8)
            .fill();
        doc.restore();

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(13)
            .text('TOTAL QUOTE VALUE', 60, currentY + 15);

        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(26)
            .text(`$${totalCost.toLocaleString()} AUD`, 60, currentY + 35);

        this.addFooter(doc, job.jobId);
        doc.addPage();
    }

    /**
     * PAGE 4: Risk Analysis & Red Flags
     */
    async generatePage4RiskAnalysis(doc, job, result, tier, colors) {
        this.addHeader(doc, 4, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Risk Analysis', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(180, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 60;

        // --- Graphical Analysis Section ---
        const redFlags = result.redFlags || [];
        const riskCounts = {
            critical: redFlags.filter(f => f.severity === 'critical').length,
            high: redFlags.filter(f => f.severity === 'high').length,
            medium: redFlags.filter(f => f.severity === 'medium').length,
            low: redFlags.filter(f => f.severity === 'low').length || (redFlags.length === 0 ? 0 : 0)
        };

        const donutData = [
            { label: 'Critical', value: riskCounts.critical, color: '#dc2626' },
            { label: 'High', value: riskCounts.high, color: '#ef4444' },
            { label: 'Medium', value: riskCounts.medium, color: '#f59e0b' },
            { label: 'Low', value: riskCounts.low, color: '#10b981' }
        ].filter(d => d.value > 0);

        // Sidebar for Graphical analysis
        doc.save();
        doc.fillColor('#f8fafc')
            .roundedRect(40, currentY, pageWidth - 80, 160, 12)
            .fill()
            .strokeColor('#e2e8f0')
            .lineWidth(1)
            .stroke();
        doc.restore();

        // 1. Donut Chart
        this.drawDonutChart(doc, 140, currentY + 80, 55, donutData.length > 0 ? donutData : [{ value: 1, color: '#e2e8f0' }], colors);

        // 2. Risk Spectrum
        const riskScore = Math.min(100, (riskCounts.critical * 40 + riskCounts.high * 25 + riskCounts.medium * 10) || 5);
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('OVERALL RISK EXPOSURE', 250, currentY + 30);

        this.drawRiskSpectrum(doc, 250, currentY + 55, pageWidth - 320, 15, riskScore);

        // Legend for donut
        let legendY = currentY + 90;
        if (donutData.length > 0) {
            donutData.forEach(item => {
                doc.fillColor(item.color)
                    .circle(255, legendY + 4, 4)
                    .fill();
                doc.fillColor(this.colors.neutral.gray)
                    .font('Helvetica')
                    .fontSize(9)
                    .text(`${item.label}: ${item.value}`, 265, legendY);
                legendY += 15;
            });
        } else {
            doc.fillColor('#10b981')
                .font('Helvetica-Bold')
                .fontSize(10)
                .text('SYSTEM HEALTH: OPTIMAL', 250, currentY + 90);
        }

        currentY += 190;

        // Red flags list title
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Identified Risk Items', 40, currentY);

        currentY += 25;

        if (redFlags.length > 0) {
            redFlags.slice(0, 8).forEach((flag, idx) => {
                const severityColor =
                    flag.severity === 'critical' ? '#dc2626' :
                        flag.severity === 'high' ? '#ef4444' :
                            flag.severity === 'medium' ? '#f59e0b' : '#10b981';

                // Flag box
                doc.save();
                doc.fillColor('#ffffff')
                    .roundedRect(40, currentY, pageWidth - 80, 80, 8)
                    .fill()
                    .strokeColor(this.colors.neutral.lightGray)
                    .lineWidth(1)
                    .stroke();
                doc.restore();

                // Severity badge
                doc.save();
                doc.fillColor(severityColor)
                    .fillOpacity(0.15)
                    .roundedRect(55, currentY + 15, 80, 22, 11)
                    .fill();
                doc.restore();

                doc.fillColor(severityColor)
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .text((flag.severity || 'medium').toUpperCase(), 55, currentY + 20, {
                        width: 80,
                        align: 'center'
                    });

                // Flag title
                doc.fillColor(this.colors.neutral.dark)
                    .font('Helvetica-Bold')
                    .fontSize(12)
                    .text(flag.title || flag.category || 'Risk Identified', 150, currentY + 18, {
                        width: pageWidth - 210
                    });

                // Description
                doc.fillColor(this.colors.neutral.gray)
                    .font('Helvetica')
                    .fontSize(10)
                    .text(flag.description || 'Review this item carefully.', 55, currentY + 45, {
                        width: pageWidth - 110,
                        lineGap: 2
                    });

                currentY += 90;

                if (currentY > 650 && idx < redFlags.length - 1) {
                    this.addFooter(doc, job.jobId);
                    doc.addPage();
                    this.addHeader(doc, 4, tier, colors);
                    currentY = 100;
                }
            });
        } else {
            doc.save();
            doc.fillColor('#10b981')
                .fillOpacity(0.1)
                .roundedRect(40, currentY, pageWidth - 80, 80, 8)
                .fill();
            doc.restore();

            doc.fillColor('#10b981')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('✓ No Critical Risks Detected', 60, currentY + 20);

            doc.fillColor(this.colors.neutral.gray)
                .font('Helvetica')
                .fontSize(11)
                .text('This quote appears to be structurally sound with no major red flags identified.', 60, currentY + 45, {
                    width: pageWidth - 120
                });
        }

        this.addFooter(doc, job.jobId);
        doc.addPage();
    }

    /**
     * PAGE 5: Market Benchmarking (Premium Only)
     */
    async generatePage5Benchmarking(doc, job, result, tier, colors) {
        this.addHeader(doc, 5, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Market Benchmarking', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(250, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        // Benchmarking data
        const benchmarks = result.benchmarking || [];

        if (benchmarks.length > 0) {
            benchmarks.slice(0, 6).forEach((benchmark, idx) => {
                // Benchmark item box
                doc.save();
                doc.fillColor('#ffffff')
                    .roundedRect(40, currentY, pageWidth - 80, 90, 8)
                    .fill()
                    .strokeColor(this.colors.neutral.lightGray)
                    .lineWidth(1)
                    .stroke();
                doc.restore();

                // Item name
                doc.fillColor(this.colors.neutral.dark)
                    .font('Helvetica-Bold')
                    .fontSize(13)
                    .text(benchmark.item, 60, currentY + 15);

                // Quote price vs market
                const barY = currentY + 45;
                const barWidth = pageWidth - 160;
                const quotePrice = benchmark.quotePrice || 0;
                const marketMin = benchmark.marketMin || 0;
                const marketMax = benchmark.marketMax || 100;
                const marketAvg = benchmark.marketAvg || 50;

                // Market range bar (background)
                doc.save();
                doc.fillColor(this.colors.neutral.lightGray)
                    .fillOpacity(0.3)
                    .roundedRect(60, barY, barWidth, 20, 10)
                    .fill();
                doc.restore();

                // Quote position indicator
                const range = marketMax - marketMin;
                const position = range > 0 ? ((quotePrice - marketMin) / range) * barWidth : barWidth / 2;
                const clampedPosition = Math.max(0, Math.min(barWidth - 4, position));

                doc.save();
                doc.fillColor(colors.accent)
                    .circle(60 + clampedPosition, barY + 10, 8)
                    .fill();
                doc.restore();

                // Labels
                doc.fillColor(this.colors.neutral.gray)
                    .font('Helvetica')
                    .fontSize(9)
                    .text(`Min: $${marketMin}`, 60, barY + 25)
                    .text(`Avg: $${marketAvg}`, 60 + barWidth / 2 - 25, barY + 25)
                    .text(`Max: $${marketMax}`, 60 + barWidth - 50, barY + 25);

                // Quote value
                doc.fillColor(colors.accent)
                    .font('Helvetica-Bold')
                    .fontSize(11)
                    .text(`Your Quote: $${quotePrice}`, 60, barY + 40);

                // Percentile
                if (benchmark.percentile !== undefined) {
                    doc.fillColor(this.colors.neutral.gray)
                        .font('Helvetica')
                        .fontSize(9)
                        .text(`${benchmark.percentile}th percentile`, pageWidth - 140, barY + 40);
                }

                currentY += 100;
            });
        } else {
            doc.fillColor(this.colors.neutral.gray)
                .font('Helvetica')
                .fontSize(11)
                .text('Market benchmarking data is being generated...', 40, currentY, {
                    width: pageWidth - 80,
                    align: 'center'
                });
        }

        this.addFooter(doc, job.jobId);
        doc.addPage();
    }

    /**
     * PAGE 6: Recommendations & Next Steps
     */
    async generatePage6Recommendations(doc, job, result, tier, colors) {
        this.addHeader(doc, 6, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Recommendations', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(220, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        // Recommendations
        const recommendations = result.recommendations || [];

        if (recommendations.length > 0) {
            recommendations.slice(0, 5).forEach((rec, idx) => {
                // Recommendation box
                doc.save();
                doc.fillColor('#ffffff')
                    .roundedRect(40, currentY, pageWidth - 80, 100, 8)
                    .fill()
                    .strokeColor(this.colors.neutral.lightGray)
                    .lineWidth(1)
                    .stroke();
                doc.restore();

                // Number badge (properly centered)
                doc.save();
                doc.fillColor(colors.primary)
                    .circle(65, currentY + 25, 18)
                    .fill();
                doc.restore();

                doc.fillColor('#ffffff')
                    .font('Helvetica-Bold')
                    .fontSize(14)
                    .text(`${idx + 1}`, 58, currentY + 17, { width: 14, align: 'center' });

                // Title
                doc.fillColor(this.colors.neutral.dark)
                    .font('Helvetica-Bold')
                    .fontSize(13)
                    .text(rec.title, 95, currentY + 18, {
                        width: pageWidth - 160
                    });

                // Description
                doc.fillColor(this.colors.neutral.gray)
                    .font('Helvetica')
                    .fontSize(10)
                    .text(rec.description, 60, currentY + 45, {
                        width: pageWidth - 120,
                        lineGap: 2
                    });

                // Savings & difficulty
                if (rec.potentialSavings) {
                    doc.fillColor('#10b981')
                        .font('Helvetica-Bold')
                        .fontSize(10)
                        .text(`💰 Save up to $${rec.potentialSavings}`, 60, currentY + 80);
                }

                if (rec.difficulty) {
                    const difficultyColor =
                        rec.difficulty === 'easy' ? '#10b981' :
                            rec.difficulty === 'moderate' ? '#f59e0b' : '#ef4444';

                    doc.fillColor(difficultyColor)
                        .font('Helvetica')
                        .fontSize(9)
                        .text(`Difficulty: ${rec.difficulty}`, pageWidth - 140, currentY + 80);
                }

                currentY += 110;
            });
        }

        // Questions to ask
        const questions = result.questionsToAsk || [];
        if (questions.length > 0 && currentY < 550) {
            doc.fillColor(this.colors.neutral.dark)
                .font('Helvetica-Bold')
                .fontSize(16)
                .text('Questions to Ask Your Contractor', 40, currentY);

            currentY += 30;

            questions.slice(0, 5).forEach((q, idx) => {
                const questionText = typeof q === 'string' ? q : q.question;

                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(10)
                    .text(`${idx + 1}.`, 50, currentY);

                doc.fillColor(this.colors.neutral.dark)
                    .font('Helvetica')
                    .fontSize(10)
                    .text(questionText, 70, currentY, {
                        width: pageWidth - 110,
                        lineGap: 2
                    });

                currentY = doc.y + 8;
            });
        }

        this.addFooter(doc, job.jobId);
        doc.addPage();
    }

    /**
     * PAGE 7: Appendix & Disclaimer
     */
    async generatePage7Appendix(doc, job, result, tier, colors) {
        this.addHeader(doc, 7, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Appendix', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(140, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        // Methodology
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Analysis Methodology', 40, currentY);

        currentY += 25;

        const methodology = `This report was generated using MyQuoteMate's AI-powered analysis engine, which examines quote documents for pricing fairness, potential risks, and market competitiveness. The analysis combines document extraction, natural language processing, and market data comparison to provide comprehensive insights.`;

        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text(methodology, 40, currentY, {
                width: pageWidth - 80,
                align: 'justify',
                lineGap: 4
            });

        currentY = doc.y + 30;

        // Disclaimer
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Important Disclaimer', 40, currentY);

        currentY += 25;

        const disclaimer = `This report is provided for informational purposes only and should not be considered as professional financial, legal, or construction advice. All analysis is based on the information provided in the submitted quote document. MyQuoteMate makes no warranties about the accuracy, completeness, or reliability of this analysis. Users should verify all information with qualified professionals before making any decisions. Market benchmarking data is indicative and based on general Australian construction industry averages for 2026.`;

        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text(disclaimer, 40, currentY, {
                width: pageWidth - 80,
                align: 'justify',
                lineGap: 4
            });

        currentY = doc.y + 30;

        // Contact information
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Need Help?', 40, currentY);

        currentY += 25;

        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.05)
            .roundedRect(40, currentY, pageWidth - 80, 80, 8)
            .fill();
        doc.restore();

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('Contact Support', 60, currentY + 15);

        doc.fillColor(this.colors.neutral.gray)
            .font('Helvetica')
            .fontSize(10)
            .text('Email: support@myquotemate.com.au', 60, currentY + 35)
            .text('Website: www.myquotemate.com.au', 60, currentY + 50);

        this.addFooter(doc, job.jobId);
    }
}

module.exports = new ReportService();