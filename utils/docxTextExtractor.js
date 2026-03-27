const unzip = require('mammoth/lib/unzip');
const officeXml = require('mammoth/lib/docx/office-xml-reader');
const docxReader = require('mammoth/lib/docx/docx-reader');

async function extractDocxTextWithNumbering(filePath) {
  const zip = await unzip.openZip({ path: filePath });
  const partPaths = await docxReader._findPartPaths(zip);
  const documentXml = await officeXml.readXmlFromZipFile(zip, partPaths.mainDocument);
  const numberingXml = await officeXml.readXmlFromZipFile(zip, partPaths.numbering);

  if (!documentXml) {
    return '';
  }

  const body = documentXml.first('w:body');
  if (!body) {
    return '';
  }

  const numberingDefinitions = readNumberingDefinitions(numberingXml);
  const numberingState = {};
  const blocks = [];

  for (const child of body.children) {
    if (!child || child.type !== 'element') {
      continue;
    }

    if (child.name === 'w:p') {
      const paragraph = readParagraph(child, numberingDefinitions, numberingState);
      if (paragraph) {
        blocks.push(paragraph);
      }
    } else if (child.name === 'w:tbl') {
      const table = readTable(child, numberingDefinitions, numberingState);
      if (table) {
        blocks.push(table);
      }
    }
  }

  return normalizeOutput(blocks.join('\n\n'));
}

function readNumberingDefinitions(numberingXml) {
  const definitions = { nums: {}, abstractNums: {} };
  if (!numberingXml) {
    return definitions;
  }

  numberingXml.getElementsByTagName('w:abstractNum').forEach((abstractNum) => {
    const abstractNumId = abstractNum.attributes['w:abstractNumId'];
    const levels = {};

    abstractNum.getElementsByTagName('w:lvl').forEach((levelElement) => {
      const level = String(levelElement.attributes['w:ilvl'] || '0');
      levels[level] = {
        start: parseInt(levelElement.firstOrEmpty('w:start').attributes['w:val'] || '1', 10),
        numFmt: levelElement.firstOrEmpty('w:numFmt').attributes['w:val'] || 'decimal',
        lvlText: levelElement.firstOrEmpty('w:lvlText').attributes['w:val'] || `%${Number(level) + 1}`,
      };
    });

    definitions.abstractNums[abstractNumId] = { levels };
  });

  numberingXml.getElementsByTagName('w:num').forEach((num) => {
    const numId = num.attributes['w:numId'];
    const abstractNumId = num.firstOrEmpty('w:abstractNumId').attributes['w:val'];
    const levelOverrides = {};

    num.getElementsByTagName('w:lvlOverride').forEach((override) => {
      const level = String(override.attributes['w:ilvl'] || '0');
      const startOverride = override.firstOrEmpty('w:startOverride').attributes['w:val'];
      const lvl = override.first('w:lvl');

      levelOverrides[level] = {
        startOverride: startOverride ? parseInt(startOverride, 10) : null,
        level: lvl ? {
          start: parseInt(lvl.firstOrEmpty('w:start').attributes['w:val'] || '1', 10),
          numFmt: lvl.firstOrEmpty('w:numFmt').attributes['w:val'] || 'decimal',
          lvlText: lvl.firstOrEmpty('w:lvlText').attributes['w:val'] || `%${Number(level) + 1}`,
        } : null,
      };
    });

    definitions.nums[numId] = { abstractNumId, levelOverrides };
  });

  return definitions;
}

function readParagraph(paragraphElement, numberingDefinitions, numberingState) {
  const paragraphProperties = paragraphElement.firstOrEmpty('w:pPr');
  const numPr = paragraphProperties.first('w:numPr');
  const text = normalizeInlineText(readElementText(paragraphElement)).trim();

  if (!text) {
    return '';
  }

  const prefix = resolveNumberingPrefix(numPr, numberingDefinitions, numberingState);
  if (!prefix) {
    return text;
  }

  return text.startsWith(prefix) ? text : `${prefix} ${text}`;
}

function readTable(tableElement, numberingDefinitions, numberingState) {
  const rows = [];

  tableElement.getElementsByTagName('w:tr').forEach((row) => {
    const cells = [];
    row.getElementsByTagName('w:tc').forEach((cell) => {
      const cellParts = [];
      cell.children.forEach((child) => {
        if (child && child.type === 'element' && child.name === 'w:p') {
          const paragraph = readParagraph(child, numberingDefinitions, numberingState);
          if (paragraph) {
            cellParts.push(paragraph);
          }
        }
      });

      const cellText = normalizeOutput(cellParts.join('\n')).trim();
      if (cellText) {
        cells.push(cellText);
      }
    });

    if (cells.length > 0) {
      rows.push(cells.join(' | '));
    }
  });

  return rows.join('\n');
}

function resolveNumberingPrefix(numPr, numberingDefinitions, numberingState) {
  if (!numPr) {
    return '';
  }

  const level = String(numPr.firstOrEmpty('w:ilvl').attributes['w:val'] || '0');
  const numId = numPr.firstOrEmpty('w:numId').attributes['w:val'];
  if (!numId) {
    return '';
  }

  const concreteNumbering = numberingDefinitions.nums[numId];
  if (!concreteNumbering) {
    return '';
  }

  const abstractNumbering = numberingDefinitions.abstractNums[concreteNumbering.abstractNumId];
  if (!abstractNumbering) {
    return '';
  }

  const levelDefinition = getLevelDefinition(concreteNumbering, abstractNumbering, level);
  if (!levelDefinition) {
    return '';
  }

  const stateForNum = numberingState[numId] || {};
  numberingState[numId] = stateForNum;

  for (const existingLevel of Object.keys(stateForNum)) {
    if (Number(existingLevel) > Number(level)) {
      delete stateForNum[existingLevel];
    }
  }

  const startValue = getStartValue(concreteNumbering, levelDefinition, level);
  stateForNum[level] = stateForNum[level] == null ? startValue : stateForNum[level] + 1;

  return formatLevelText(levelDefinition.lvlText, numId, numberingDefinitions, numberingState);
}

function getLevelDefinition(concreteNumbering, abstractNumbering, level) {
  const override = concreteNumbering.levelOverrides[level];
  if (override && override.level) {
    return override.level;
  }
  return abstractNumbering.levels[level];
}

function getStartValue(concreteNumbering, levelDefinition, level) {
  const override = concreteNumbering.levelOverrides[level];
  if (override && override.startOverride != null) {
    return override.startOverride;
  }
  return levelDefinition.start || 1;
}

function formatLevelText(lvlText, numId, numberingDefinitions, numberingState) {
  return lvlText.replace(/%(\d+)/g, (_, rawLevelNumber) => {
    const referencedLevel = String(Number(rawLevelNumber) - 1);
    const concreteNumbering = numberingDefinitions.nums[numId];
    const abstractNumbering = numberingDefinitions.abstractNums[concreteNumbering.abstractNumId];
    const levelDefinition = getLevelDefinition(concreteNumbering, abstractNumbering, referencedLevel);
    const stateForNum = numberingState[numId] || {};

    let value = stateForNum[referencedLevel];
    if (value == null) {
      value = getStartValue(concreteNumbering, levelDefinition, referencedLevel);
      stateForNum[referencedLevel] = value;
    }

    return formatNumber(value, levelDefinition ? levelDefinition.numFmt : 'decimal');
  });
}

function formatNumber(value, numFmt) {
  switch (numFmt) {
    case 'decimal':
      return String(value);
    case 'upperLetter':
      return toAlphabetic(value).toUpperCase();
    case 'lowerLetter':
      return toAlphabetic(value).toLowerCase();
    case 'upperRoman':
      return toRoman(value).toUpperCase();
    case 'lowerRoman':
      return toRoman(value).toLowerCase();
    case 'chineseCounting':
    case 'chineseCountingThousand':
      return toChineseNumber(value);
    case 'chineseLegalSimplified':
      return toChineseFinancialNumber(value);
    case 'bullet':
      return '•';
    default:
      return String(value);
  }
}

function toAlphabetic(value) {
  let result = '';
  let current = value;

  while (current > 0) {
    current -= 1;
    result = String.fromCharCode(97 + (current % 26)) + result;
    current = Math.floor(current / 26);
  }

  return result || 'a';
}

function toRoman(value) {
  const numerals = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
  ];

  let remaining = value;
  let result = '';

  for (const [symbol, amount] of numerals) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }

  return result || 'I';
}

function toChineseNumber(value) {
  if (value === 0) {
    return '零';
  }

  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百', '千'];
  const sectionUnits = ['', '万', '亿'];
  let remaining = value;
  let sectionIndex = 0;
  let result = '';
  let needsZero = false;

  while (remaining > 0) {
    const section = remaining % 10000;
    if (section === 0) {
      if (result && !result.startsWith('零')) {
        needsZero = true;
      }
    } else {
      let sectionText = '';
      let sectionRemaining = section;
      let unitIndex = 0;
      let zeroInSection = false;

      while (sectionRemaining > 0) {
        const digit = sectionRemaining % 10;
        if (digit === 0) {
          if (sectionText && !sectionText.startsWith('零')) {
            zeroInSection = true;
          }
        } else {
          const zeroPrefix = zeroInSection ? '零' : '';
          sectionText = `${digits[digit]}${units[unitIndex]}${zeroPrefix}${sectionText}`;
          zeroInSection = false;
        }
        sectionRemaining = Math.floor(sectionRemaining / 10);
        unitIndex += 1;
      }

      if (needsZero && !sectionText.startsWith('零')) {
        sectionText = `零${sectionText}`;
      }

      result = `${sectionText}${sectionUnits[sectionIndex]}${result}`;
      needsZero = section < 1000 && remaining >= 10000;
    }

    remaining = Math.floor(remaining / 10000);
    sectionIndex += 1;
  }

  return result.replace(/^一十/, '十').replace(/零+/g, '零').replace(/零$/g, '');
}

function toChineseFinancialNumber(value) {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const sectionUnits = ['', '万', '亿'];

  if (value === 0) {
    return digits[0];
  }

  let remaining = value;
  let sectionIndex = 0;
  let result = '';
  let needsZero = false;

  while (remaining > 0) {
    const section = remaining % 10000;
    if (section === 0) {
      if (result && !result.startsWith(digits[0])) {
        needsZero = true;
      }
    } else {
      let sectionText = '';
      let sectionRemaining = section;
      let unitIndex = 0;
      let zeroInSection = false;

      while (sectionRemaining > 0) {
        const digit = sectionRemaining % 10;
        if (digit === 0) {
          if (sectionText && !sectionText.startsWith(digits[0])) {
            zeroInSection = true;
          }
        } else {
          const zeroPrefix = zeroInSection ? digits[0] : '';
          sectionText = `${digits[digit]}${units[unitIndex]}${zeroPrefix}${sectionText}`;
          zeroInSection = false;
        }
        sectionRemaining = Math.floor(sectionRemaining / 10);
        unitIndex += 1;
      }

      if (needsZero && !sectionText.startsWith(digits[0])) {
        sectionText = `${digits[0]}${sectionText}`;
      }

      result = `${sectionText}${sectionUnits[sectionIndex]}${result}`;
      needsZero = section < 1000 && remaining >= 10000;
    }

    remaining = Math.floor(remaining / 10000);
    sectionIndex += 1;
  }

  return result.replace(/零+/g, '零').replace(/零$/g, '');
}

function readElementText(node) {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.value;
  }

  if (node.type !== 'element') {
    return '';
  }

  if (node.name === 'w:t') {
    return node.children.map(readElementText).join('');
  }

  if (node.name === 'w:tab') {
    return '\t';
  }

  if (node.name === 'w:br' || node.name === 'w:cr') {
    return '\n';
  }

  if (node.name === 'w:noBreakHyphen') {
    return '-';
  }

  if (node.name === 'w:softHyphen') {
    return '';
  }

  return node.children.map(readElementText).join('');
}

function normalizeInlineText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ');
}

function normalizeOutput(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


module.exports = {
  extractDocxTextWithNumbering,
};
