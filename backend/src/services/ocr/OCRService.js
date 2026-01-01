// ============================================
// src/services/ocr/OCRService.js
// ============================================
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const logger = require('../../utils/logger');

class OCRService {
  /**
   * Extract text from PDF
   */
  async extractTextFromPDF(pdfBuffer) {
    try {
      // Try text extraction first
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text.trim();

      // If sufficient text found, return it
      if (extractedText && extractedText.length >= 100) {
        return {
          text: extractedText,
          ocrRequired: false,
          ocrConfidence: 100,
          method: 'text_extraction'
        };
      }

      // Otherwise, perform OCR
      logger.info('PDF appears to be scanned, performing OCR');
      return await this.performOCR(pdfBuffer);
    } catch (error) {
      logger.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Perform OCR on scanned PDF
   */
  async performOCR(pdfBuffer) {
    const startTime = Date.now();
    const warnings = [];

    try {
      const { data: { text, confidence } } = await Tesseract.recognize(
        pdfBuffer,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const processingTime = Date.now() - startTime;

      if (confidence < 60) {
        warnings.push('Low OCR confidence. Results may be inaccurate.');
      }

      return {
        text: text.trim(),
        ocrRequired: true,
        ocrConfidence: Math.round(confidence),
        method: 'tesseract_ocr',
        processingTime,
        warnings
      };
    } catch (error) {
      logger.error('OCR failed:', error);
      throw new Error('OCR processing failed');
    }
  }

  /**
   * Validate extracted text
   */
  validateExtractedText(text) {
    if (!text || typeof text !== 'string') {
      return {
        valid: false,
        reason: 'No text extracted'
      };
    }

    if (text.length < 50) {
      return {
        valid: false,
        reason: 'Insufficient text extracted'
      };
    }

    return {
      valid: true
    };
  }
}

module.exports = new OCRService();