import React from "react";
import { Copy, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import "./styles/CodeBlock.css";

interface CodeBlockProps {
  fields: {
    title?: string;
    description?: string;
    code: string;
    language?: string;
    showLineNumbers?: string | boolean;
    theme?: "light" | "dark";
    highlightLines?: string; // Format: "1,3-5,8" - supports individual lines and ranges
    fileName?: string;
    showCopyButton?: string | boolean;
    showHeader?: string | boolean;
  };
}

const CodeBlock: React.FC<CodeBlockProps> = ({ fields }) => {
  const {
    title,
    description,
    code,
    language = "javascript",
    showLineNumbers = false,
    theme = "light",
    highlightLines = "",
    fileName,
    showCopyButton = true,
    showHeader = true,
  } = fields;

  // Note: Copy functionality is handled by client-side script
  // The client script will handle the copy state and visual feedback

  // Convert string booleans to actual booleans
  const shouldShowLineNumbers = showLineNumbers === "true" || showLineNumbers === true;
  const shouldShowCopyButton = showCopyButton === "true" || showCopyButton === true;
  const shouldShowHeader = showHeader === "true" || showHeader === true;

  const handleCopy = async () => {
    // Copy functionality is now handled by the client script
    // This function is kept for potential server-side compatibility
    // but the actual copy logic is in clientScript.ts
  };

  const formatCodeWithLineNumbers = (code: string) => {
    const lines = code.split('\n');
    
    // Parse highlight lines with support for ranges (e.g., "1,3-5,8")
    const parseHighlightLines = (highlightSpec: string): number[] => {
      if (!highlightSpec.trim()) return [];
      
      const result: number[] = [];
      const parts = highlightSpec.split(',').map(part => part.trim()).filter(part => part);
      
      parts.forEach(part => {
        if (part.includes('-')) {
          // Handle range like "3-5"
          const [start, end] = part.split('-').map(num => parseInt(num.trim()));
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
              result.push(i);
            }
          }
        } else {
          // Handle single number like "1" or "8"
          const num = parseInt(part);
          if (!isNaN(num)) {
            result.push(num);
          }
        }
      });
      
      return result.filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    };
    
    const highlightedLines = parseHighlightLines(highlightLines);
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isHighlighted = highlightedLines.includes(lineNumber);
      
      return (
        <div 
          key={index} 
          className={cn(
            "code-line",
            isHighlighted && "code-line--highlighted"
          )}
        >
          {shouldShowLineNumbers && (
            <span className="line-number">{lineNumber}</span>
          )}
          <span 
            className="line-content"
            dangerouslySetInnerHTML={{ 
              __html: line ? getSyntaxHighlightedCode(line, language) : ' ' 
            }}
          />
        </div>
      );
    });
  };

  const getLanguageDisplayName = (lang: string) => {
    const languageNames: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      cpp: "C++",
      csharp: "C#",
      php: "PHP",
      ruby: "Ruby",
      go: "Go",
      rust: "Rust",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      xml: "XML",
      yaml: "YAML",
      bash: "Bash/Shell",
      sql: "SQL",
      markdown: "Markdown",
      plaintext: "Plain Text",
    };
    return languageNames[lang] || lang.toUpperCase();
  };

  const getSyntaxHighlightedCode = (code: string, language: string) => {
    // Enhanced syntax highlighting with proper tokenization
    // This prevents malformed HTML by processing tokens in the correct order
    
    interface Token {
      type: string;
      value: string;
      start: number;
      end: number;
    }

    // Language-specific patterns
    const languagePatterns: Record<string, any> = {
      javascript: {
        keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'new', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'this', 'super', 'extends', 'static'],
        functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
        operators: /[+\-*/%=!<>&|^~?:]/g,
        singleLineComment: /\/\/.*$/gm,
        multiLineComment: /\/\*[\s\S]*?\*\//g,
      },
      typescript: {
        keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'new', 'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'public', 'private', 'protected', 'readonly', 'static', 'abstract', 'extends', 'implements', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'this', 'super'],
        functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
        operators: /[+\-*/%=!<>&|^~?:]/g,
        singleLineComment: /\/\/.*$/gm,
        multiLineComment: /\/\*[\s\S]*?\*\//g,
      },
      python: {
        keywords: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'self', 'pass', 'break', 'continue', 'global', 'nonlocal'],
        functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
        operators: /[+\-*/%=!<>&|^~]/g,
        singleLineComment: /#.*$/gm,
        multiLineComment: /"""[\s\S]*?"""|'''[\s\S]*?'''/g,
      },
      java: {
        keywords: ['public', 'private', 'protected', 'class', 'interface', 'abstract', 'final', 'static', 'synchronized', 'volatile', 'transient', 'native', 'strictfp', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package', 'extends', 'implements', 'new', 'this', 'super', 'null', 'true', 'false', 'void', 'int', 'long', 'short', 'byte', 'float', 'double', 'char', 'boolean'],
        functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
        operators: /[+\-*/%=!<>&|^~?:]/g,
        singleLineComment: /\/\/.*$/gm,
        multiLineComment: /\/\*[\s\S]*?\*\//g,
      },
      cpp: {
        keywords: ['int', 'float', 'double', 'char', 'bool', 'void', 'long', 'short', 'unsigned', 'signed', 'const', 'static', 'extern', 'register', 'auto', 'volatile', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'sizeof', 'typedef', 'struct', 'union', 'enum', 'class', 'public', 'private', 'protected', 'virtual', 'inline', 'friend', 'template', 'typename', 'namespace', 'using', 'new', 'delete', 'this', 'true', 'false', 'nullptr'],
        functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
        operators: /[+\-*/%=!<>&|^~?:]/g,
        singleLineComment: /\/\/.*$/gm,
        multiLineComment: /\/\*[\s\S]*?\*\//g,
      },
      csharp: {
        keywords: ['public', 'private', 'protected', 'internal', 'class', 'interface', 'struct', 'enum', 'namespace', 'using', 'abstract', 'virtual', 'override', 'sealed', 'static', 'readonly', 'const', 'volatile', 'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'base', 'null', 'true', 'false', 'void', 'int', 'long', 'short', 'byte', 'float', 'double', 'decimal', 'char', 'bool', 'string', 'object'],
        functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
        operators: /[+\-*/%=!<>&|^~?:]/g,
        singleLineComment: /\/\/.*$/gm,
        multiLineComment: /\/\*[\s\S]*?\*\//g,
      },
      html: {
        keywords: [],
        functions: null,
        operators: null,
        singleLineComment: null,
        multiLineComment: /<!--[\s\S]*?-->/g,
        // HTML-specific patterns for better syntax highlighting
        htmlTags: /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g,
        htmlTagNames: /<\/?([a-zA-Z][a-zA-Z0-9]*)/g,
        htmlAttributes: /\s([a-zA-Z-]+)(?=\s*=)/g,
        htmlAttributeValues: /=\s*(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
        htmlSelfClosing: /\/>/g,
      },
      css: {
        keywords: ['important', 'inherit', 'initial', 'unset', 'auto', 'none', 'normal', 'bold', 'italic', 'underline', 'solid', 'dashed', 'dotted', 'block', 'inline', 'flex', 'grid', 'absolute', 'relative', 'fixed', 'static', 'sticky'],
        functions: /\b([a-zA-Z-]+)\s*(?=\()/g,
        operators: /[:{};]/g,
        singleLineComment: null,
        multiLineComment: /\/\*[\s\S]*?\*\//g,
        cssSelectors: /[.#]?[a-zA-Z][a-zA-Z0-9-]*(?=\s*{)/g,
        cssProperties: /\b([a-zA-Z-]+)\s*(?=:)/g,
      },
      json: {
        keywords: ['true', 'false', 'null'],
        functions: null,
        operators: /[:{}[\],]/g,
        singleLineComment: null,
        multiLineComment: null,
      },
    };

    const patterns = languagePatterns[language] || languagePatterns.javascript;
    const tokens: Token[] = [];

    // Collect all tokens with their positions
    const addTokens = (regex: RegExp, type: string) => {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      while ((match = regexCopy.exec(code)) !== null) {
        tokens.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    };

    // Add tokens in order of precedence (comments and strings first to avoid conflicts)
    if (patterns.multiLineComment) {
      addTokens(patterns.multiLineComment, 'comment');
    }
    if (patterns.singleLineComment) {
      addTokens(patterns.singleLineComment, 'comment');
    }

    // String patterns (general)
    if (language !== 'html') {
      addTokens(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 'string');
    }

    // Special handling for HTML
    if (language === 'html') {
      // First, add entire HTML tags as a base
      const htmlTagRegex = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g;
      let match;
      while ((match = htmlTagRegex.exec(code)) !== null) {
        const tagContent = match[0];
        const tagStart = match.index;
        
        // Parse the tag content for more specific highlighting
        // Tag name (opening or closing)
        const tagNameMatch = tagContent.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/);
        if (tagNameMatch) {
          const tagNameStart = tagStart + tagNameMatch.index;
          const tagNameEnd = tagNameStart + tagNameMatch[0].length;
          tokens.push({
            type: 'keyword',
            value: tagNameMatch[0],
            start: tagNameStart,
            end: tagNameEnd
          });
        }
        
        // Find attributes within the tag
        const attributeRegex = /\s([a-zA-Z-]+)(?=\s*=)/g;
        let attrMatch;
        while ((attrMatch = attributeRegex.exec(tagContent)) !== null) {
          tokens.push({
            type: 'function',
            value: attrMatch[1],
            start: tagStart + attrMatch.index + 1, // +1 to skip the space
            end: tagStart + attrMatch.index + attrMatch[0].length
          });
        }
        
        // Find attribute values
        const valueRegex = /=\s*(["'])((?:\\.|(?!\1)[^\\])*?)\1/g;
        let valueMatch;
        while ((valueMatch = valueRegex.exec(tagContent)) !== null) {
          // Add the equals sign as operator
          tokens.push({
            type: 'operator',
            value: '=',
            start: tagStart + valueMatch.index,
            end: tagStart + valueMatch.index + 1
          });
          
          // Add the quoted value as string
          tokens.push({
            type: 'string',
            value: valueMatch[0].substring(1), // Skip the = sign
            start: tagStart + valueMatch.index + 1,
            end: tagStart + valueMatch.index + valueMatch[0].length
          });
        }
        
        // Find self-closing tag indicator
        if (tagContent.endsWith('/>')) {
          tokens.push({
            type: 'operator',
            value: '/>',
            start: tagStart + tagContent.length - 2,
            end: tagStart + tagContent.length
          });
        } else if (tagContent.endsWith('>')) {
          tokens.push({
            type: 'operator',
            value: '>',
            start: tagStart + tagContent.length - 1,
            end: tagStart + tagContent.length
          });
        }
        
        // Add opening bracket
        tokens.push({
          type: 'operator',
          value: '<',
          start: tagStart,
          end: tagStart + 1
        });
      }
    }

    // Special handling for CSS
    if (language === 'css') {
      if (patterns.cssSelectors) {
        addTokens(patterns.cssSelectors, 'keyword');
      }
      if (patterns.cssProperties) {
        addTokens(patterns.cssProperties, 'function');
      }
    }

    // Numbers
    addTokens(/\b\d+\.?\d*([eE][+-]?\d+)?\b/g, 'number');

    // Functions
    if (patterns.functions) {
      addTokens(patterns.functions, 'function');
    }

    // Keywords
    patterns.keywords.forEach((keyword: string) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      addTokens(regex, 'keyword');
    });

    // Operators
    if (patterns.operators) {
      addTokens(patterns.operators, 'operator');
    }

    // Sort tokens by start position and remove overlapping tokens
    tokens.sort((a, b) => a.start - b.start);
    const filteredTokens: Token[] = [];
    let lastEnd = 0;

    tokens.forEach(token => {
      if (token.start >= lastEnd) {
        filteredTokens.push(token);
        lastEnd = token.end;
      }
    });

    // Apply highlighting
    let result = '';
    let currentPos = 0;

    filteredTokens.forEach(token => {
      // Add any unhighlighted text before this token
      if (token.start > currentPos) {
        result += escapeHtml(code.slice(currentPos, token.start));
      }
      
      // Add the highlighted token
      const escapedValue = escapeHtml(token.value);
      result += `<span class="token-${token.type}">${escapedValue}</span>`;
      currentPos = token.end;
    });

    // Add any remaining unhighlighted text
    if (currentPos < code.length) {
      result += escapeHtml(code.slice(currentPos));
    }

    return result;
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <div className={cn(
      "code-block rounded-lg overflow-hidden my-2",
      theme === "dark" ? "code-block--dark bg-gray-900 border-gray-700" : "code-block--light bg-gray-50 border border-gray-200"
    )}>
      {shouldShowHeader && (title || description || fileName || language) && (
        <div className={cn(
          "code-block__header p-4 border-b",
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            {fileName && (
              <div className={cn(
                "code-block__filename flex items-center gap-2 text-sm font-medium",
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              )}>
                <FileText className="h-4 w-4" />
                {fileName}
              </div>
            )}
            <div className={cn(
              "code-block__language-tag px-2 py-1 text-xs font-medium rounded",
              theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
            )}>
              {getLanguageDisplayName(language)}
            </div>
          </div>
          {title && (
            <div className={cn(
              "code-block__title text-lg font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
            style={{ marginTop: "20px", marginBottom: "10px" }}
            >
              {title}
            </div>
          )}
          {description && (
            <div className={cn(
              "code-block__description text-sm",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              color: theme === "dark" ? "white" : "black"
            }}
            >
              {description}
            </div>
          )}
        </div>
      )}
      
      <div className="code-block__container relative">
        <pre className={cn(
          "code-block__pre p-4 overflow-x-auto text-sm leading-relaxed",
          theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900",
          shouldShowLineNumbers && "pl-12"
        )}>
          <code className={`language-${language}`}>
            {shouldShowLineNumbers ? (
              <div className="code-lines">
                {formatCodeWithLineNumbers(code)}
              </div>
            ) : (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: getSyntaxHighlightedCode(code, language) 
                }} 
              />
            )}
          </code>
        </pre>
        
        {shouldShowCopyButton && (
          <button
            className={cn(
              "code-block__copy-button absolute top-4 right-4 p-2 rounded transition-all",
              "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
              theme === "dark" 
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 focus:ring-gray-500" 
                : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 focus:ring-gray-500"
            )}
            onClick={handleCopy}
            title="Copy code"
            data-copy-state="idle"
          >
            <Copy className="h-4 w-4 copy-icon" />
            <Check className="h-4 w-4 copied-icon hidden" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;
