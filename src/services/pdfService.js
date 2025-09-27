// src/services/pdfService.js - REAL EXTRACTION ONLY, NO RANDOM DATA
class PDFService {
  async extractResumeData(file) {
    try {
      console.log('📄 Starting REAL-ONLY PDF extraction for:', file.name);

      let text = '';
      let extractionMethod = 'none';

      // Method 1: Try text extraction
      try {
        text = await this.extractAsText(file);
        if (text && text.length > 50) {
          extractionMethod = 'text-extraction';
        }
      } catch (error) {
        console.log('Text extraction failed:', error.message);
      }

      // Method 2: Try binary extraction
      if (!text || text.length < 50) {
        try {
          text = await this.extractFromBinary(file);
          if (text && text.length > 20) {
            extractionMethod = 'binary-extraction';
          }
        } catch (error) {
          console.log('Binary extraction failed:', error.message);
        }
      }

      console.log('✅ Using extraction method:', extractionMethod);
      console.log('📝 Text sample:', text.substring(0, 200));

      // Parse ONLY real data from text - NO random generation
      const result = this.parseRealContactInfo(text, file.name);
      result.extractionMethod = extractionMethod;
      result.rawText = text.substring(0, 500);

      console.log('🎯 Real extraction result:', result);
      return result;

    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      return this.createEmptyResult();
    }
  }

  async extractAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        if (typeof text === 'string' && text.length > 50) {
          resolve(text);
        } else {
          reject(new Error('No readable text'));
        }
      };
      reader.onerror = () => reject(new Error('Text reading failed'));
      reader.readAsText(file, 'utf-8');
    });
  }

  async extractFromBinary(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const uint8Array = new Uint8Array(e.target.result);
          let text = '';
          let currentWord = '';

          for (let i = 0; i < uint8Array.length; i++) {
            const char = String.fromCharCode(uint8Array[i]);

            if (char.match(/[a-zA-Z0-9@.\-_+() ]/)) {
              currentWord += char;
            } else if (char === ' ' || char === '\n') {
              if (currentWord.length > 0) {
                text += currentWord + ' ';
                currentWord = '';
              }
            } else {
              if (currentWord.length > 2) {
                text += currentWord + ' ';
              }
              currentWord = '';
            }
          }

          if (currentWord.length > 2) {
            text += currentWord;
          }

          text = text.replace(/\s+/g, ' ').trim();

          if (text.length > 20) {
            resolve(text);
          } else {
            reject(new Error('Insufficient text from binary'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Binary reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  parseRealContactInfo(text, filename) {
    const info = {
      name: '',
      email: '',
      phone: '',
      extractionSuccess: false,
      needsManualInput: false
    };

    // Extract REAL email only
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const emailMatches = text.match(emailPattern);
    if (emailMatches) {
      const validEmails = emailMatches.filter(email => 
        !email.includes('example.com') && 
        !email.includes('test.com') &&
        !email.includes('font') &&
        !email.includes('page') &&
        email.length <= 50
      );
      if (validEmails.length > 0) {
        info.email = validEmails[0].toLowerCase();
        console.log('✅ Real email found:', info.email);
      }
    }

    // Extract REAL phone number only
    const phonePatterns = [
      /\+91[\s-]?[6-9]\d{9}/g,  // +91 format
      /[6-9]\d{9}/g,              // 10-digit Indian mobile
      /\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{4,}/g // General phone
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const cleanNumbers = matches.map(num => num.replace(/[^\d+]/g, ''));
        const validNumbers = cleanNumbers.filter(num => {
          const digits = num.replace(/^\+91/, '');
          return digits.length >= 10 && digits.length <= 12;
        });

        if (validNumbers.length > 0) {
          info.phone = validNumbers[0];
          if (info.phone.length === 10) {
            info.phone = '+91' + info.phone;
          }
          console.log('✅ Real phone found:', info.phone);
          break;
        }
      }
    }

    // Extract REAL name only
    info.name = this.extractRealName(text, filename);
    if (info.name) {
      console.log('✅ Real name found:', info.name);
    }

    // Check if we have enough real data
    const hasRealData = !!(info.name || info.email || info.phone);

    if (hasRealData) {
      info.extractionSuccess = true;
      info.needsManualInput = !(info.name && info.email && info.phone); // Need manual input for missing fields
    } else {
      info.extractionSuccess = false;
      info.needsManualInput = true; // Need manual input for all fields
    }

    return info;
  }

  extractRealName(text, filename) {
    // Strategy 1: Extract from text content
    const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);

    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];

      // Skip lines that are clearly not names
      if (line.includes('@') || 
          line.match(/^[\d\s\-+()]+$/) || 
          line.match(/^(resume|cv|profile|contact|phone|email|address|objective|summary|experience|education|skills)$/i) ||
          line.length > 60) {
        continue;
      }

      // Look for proper name patterns
      if (line.match(/^[A-Z][a-zA-Z]+(\s+[A-Z][a-zA-Z]+){1,3}$/)) {
        return line;
      }

      // Look for names with Indian surnames
      if (line.match(/^[A-Z][a-zA-Z]+(\s+(Singh|Kumar|Sharma|Gupta|Patel|Shah|Reddy|Nair|Iyer|Rao|Verma|Agarwal|Jain))/i)) {
        return line;
      }
    }

    // Strategy 2: Look for name patterns in text
    const namePatterns = [
      /Name[:\s]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      /I am ([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      /My name is ([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length <= 50 && !match[1].includes('@')) {
        return match[1].trim();
      }
    }

    // Strategy 3: Extract from filename ONLY if it's clearly a name
    const filenameBasedName = this.extractNameFromFilename(filename);
    if (filenameBasedName && this.isLikelyRealName(filenameBasedName)) {
      return filenameBasedName;
    }

    // If no real name found, return empty
    return '';
  }

  extractNameFromFilename(filename) {
    if (!filename) return '';

    let name = filename
      .replace(/\.(pdf|docx?)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(resume|cv|document|\d+)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (name.length >= 2 && name.length <= 50) {
      // Capitalize words
      return name.split(' ')
                 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                 .join(' ');
    }

    return '';
  }

  isLikelyRealName(name) {
    // Check if the extracted name seems real (not generic)
    const genericTerms = ['user', 'test', 'demo', 'sample', 'example', 'file', 'document'];
    const nameLower = name.toLowerCase();

    // If contains generic terms, probably not a real name
    for (const term of genericTerms) {
      if (nameLower.includes(term)) {
        return false;
      }
    }

    // If it's 2-4 words with reasonable length, likely real
    const words = name.split(' ');
    if (words.length >= 2 && words.length <= 4) {
      const allWordsReasonable = words.every(word => word.length >= 2 && word.length <= 20);
      return allWordsReasonable;
    }

    return false;
  }

  createEmptyResult() {
    return {
      name: '',
      email: '',
      phone: '',
      extractionMethod: 'failed',
      extractionSuccess: false,
      needsManualInput: true
    };
  }

  validateFile(file) {
    const validTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a PDF file only');
    }
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }
    if (file.size === 0) {
      throw new Error('File appears to be empty');
    }

    return true;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const pdfService = new PDFService();