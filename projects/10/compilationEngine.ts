import { TokenType } from "./types.ts";

export type Writer = {
  write(text: string): Promise<void>;
};

class CompilationEngine {
  tokens: TokenType[];
  writer: Writer;
  constructor(tokens: TokenType[], writer: Writer) {
    this.tokens = tokens;
    this.writer = writer;
  }

  private eat(tokenVal: string): void {
    const currentToken = this.tokens.shift();
    if (
      currentToken?.value === tokenVal ||
      // identifier
      (tokenVal === "identifier" &&
        currentToken &&
        currentToken.kind === tokenVal)
    ) {
      this.writer.write(
        `<${currentToken.kind}> ${currentToken.value} </${currentToken.kind}>`
      );
    } else {
      throw new Error(`Expected ${tokenVal}`);
    }
  }

  /**
   * Compiles a complete class.
   */
  async compileClass(): Promise<void> {
    await this.writer.write("<class>");
    this.eat("class");
    this.eat("identifier");
    this.eat("{");
    this.compileClassVarDec();
    this.compileSubroutine();
    this.eat("}");
    await this.writer.write("</class>");
  }

  /**
   * Compiles a static variable declaration, or a field declaration.
   */
  compileClassVarDec(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a complete method, function, or constructor.
   */
  compileSubroutine(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a (possibly empty) parameter list. Does not handle the enclosing
   * parentheses tokens ( and ).
   */
  compileParameterList(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a subroutine's body.
   */
  compileSubroutineBody(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a var declaration.
   */
  compileVarDec(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a sequence of statements. Does not handle the enclosing curly
   * brackets tokens { and }.
   */
  compileStatements(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a let statement.
   */
  compileLet(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles an if statement, possibly with a trailing else clause.
   */
  compileIf(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a while statement.
   */
  compileWhile(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a do statement.
   */
  compileDo(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a return statement.
   */
  compileReturn(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles an expression.
   */
  compileExpression(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a term. If the current token is an identifier, the routine must
   * resolve it into a variable, an array element, or a subroutine call. A
   * single lookahead token, which may be [, (, or ., suffices to distinuish
   * between the possibilities. Any other token is not part of this term and
   * should not be advanced over.
   */
  compileTerm(): void {
    throw new Error("Not implemented");
  }

  /**
   * Compiles a (possibly empty) comma-separated list of expressions. Returns
   * the number of expressions in the list.
   */
  compileExpressionList(): number {
    throw new Error("Not implemented");
  }
}

export default CompilationEngine;
