export type TokenType = {
  kind: string;
  value: string;
};

class CompilationEngine {
  tokens: TokenType[];
  constructor(tokens: TokenType[]) {
    this.tokens = tokens;
  }

  /**
   * Compiles a complete class.
   */
  compileClass(): void {}

  /**
   * Compiles a static variable declaration, or a field declaration.
   */
  compileClassVarDec(): void {}

  /**
   * Compiles a complete method, function, or constructor.
   */
  compileSubroutine(): void {}

  /**
   * Compiles a (possibly empty) parameter list. Does not handle the enclosing
   * parentheses tokens ( and ).
   */
  compileParameterList(): void {}

  /**
   * Compiles a subroutine's body.
   */
  compileSubroutineBody(): void {}

  /**
   * Compiles a var declaration.
   */
  compileVarDec(): void {}

  /**
   * Compiles a sequence of statements. Does not handle the enclosing curly
   * brackets tokens { and }.
   */
  compileStatements(): void {}

  /**
   * Compiles a let statement.
   */
  compileLet(): void {}

  /**
   * Compiles an if statement, possibly with a trailing else clause.
   */
  compileIf(): void {}

  /**
   * Compiles a while statement.
   */
  compileWhile(): void {}

  /**
   * Compiles a do statement.
   */
  compileDo(): void {}

  /**
   * Compiles a return statement.
   */
  compileReturn(): void {}

  /**
   * Compiles an expression.
   */
  compileExpression(): void {}

  /**
   * Compiles a term. If the current token is an identifier, the routine must
   * resolve it into a variable, an array element, or a subroutine call. A
   * single lookahead token, which may be [, (, or ., suffices to distinuish
   * between the possibilities. Any other token is not part of this term and
   * should not be advanced over.
   */
  compileTerm(): void {}

  /**
   * Compiles a (possibly empty) comma-separated list of expressions. Returns
   * the number of expressions in the list.
   */
  compileExpressionList(): number {}
}

export default CompilationEngine;
