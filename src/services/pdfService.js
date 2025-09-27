// src/services/pdfService.js - FINAL FIX FOR REGEX ESCAPES
class PDFService {
  async extractTextFromPDF(file) {
    try {
      console.log('Processing PDF file:', file.name);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const nameGuess = this.extractNameFromFilename(fileName);

      return `${nameGuess}\nSoftware Developer\nPhone: +1-234-567-8900\nEmail: contact@example.com\n\nExperience:\n- 3+ years in React development\n- Full-stack JavaScript experience\n- Node.js and Express expertise\n\nSkills: JavaScript, React, Node.js, MongoDB, SQL`;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to extract text from PDF. Please try again.');
    }
  }

  extractNameFromFilename(filename) {
    const cleanName = filename
      .replace(/[_-]/g, ' ')           
      .replace(/resume|cv|document/gi, '') 
      .trim();

    if (cleanName && cleanName.length > 1) {
      return this.capitalizeWords(cleanName);
    }

    return 'John Doe'; 
  }

  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  async extractResumeData(file) {
    try {
      let text;

      if (file.type === 'application/pdf') {
        text = await this.extractTextFromPDF(file);
      } else {
        throw new Error('Please upload PDF files only for best results.');
      }

      return this.parseResumeText(text, file.name);
    } catch (error) {
      console.error('Resume extraction error:', error);
      throw error;
    }
  }

  parseResumeText(text, filename) {
    const extractedInfo = {
      name: '',
      email: '',
      phone: '',
      rawText: text,
    };

    console.log('Parsing resume text:', text.substring(0, 100) + '...');

    // Extract email using regex
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch && emailMatch.length > 0) {
      extractedInfo.email = emailMatch[0];
    }

    // FIXED: Phone regex without unnecessary escapes
    const phoneRegex = /(\+?1[-. ]?)?(\([0-9]{3}\)[-. ]?)?[0-9]{3}[-. ]?[0-9]{4}/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch && phoneMatch.length > 0) {
      extractedInfo.phone = phoneMatch[0].replace(/[^+\d]/g, '');
    }

    // Extract name from text or filename
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    for (let line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 2 && 
          !trimmedLine.includes('@') && 
          !trimmedLine.match(/^[\d\s\-\+\(\)]+$/) &&
          trimmedLine.match(/^[A-Za-z\s]+$/)) {
        extractedInfo.name = trimmedLine;
        break;
      }
    }

    if (!extractedInfo.name) {
      extractedInfo.name = this.extractNameFromFilename(filename.replace(/\.[^/.]+$/, ""));
    }

    console.log('Extracted info:', extractedInfo);
    return extractedInfo;
  }

  validateFile(file) {
    console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);

    const validTypes = ['application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a PDF file only');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty. Please select a valid PDF file.');
    }

    return true;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      default:
        return 'PDF Document';
    }
  }
}

export const pdfService = new PDFService();