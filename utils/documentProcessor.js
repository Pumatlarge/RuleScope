const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');
const { extractDocxTextWithNumbering } = require('./docxTextExtractor');

class DocumentProcessor {
  constructor() {
    this.datePatterns = [
      /\d{4}年\d{1,2}月\d{1,2}日/,
      /\d{4}-\d{1,2}-\d{1,2}/,
      /\d{4}\/\d{1,2}\/\d{1,2}/,
      /发布日期：?\s*(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{1,2}-\d{1,2})/,
      /生效日期：?\s*(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{1,2}-\d{1,2})/,
      /签发日期：?\s*(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{1,2}-\d{1,2})/,
      /日期：?\s*(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{1,2}-\d{1,2})/
    ];
    
    this.signaturePatterns = [
      /签发人：?\s*[^\n\r]+/,
      /发布人：?\s*[^\n\r]+/,
      /负责人：?\s*[^\n\r]+/,
      /签章：?\s*[^\n\r]+/,
      /盖章：?\s*[^\n\r]+/
    ];

    this.chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    
    this.numberingPatterns = [
      /^\d+\./,
      /^\d+、/,
      /^\d+．/,
      /^[（(]\d+[)）]/,
      /^[第][一二三四五六七八九十百千万]+[章节条款]/,
      /^[（(][一二三四五六七八九十]+[)）]/,
      /^[一二三四五六七八九十]+[、.．]/,
      /^[IVXLCDM]+[.、]/
    ];
  }

  hasNumberingPrefix(text) {
    const trimmedText = text.trim();
    for (const pattern of this.numberingPatterns) {
      if (pattern.test(trimmedText)) {
        return true;
      }
    }
    return false;
  }

  htmlToTextWithNumbering(html) {
    let text = html;
    let listCounters = {};
    let listTypes = {};
    let listLevel = 0;

    text = text.replace(/<ol[^>]*>/gi, (match) => {
      listLevel++;
      const typeMatch = match.match(/type=['"]?([aAiI1])['"]?/i);
      const startMatch = match.match(/start=['"]?(\d+)['"]?/i);
      const listId = `list_${listLevel}`;
      listTypes[listId] = typeMatch ? typeMatch[1].toLowerCase() : '1';
      listCounters[listId] = startMatch ? parseInt(startMatch[1]) : 1;
      return '\n';
    });

    text = text.replace(/<ul[^>]*>/gi, () => {
      listLevel++;
      const listId = `list_${listLevel}`;
      listTypes[listId] = 'bullet';
      listCounters[listId] = 0;
      return '\n';
    });

    text = text.replace(/<\/ol>/gi, () => {
      const listId = `list_${listLevel}`;
      delete listCounters[listId];
      delete listTypes[listId];
      listLevel = Math.max(0, listLevel - 1);
      return '\n';
    });

    text = text.replace(/<\/ul>/gi, () => {
      const listId = `list_${listLevel}`;
      delete listCounters[listId];
      delete listTypes[listId];
      listLevel = Math.max(0, listLevel - 1);
      return '\n';
    });

    text = text.replace(/<li[^>]*>/gi, () => {
      const listId = `list_${listLevel}`;
      const counter = listCounters[listId] || 1;
      const type = listTypes[listId] || '1';
      
      let prefix = '';
      if (type === 'bullet') {
        prefix = '• ';
      } else if (type === '1') {
        prefix = `${counter}. `;
      } else if (type === 'a') {
        prefix = `${String.fromCharCode(96 + counter)}) `;
      } else if (type === 'A') {
        prefix = `${String.fromCharCode(64 + counter)}. `;
      } else if (type === 'i') {
        prefix = `${this.toRoman(counter).toLowerCase()}) `;
      } else if (type === 'I') {
        prefix = `${this.toRoman(counter)}. `;
      }
      
      listCounters[listId] = counter + 1;
      return prefix;
    });

    text = text.replace(/<\/li>/gi, '\n');

    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<h[1-6][^>]*>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n');

    text = text.replace(/<[^>]+>/g, '');

    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');

    text = text.replace(/\n\s*\n/g, '\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();

    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
      const trimmedLine = line.trim();
      
      for (const pattern of this.numberingPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const prefix = match[0];
          const remainingText = trimmedLine.substring(prefix.length).trim();
          
          if (this.hasNumberingPrefix(remainingText)) {
            return remainingText;
          }
        }
      }
      
      return trimmedLine;
    });

    return cleanedLines.filter(line => line.length > 0).join('\n');
  }

  toRoman(num) {
    const romanNumerals = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
      ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
      ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    let result = '';
    for (const [roman, value] of romanNumerals) {
      while (num >= value) {
        result += roman;
        num -= value;
      }
    }
    return result;
  }

  async processDocument(filePath) {
    try {
      const text = await extractDocxTextWithNumbering(filePath);
      const stats = await fs.stat(filePath);

      const documentInfo = {
        content: text,
        metadata: {
          fileSize: stats.size,
          createdDate: stats.birthtime,
          modifiedDate: stats.mtime,
          pageCount: 0
        }
      };

      const signatureInfo = this.extractSignatureInfo(text);
      const dateInfo = this.extractDateInfo(text);

      return {
        ...documentInfo,
        ...signatureInfo,
        ...dateInfo
      };
    } catch (error) {
      throw new Error(`文档处理失败: ${error.message}`);
    }
  }

  extractSignatureInfo(text) {
    let signatory = '';
    
    for (const pattern of this.signaturePatterns) {
      const match = text.match(pattern);
      if (match) {
        signatory = match[0].replace(/签发人：?|发布人：?|负责人：?|签章：?|盖章：?\s*/, '').trim();
        break;
      }
    }

    return { signatory };
  }

  extractDateInfo(text) {
    let signatureDate = null;
    let effectiveDate = null;

    const lines = text.split('\n');
    
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 20); i--) {
      const line = lines[i].trim();
      
      if (!line) continue;

      for (const pattern of this.datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const dateStr = match[0];
          const parsedDate = this.parseDate(dateStr);
          
          if (!signatureDate) {
            signatureDate = parsedDate;
          } else if (!effectiveDate && i < lines.length - 1) {
            effectiveDate = parsedDate;
          }
        }
      }
    }

    return { signatureDate, effectiveDate };
  }

  parseDate(dateStr) {
    const normalizedDate = dateStr
      .replace(/[年月日]/g, '-')
      .replace(/\//g, '-')
      .replace(/-/g, '-')
      .replace(/--/g, '-')
      .trim();

    const dateParts = normalizedDate.split('-');
    
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      
      if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(year, month - 1, day);
      }
    }
    
    return null;
  }

  extractKeywords(text) {
    const stopWords = [
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'if', 'because', 'so', 'then', 'than', 'as', 'but', 'or', 'yet', 'for', 'nor', 'not', 'only', 'such', 'no', 'nor', 'not', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
    ];

    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word));

    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  countWords(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

  generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${baseName}_${timestamp}_${random}${ext}`;
  }
}

module.exports = DocumentProcessor;
