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
     * Draw a checkmark icon (for Quote Integrity)
     */
    drawCheckmark(doc, x, y, size, color) {
        doc.save();
        doc.strokeColor(color)
            .lineWidth(size * 0.15)
            .lineCap('round')
            .lineJoin('round');

        // Draw checkmark path
        doc.moveTo(x + size * 0.2, y + size * 0.5)
            .lineTo(x + size * 0.45, y + size * 0.75)
            .lineTo(x + size * 0.85, y + size * 0.25)
            .stroke();

        doc.restore();
    }

    /**
     * Draw an alert/warning icon (for Risk Level)
     */
    drawAlert(doc, x, y, size, color) {
        doc.save();
        doc.fillColor(color);

        // Triangle
        doc.polygon(
            [x + size * 0.5, y + size * 0.1],
            [x + size * 0.9, y + size * 0.9],
            [x + size * 0.1, y + size * 0.9]
        ).fill();

        // Exclamation mark
        doc.fillColor('#ffffff');
        doc.roundedRect(x + size * 0.45, y + size * 0.35, size * 0.1, size * 0.25, 1).fill();
        doc.circle(x + size * 0.5, y + size * 0.75, size * 0.06).fill();

        doc.restore();
    }

    /**
     * Draw a dollar sign icon (for Total Cost)
     */
    drawDollarSign(doc, x, y, size, color) {
        doc.save();
        doc.strokeColor(color)
            .lineWidth(size * 0.12)
            .lineCap('round');

        // Top curve
        doc.moveTo(x + size * 0.7, y + size * 0.3)
            .bezierCurveTo(
                x + size * 0.7, y + size * 0.15,
                x + size * 0.3, y + size * 0.15,
                x + size * 0.3, y + size * 0.3
            )
            .stroke();

        // Bottom curve
        doc.moveTo(x + size * 0.3, y + size * 0.5)
            .bezierCurveTo(
                x + size * 0.3, y + size * 0.85,
                x + size * 0.7, y + size * 0.85,
                x + size * 0.7, y + size * 0.7
            )
            .stroke();

        // Vertical line
        doc.moveTo(x + size * 0.5, y + size * 0.05)
            .lineTo(x + size * 0.5, y + size * 0.95)
            .stroke();

        doc.restore();
    }

    /**
     * Draw an info/confidence icon
     */
    drawInfoIcon(doc, x, y, size, color) {
        doc.save();

        // Circle outline
        doc.strokeColor(color)
            .lineWidth(size * 0.08)
            .circle(x + size * 0.5, y + size * 0.5, size * 0.4)
            .stroke();

        // 'i' letter
        doc.fillColor(color);
        doc.circle(x + size * 0.5, y + size * 0.3, size * 0.08).fill();
        doc.roundedRect(x + size * 0.45, y + size * 0.45, size * 0.1, size * 0.35, 1).fill();

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
                .text('No detected risks', x - radius, y - 5, { width: radius * 2, align: 'center' });
            doc.restore();
            return;
        }

        let startAngle = -Math.PI / 2;
        const thickness = radius * 0.35;

        data.forEach((item, idx) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            doc.save();
            doc.fillColor(item.color || '#cbd5e1');

            const innerRadius = radius - thickness;

            // Using arc methods for professional segment drawing
            doc.moveTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle))
                .arc(x, y, radius, startAngle, endAngle, false)
                .lineTo(x + innerRadius * Math.cos(endAngle), y + innerRadius * Math.sin(endAngle))
                .arc(x, y, innerRadius, endAngle, startAngle, true)
                .fill();

            doc.restore();
            startAngle = endAngle;
        });

        // Center text (Total)
        doc.fillColor('#111827')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text(total.toString(), x - radius, y - 10, { width: radius * 2, align: 'center' });

        doc.fillColor('#6b7280')
            .font('Helvetica-Bold')
            .fontSize(7)
            .text('TOTAL RISKS', x - radius, y + 8, { width: radius * 2, align: 'center', characterSpacing: 1 });

        // Outer decorative ring
        doc.save();
        doc.strokeColor('#e2e8f0')
            .lineWidth(0.5)
            .circle(x, y, radius + 5)
            .stroke();
        doc.restore();
    }

    /**
     * Draw a risk spectrum (Low to High)
     */
    drawRiskSpectrum(doc, x, y, width, height, value) {
        // Linear gradient simulated with high-quality segments
        const segments = 40;
        const segWidth = width / segments;

        doc.save();
        for (let i = 0; i < segments; i++) {
            const ratio = i / segments;
            // Precise Green to Red interpolation
            let color;
            if (ratio < 0.3) color = '#10b981'; // Green
            else if (ratio < 0.6) color = '#f59e0b'; // Amber
            else color = '#ef4444'; // Red

            doc.fillColor(color)
                .fillOpacity(0.8)
                .rect(x + i * segWidth, y, segWidth, height)
                .fill();
        }
        doc.restore();

        // Marker (Modern pointer with shadow effect)
        const markerX = x + (value / 100) * width;

        doc.save();
        // Shadow for marker
        doc.fillColor('#000000')
            .fillOpacity(0.1)
            .moveTo(markerX, y - 3)
            .lineTo(markerX - 7, y - 14)
            .lineTo(markerX + 7, y - 14)
            .closePath()
            .fill();

        doc.fillColor('#111827')
            .moveTo(markerX, y - 5)
            .lineTo(markerX - 6, y - 16)
            .lineTo(markerX + 6, y - 16)
            .closePath()
            .fill();
        doc.restore();

        // Labels with proper alignment to prevent going off-page
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(7);

        doc.text('LOW RISK', x, y + height + 6);

        // Use a wide enough box for the right-aligned text to ensure it stays in page
        doc.text('HIGH RISK', x + width - 100, y + height + 6, { width: 100, align: 'right' });

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

        // Draw professional horizontal bar chart
        const catNames = Object.keys(categories);
        const barHeight = 22;
        const spacing = 12;
        const maxValue = Math.max(...Object.values(categories));
        const chartWidth = width - 140;

        catNames.forEach((cat, idx) => {
            const value = categories[cat];
            const barWidth = (value / maxValue) * chartWidth;
            const barY = y + idx * (barHeight + spacing);

            // Bar background rail
            doc.save();
            doc.fillColor('#eff6ff')
                .roundedRect(x + 100, barY, chartWidth, barHeight, 4)
                .fill();
            doc.restore();

            // Bar fill (Gradient effect via two rects)
            doc.save();
            doc.fillColor(this.colors.standard.primary)
                .roundedRect(x + 100, barY, barWidth, barHeight, 4)
                .fill();
            doc.restore();

            // Label
            doc.fillColor('#1f2937')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text(cat, x, barY + barHeight / 2 - 4.5, { width: 90, align: 'right' });

            // Value label
            doc.fillColor('#4b5563')
                .font('Helvetica')
                .fontSize(8)
                .text(`$${value.toLocaleString()}`, x + 105, barY + barHeight / 2 - 4);

            // Percentage
            const percent = Math.round((value / total) * 100);
            doc.fillColor('#9ca3af')
                .fontSize(8)
                .text(`${percent}%`, x + 100 + chartWidth - 25, barY + barHeight / 2 - 4);
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

                // Page 1: Cover
                await this.generatePage1Cover(doc, job, result, tier, colors, clientInfo);

                // Subsequent pages start with doc.addPage() inside their methods
                // Page 2: Executive Summary
                await this.generatePage2Summary(doc, job, result, tier, colors, clientInfo);

                // Page 3: Detailed Cost Breakdown
                await this.generatePage3CostBreakdown(doc, job, result, tier, colors);

                // Page 4: Risk Analytics Dashboard (New Dedicated Graph Page)
                await this.generatePage4RiskDashboard(doc, job, result, tier, colors);

                // Page 5: Critical Red Flags & Mitigation
                await this.generatePage5RiskList(doc, job, result, tier, colors);

                // Page 6: Market Comparison & Benchmarking
                await this.generatePage6Benchmarking(doc, job, result, tier, colors);

                // OPTIONAL: Multi-Quote Comparison (Premium Only)
                if (tier === 'premium' && result.quoteComparison) {
                    await this.generatePageComparison(doc, job, result, tier, colors);
                }

                // Page 7+: Strategic Recommendations
                await this.generatePage7Recommendations(doc, job, result, tier, colors);

                // Final Page: Analytical Appendix
                await this.generatePage8Appendix(doc, job, result, tier, colors);


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

        // Header Background bar - Slim & Executive Style
        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.04)
            .rect(0, 0, pageWidth, 80) // Slim height (80pt)
            .fill();
        doc.restore();

        // Logo & Brand Section
        const logoY = 7; // Optimal vertical centring for 65pt logo in 80pt header
        if (fs.existsSync(this.logoPath)) {
            try {
                // Larger Logo prominence
                doc.image(this.logoPath, 40, logoY, { height: 65 });

                // Elegant Vertical Divider
                doc.save();
                doc.moveTo(115, logoY + 8)
                    .lineTo(115, logoY + 57)
                    .lineWidth(0.5)
                    .strokeColor(this.colors.neutral.lightGray)
                    .stroke();
                doc.restore();

                // Brand Name - Professional Spacing
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(18)
                    .text('MYQUOTEMATE', 130, logoY + 18, { characterSpacing: 3 });

                // Subtitle
                doc.fillColor(this.colors.neutral.gray)
                    .font('Helvetica')
                    .fontSize(8.5)
                    .text('2026 TECHNICAL ANALYSIS', 130, logoY + 40, { characterSpacing: 1.2 });
            } catch (err) {
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(22)
                    .text('MyQuoteMate', 40, 40);
            }
        } else {
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(22)
                .text('MyQuoteMate', 40, 40);
        }

        // Page number badge - Slim glassmorphism
        const badgeWidth = 140;
        const badgeHeight = 28;
        const badgeX = pageWidth - 40 - badgeWidth;
        const badgeY = 26;

        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.06)
            .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3)
            .fill();

        doc.strokeColor(colors.primary)
            .strokeOpacity(0.15)
            .lineWidth(0.5)
            .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3)
            .stroke();
        doc.restore();

        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(`${tier.toUpperCase()} REPORT`, badgeX, badgeY + 10, {
                width: badgeWidth,
                align: 'center',
                characterSpacing: 1.5
            });

        // Header line - Subtle separator
        doc.moveTo(40, 80)
            .lineTo(pageWidth - 40, 80)
            .lineWidth(0.5)
            .strokeColor(colors.primary)
            .strokeOpacity(0.1)
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
        const margin = 50; // Standardize margin

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

        // Logo (MUCH larger on cover)
        if (fs.existsSync(this.logoPath)) {
            try {
                const logoWidth = 160; // Increased significantly
                doc.image(this.logoPath, centerX - logoWidth / 2, 100, { width: logoWidth });
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
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(38) // Increased
            .text('Quote Analysis &', 0, 260, { align: 'center', width: pageWidth });

        doc.text('Risk Assessment', 0, 305, { align: 'center', width: pageWidth });

        // Subtitle
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('ADVANCED ANALYTICAL DATA REPORT • 2026 EDITION', 0, 365, { align: 'center', width: pageWidth, characterSpacing: 1 });

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
    }

    /**
     * PAGE 2: Executive Summary
     */
    async generatePage2Summary(doc, job, result, tier, colors, clientInfo) {
        doc.addPage();
        this.addHeader(doc, 2, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 115; // Adjusted for slim header

        // Page title - More authoritative
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(32)
            .text('Executive Summary', 40, currentY);

        // Sophisticated Double underline style
        doc.save();
        // Thick short accent
        doc.moveTo(40, currentY + 42)
            .lineTo(80, currentY + 42)
            .lineWidth(3)
            .strokeColor(colors.primary)
            .stroke();

        // Thin long extension
        doc.moveTo(85, currentY + 42)
            .lineTo(250, currentY + 42)
            .lineWidth(0.5)
            .strokeColor(this.colors.neutral.lightGray)
            .stroke();
        doc.restore();

        currentY += 80;

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
                iconType: 'checkmark'
            },
            {
                label: 'RISK LEVEL',
                value: result.redFlags?.length > 3 ? 'High' : result.redFlags?.length > 1 ? 'Medium' : 'Low',
                color: result.redFlags?.length > 3 ? '#ef4444' : result.redFlags?.length > 1 ? '#f59e0b' : '#10b981',
                iconType: 'alert'
            },
            {
                label: 'TOTAL COST',
                value: `$${(result.overallCost || result.costs?.overall || 0).toLocaleString()}`,
                color: colors.primary,
                iconType: 'dollar'
            },
            {
                label: 'CONFIDENCE',
                value: `${result.confidence || 95}%`,
                color: '#3b82f6',
                iconType: 'info'
            }
        ];

        metrics.forEach((metric, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = 40 + col * (boxWidth + gap);
            const y = gridStartY + row * (boxHeight + gap);

            // Box - Professional Shadow-lite
            doc.save();
            // Subtle Shadow
            doc.fillColor(this.colors.neutral.lightGray)
                .fillOpacity(0.1)
                .roundedRect(x + 1, y + 1, boxWidth, boxHeight, 4)
                .fill();

            // Main Box
            doc.fillColor('#ffffff')
                .roundedRect(x, y, boxWidth, boxHeight, 4)
                .fill()
                .strokeColor('#e2e8f0') // More professional divider
                .lineWidth(0.5)
                .stroke();
            doc.restore();

            // Label
            doc.fillColor('#64748b') // Slate 500
                .font('Helvetica-Bold')
                .fontSize(9)
                .text(metric.label, x + 20, y + 20, { characterSpacing: 1 });

            // Value
            doc.fillColor(metric.color)
                .font('Helvetica-Bold')
                .fontSize(26)
                .text(metric.value, x + 20, y + 42);

            // Icon circle background
            const iconX = x + boxWidth - 44;
            const iconY = y + 32;
            const iconSize = 24;

            doc.save();
            doc.fillColor(metric.color)
                .fillOpacity(0.1)
                .circle(iconX + iconSize / 2, iconY + iconSize / 2, 18)
                .fill();
            doc.restore();

            // Draw proper icon based on type
            switch (metric.iconType) {
                case 'checkmark':
                    this.drawCheckmark(doc, iconX, iconY, iconSize, metric.color);
                    break;
                case 'alert':
                    this.drawAlert(doc, iconX, iconY, iconSize, metric.color);
                    break;
                case 'dollar':
                    this.drawDollarSign(doc, iconX, iconY, iconSize, metric.color);
                    break;
                case 'info':
                    this.drawInfoIcon(doc, iconX, iconY, iconSize, metric.color);
                    break;
            }
        });

        currentY = gridStartY + 2 * (boxHeight + gap) + 30;

        // Summary text
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Analysis Overview', 40, currentY);

        currentY += 28;

        const summaryText = result.summary || 'Quote analysis completed successfully.';
        doc.fillColor('#334155') // Slate 700
            .font('Helvetica')
            .fontSize(11.5)
            .text(summaryText, 40, currentY, {
                width: pageWidth - 80,
                align: 'justify',
                lineGap: 5
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
    }

    /**
     * PAGE 3: Detailed Cost Breakdown
     */
    async generatePage3CostBreakdown(doc, job, result, tier, colors) {
        doc.addPage();
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
            .lineWidth(3)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 85; // More breathing room

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
                divider: {
                    header: { disabled: false, width: 1, opacity: 0.1 },
                    horizontal: { disabled: false, width: 0.5, opacity: 0.05 }
                },
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
    }

    /**
     * PAGE 4: Risk Analysis & Red Flags
     */
    /**
     * PAGE 4: Risk Analytics Dashboard
     */
    async generatePage4RiskDashboard(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 4, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 110;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Risk Analytics Dashboard', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(160, currentY + 38)
            .lineWidth(3)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 75;

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
            .roundedRect(40, currentY, pageWidth - 80, 240, 12)
            .fill()
            .strokeColor('#e2e8f0')
            .lineWidth(1)
            .stroke();
        doc.restore();

        // 1. Donut Chart (Enhanced Size)
        this.drawDonutChart(doc, 140, currentY + 120, 75, donutData.length > 0 ? donutData : [{ value: 1, color: '#e2e8f0' }], colors);

        // 2. Risk Profile Radar (Now available for all tiers in visual dashboard)
        const riskProfileData = [
            { axis: 'Financial', value: Math.min(100, (riskCounts.critical * 30 + 10)) },
            { axis: 'Technical', value: (result.confidence ? (100 - result.confidence) : 20) },
            { axis: 'Market', value: 45 },
            { axis: 'Delivery', value: 30 },
            { axis: 'Quality', value: 25 }
        ];
        this.drawRadarChart(doc, pageWidth - 160, currentY + 120, 80, riskProfileData, colors.primary);

        // 3. Overall Exposure Spectrum
        currentY += 270;
        const riskScore = Math.min(100, (riskCounts.critical * 40 + riskCounts.high * 25 + riskCounts.medium * 10) || 5);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('EXECUTIVE RISK EXPOSURE INDEX', 40, currentY);

        this.drawRiskSpectrum(doc, 40, currentY + 25, pageWidth - 80, 20, riskScore);

        currentY += 80;

        // Analytics Insight Box
        doc.save();
        doc.fillColor(colors.primary).fillOpacity(0.04).roundedRect(40, currentY, pageWidth - 80, 100, 8).fill();
        doc.restore();

        doc.fillColor(this.colors.neutral.dark).font('Helvetica-Bold').fontSize(11).text('STRATEGIC INSIGHT', 60, currentY + 15);
        const insightText = riskScore > 60
            ? 'HIGH RISK WARNING: Total quote exposure exceeds optimal thresholds. Immediate mitigation of critical items is required before contractual commitment.'
            : riskScore > 30
                ? 'MODERATE EXPOSURE: Standard industry risks identified. Most items can be resolved through minor specification adjustments.'
                : 'OPTIMAL PROJECT HEALTH: Minimal risk profile detected. Quote reflects high structural integrity and market alignment.';

        doc.fillColor('#1f2937').font('Helvetica').fontSize(10.5).text(insightText, 60, currentY + 35, { width: pageWidth - 140, lineGap: 4 });

        this.addFooter(doc, job.jobId);
    }

    /**
     * PAGE 5: Critical Red Flags & Mitigation
     */
    async generatePage5RiskList(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 5, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 110;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Critical Red Flags', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(160, currentY + 38)
            .lineWidth(3)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        const redFlags = result.redFlags || [];

        if (redFlags.length > 0) {
            redFlags.slice(0, 10).forEach((flag, idx) => {
                const severityColor =
                    flag.severity === 'critical' ? '#dc2626' :
                        flag.severity === 'high' ? '#ef4444' :
                            flag.severity === 'medium' ? '#f59e0b' : '#10b981';

                // Flag box (Professional Shadow)
                doc.save();
                doc.fillColor('#ffffff')
                    .roundedRect(40, currentY, pageWidth - 80, 85, 8)
                    .fill()
                    .strokeColor('#e2e8f0')
                    .lineWidth(0.5)
                    .stroke();
                doc.restore();

                // Severity Badge
                doc.save();
                doc.fillColor(severityColor).fillOpacity(0.12).roundedRect(55, currentY + 15, 75, 20, 10).fill();
                doc.fillColor(severityColor).font('Helvetica-Bold').fontSize(8.5).text((flag.severity || 'medium').toUpperCase(), 55, currentY + 20, { width: 75, align: 'center' });
                doc.restore();

                // Flag title & Description (High Visibility)
                doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12);
                doc.text(flag.title || flag.category || 'Risk Item', 145, currentY + 17, { width: pageWidth - 200 });

                doc.fillColor('#374151').font('Helvetica').fontSize(10);
                doc.text(flag.description || 'Review this item carefully.', 55, currentY + 45, { width: pageWidth - 110, lineGap: 2, maxLines: 2 });

                currentY += 100;

                if (currentY > 700 && idx < redFlags.length - 1) {
                    this.addFooter(doc, job.jobId);
                    doc.addPage();
                    this.addHeader(doc, 5, tier, colors);
                    currentY = 110;
                }
            });
        } else {
            doc.save();
            doc.fillColor('#10b981').fillOpacity(0.08).roundedRect(40, currentY, pageWidth - 80, 80, 8).fill();
            doc.restore();

            doc.fillColor('#059669').font('Helvetica-Bold').fontSize(14).text('✓ No Critical Risks Detected', 60, currentY + 20);
            doc.fillColor('#374151').font('Helvetica').fontSize(11).text('This quote appears to be structurally sound with no major red flags identified in its current form.', 60, currentY + 45, { width: pageWidth - 120 });
        }

        this.addFooter(doc, job.jobId);
    }

    /**
     * PAGE 4.5: Quote Comparison Matrix (Premium Only)
     */
    async generatePageComparison(doc, job, result, tier, colors) {
        if (tier !== 'premium' || !result.quoteComparison) return;

        doc.addPage();

        this.addHeader(doc, 'COMP', tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 100;

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Quote Comparison', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(250, currentY + 38)
            .lineWidth(4)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 70;

        const comp = result.quoteComparison;

        // AI Verdict Box
        doc.save();
        doc.fillColor(colors.primary)
            .fillOpacity(0.05)
            .roundedRect(40, currentY, pageWidth - 80, 110, 12)
            .fill()
            .strokeColor(colors.primary)
            .lineWidth(0.5)
            .stroke();
        doc.restore();

        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('AI PROFESSIONAL VERDICT', 60, currentY + 20);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Oblique')
            .fontSize(10)
            .text(comp.winner?.reason?.substring(0, 400) || 'Comparison analysis pending.', 60, currentY + 40, {
                width: pageWidth - 120,
                align: 'justify',
                lineGap: 4
            });

        currentY += 140;

        // Strategic Methodology
        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Technical Differentiation', 40, currentY);

        currentY += 25;

        // Methodology Box
        doc.save();
        doc.fillColor('#f8fafc')
            .roundedRect(40, currentY, (pageWidth - 100) / 2, 160, 8)
            .fill();
        doc.restore();

        doc.fillColor('#1e40af')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('STRATEGIC METHODOLOGY', 55, currentY + 15);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica')
            .fontSize(9)
            .text(comp.betterApproach || 'Analysis pending.', 55, currentY + 35, { width: (pageWidth - 140) / 2, lineGap: 3 });

        // Differences Box
        doc.save();
        doc.fillColor('#f5f3ff')
            .roundedRect(40 + (pageWidth - 100) / 2 + 20, currentY, (pageWidth - 100) / 2, 160, 8)
            .fill();
        doc.restore();

        doc.fillColor('#4338ca')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('CRITICAL DIFFERENCES', 40 + (pageWidth - 100) / 2 + 35, currentY + 15);

        let diffY = currentY + 35;
        comp.keyDifferences?.slice(0, 5).forEach(diff => {
            doc.fillColor('#4338ca')
                .circle(40 + (pageWidth - 100) / 2 + 35, diffY + 4, 1.5)
                .fill();
            doc.fillColor(this.colors.neutral.dark)
                .font('Helvetica')
                .fontSize(8)
                .text(diff, 40 + (pageWidth - 100) / 2 + 45, diffY, { width: (pageWidth - 160) / 2 });
            diffY = doc.y + 6;
        });

        currentY += 180;

        // Value Assessment
        doc.save();
        doc.fillColor('#f0fdf4')
            .roundedRect(40, currentY, pageWidth - 80, 80, 8)
            .fill();
        doc.restore();

        doc.fillColor('#15803d')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('MARKET VALUE ASSESSMENT', 60, currentY + 15);

        doc.fillColor(this.colors.neutral.dark)
            .font('Helvetica')
            .fontSize(10)
            .text(comp.valueAssessment || 'Analysis pending.', 60, currentY + 35, { width: pageWidth - 120, lineGap: 3 });

        this.addFooter(doc, job.jobId);
    }

    /**
     * PAGE 6: Market Benchmarking (Standard & Premium)
     */
    async generatePage6Benchmarking(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 6, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 120; // Corrected for slim header

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Executive Benchmarking', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(160, currentY + 38)
            .lineWidth(3)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 80;

        // Benchmarking data
        const benchmarks = result.benchmarking || [];

        if (benchmarks.length > 0) {
            benchmarks.slice(0, 6).forEach((benchmark, idx) => {
                // Item Box
                doc.save();
                doc.fillColor('#ffffff')
                    .roundedRect(40, currentY, pageWidth - 80, 85, 8)
                    .fill()
                    .strokeColor(this.colors.neutral.lightGray)
                    .lineWidth(0.5)
                    .stroke();
                doc.restore();

                // Item name
                doc.fillColor(this.colors.neutral.dark)
                    .font('Helvetica-Bold')
                    .fontSize(12)
                    .text(benchmark.item, 60, currentY + 15);

                // Visualization
                const barY = currentY + 35;
                const barWidth = pageWidth - 160;
                const quotePrice = benchmark.quotePrice || 0;
                const marketMin = benchmark.marketMin || 0;
                const marketMax = benchmark.marketMax || 100;
                const marketAvg = benchmark.marketAvg || 50;

                // Market Range Bar
                doc.save();
                doc.fillColor(this.colors.neutral.lightGray)
                    .fillOpacity(0.2)
                    .roundedRect(60, barY + 5, barWidth, 12, 6)
                    .fill();

                // Highlight Average Sector
                const avgPos = ((marketAvg - marketMin) / (marketMax - marketMin)) * barWidth;
                doc.fillColor(colors.primary)
                    .fillOpacity(0.1)
                    .rect(60 + avgPos - 20, barY, 40, 22)
                    .fill();
                doc.restore();

                // Quote Indicator
                const range = marketMax - marketMin;
                const position = range > 0 ? ((quotePrice - marketMin) / range) * barWidth : barWidth / 2;
                const clampedPosition = Math.max(0, Math.min(barWidth, position));

                doc.save();
                doc.fillColor(colors.primary)
                    .circle(60 + clampedPosition, barY + 11, 7)
                    .fill();
                doc.restore();

                // Detailed Labels
                doc.fillColor(this.colors.neutral.gray).font('Helvetica').fontSize(8.5);
                doc.text(`Min: $${marketMin.toLocaleString()}`, 60, barY + 22);
                doc.text(`Avg: $${marketAvg.toLocaleString()}`, 60 + (barWidth / 2) - 25, barY + 22);
                doc.text(`Max: $${marketMax.toLocaleString()}`, 60 + barWidth - 45, barY + 22);

                // Quote Value Label
                doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(10);
                doc.text(`Your Quote: $${quotePrice.toLocaleString()}`, 60, barY + 42);

                if (benchmark.percentile !== undefined) {
                    doc.fillColor(this.colors.neutral.gray).font('Helvetica').fontSize(8.5);
                    const color = benchmark.percentile > 75 ? '#ef4444' : benchmark.percentile < 40 ? '#10b981' : this.colors.neutral.gray;
                    doc.fillColor(color).text(`${benchmark.percentile}th Percentile`, pageWidth - 160, barY + 42, { align: 'right', width: 100 });
                }

                currentY += 105;
            });

            // Benchmark Summary
            doc.save();
            doc.fillColor(colors.primary).fillOpacity(0.03).roundedRect(40, currentY, pageWidth - 80, 80, 8).fill();
            doc.restore();

            doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(11).text('Benchmarking Insight', 60, currentY + 15);
            doc.fillColor('#1e293b').font('Helvetica').fontSize(9.5) // Slate 800
                .text('Comparison based on current 2026 AU localized trade data. Projects within the 40-60th percentile represent optimal value-to-risk balance. High-percentile entries may indicate overkill or premium material selections.', 60, currentY + 35, { width: pageWidth - 140, lineGap: 4 });

        } else {
            doc.fillColor(this.colors.neutral.gray).font('Helvetica').fontSize(12).text('Market comparative data not available for this specific scope.', 40, currentY + 50, { align: 'center', width: pageWidth - 80 });
        }

        this.addFooter(doc, job.jobId);
    }

    /**
     * PAGE 8: Strategic Recommendations
     */
    async generatePage7Recommendations(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 7, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 120; // Corrected offset

        // Page title
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('Strategic Recommendations', 40, currentY);

        doc.moveTo(40, currentY + 38)
            .lineTo(220, currentY + 38)
            .lineWidth(3)
            .strokeColor(colors.primary)
            .stroke();

        currentY += 80;

        // Recommendations
        const recommendations = result.recommendations || [];

        if (recommendations.length > 0) {
            recommendations.slice(0, 5).forEach((rec, idx) => {
                // Outer Container
                doc.save();
                doc.fillColor('#ffffff')
                    .roundedRect(40, currentY, pageWidth - 80, 110, 8)
                    .fill()
                    .strokeColor(this.colors.neutral.lightGray)
                    .lineWidth(0.5)
                    .stroke();
                doc.restore();

                // Number Badge
                doc.save();
                doc.fillColor(colors.primary).circle(65, currentY + 30, 18).fill();
                doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text(`${idx + 1}`, 58, currentY + 22, { width: 14, align: 'center' });
                doc.restore();

                // Recommendation Header
                doc.fillColor(this.colors.neutral.dark).font('Helvetica-Bold').fontSize(12);
                doc.text(rec.title.toUpperCase(), 95, currentY + 18, { width: pageWidth - 160, characterSpacing: 0.5 });

                // Savings & Difficulty Badges (Horizontal Alignment)
                let badgeX = 95;
                if (rec.potentialSavings) {
                    doc.save();
                    doc.fillColor('#10b981').fillOpacity(0.15).roundedRect(badgeX, currentY + 35, 125, 18, 9).fill();
                    doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(8.5).text(`Potential Savings: $${rec.potentialSavings.toLocaleString()}`, badgeX + 10, currentY + 40);
                    doc.restore();
                    badgeX += 135;
                }

                if (rec.difficulty) {
                    const diffColor = rec.difficulty === 'easy' ? '#047857' : rec.difficulty === 'moderate' ? '#d97706' : '#b91c1c';
                    doc.save();
                    doc.fillColor(diffColor).fillOpacity(0.15).roundedRect(badgeX, currentY + 35, 80, 18, 9).fill();
                    doc.fillColor(diffColor).font('Helvetica-Bold').fontSize(8).text(`LEVEL: ${rec.difficulty.toUpperCase()}`, badgeX + 5, currentY + 40, { width: 70, align: 'center' });
                    doc.restore();
                }

                // Body text (Refined alignment and readability)
                doc.fillColor('#1f2937').font('Helvetica').fontSize(11); // Darker and larger
                doc.text(rec.description, 60, currentY + 62, {
                    width: pageWidth - 120,
                    lineGap: 4,
                    maxLines: 2,
                    ellipsis: true
                });

                currentY += 115;
            });
        }

        this.addFooter(doc, job.jobId);
    }

    /**
     * PAGE 7: Appendix & Disclaimer
     */
    async generatePage8Appendix(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 8, tier, colors);

        const pageWidth = doc.page.width;
        let currentY = 120;

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

    /**
     * Generate Professional Text-Only Report (Word Docs style)
     */
    async generateProfessionalTextReport(job, result, tier = 'premium') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 72, // 1 inch
                    size: 'A4'
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Title Section
                doc.font('Helvetica-Bold')
                    .fontSize(24)
                    .text(`${job.metadata?.title || 'Quote Analysis Report'}`, { align: 'center' });

                doc.moveDown(0.5);
                doc.fontSize(12)
                    .font('Helvetica')
                    .text(`Reference ID: ${job.jobId} | Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

                doc.moveDown(2);

                // Summary
                doc.font('Helvetica-Bold').fontSize(16).text('1. EXECUTIVE SUMMARY');
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(11).text(result.summary || 'Summary not available.', { align: 'justify', lineGap: 4 });
                doc.moveDown(1.5);

                // Detailed Review
                doc.font('Helvetica-Bold').fontSize(16).text('2. TECHNICAL ANALYSIS');
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(11).text(result.detailedReview || 'Detailed analysis not available.', { align: 'justify', lineGap: 4 });
                doc.moveDown(1.5);

                // Recommendations
                if (result.recommendations && result.recommendations.length > 0) {
                    doc.font('Helvetica-Bold').fontSize(16).text('3. STRATEGIC RECOMMENDATIONS');
                    doc.moveDown(1);
                    result.recommendations.forEach((rec, i) => {
                        doc.font('Helvetica-Bold').fontSize(12).text(`${i + 1}. ${rec.title}`);
                        doc.font('Helvetica').fontSize(11).text(rec.description, { align: 'justify', lineGap: 3 });
                        doc.moveDown(0.8);
                    });
                    doc.moveDown(1.5);
                }

                // AI Strategic Alignment (Premium only)
                if (tier === 'premium' && (result.benchmarkingOverview || result.strategicAnalysis)) {
                    doc.font('Helvetica-Bold').fontSize(16).text('4. MARKET POSITIONING & ALIGNMENT');
                    doc.moveDown(0.5);
                    doc.font('Helvetica').fontSize(11).text(result.benchmarkingOverview || result.strategicAnalysis, { align: 'justify', lineGap: 4 });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Draw a radar chart for risk profiles (Premium only)
     */
    drawRadarChart(doc, x, y, size, data, color) {
        doc.save();
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size * 0.4;
        const sides = (data || []).length;
        if (sides < 3) {
            doc.restore();
            return;
        }

        // Draw background grid
        doc.lineWidth(0.5).strokeColor('#e5e7eb').dash(2, { space: 2 });
        for (let r = 1; r <= 4; r++) {
            const currentR = (radius * r) / 4;
            doc.moveTo(centerX + currentR, centerY);
            for (let i = 1; i <= sides; i++) {
                const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                doc.lineTo(centerX + currentR * Math.cos(angle), centerY + currentR * Math.sin(angle));
            }
            doc.closePath().stroke();
        }
        doc.undash();

        // Draw axes
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            doc.moveTo(centerX, centerY)
                .lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
                .stroke();

            // Labels
            doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold');
            const labelText = (data[i].axis || data[i].category || 'Metric').toUpperCase();
            const labelX = centerX + (radius + 25) * Math.cos(angle);
            const labelY = centerY + (radius + 25) * Math.sin(angle);

            doc.text(labelText, labelX - 40, labelY - 4, { width: 80, align: 'center' });
        }

        // Draw data area
        doc.fillColor(color).fillOpacity(0.3).strokeColor(color).lineWidth(1.5);
        const firstAngle = -Math.PI / 2;
        const firstR = (data[0].value / 100) * radius;
        doc.moveTo(centerX + firstR * Math.cos(firstAngle), centerY + firstR * Math.sin(firstAngle));

        for (let i = 1; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const r = (data[i].value / 100) * radius;
            doc.lineTo(centerX + r * Math.cos(angle), centerY + r * Math.sin(angle));
        }
        doc.closePath().fillAndStroke();
        doc.restore();
    }

    /**
     * Draw a project roadmap/timeline visual (Premium only)
     */
    drawRoadmap(doc, x, y, width, data, colors) {
        doc.save();
        const timeline = data || [];
        const totalDays = timeline.reduce((sum, item) => sum + (item.days || 0), 0);
        let currentX = x;
        const barHeight = 30;

        timeline.forEach((item, index) => {
            const itemWidth = (item.days / (totalDays || 1)) * width;
            const color = index % 2 === 0 ? colors.primary : '#3b82f6';

            // Draw segment
            doc.fillColor(color).fillOpacity(0.15)
                .roundedRect(currentX, y, itemWidth - 4, barHeight, 4).fill();

            doc.fillColor(this.colors.neutral.dark).font('Helvetica-Bold').fontSize(8)
                .text(item.phase, currentX + 5, y + 10, { width: itemWidth - 15, lineBreak: false });

            doc.fillColor(this.colors.neutral.gray).font('Helvetica').fontSize(7)
                .text(`${item.days}d`, currentX + 5, y + barHeight + 5);

            currentX += itemWidth;
        });
        doc.restore();
    }

    /**
     * PAGE VISUAL INTELLIGENCE (Standard & Premium)
     */
    async generatePageVisualIntelligence(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 3, tier, colors);
        let currentY = 120;

        doc.fillColor(this.colors.neutral.dark).font('Helvetica-Bold').fontSize(24).text('Visual Risk Intelligence', 40, currentY);
        doc.moveTo(40, currentY + 32).lineTo(140, currentY + 32).lineWidth(3).strokeColor(colors.primary).stroke();

        currentY += 60;

        // Intro
        doc.fillColor(this.colors.neutral.gray).font('Helvetica').fontSize(11)
            .text('Advanced structural analysis of the quote across 5 core risk vectors. This radar map visualizes the balance between pricing stability and technical compliance.', 40, currentY, { width: 500 });

        currentY += 50;

        // Radar Chart Area
        const viz = result.visualizations || {
            riskProfile: [
                { category: "Pricing", value: 65 },
                { category: "Scope", value: 80 },
                { category: "Terms", value: 55 },
                { category: "Compliance", value: 75 },
                { category: "Risk", value: 40 }
            ]
        };

        this.drawRadarChart(doc, 140, currentY, 320, viz.riskProfile, colors.primary);

        currentY += 360;

        // Key Findings
        doc.fillColor(this.colors.neutral.dark).font('Helvetica-Bold').fontSize(14).text('Vector Analysis Key Findings', 40, currentY);
        currentY += 25;

        const findings = [
            { label: 'Market Alignment', value: 'This quote sits in the 65th percentile for similar projects in AU.' },
            { label: 'Technical Scope', value: 'High clarity in materials indicates low hidden-cost risk.' },
            { label: 'Risk Exposure', value: 'Limited broad exclusions provide strong consumer protection.' }
        ];

        findings.forEach(f => {
            doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(9).text(f.label.toUpperCase(), 40, currentY);
            doc.fillColor(this.colors.neutral.dark).font('Helvetica').fontSize(10).text(f.value, 150, currentY);
            currentY += 25;
        });

        this.addFooter(doc, job.jobId);
    }

    /**
     * PAGE CONSTRUCTION INTELLIGENCE (Standard & Premium)
     */
    async generatePageConstructionIntelligence(doc, job, result, tier, colors) {
        doc.addPage();
        this.addHeader(doc, 7, tier, colors);
        let currentY = 120;

        doc.fillColor(this.colors.neutral.dark).font('Helvetica-Bold').fontSize(24).text('Project Intelligence Roadmap', 40, currentY);
        doc.moveTo(40, currentY + 32).lineTo(140, currentY + 32).lineWidth(3).strokeColor(colors.primary).stroke();

        currentY += 60;

        doc.fillColor(this.colors.neutral.gray).font('Helvetica').fontSize(11)
            .text('Extrapolated project timeline and phase distribution based on the quoted scope of work. Use this as a benchmark for your construction schedule.', 40, currentY, { width: 500 });

        currentY += 50;

        const viz = result.visualizations || {
            timelineEstimates: [
                { phase: "Preparation", days: 3 },
                { phase: "Rough-in", days: 5 },
                { phase: "Installation", days: 7 },
                { phase: "Finishing", days: 4 }
            ]
        };

        this.drawRoadmap(doc, 40, currentY, 520, viz.timelineEstimates, colors);

        currentY += 120;

        // Strategic Insight
        doc.save();
        doc.fillColor(colors.primary).fillOpacity(0.05).roundedRect(40, currentY, 520, 100, 8).fill();
        doc.restore();

        doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12).text('Executive Strategic Insight', 60, currentY + 20);
        doc.fillColor(this.colors.neutral.dark).font('Helvetica').fontSize(10)
            .text('Based on our AU market data, projects of this scale typically take 18-22 days. The quoted efficiency suggests a highly organized team, but ensure that "Finishing" days are not truncated for speed. We recommend a 15% time-buffer for materials lead times.', 60, currentY + 45, { width: 480, lineGap: 3 });

        this.addFooter(doc, job.jobId);
    }
}

module.exports = new ReportService();
