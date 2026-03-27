const diff = require('diff');
const DocumentProcessor = require('./documentProcessor');

class VersionComparator {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
  }

  async compareVersions(version1, version2) {
    const diffResult = diff.diffLines(version1.content, version2.content);
    
    const comparison = {
      version1: {
        title: version1.title,
        version: version1.version,
        uploadedBy: version1.uploadedBy,
        uploadedAt: version1.createdAt
      },
      version2: {
        title: version2.title,
        version: version2.version,
        uploadedBy: version2.uploadedBy,
        uploadedAt: version2.createdAt
      },
      changes: {
        added: [],
        removed: [],
        modified: [],
        unchanged: []
      },
      statistics: {
        addedLines: 0,
        removedLines: 0,
        modifiedLines: 0,
        unchangedLines: 0
      },
      summary: ''
    };

    let lineNum1 = 1;
    let lineNum2 = 1;

    diffResult.forEach(part => {
      if (part.added) {
        const lines = part.value.split('\n');
        lines.forEach((line, index) => {
          if (line.trim()) {
            comparison.changes.added.push({
              lineNumber: lineNum2 + index,
              content: line,
              context: this.getContext(diffResult, lineNum2 + index)
            });
            comparison.statistics.addedLines++;
          }
        });
        lineNum2 += lines.length - 1;
      } else if (part.removed) {
        const lines = part.value.split('\n');
        lines.forEach((line, index) => {
          if (line.trim()) {
            comparison.changes.removed.push({
              lineNumber: lineNum1 + index,
              content: line,
              context: this.getContext(diffResult, lineNum1 + index)
            });
            comparison.statistics.removedLines++;
          }
        });
        lineNum1 += lines.length - 1;
      } else if (part.value) {
        const lines = part.value.split('\n');
        lines.forEach((line, index) => {
          if (line.trim()) {
            comparison.changes.unchanged.push({
              lineNumber: lineNum1 + index,
              content: line
            });
            comparison.statistics.unchangedLines++;
          }
        });
        lineNum1 += lines.length - 1;
        lineNum2 += lines.length - 1;
      }
    });

    comparison.changes.modified = this.findModifiedLines(diffResult);
    comparison.statistics.modifiedLines = comparison.changes.modified.length;

    comparison.summary = this.generateComparisonSummary(comparison);

    return comparison;
  }

  findModifiedLines(diffResult) {
    const modified = [];
    let lineNum1 = 1;
    let lineNum2 = 1;

    diffResult.forEach(part => {
      if (part.added || part.removed) {
        return;
      }

      const lines = part.value.split('\n');
      lines.forEach((line, index) => {
        if (line.trim()) {
          modified.push({
            lineNumber1: lineNum1 + index,
            lineNumber2: lineNum2 + index,
            content: line,
            hash: this.hashString(line)
          });
        }
      });

      lineNum1 += lines.length - 1;
      lineNum2 += lines.length - 1;
    });

    return modified;
  }

  getContext(diffResult, targetLine) {
    const contextLines = [];
    let currentLine = 1;

    for (const part of diffResult) {
      if (part.added || part.removed) {
        const lines = part.value.split('\n');
        lines.forEach((line, index) => {
          if (Math.abs(currentLine + index - targetLine) <= 2) {
            contextLines.push({
              type: part.added ? 'added' : 'removed',
              content: line,
              lineNumber: currentLine + index
            });
          }
        });
        currentLine += lines.length - 1;
      } else {
        const lines = part.value.split('\n');
        lines.forEach((line, index) => {
          if (Math.abs(currentLine + index - targetLine) <= 2) {
            contextLines.push({
              type: 'unchanged',
              content: line,
              lineNumber: currentLine + index
            });
          }
        });
        currentLine += lines.length - 1;
      }
    }

    return contextLines;
  }

  generateComparisonSummary(comparison) {
    const { addedLines, removedLines, modifiedLines, unchangedLines } = comparison.statistics;
    const totalLines = addedLines + removedLines + modifiedLines + unchangedLines;

    const percentageChanged = ((addedLines + removedLines + modifiedLines) / totalLines * 100).toFixed(1);

    return `版本对比摘要：
• 总行数：${totalLines}
• 新增行数：${addedLines}
• 删除行数：${removedLines}
• 修改行数：${modifiedLines}
• 未变更行数：${unchangedLines}
• 变更比例：${percentageChanged}%

主要变更：
${this.getMajorChanges(comparison)}`;
  }

  getMajorChanges(comparison) {
    const majorChanges = [];

    if (comparison.changes.added.length > 0) {
      majorChanges.push(`• 新增内容：${comparison.changes.added.length} 处`);
    }

    if (comparison.changes.removed.length > 0) {
      majorChanges.push(`• 删除内容：${comparison.changes.removed.length} 处`);
    }

    if (comparison.changes.modified.length > 0) {
      majorChanges.push(`• 修改内容：${comparison.changes.modified.length} 处`);
    }

    return majorChanges.join('\n');
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  generateHTMLComparison(comparison) {
    const { version1, version2, changes } = comparison;
    
    let html = `
    <div class="version-comparison">
      <div class="version-info">
        <div class="version">
          <h3>版本 ${version1.version}</h3>
          <p>上传人：${version1.uploadedBy}</p>
          <p>上传时间：${new Date(version1.uploadedAt).toLocaleString()}</p>
        </div>
        <div class="version">
          <h3>版本 ${version2.version}</h3>
          <p>上传人：${version2.uploadedBy}</p>
          <p>上传时间：${new Date(version2.uploadedAt).toLocaleString()}</p>
        </div>
      </div>
      
      <div class="changes-summary">
        <h4>变更摘要</h4>
        <div class="stats">
          <span class="added">+${changes.added.length}</span>
          <span class="removed">-${changes.removed.length}</span>
          <span class="modified">~${changes.modified.length}</span>
        </div>
      </div>
      
      <div class="changes-content">
    `;

    changes.added.forEach(change => {
      html += `
        <div class="change-line added" data-line="${change.lineNumber}">
          <span class="line-number">${change.lineNumber}</span>
          <span class="content">${change.content}</span>
          <span class="context">${this.formatContext(change.context)}</span>
        </div>
      `;
    });

    changes.removed.forEach(change => {
      html += `
        <div class="change-line removed" data-line="${change.lineNumber}">
          <span class="line-number">${change.lineNumber}</span>
          <span class="content">${change.content}</span>
          <span class="context">${this.formatContext(change.context)}</span>
        </div>
      `;
    });

    changes.modified.forEach(change => {
      html += `
        <div class="change-line modified" data-line="${change.lineNumber1}-${change.lineNumber2}">
          <span class="line-number">${change.lineNumber1}</span>
          <span class="content">${change.content}</span>
          <span class="context">修改</span>
        </div>
      `;
    });

    html += `
      </div>
    </div>
    `;

    return html;
  }

  formatContext(context) {
    return context.slice(0, 3).map(line => 
      `<span class="${line.type}">${line.content}</span>`
    ).join('...');
  }
}

module.exports = VersionComparator;