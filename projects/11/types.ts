export const TokenKindKeyword = "keyword";
export const TokenKindSymbol = "symbol";
export const TokenKindIdentifier = "identifier";
export const TokenKindIntegerConstant = "integerConstant";
export const TokenKindStringConstant = "stringConstant";
export type TokenKindType =
  | typeof TokenKindKeyword
  | typeof TokenKindSymbol
  | typeof TokenKindIdentifier
  | typeof TokenKindIntegerConstant
  | typeof TokenKindStringConstant;
export type TokenPositionType = {
  position: number;
  line: number;
  column: number;
};
export type TokenType = {
  kind: TokenKindType;
  value: string;
  position: TokenPositionType;
};

export const Keywords = [
  "class",
  "method",
  "function",
  "constructor",
  "int",
  "boolean",
  "char",
  "void",
  "var",
  "static",
  "field",
  "let",
  "do",
  "if",
  "else",
  "while",
  "return",
  "true",
  "false",
  "null",
  "this",
] as const;

export const Symbols = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ".",
  ",",
  ";",
  "+",
  "-",
  "*",
  "/",
  "&",
  "|",
  "<",
  ">",
  "=",
  "~",
] as const;
export type KeywordType = typeof Keywords[number];
export type SymbolType = typeof Symbols[number];

export const Operators = [
  "+",
  "-",
  "*",
  "/",
  "&amp;",
  "|",
  "&lt;",
  "&gt;",
  "=",
];

export type WriteCloser = {
  write(text: string): Promise<void>;
  close(): Promise<void>;
};
