import SymbolTable, {
  SymbolKindArg,
  SymbolKindStatic,
  SymbolKindType,
  SymbolKindVar,
} from "./symbolTable.ts";
import {
  Operators,
  TokenKindIdentifier,
  TokenKindIntegerConstant,
  TokenKindStringConstant,
  TokenType,
} from "./types.ts";
import VMWriter, {
  ConstantSegment,
  ArgumentSegment,
  LocalSegment,
  StaticSegment,
  ThisSegment,
  ThatSegment,
  PointerSegment,
  TempSegment,
  AddCommand,
  SubCommand,
  NegCommand,
  EqCommand,
  GtCommand,
  LtCommand,
  AndCommand,
  OrCommand,
  NotCommand,
} from "./vmWriter.ts";

class CompilationEngine {
  className = "";
  tokens: TokenType[];
  writer: VMWriter;
  classSymbolTable = new SymbolTable();
  subrutineSymbolTable = new SymbolTable();
  depth = 0; // TODO: Delete this
  constructor(tokens: TokenType[], writer: VMWriter) {
    this.tokens = tokens;
    this.writer = writer;
  }

  private eat(tokenVal: string): string {
    const currentToken = this.tokens.shift();
    if (
      !(
        currentToken?.value === tokenVal ||
        // identifier
        // TODO: DELETE?
        (tokenVal === "identifier" && currentToken?.kind === tokenVal)
      )
    ) {
      throw new Error(
        `Parser error at line ${currentToken?.position.line}: exptected=\`${tokenVal}\`, got=\`${currentToken?.value}\``
      );
    }
    return currentToken.value;
  }

  // TODO: Delete this
  private async write(text: string): Promise<void> {
    // await this.writer.write(`${" ".repeat(this.depth * 2)}${text}\n`);
    console.log(`${" ".repeat(this.depth * 2)}${text}`);
  }

  private peekToken(i = 0): TokenType {
    return this.tokens[i];
  }

  /**
   * Compiles a complete class.
   */
  async compileClass(): Promise<void> {
    this.eat("class");
    this.className = this.eat(this.peekToken().value);
    this.eat("{");
    while (
      this.peekToken().value === "static" ||
      this.peekToken().value === "field"
    ) {
      this.compileClassVarDec();
    }
    while (
      this.peekToken().value === "constructor" ||
      this.peekToken().value === "function" ||
      this.peekToken().value === "method"
    ) {
      await this.compileSubroutine();
    }
    this.eat("}");
  }

  /**
   * Compiles a static variable declaration, or a field declaration.
   */
  compileClassVarDec(): void {
    const kind = this.eat(this.peekToken().value); // static or field
    const type = this.eat(this.peekToken().value); // type
    const name = this.eat("identifier");
    this.classSymbolTable.define(name, type, kind as SymbolKindType);
    while (this.peekToken().value === ",") {
      this.eat(",");
      const name = this.eat("identifier");
      this.classSymbolTable.define(name, type, kind as SymbolKindType);
    }
    this.eat(";");
  }

  /**
   * Compiles a complete method, function, or constructor.
   */
  async compileSubroutine(): Promise<void> {
    this.subrutineSymbolTable.reset();
    const subroutine = this.eat(this.peekToken().value); // constructor or function or method
    this.eat(this.peekToken().value); // void or type
    const name = this.eat("identifier");
    if (subroutine === "method") {
      this.subrutineSymbolTable.define("this", this.className, SymbolKindArg);
    }
    this.eat("(");
    this.compileParameterList();
    this.eat(")");
    this.eat("{");
    while (this.peekToken().value === "var") {
      this.compileVarDec();
    }
    this.writer.writeFunction(
      `${this.className}.${name}`,
      this.subrutineSymbolTable.varCount(SymbolKindVar)
    );
    await this.compileSubroutineBody();
    this.eat("}");
  }

  /**
   * Compiles a (possibly empty) parameter list. Does not handle the enclosing
   * parentheses tokens ( and ).
   */
  compileParameterList(): void {
    if (this.peekToken().value !== ")") {
      const type = this.eat(this.peekToken().value);
      const name = this.eat("identifier");
      this.subrutineSymbolTable.define(name, type, SymbolKindArg);
      while (this.peekToken().value === ",") {
        this.eat(",");
        const type = this.eat(this.peekToken().value);
        const name = this.eat("identifier");
        this.subrutineSymbolTable.define(name, type, SymbolKindArg);
      }
    }
  }

  /**
   * Compiles a subroutine's body.
   */
  async compileSubroutineBody(): Promise<void> {
    await this.compileStatements();
  }

  /**
   * Compiles a var declaration.
   */
  compileVarDec(): void {
    this.eat("var");
    const type = this.eat(this.peekToken().value);
    const name = this.eat("identifier");
    this.subrutineSymbolTable.define(name, type, SymbolKindVar);
    while (this.peekToken().value === ",") {
      this.eat(",");
      const name = this.eat("identifier");
      this.subrutineSymbolTable.define(name, type, SymbolKindVar);
    }
    this.eat(";");
  }

  /**
   * Compiles a sequence of statements. Does not handle the enclosing curly
   * brackets tokens { and }.
   */
  async compileStatements(): Promise<void> {
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
    this.eat("do");
    let func = this.eat("identifier");
    if (this.peekToken().value === ".") {
      this.eat(".");
      const mehtod = this.eat("identifier");
      func = `${func}.${mehtod}`;
    }
    this.eat("(");
    const nArgs = await this.compileExpressionList();
    this.eat(")");
    this.eat(";");
    await this.writer.writeCall(func, nArgs);
    await this.writer.writePop(TempSegment, 0);
  }

  /**
   * Compiles a return statement.
   */
  async compileReturn(): Promise<void> {
    this.eat("return");
    if (this.peekToken().value !== ";") {
      await this.compileExpression();
    } else {
      await this.writer.writePush(ConstantSegment, 0);
    }
    this.eat(";");
    await this.writer.writeReturn();
  }

  /**
   * Compiles an expression.
   */
  async compileExpression(): Promise<void> {
    await this.compileTerm();
    while (Operators.includes(this.peekToken().value)) {
      const operator = this.eat(this.peekToken().value);
      await this.compileTerm();
      switch (operator) {
        case "+":
          await this.writer.writeArithmetic(AddCommand);
          break;
        case "-":
          await this.writer.writeArithmetic(SubCommand);
          break;
        case "*":
          await this.writer.writeCall("Math.multiply", 2);
          break;
        case "/":
          await this.writer.writeCall("Math.divide", 2);
          break;
        case "&":
          await this.writer.writeArithmetic(AndCommand);
          break;
        case "|":
          await this.writer.writeArithmetic(OrCommand);
          break;
        case "<":
          await this.writer.writeArithmetic(LtCommand);
          break;
        case ">":
          await this.writer.writeArithmetic(GtCommand);
          break;
        case "=":
          await this.writer.writeArithmetic(EqCommand);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Compiles a term. If the current token is an identifier, the routine must
   * resolve it into a variable, an array element, or a subroutine call. A
   * single lookahead token, which may be [, (, or ., suffices to distinuish
   * between the possibilities. Any other token is not part of this term and
   * should not be advanced over.
   */
  async compileTerm(): Promise<void> {
    const nextToken = this.peekToken();
    if (nextToken.value === "(") {
      // (expression)
      this.eat("(");
      await this.compileExpression();
      this.eat(")");
    } else if (nextToken.value === "-" || nextToken.value === "~") {
      // unaryOp term
      this.eat(nextToken.value);
      await this.compileTerm();
      if (nextToken.value === "-") {
        await this.writer.writeArithmetic(NegCommand);
      } else {
        await this.writer.writeArithmetic(NotCommand);
      }
    } else {
      if (nextToken.kind === TokenKindIdentifier) {
        if (this.subrutineSymbolTable.kindOf(nextToken.value)) {
          const kind = this.subrutineSymbolTable.kindOf(nextToken.value);
          const index = this.subrutineSymbolTable.indexOf(nextToken.value);
          if (kind === SymbolKindArg) {
            // arg
            await this.writer.writePush(ArgumentSegment, index);
          } else {
            // var
            await this.writer.writePush(LocalSegment, index);
          }
        } else if (this.classSymbolTable.kindOf(nextToken.value)) {
          const kind = this.classSymbolTable.kindOf(nextToken.value);
          const index = this.classSymbolTable.indexOf(nextToken.value);
          if (kind === SymbolKindStatic) {
            // static
            await this.writer.writePush(StaticSegment, index);
          } else {
            // field
            await this.writer.writePush(ThisSegment, index);
          }
        } else {
          throw new Error(
            `Parser error at line ${nextToken.position.line}: undefined variable ${nextToken.value}`
          );
        }
      } else if (nextToken.kind === TokenKindIntegerConstant) {
        await this.writer.writePush(ConstantSegment, Number(nextToken.value));
      } else if (nextToken.kind === TokenKindStringConstant) {
        // TODO: handle string constants
      }
      this.eat(nextToken.value);
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
  }

  /**
   * Compiles a (possibly empty) comma-separated list of expressions. Returns
   * the number of expressions in the list.
   */
  async compileExpressionList(): Promise<number> {
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
    return count;
  }
}

export default CompilationEngine;
