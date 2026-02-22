/**
 * LaTeX to PDF Converter Component
 * 
 * This component provides utilities for converting LaTeX/MathJax expressions
 * to readable text format suitable for PDF generation.
 * 
 * Features:
 * - Matrix conversion (all types: matrix, pmatrix, bmatrix, vmatrix, Vmatrix)
 * - Mathematical symbols and Greek letters
 * - Fractions, square roots, superscripts, subscripts
 * - Vector notation and matrix operations
 * - Systems of equations (cases)
 * - Determinants and mathematical functions
 */

class LaTeXToPDFConverter {
  /**
   * Main function to clean LaTeX/MathJax expressions for PDF rendering
   * @param {string} text - Raw text containing LaTeX expressions
   * @returns {string} - Cleaned text with Unicode mathematical symbols
   */
  static cleanMathExpression(text) {
    if (!text || typeof text !== 'string') return '';
    
    let cleanText = text
      // Remove MathJax delimiters
      .replace(/\$\$([^$]+)\$\$/g, '$1')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/\\begin\{equation\}(.*?)\\end\{equation\}/gs, '$1')
      .replace(/\\begin\{align\}(.*?)\\end\{align\}/gs, '$1')
      
      // Handle matrices - convert to readable format
      .replace(/\\begin\{matrix\}(.*?)\\end\{matrix\}/gs, (match, content) => {
        return LaTeXToPDFConverter._formatMatrix(content, '[', ']');
      })
      .replace(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/gs, (match, content) => {
        return LaTeXToPDFConverter._formatMatrix(content, '(', ')');
      })
      .replace(/\\begin\{bmatrix\}(.*?)\\end\{bmatrix\}/gs, (match, content) => {
        return LaTeXToPDFConverter._formatMatrix(content, '[', ']');
      })
      .replace(/\\begin\{vmatrix\}(.*?)\\end\{vmatrix\}/gs, (match, content) => {
        return LaTeXToPDFConverter._formatMatrix(content, '|', '|');
      })
      .replace(/\\begin\{Vmatrix\}(.*?)\\end\{Vmatrix\}/gs, (match, content) => {
        return LaTeXToPDFConverter._formatMatrix(content, '||', '||');
      })
      
      // Handle systems of equations
      .replace(/\\begin\{cases\}(.*?)\\end\{cases\}/gs, (match, content) => {
        const cases = content.split('\\\\').map(case_item => 
          case_item.trim().replace(/&/g, ' ')
        ).filter(case_item => case_item.length > 0).join('; ');
        return `{${cases}}`;
      })
      
      // Handle determinants and matrix functions
      .replace(/\\det\s*\(/g, 'det(')
      .replace(/\\det\s*\\left\(/g, 'det(')
      
      // Convert fractions and roots
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$2^(1/$1)')
      
      // Convert Greek letters (lowercase)
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\delta/g, 'δ')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\zeta/g, 'ζ')
      .replace(/\\eta/g, 'η')
      .replace(/\\theta/g, 'θ')
      .replace(/\\iota/g, 'ι')
      .replace(/\\kappa/g, 'κ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\nu/g, 'ν')
      .replace(/\\xi/g, 'ξ')
      .replace(/\\pi/g, 'π')
      .replace(/\\rho/g, 'ρ')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\tau/g, 'τ')
      .replace(/\\upsilon/g, 'υ')
      .replace(/\\phi/g, 'φ')
      .replace(/\\chi/g, 'χ')
      .replace(/\\psi/g, 'ψ')
      .replace(/\\omega/g, 'ω')
      
      // Convert Greek letters (uppercase)
      .replace(/\\Gamma/g, 'Γ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\Theta/g, 'Θ')
      .replace(/\\Lambda/g, 'Λ')
      .replace(/\\Xi/g, 'Ξ')
      .replace(/\\Pi/g, 'Π')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\Upsilon/g, 'Υ')
      .replace(/\\Phi/g, 'Φ')
      .replace(/\\Chi/g, 'Χ')
      .replace(/\\Psi/g, 'Ψ')
      .replace(/\\Omega/g, 'Ω')
      
      // Convert superscripts and subscripts
      .replace(/\^(\d)/g, (match, digit) => {
        const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
        return superscripts[parseInt(digit)] || `^${digit}`;
      })
      .replace(/_(\d)/g, (match, digit) => {
        const subscripts = '₀₁₂₃₄₅₆₇₈₉';
        return subscripts[parseInt(digit)] || `_${digit}`;
      })
      .replace(/\^{([^}]+)}/g, '^($1)')
      .replace(/_{([^}]+)}/g, '_($1)')
      
      // Handle matrix operations and related commands
      .replace(/\\transpose/g, 'ᵀ')
      .replace(/\\T\b/g, 'ᵀ')
      .replace(/\^T\b/g, 'ᵀ')
      .replace(/\\inverse/g, '⁻¹')
      .replace(/\^{-1}/g, '⁻¹')
      .replace(/\\rank/g, 'rank')
      .replace(/\\trace/g, 'tr')
      .replace(/\\tr/g, 'tr')
      
      // Handle vectors
      .replace(/\\vec\{([^}]+)\}/g, '→$1')
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/\\boldsymbol\{([^}]+)\}/g, '$1')
      
      // Handle common bracket notations
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\|/g, '|')
      .replace(/\\right\|/g, '|')
      .replace(/\\left</g, '<')
      .replace(/\\right>/g, '>')
      
      // Convert mathematical operators and symbols
      .replace(/\\sum/g, 'Σ')
      .replace(/\\prod/g, 'Π')
      .replace(/\\int/g, '∫')
      .replace(/\\oint/g, '∮')
      .replace(/\\lim/g, 'lim')
      .replace(/\\infty/g, '∞')
      .replace(/\\partial/g, '∂')
      .replace(/\\nabla/g, '∇')
      
      // Convert comparison and relation symbols
      .replace(/\\geq/g, '≥')
      .replace(/\\leq/g, '≤')
      .replace(/\\neq/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\equiv/g, '≡')
      .replace(/\\sim/g, '∼')
      .replace(/\\propto/g, '∝')
      
      // Convert arithmetic operators
      .replace(/\\pm/g, '±')
      .replace(/\\mp/g, '∓')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\bullet/g, '•')
      .replace(/\\ast/g, '*')
      .replace(/\\star/g, '⋆')
      .replace(/\\circ/g, '∘')
      
      // Convert set theory symbols
      .replace(/\\in/g, '∈')
      .replace(/\\notin/g, '∉')
      .replace(/\\subset/g, '⊂')
      .replace(/\\supset/g, '⊃')
      .replace(/\\subseteq/g, '⊆')
      .replace(/\\supseteq/g, '⊇')
      .replace(/\\cup/g, '∪')
      .replace(/\\cap/g, '∩')
      .replace(/\\emptyset/g, '∅')
      
      // Convert logic symbols
      .replace(/\\land/g, '∧')
      .replace(/\\lor/g, '∨')
      .replace(/\\neg/g, '¬')
      .replace(/\\implies/g, '⇒')
      .replace(/\\iff/g, '⇔')
      .replace(/\\forall/g, '∀')
      .replace(/\\exists/g, '∃')
      
      // Convert arrows
      .replace(/\\rightarrow/g, '→')
      .replace(/\\leftarrow/g, '←')
      .replace(/\\leftrightarrow/g, '↔')
      .replace(/\\Rightarrow/g, '⇒')
      .replace(/\\Leftarrow/g, '⇐')
      .replace(/\\Leftrightarrow/g, '⇔')
      
      // Remove remaining LaTeX commands
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanText;
  }
  
  /**
   * Private helper method to format matrix content
   * @param {string} content - Matrix content between \begin and \end
   * @param {string} leftBracket - Left bracket character(s)
   * @param {string} rightBracket - Right bracket character(s)
   * @returns {string} - Formatted matrix string
   * @private
   */
  static _formatMatrix(content, leftBracket, rightBracket) {
    try {
      const rows = content.split('\\\\')
        .map(row => row.trim())
        .filter(row => row.length > 0)
        .map(row => {
          return row.split('&')
            .map(cell => cell.trim())
            .filter(cell => cell.length > 0)
            .join(' ');
        })
        .join(' | ');
      
      return `${leftBracket}${rows}${rightBracket}`;
    } catch (error) {
      // If matrix parsing fails, return cleaned content
      return `${leftBracket}${content.replace(/[\\&]/g, ' ').replace(/\s+/g, ' ').trim()}${rightBracket}`;
    }
  }
  
  /**
   * Process a question object and clean all LaTeX expressions
   * @param {Object} question - Question object with text and options
   * @returns {Object} - Question object with cleaned LaTeX expressions
   */
  static processQuestion(question) {
    if (!question || typeof question !== 'object') {
      return question;
    }
    
    const processedQuestion = { ...question };
    
    // Clean question text
    if (processedQuestion.question) {
      processedQuestion.question = LaTeXToPDFConverter.cleanMathExpression(processedQuestion.question);
    }
    
    // Clean options if they exist
    if (processedQuestion.options && Array.isArray(processedQuestion.options)) {
      processedQuestion.options = processedQuestion.options.map(option => {
        if (typeof option === 'string') {
          return LaTeXToPDFConverter.cleanMathExpression(option);
        } else if (option && typeof option === 'object') {
          return {
            ...option,
            value: option.value ? LaTeXToPDFConverter.cleanMathExpression(option.value) : option.value
          };
        }
        return option;
      });
    }
    
    return processedQuestion;
  }
  
  /**
   * Process an array of questions and clean all LaTeX expressions
   * @param {Array} questions - Array of question objects
   * @returns {Array} - Array of questions with cleaned LaTeX expressions
   */
  static processQuestions(questions) {
    if (!Array.isArray(questions)) {
      return questions;
    }
    
    return questions.map(question => LaTeXToPDFConverter.processQuestion(question));
  }
}

export default LaTeXToPDFConverter;