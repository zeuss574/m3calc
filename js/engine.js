/**
 * Scientific Calculator Engine
 * High-precision mathematical expression parser, tokenizer, AST evaluator,
 * and scientific functions suite.
 */

class CalculatorEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG', 'RAD', 'GRAD'
    this.memory = 0;
    this.lastAnswer = 0;
  }

  setAngleMode(mode) {
    if (['DEG', 'RAD', 'GRAD'].includes(mode)) {
      this.angleMode = mode;
    }
  }

  // Convert input angle to radians based on active mode
  toRadians(val) {
    switch (this.angleMode) {
      case 'DEG':
        return (val * Math.PI) / 180;
      case 'GRAD':
        return (val * Math.PI) / 200;
      case 'RAD':
      default:
        return val;
    }
  }

  // Convert radian result to active angle mode (for inverse trig)
  fromRadians(rad) {
    switch (this.angleMode) {
      case 'DEG':
        return (rad * 180) / Math.PI;
      case 'GRAD':
        return (rad * 200) / Math.PI;
      case 'RAD':
      default:
        return rad;
    }
  }

  // Factorial with precision check
  factorial(n) {
    if (n < 0) throw new Error('Invalid factorial operand');
    if (!Number.isInteger(n)) throw new Error('Factorial requires integer');
    if (n > 170) return Infinity; // JS Number overflow limit
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  // Permutations nPr = n! / (n - r)!
  permutations(n, r) {
    if (n < 0 || r < 0 || r > n) throw new Error('Invalid nPr operands');
    return this.factorial(n) / this.factorial(n - r);
  }

  // Combinations nCr = n! / (r! * (n - r)!)
  combinations(n, r) {
    if (n < 0 || r < 0 || r > n) throw new Error('Invalid nCr operands');
    return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
  }

  /**
   * Preprocess human-readable input string into standard token stream:
   * Replaces display glyphs (×, ÷, −, π, √, etc.) and injects implicit multiplication.
   */
  preprocess(expr) {
    if (!expr || typeof expr !== 'string') return '';

    let s = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/–/g, '-')
      .replace(/π/g, 'pi')
      .replace(/e(?![a-zA-Z0-9_])/g, 'e_const')
      .replace(/φ/g, 'phi')
      .replace(/√\(/g, 'sqrt(')
      .replace(/∛\(/g, 'cbrt(')
      .replace(/\s+/g, '');

    // Insert implicit multiplication:
    // e.g. 2pi -> 2*pi, 2(3) -> 2*(3), (2)(3) -> (2)*(3), 5sin(30) -> 5*sin(30)
    // number followed by letter or '('
    s = s.replace(/(\d+(\.\d+)?)(\s*)([a-zA-Z_]\w*|\()/g, '$1*$4');
    // ')' followed by number or letter or '('
    s = s.replace(/\)(\s*)(\d+(\.\d+)?|[a-zA-Z_]\w*|\()/g, ')*$2');
    // constant (pi, e_const, phi, Ans) followed by '(' or number
    s = s.replace(/(pi|e_const|phi|Ans)(\s*)(\d|\()/g, '$1*$3');

    return s;
  }

  /**
   * Tokenize expression into numbers, operators, identifiers, and brackets.
   */
  tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      const ch = expr[i];

      // White space (should already be stripped, but safe guard)
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Numbers (integers, floats, scientific notation e.g., 1.5e-3)
      if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
        let numStr = '';
        while (i < len && (/[\d.]/.test(expr[i]) || (/[eE]/.test(expr[i]) && (expr[i + 1] === '+' || expr[i + 1] === '-' || /\d/.test(expr[i + 1]))))) {
          if (/[eE]/.test(expr[i])) {
            numStr += expr[i++];
            if (expr[i] === '+' || expr[i] === '-') numStr += expr[i++];
          } else {
            numStr += expr[i++];
          }
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr), raw: numStr });
        continue;
      }

      // Words (function names, constants)
      if (/[a-zA-Z_]/.test(ch)) {
        let word = '';
        while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) {
          word += expr[i++];
        }
        tokens.push({ type: 'IDENT', value: word });
        continue;
      }

      // Two-character operators or single
      if (ch === '*' && expr[i + 1] === '*') {
        tokens.push({ type: 'OP', value: '^', prec: 4, assoc: 'right' });
        i += 2;
        continue;
      }

      if ('+-*/%^!,()'.includes(ch)) {
        let prec = 0;
        let assoc = 'left';
        if (ch === '+' || ch === '-') prec = 1;
        if (ch === '*' || ch === '/' || ch === '%') prec = 2;
        if (ch === '^') { prec = 4; assoc = 'right'; }
        if (ch === '!') { prec = 5; assoc = 'left'; } // postfix factorial

        tokens.push({ type: ch === '(' ? 'LPAREN' : ch === ')' ? 'RPAREN' : ch === ',' ? 'COMMA' : 'OP', value: ch, prec, assoc });
        i++;
        continue;
      }

      throw new Error(`Unexpected character: "${ch}"`);
    }

    // Distinguish unary minus/plus:
    // A '-' or '+' is unary if it is at the start or follows an operator, LPAREN, or COMMA.
    const resolvedTokens = [];
    for (let t = 0; t < tokens.length; t++) {
      const cur = tokens[t];
      const prev = tokens[t - 1];

      if (cur.type === 'OP' && (cur.value === '-' || cur.value === '+')) {
        const isUnary = !prev || prev.type === 'OP' || prev.type === 'LPAREN' || prev.type === 'COMMA';
        if (isUnary) {
          if (cur.value === '-') {
            resolvedTokens.push({ type: 'UNARY_MINUS', value: 'u-', prec: 3, assoc: 'right' });
            continue;
          } else {
            // Unary plus is a no-op
            continue;
          }
        }
      }
      resolvedTokens.push(cur);
    }

    return resolvedTokens;
  }

  /**
   * Shunting-yard algorithm to convert infix tokens into Reverse Polish Notation (RPN).
   */
  toRPN(tokens) {
    const output = [];
    const opStack = [];

    const functionNames = new Set([
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
      'ln', 'log', 'log10', 'log2', 'exp',
      'sqrt', 'cbrt', 'abs', 'round', 'floor', 'ceil',
      'nPr', 'nCr'
    ]);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'NUMBER') {
        output.push(token);
      } else if (token.type === 'IDENT') {
        if (token.value === 'pi') {
          output.push({ type: 'NUMBER', value: Math.PI });
        } else if (token.value === 'e_const' || token.value === 'e') {
          output.push({ type: 'NUMBER', value: Math.E });
        } else if (token.value === 'phi') {
          output.push({ type: 'NUMBER', value: (1 + Math.sqrt(5)) / 2 });
        } else if (token.value === 'Ans') {
          output.push({ type: 'NUMBER', value: this.lastAnswer });
        } else if (token.value === 'RND') {
          output.push({ type: 'NUMBER', value: Math.random() });
        } else if (functionNames.has(token.value)) {
          opStack.push({ type: 'FUNC', value: token.value, prec: 6 });
        } else {
          throw new Error(`Unknown variable or function: "${token.value}"`);
        }
      } else if (token.type === 'COMMA') {
        while (opStack.length && opStack[opStack.length - 1].type !== 'LPAREN') {
          output.push(opStack.pop());
        }
        if (!opStack.length) throw new Error('Misplaced comma');
      } else if (token.type === 'OP' || token.type === 'UNARY_MINUS') {
        // Special case: postfix factorial '!' evaluates immediately on left operand
        if (token.value === '!') {
          output.push(token);
          continue;
        }

        while (
          opStack.length &&
          (opStack[opStack.length - 1].type === 'OP' ||
            opStack[opStack.length - 1].type === 'UNARY_MINUS' ||
            opStack[opStack.length - 1].type === 'FUNC')
        ) {
          const top = opStack[opStack.length - 1];
          if (
            (token.assoc === 'left' && token.prec <= top.prec) ||
            (token.assoc === 'right' && token.prec < top.prec)
          ) {
            output.push(opStack.pop());
          } else {
            break;
          }
        }
        opStack.push(token);
      } else if (token.type === 'LPAREN') {
        opStack.push(token);
      } else if (token.type === 'RPAREN') {
        let matched = false;
        while (opStack.length) {
          const top = opStack.pop();
          if (top.type === 'LPAREN') {
            matched = true;
            break;
          }
          output.push(top);
        }
        if (!matched) throw new Error('Mismatched parentheses: unexpected ")"');
        // If the top of the stack is now a function, pop it to output
        if (opStack.length && opStack[opStack.length - 1].type === 'FUNC') {
          output.push(opStack.pop());
        }
      }
    }

    while (opStack.length) {
      const top = opStack.pop();
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        throw new Error('Mismatched parentheses: unclosed "("');
      }
      output.push(top);
    }

    return output;
  }

  /**
   * Evaluate RPN token queue
   */
  evaluateRPN(rpn) {
    const stack = [];

    for (let i = 0; i < rpn.length; i++) {
      const token = rpn[i];

      if (token.type === 'NUMBER') {
        stack.push(token.value);
      } else if (token.type === 'UNARY_MINUS') {
        if (!stack.length) throw new Error('Syntax error on unary minus');
        const a = stack.pop();
        stack.push(-a);
      } else if (token.value === '!') {
        if (!stack.length) throw new Error('Missing operand for factorial');
        const a = stack.pop();
        stack.push(this.factorial(a));
      } else if (token.type === 'OP') {
        if (stack.length < 2) throw new Error(`Missing operands for operator "${token.value}"`);
        const b = stack.pop();
        const a = stack.pop();
        let res;

        switch (token.value) {
          case '+': res = a + b; break;
          case '-': res = a - b; break;
          case '*': res = a * b; break;
          case '/':
            if (b === 0) throw new Error('Division by zero');
            res = a / b;
            break;
          case '%':
            // Percentage or modulo: if a % b
            res = a % b;
            break;
          case '^':
            res = Math.pow(a, b);
            break;
          default:
            throw new Error(`Unknown operator "${token.value}"`);
        }
        stack.push(res);
      } else if (token.type === 'FUNC') {
        // Functions with 2 arguments: nPr, nCr
        if (token.value === 'nPr' || token.value === 'nCr') {
          if (stack.length < 2) throw new Error(`Missing arguments for ${token.value}(n, r)`);
          const r = stack.pop();
          const n = stack.pop();
          stack.push(token.value === 'nPr' ? this.permutations(n, r) : this.combinations(n, r));
          continue;
        }

        // 1-argument functions
        if (!stack.length) throw new Error(`Missing argument for function "${token.value}"`);
        const x = stack.pop();
        let res;

        switch (token.value) {
          case 'sin': {
            // Clean rounding for multiples of 180 deg
            if (this.angleMode === 'DEG' && x % 180 === 0) res = 0;
            else res = Math.sin(this.toRadians(x));
            break;
          }
          case 'cos': {
            if (this.angleMode === 'DEG' && (x - 90) % 180 === 0) res = 0;
            else res = Math.cos(this.toRadians(x));
            break;
          }
          case 'tan': {
            if (this.angleMode === 'DEG' && (x - 90) % 180 === 0) throw new Error('Undefined (tan 90°)');
            if (this.angleMode === 'DEG' && x % 180 === 0) res = 0;
            else res = Math.tan(this.toRadians(x));
            break;
          }
          case 'asin': {
            if (x < -1 || x > 1) throw new Error('Domain error for asin: [-1, 1]');
            res = this.fromRadians(Math.asin(x));
            break;
          }
          case 'acos': {
            if (x < -1 || x > 1) throw new Error('Domain error for acos: [-1, 1]');
            res = this.fromRadians(Math.acos(x));
            break;
          }
          case 'atan': {
            res = this.fromRadians(Math.atan(x));
            break;
          }
          case 'sinh': res = Math.sinh(x); break;
          case 'cosh': res = Math.cosh(x); break;
          case 'tanh': res = Math.tanh(x); break;
          case 'asinh': res = Math.asinh(x); break;
          case 'acosh':
            if (x < 1) throw new Error('Domain error for acosh: [1, ∞)');
            res = Math.acosh(x);
            break;
          case 'atanh':
            if (x <= -1 || x >= 1) throw new Error('Domain error for atanh: (-1, 1)');
            res = Math.atanh(x);
            break;
          case 'ln':
            if (x <= 0) throw new Error('Domain error for ln: > 0');
            res = Math.log(x);
            break;
          case 'log':
          case 'log10':
            if (x <= 0) throw new Error('Domain error for log: > 0');
            res = Math.log10(x);
            break;
          case 'log2':
            if (x <= 0) throw new Error('Domain error for log2: > 0');
            res = Math.log2(x);
            break;
          case 'exp': res = Math.exp(x); break;
          case 'sqrt':
            if (x < 0) throw new Error('Domain error for sqrt: ≥ 0');
            res = Math.sqrt(x);
            break;
          case 'cbrt': res = Math.cbrt(x); break;
          case 'abs': res = Math.abs(x); break;
          case 'round': res = Math.round(x); break;
          case 'floor': res = Math.floor(x); break;
          case 'ceil': res = Math.ceil(x); break;
          default:
            throw new Error(`Unknown function "${token.value}"`);
        }
        stack.push(res);
      }
    }

    if (stack.length !== 1) {
      throw new Error('Malformed expression');
    }

    const finalVal = stack[0];
    if (typeof finalVal !== 'number' || Number.isNaN(finalVal)) {
      throw new Error('Calculation resulted in NaN');
    }

    // Clean up precision artifacts (e.g., 0.1 + 0.2 = 0.30000000000000004)
    return this.sanitizePrecision(finalVal);
  }

  /**
   * Remove tiny floating point epsilon errors while preserving genuine precision.
   */
  sanitizePrecision(num) {
    if (!Number.isFinite(num)) return num;
    // Round to 12 decimal places if difference to nearest integer or short decimal is tiny
    const epsilon = 1e-12;
    if (Math.abs(num - Math.round(num)) < epsilon) {
      return Math.round(num);
    }
    // Convert to precision 12 and parse back
    return parseFloat(num.toPrecision(12));
  }

  /**
   * Main evaluate method.
   * Takes raw expression string, returns numerical result.
   */
  evaluate(rawExpr) {
    if (!rawExpr || !rawExpr.trim()) return 0;
    const preprocessed = this.preprocess(rawExpr);
    const tokens = this.tokenize(preprocessed);
    const rpn = this.toRPN(tokens);
    const result = this.evaluateRPN(rpn);
    this.lastAnswer = result;
    return result;
  }

  /**
   * Speculative preview evaluate:
   * Safely attempts to evaluate partial expressions as user types.
   * Closes open brackets if needed.
   * Returns null if incomplete.
   */
  tryEvaluatePreview(rawExpr) {
    if (!rawExpr || !rawExpr.trim()) return null;
    let s = rawExpr.trim();

    // If expression ends with an operator, don't preview
    if (/[+\-*/^%–−×÷,]$/.test(s)) return null;

    // Balance open parentheses
    let openCount = 0;
    for (let c of s) {
      if (c === '(') openCount++;
      if (c === ')') openCount--;
    }
    if (openCount > 0) {
      s += ')'.repeat(openCount);
    } else if (openCount < 0) {
      return null;
    }

    try {
      const res = this.evaluate(s);
      return res;
    } catch {
      return null;
    }
  }

  /**
   * Format numbers for display in Material 3 typography
   */
  formatResult(val) {
    if (val === Infinity) return '∞';
    if (val === -Infinity) return '-∞';
    if (Number.isNaN(val)) return 'Error';

    // Very large or very tiny non-zero numbers: use scientific notation
    const absVal = Math.abs(val);
    if ((absVal >= 1e14 || (absVal > 0 && absVal <= 1e-6)) && absVal !== 0) {
      return val.toExponential(6).replace('e+', 'e').replace('e', '×10^');
    }

    // Standard numbers with commas for thousands
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
}

// Export for browser or module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculatorEngine;
}
