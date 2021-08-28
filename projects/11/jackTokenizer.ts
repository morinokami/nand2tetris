import {
  TokenKindKeyword,
  TokenKindSymbol,
  TokenKindIdentifier,
  TokenKindIntegerConstant,
  TokenKindStringConstant,
  TokenKindType,
  TokenPositionType,
  Keywords,
  KeywordType,
  Symbols,
  SymbolType,
} from "./types.ts";

class JackTokenizer {
  private source: string;
  private position = 0;
  private readPosition = 0;
  private line = 0;
  private column = 0;
  private tokenHeadPosition: TokenPositionType = {
    position: this.position,
    line: this.line,
    column: this.column,
  };
  private ch = "";
  private token = "";
  constructor(source: string) {
    this.source = source;
    this.skipWhiteSpace();
    if (this.ch.length === 0) {
      this.readChar();
    }
  }

  private skipWhiteSpace(): void {
    while (this.ch.match(/\s/)) {
      this.readChar();
    }
    if (
      this.source[this.position] === "/" &&
      this.source[this.readPosition] === "*" &&
      this.source[this.readPosition + 1] === "*"
    ) {
      // Multi-line comment
      this.readChar();
      this.readChar();
      this.readChar();
      this.skipComment();
      this.skipWhiteSpace();
    } else if (
      this.source[this.position] === "/" &&
      (this.source[this.readPosition] === "/" ||
        this.source[this.readPosition] === "*")
    ) {
      // Single-line comment
      this.readChar();
      this.readChar();
      this.skipLine();
      this.skipWhiteSpace();
    }
  }

  private skipLine(): void {
    while (this.ch !== "\n") {
      this.readChar();
    }
  }

  private skipComment(): void {
    while (this.ch !== "*" || this.source[this.readPosition] !== "/") {
      this.readChar();
    }
    this.readChar();
    this.readChar();
  }

  private readChar(): void {
    if (this.ch === "\n") {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    if (this.readPosition >= this.source.length) {
      this.ch = "";
    } else {
      this.ch = this.source[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition++;
  }

  private readInteger(): void {
    while (Number.isInteger(this.ch)) {
      this.readChar();
    }
  }

  private readString(): void {
    while (this.ch !== '"') {
      this.readChar();
    }
    this.readChar();
  }

  /**
   * Are there more tokens in the input?
   */
  hasMoreTokens(): boolean {
    return this.readPosition <= this.source.length;
  }

  /**
   * Gets the next token from the input, and makes it the current token.
   *
   * This method should be called only if hasMoreTokens is true.
   *
   * Initially there is no current token.
   */
  advance(): void {
    const start = this.position;
    this.tokenHeadPosition = {
      position: start,
      line: this.line + 1,
      column: this.column + 1,
    };
    if ((Symbols as unknown as string[]).includes(this.ch)) {
      this.token = this.ch;
      this.readChar();
    } else if (Number.isInteger(this.ch)) {
      this.readInteger();
      this.token = this.source.substring(start, this.position);
    } else if (this.ch === '"') {
      this.readChar();
      this.readString();
      this.token = this.source.substring(start, this.position);
    } else {
      while (this.ch.match(/^[0-9a-z_]$/i)) {
        this.readChar();
      }
      this.token = this.source.substring(start, this.position);
    }
    this.skipWhiteSpace();
  }

  /**
   * Returns the type of the current token, as a constant.
   */
  tokenType(): TokenKindType {
    if ((Keywords as unknown as string[]).includes(this.token)) {
      return TokenKindKeyword;
    } else if ((Symbols as unknown as string[]).indexOf(this.token) !== -1) {
      return TokenKindSymbol;
    } else if (this.token.match(/^[0-9]+$/)) {
      return TokenKindIntegerConstant;
    } else if (this.token.match(/^"[^"]*"$/)) {
      return TokenKindStringConstant;
    } else {
      return TokenKindIdentifier;
    }
  }

  /**
   * Returns the keyword which is the current token, as a constant.
   *
   * This method should be called only if tokenType is KEYWORD.
   */
  keyword(): KeywordType {
    return this.token as KeywordType;
  }

  /**
   * Returns the character which is the current token. Should be called only if
   * tokenType is SYMBOL.
   */
  symbol(): SymbolType {
    return this.token as SymbolType;
  }

  /**
   * Returns the string which is the current token. Should be called only if
   * tokenType is IDENTIFIER.
   */
  identifier(): string {
    return this.token;
  }

  /**
   * Returns the integer value which is the current token. Should be called
   * only if tokenType is INT_CONST.
   */
  intVal(): number {
    return parseInt(this.token);
  }

  /**
   * Returns the string value which is the current token, wihtout the double
   * quotes. Should be called only if tokenType is STRING_CONST.
   */
  stringVal(): string {
    return this.token.substring(1, this.token.length - 1);
  }

  /**
   * Returns the position of the current token.
   */
  tokenPosition(): TokenPositionType {
    return this.tokenHeadPosition;
  }
}

export default JackTokenizer;
