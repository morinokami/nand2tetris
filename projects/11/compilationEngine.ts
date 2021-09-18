import SymbolTable, {
  SymbolKindArg,
  SymbolKindField,
  SymbolKindNone,
  SymbolKindStatic,
  SymbolKindType,
  SymbolKindVar,
} from "./symbolTable.ts";
import {
  Operators,
  TokenKindIdentifier,
  TokenKindIntegerConstant,
  TokenKindKeyword,
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
  ifCounter = 0;
  whileCounter = 0;
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
      this.subrutineSymbolTable.reset();
      this.ifCounter = 0;
      this.whileCounter = 0;
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
    await this.writer.writeFunction(
      `${this.className}.${name}`,
      this.subrutineSymbolTable.varCount(SymbolKindVar)
    );
    if (subroutine === "constructor") {
      await this.writer.writePush(
        "constant",
        this.classSymbolTable.varCount(SymbolKindField)
      );
      await this.writer.writeCall("Memory.alloc", 1);
      await this.writer.writePop(PointerSegment, 0);
    } else if (subroutine === "method") {
      // push argument 0
      this.writer.writePush(ArgumentSegment, 0);
      // pop pointer 0
      this.writer.writePop(PointerSegment, 0);
      // TODO: OK???
    }
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
    this.eat("let");
    const line = this.peekToken().position.line;
    const name = this.eat("identifier");
    if (this.peekToken().value === "[") {
      // TODO: array
      this.eat("[");
      await this.compileExpression();
      this.eat("]");
    }
    this.eat("=");
    await this.compileExpression();
    this.eat(";");
    if (this.subrutineSymbolTable.kindOf(name) !== SymbolKindNone) {
      const kind = this.subrutineSymbolTable.kindOf(name);
      const index = this.subrutineSymbolTable.indexOf(name);
      if (kind === SymbolKindArg) {
        // arg
        await this.writer.writePop(ArgumentSegment, index);
      } else {
        // var
        await this.writer.writePop(LocalSegment, index);
      }
    } else if (this.classSymbolTable.kindOf(name) !== SymbolKindNone) {
      const kind = this.classSymbolTable.kindOf(name);
      const index = this.classSymbolTable.indexOf(name);
      if (kind === SymbolKindStatic) {
        // static
        await this.writer.writePop(StaticSegment, index);
      } else {
        // field
        await this.writer.writePop(ThisSegment, index);
      }
    } else {
      throw new Error(
        `Parser error at line ${line}: identifier ${name} is not defined`
      );
    }
  }

  /**
   * Compiles an if statement, possibly with a trailing else clause.
   */
  async compileIf(): Promise<void> {
    const count = this.ifCounter++;
    this.eat("if");
    this.eat("(");
    await this.compileExpression();
    await this.writer.writeIf(`IF_TRUE${count}`);
    await this.writer.writeGoto(`IF_FALSE${count}`);
    this.eat(")");
    this.eat("{");
    await this.writer.writeLabel(`IF_TRUE${count}`);
    await this.compileStatements();
    this.eat("}");
    if (this.peekToken().value === "else") {
      await this.writer.writeGoto(`IF_END${count}`);
      this.eat("else");
      this.eat("{");
      await this.writer.writeLabel(`IF_FALSE${count}`);
      await this.compileStatements();
      this.eat("}");
      await this.writer.writeLabel(`IF_END${count}`);
    } else {
      await this.writer.writeLabel(`IF_FALSE${count}`);
    }
  }

  /**
   * Compiles a while statement.
   */
  async compileWhile(): Promise<void> {
    const count = this.whileCounter++;
    await this.writer.writeLabel(`WHILE_EXP${count}`);
    this.eat("while");
    this.eat("(");
    await this.compileExpression();
    await this.writer.writeArithmetic(NotCommand);
    await this.writer.writeIf(`WHILE_END${count}`);
    this.eat(")");
    this.eat("{");
    await this.compileStatements();
    this.eat("}");
    await this.writer.writeGoto(`WHILE_EXP${count}`);
    await this.writer.writeLabel(`WHILE_END${count}`);
  }

  /**
   * Compiles a do statement.
   */
  async compileDo(): Promise<void> {
    this.eat("do");
    const ident0 = this.eat("identifier");
    if (this.peekToken().value === ".") {
      this.eat(".");
      const ident1 = this.eat("identifier");
      let className = "";
      let kind = "";
      let index = 0;
      if (this.classSymbolTable.kindOf(ident0) !== SymbolKindNone) {
        className = this.classSymbolTable.typeOf(ident0);
        kind = this.classSymbolTable.kindOf(ident0);
        index = this.classSymbolTable.indexOf(ident0);
      } else if (this.subrutineSymbolTable.kindOf(ident0) !== SymbolKindNone) {
        className = this.subrutineSymbolTable.typeOf(ident0);
        kind = this.subrutineSymbolTable.kindOf(ident0);
        index = this.subrutineSymbolTable.indexOf(ident0);
      } else {
        className = ident0;
      }
      this.eat("(");
      const nArgs = await this.compileExpressionList();
      this.eat(")");
      this.eat(";");
      if (className !== ident0) {
        switch (kind) {
          case SymbolKindArg:
            await this.writer.writePush(ArgumentSegment, index);
            break;
          case SymbolKindVar:
            await this.writer.writePush(LocalSegment, index);
            break;
          case SymbolKindField:
            await this.writer.writePush(ThisSegment, index);
            break;
          case SymbolKindStatic:
            // TODO:
            throw new Error("static not implemented");
        }
        await this.writer.writeCall(`${className}.${ident1}`, nArgs + 1);
      } else {
        await this.writer.writeCall(`${ident0}.${ident1}`, nArgs);
      }
    } else {
      this.eat("(");
      const nArgs = await this.compileExpressionList();
      this.eat(")");
      this.eat(";");
      const className = this.className; // this.subrutineSymbolTable.typeOf("this");
      await this.writer.writePush(PointerSegment, 0);
      await this.writer.writeCall(`${className}.${ident0}`, nArgs + 1);
    }
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
      const operator = this.eat(nextToken.value);
      await this.compileTerm();
      if (operator === "-") {
        await this.writer.writeArithmetic(NegCommand);
      } else {
        await this.writer.writeArithmetic(NotCommand);
      }
    } else {
      if (nextToken.kind === TokenKindKeyword) {
        if (nextToken.value === "true") {
          await this.writer.writePush(ConstantSegment, 0);
          await this.writer.writeArithmetic(NotCommand);
        } else if (nextToken.value === "false" || nextToken.value === "null") {
          await this.writer.writePush(ConstantSegment, 0);
        } else if (nextToken.value === "this") {
          await this.writer.writePush(PointerSegment, 0);
        }
        this.eat(nextToken.value);
      } else if (nextToken.kind === TokenKindIdentifier) {
        const name0 = this.eat(nextToken.value);
        if (this.peekToken().value === "[") {
          // TODO: array
          this.eat("[");
          await this.compileExpression();
          this.eat("]");
        } else if (this.peekToken().value === "(") {
          this.eat("(");
          const nArgs = await this.compileExpressionList();
          this.eat(")");
          this.writer.writeCall(name0, nArgs);
        } else if (this.peekToken().value === ".") {
          this.eat(".");
          const name1 = this.eat("identifier");
          this.eat("(");
          const nArgs = await this.compileExpressionList();
          this.eat(")");
          this.writer.writeCall(`${name0}.${name1}`, nArgs);
        } else {
          const token = nextToken;
          if (
            this.subrutineSymbolTable.kindOf(token.value) !== SymbolKindNone
          ) {
            const kind = this.subrutineSymbolTable.kindOf(token.value);
            const index = this.subrutineSymbolTable.indexOf(token.value);
            if (kind === SymbolKindArg) {
              // arg
              await this.writer.writePush(ArgumentSegment, index);
            } else {
              // var
              await this.writer.writePush(LocalSegment, index);
            }
          } else if (this.classSymbolTable.kindOf(token.value)) {
            const kind = this.classSymbolTable.kindOf(token.value);
            const index = this.classSymbolTable.indexOf(token.value);
            if (kind === SymbolKindStatic) {
              // static
              await this.writer.writePush(StaticSegment, index);
            } else {
              // field
              await this.writer.writePush(ThisSegment, index);
            }
          } else {
            throw new Error(
              `Parser error at line ${token.position.line}: identifier ${token.value} is not defined`
            );
          }
        }
      } else if (nextToken.kind === TokenKindIntegerConstant) {
        await this.writer.writePush(ConstantSegment, Number(nextToken.value));
        this.eat(nextToken.value);
      } else if (nextToken.kind === TokenKindStringConstant) {
        // TODO: handle string constants
        this.eat(nextToken.value);
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
