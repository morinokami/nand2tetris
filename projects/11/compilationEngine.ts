import { Operators, TokenType } from "./types.ts";

export type Writer = {
  write(text: string): Promise<void>;
};

class CompilationEngine {
  tokens: TokenType[];
  writer: Writer;
  depth = 0;
  constructor(tokens: TokenType[], writer: Writer) {
    this.tokens = tokens;
    this.writer = writer;
  }

  private eat(tokenVal: string): void {
    const currentToken = this.tokens.shift();
    if (
      currentToken?.value === tokenVal ||
      // identifier
      (tokenVal === "identifier" && currentToken?.kind === tokenVal)
    ) {
      this.write(
        `<${currentToken.kind}> ${currentToken.value} </${currentToken.kind}>`
      );
    } else {
      throw new Error(
        `Parser error at line ${currentToken?.position.line}: exptected=\`${tokenVal}\`, got=\`${currentToken?.value}\``
      );
    }
  }

  private async write(text: string): Promise<void> {
    await this.writer.write(`${" ".repeat(this.depth * 2)}${text}\n`);
  }

  private peekToken(i = 0): TokenType {
    return this.tokens[i];
  }

  /**
   * Compiles a complete class.
   */
  async compileClass(): Promise<void> {
    await this.write("<class>");
    this.depth += 1;
    this.eat("class");
    this.eat("identifier");
    this.eat("{");
    while (
      this.peekToken().value === "static" ||
      this.peekToken().value === "field"
    ) {
      await this.compileClassVarDec();
    }
    while (
      this.peekToken().value === "constructor" ||
      this.peekToken().value === "function" ||
      this.peekToken().value === "method"
    ) {
      await this.compileSubroutine();
    }
    this.eat("}");
    this.depth -= 1;
    await this.write("</class>");
  }

  /**
   * Compiles a static variable declaration, or a field declaration.
   */
  async compileClassVarDec(): Promise<void> {
    await this.write("<classVarDec>");
    this.depth += 1;
    this.eat(this.peekToken().value); // static or field
    this.eat(this.peekToken().value); // type
    this.eat("identifier");
    while (this.peekToken().value === ",") {
      this.eat(",");
      this.eat("identifier");
    }
    this.eat(";");
    this.depth -= 1;
    await this.write("</classVarDec>");
  }

  /**
   * Compiles a complete method, function, or constructor.
   */
  async compileSubroutine(): Promise<void> {
    await this.write("<subroutineDec>");
    this.depth += 1;
    this.eat(this.peekToken().value); // constructor or function or method
    this.eat(this.peekToken().value); // void or type
    this.eat("identifier");
    this.eat("(");
    await this.compileParameterList();
    this.eat(")");
    await this.compileSubroutineBody();
    this.depth -= 1;
    await this.write("</subroutineDec>");
  }

  /**
   * Compiles a (possibly empty) parameter list. Does not handle the enclosing
   * parentheses tokens ( and ).
   */
  async compileParameterList(): Promise<void> {
    await this.write("<parameterList>");
    this.depth += 1;
    if (this.peekToken().value !== ")") {
      if (this.peekToken().kind === "identifier") {
        this.eat("identifier");
      } else {
        this.eat(this.peekToken().value); // int or char or boolean
      }
      this.eat("identifier");
      while (this.peekToken().value === ",") {
        this.eat(",");
        if (this.peekToken().kind === "identifier") {
          this.eat("identifier");
        } else {
          this.eat(this.peekToken().value); // int or char or boolean
        }
        this.eat("identifier");
      }
    }
    this.depth -= 1;
    await this.write("</parameterList>");
  }

  /**
   * Compiles a subroutine's body.
   */
  async compileSubroutineBody(): Promise<void> {
    await this.write("<subroutineBody>");
    this.depth += 1;
    this.eat("{");
    while (this.peekToken().value === "var") {
      await this.compileVarDec();
    }
    await this.compileStatements();
    this.eat("}");
    this.depth -= 1;
    await this.write("</subroutineBody>");
  }

  /**
   * Compiles a var declaration.
   */
  async compileVarDec(): Promise<void> {
    await this.write("<varDec>");
    this.depth += 1;
    this.eat("var");
    if (this.peekToken().kind === "identifier") {
      this.eat("identifier");
    } else {
      this.eat(this.peekToken().value); // int or char or boolean
    }
    this.eat("identifier");
    while (this.peekToken().value === ",") {
      this.eat(",");
      this.eat("identifier");
    }
    this.eat(";");
    this.depth -= 1;
    await this.write("</varDec>");
  }

  /**
   * Compiles a sequence of statements. Does not handle the enclosing curly
   * brackets tokens { and }.
   */
  async compileStatements(): Promise<void> {
    await this.write("<statements>");
    this.depth += 1;
    while (this.peekToken().value !== "}") {
      switch (this.peekToken().value) {
        case "let":
          await this.compileLet();
          break;
        case "if":
          await this.compileIf();
          break;
        case "while":
          await this.compileWhile();
          break;
        case "do":
          await this.compileDo();
          break;
        case "return":
          await this.compileReturn();
          break;
        default:
          throw new Error(
            `Parser error at line ${
              this.peekToken().position.line
            }: unexpected token ${this.peekToken().value}`
          );
      }
    }
    this.depth -= 1;
    await this.write("</statements>");
  }

  /**
   * Compiles a let statement.
   */
  async compileLet(): Promise<void> {
    await this.write("<letStatement>");
    this.depth += 1;
    this.eat("let");
    this.eat("identifier");
    if (this.peekToken().value === "[") {
      this.eat("[");
      await this.compileExpression();
      this.eat("]");
    }
    this.eat("=");
    await this.compileExpression();
    this.eat(";");
    this.depth -= 1;
    await this.write("</letStatement>");
  }

  /**
   * Compiles an if statement, possibly with a trailing else clause.
   */
  async compileIf(): Promise<void> {
    this.write("<ifStatement>");
    this.depth += 1;
    this.eat("if");
    this.eat("(");
    await this.compileExpression();
    this.eat(")");
    this.eat("{");
    await this.compileStatements();
    this.eat("}");
    if (this.peekToken().value === "else") {
      this.eat("else");
      this.eat("{");
      await this.compileStatements();
      this.eat("}");
    }
    this.depth -= 1;
    this.write("</ifStatement>");
  }

  /**
   * Compiles a while statement.
   */
  async compileWhile(): Promise<void> {
    this.write("<whileStatement>");
    this.depth += 1;
    this.eat("while");
    this.eat("(");
    await this.compileExpression();
    this.eat(")");
    this.eat("{");
    await this.compileStatements();
    this.eat("}");
    this.depth -= 1;
    this.write("</whileStatement>");
  }

  /**
   * Compiles a do statement.
   */
  async compileDo(): Promise<void> {
    this.write("<doStatement>");
    this.depth += 1;
    this.eat("do");
    this.eat("identifier");
    if (this.peekToken().value === ".") {
      this.eat(".");
      this.eat("identifier");
    }
    this.eat("(");
    await this.compileExpressionList();
    this.eat(")");
    this.eat(";");
    this.depth -= 1;
    this.write("</doStatement>");
  }

  /**
   * Compiles a return statement.
   */
  async compileReturn(): Promise<void> {
    this.write("<returnStatement>");
    this.depth += 1;
    this.eat("return");
    if (this.peekToken().value !== ";") {
      await this.compileExpression();
    }
    this.eat(";");
    this.depth -= 1;
    this.write("</returnStatement>");
  }

  /**
   * Compiles an expression.
   */
  async compileExpression(): Promise<void> {
    this.write("<expression>");
    this.depth += 1;
    await this.compileTerm();
    while (Operators.includes(this.peekToken().value)) {
      this.eat(this.peekToken().value);
      await this.compileTerm();
    }
    this.depth -= 1;
    this.write("</expression>");
  }

  /**
   * Compiles a term. If the current token is an identifier, the routine must
   * resolve it into a variable, an array element, or a subroutine call. A
   * single lookahead token, which may be [, (, or ., suffices to distinuish
   * between the possibilities. Any other token is not part of this term and
   * should not be advanced over.
   */
  async compileTerm(): Promise<void> {
    this.write("<term>");
    this.depth += 1;
    if (this.peekToken().value === "(") {
      // (expression)
      this.eat("(");
      await this.compileExpression();
      this.eat(")");
    } else if (
      this.peekToken().value === "-" ||
      this.peekToken().value === "~"
    ) {
      // unaryOp term
      this.eat(this.peekToken().value);
      await this.compileTerm();
    } else {
      this.eat(this.peekToken().value);
      if (this.peekToken().value === "[") {
        this.eat("[");
        await this.compileExpression();
        this.eat("]");
      } else if (this.peekToken().value === "(") {
        this.eat("(");
        await this.compileExpressionList();
        this.eat(")");
      } else if (this.peekToken().value === ".") {
        this.eat(".");
        this.eat("identifier");
        this.eat("(");
        await this.compileExpressionList();
        this.eat(")");
      }
    }
    this.depth -= 1;
    this.write("</term>");
  }

  /**
   * Compiles a (possibly empty) comma-separated list of expressions. Returns
   * the number of expressions in the list.
   */
  async compileExpressionList(): Promise<number> {
    this.write("<expressionList>");
    this.depth += 1;
    let count = 0;
    if (this.peekToken().value !== ")") {
      count += 1;
      await this.compileExpression();
      while (this.peekToken().value === ",") {
        count += 1;
        this.eat(",");
        await this.compileExpression();
      }
    }
    this.depth -= 1;
    this.write("</expressionList>");
    return count;
  }
}

export default CompilationEngine;
