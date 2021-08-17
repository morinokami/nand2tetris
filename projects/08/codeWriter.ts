import { Command } from "./parser.ts";

export type ArithmeticLogicalCommand =
  | "add"
  | "sub"
  | "neg"
  | "eq"
  | "gt"
  | "lt"
  | "and"
  | "or"
  | "not";

export type Segment =
  | "argument"
  | "local"
  | "static"
  | "constant"
  | "this"
  | "that"
  | "pointer"
  | "temp";

const encoder = new TextEncoder();

class CodeWriter {
  file: Deno.File;
  filename = "";
  labelNumber = 0;
  constructor(outputPath: string) {
    this.file = Deno.openSync(outputPath, {
      create: true,
      write: true,
      truncate: true,
    });
  }

  /**
   * Informs that the translation of a new VM file has started (called by the
   * VMTranslator).
   */
  setFileName(filename: string): void {
    this.filename = filename;
  }

  /**
   * Writes to the output file the assembly code that implements the given
   * arithmetic-logical command.
   */
  writeArithmetic(command: ArithmeticLogicalCommand): void {
    switch (command) {
      case "add":
        this.writeLine("// add");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=D+*SP
        this.writeLine("M=D+M");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "sub":
        this.writeLine("// sub");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=*SP-D
        this.writeLine("M=M-D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "neg":
        this.writeLine("// neg");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=-*SP
        this.writeLine("M=-M");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "eq":
        const eqLabel = this.getLabelNumber();
        const neqLabel = this.getLabelNumber();
        this.writeLine("// eq");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=*SP-D
        this.writeLine("D=M-D");
        this.writeLine(`@EQ${eqLabel}`); // if D=0 goto EQ
        this.writeLine("D;JEQ");
        this.writeLine("@SP"); // *SP=false
        this.writeLine("A=M");
        this.writeLine("M=0");
        this.writeLine(`@NEQ${neqLabel}`); // goto NEQ
        this.writeLine("0;JMP");
        this.writeLine(`(EQ${eqLabel})`);
        this.writeLine("@SP"); // *SP=true
        this.writeLine("A=M");
        this.writeLine("M=-1");
        this.writeLine(`(NEQ${neqLabel})`);
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "gt":
        const gtLabel = this.getLabelNumber();
        const ngtLabel = this.getLabelNumber();
        this.writeLine("// gt");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=*SP-D
        this.writeLine("D=M-D");
        this.writeLine(`@GT${gtLabel}`); // if D>0 goto GT
        this.writeLine("D;JGT");
        this.writeLine("@SP"); // *SP=false
        this.writeLine("A=M");
        this.writeLine("M=0");
        this.writeLine(`@NGT${ngtLabel}`); // goto NGT
        this.writeLine("0;JMP");
        this.writeLine(`(GT${gtLabel})`);
        this.writeLine("@SP"); // *SP=true
        this.writeLine("A=M");
        this.writeLine("M=-1");
        this.writeLine(`(NGT${ngtLabel})`);
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "lt":
        const ltLabel = this.getLabelNumber();
        const nltLabel = this.getLabelNumber();
        this.writeLine("// lt");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=*SP-D
        this.writeLine("D=M-D");
        this.writeLine(`@LT${ltLabel}`); // if D<0 goto LT
        this.writeLine("D;JLT");
        this.writeLine("@SP"); // *SP=false
        this.writeLine("A=M");
        this.writeLine("M=0");
        this.writeLine(`@NLT${nltLabel}`); // goto NLT
        this.writeLine("0;JMP");
        this.writeLine(`(LT${ltLabel})`);
        this.writeLine("@SP"); // *SP=true
        this.writeLine("A=M");
        this.writeLine("M=-1");
        this.writeLine(`(NLT${nltLabel})`);
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "and":
        this.writeLine("// and");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=D&*SP
        this.writeLine("M=D&M");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "or":
        this.writeLine("// or");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=D|*SP
        this.writeLine("M=D|M");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "not":
        this.writeLine("// not");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=!*SP
        this.writeLine("M=!M");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
    }
  }

  /**
   * Writes to the output file the assembly code that implements the given
   * push or pop command.
   */
  writePushPop(
    command: Command.C_PUSH | Command.C_POP,
    segment: Segment,
    index: number
  ): void {
    if (command === Command.C_PUSH) {
      this.writePush(segment, index);
    } else {
      this.writePop(segment, index);
    }
  }

  private writePush(segment: Segment, index: number): void {
    switch (segment) {
      case "argument":
        this.writeLine(`// push argument ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@ARG"); // D=*(D+*ARG)
        this.writeLine("A=D+M");
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "local":
        this.writeLine(`// push local ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@LCL"); // D=*(D+*LCL)
        this.writeLine("A=D+M");
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "static":
        this.writeLine(`// push static ${index}`);
        this.writeLine(`@${this.filename}.${index}`); // D=*(FileName.i)
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "constant":
        this.writeLine(`// push constant ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "this":
        this.writeLine(`// push this ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@THIS"); // D=*(D+*THIS)
        this.writeLine("A=D+M");
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "that":
        this.writeLine(`// push that ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@THAT"); // D=*(D+*THAT)
        this.writeLine("A=D+M");
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "pointer":
        this.writeLine(`// push pointer ${index}`);
        if (index === 0) {
          this.writeLine(`@THIS`); // D=*THIS
        } else {
          this.writeLine(`@THAT`); // D=*THAT
        }
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      case "temp":
        this.writeLine(`// push temp ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@TEMP"); // D=*(D+*TEMP)
        this.writeLine("A=D+M");
        this.writeLine("D=M");
        this.writeLine("@SP"); // *SP=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      default:
        throw new Error(`push ${segment} not implemented`);
    }
  }

  private writePop(segment: Segment, index: number): void {
    switch (segment) {
      case "argument":
        this.writeLine(`// pop argument ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@ARG"); // D=D+*ARG
        this.writeLine("D=D+M");
        this.writeLine("@R13"); // R13=D
        this.writeLine("M=D");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        this.writeLine("@R13"); // *R13=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        break;
      case "local":
        this.writeLine(`// pop local ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@LCL"); // D=D+*LCL
        this.writeLine("D=D+M");
        this.writeLine("@R13"); // R13=D
        this.writeLine("M=D");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        this.writeLine("@R13"); // *R13=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        break;
      case "static":
        this.writeLine(`// pop static ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        this.writeLine(`@${this.filename}.${index}`); // *(FileName.i)=D
        this.writeLine("M=D");
        break;
      case "this":
        this.writeLine(`// pop this ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@THIS"); // D=D+*THIS
        this.writeLine("D=D+M");
        this.writeLine("@R13"); // R13=D
        this.writeLine("M=D");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        this.writeLine("@R13"); // *R13=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        break;
      case "that":
        this.writeLine(`// pop that ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@THAT"); // D=D+*THAT
        this.writeLine("D=D+M");
        this.writeLine("@R13"); // R13=D
        this.writeLine("M=D");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        this.writeLine("@R13"); // *R13=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        break;
      case "pointer":
        this.writeLine(`// pop pointer ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        if (index === 0) {
          this.writeLine("@THIS"); // *THIS=D
        } else {
          this.writeLine(`@THAT`); // *THAT=D
        }
        this.writeLine("M=D");
        break;
      case "temp":
        this.writeLine(`// pop temp ${index}`);
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
        this.writeLine("@5"); // D=D+TEMP
        this.writeLine("D=D+A");
        this.writeLine("@R13"); // R13=D
        this.writeLine("M=D");
        this.writeLine("@SP"); // D=*SP
        this.writeLine("A=M");
        this.writeLine("D=M");
        this.writeLine("@R13"); // *R13=D
        this.writeLine("A=M");
        this.writeLine("M=D");
        break;
      default:
        throw new Error(`pop ${segment} not implemented`);
    }
  }

  /**
   * Writes assembly code that effects the label command.
   */
  writeLabel(label: string): void {
    this.writeLine(`(${label})`); // (label)
  }

  /**
   * Writes assembly code that effects the goto command.
   */
  writeGoto(label: string): void {
    this.writeLine(`@${label}`); // goto label
    this.writeLine("0;JMP");
  }

  /**
   * Writes assembly code that effects the if-goto command.
   */
  writeIf(label: string): void {
    this.writeLine("@SP"); // SP--
    this.writeLine("M=M-1");
    this.writeLine("A=M"); // D=*SP
    this.writeLine("D=M");
    this.writeLine(`@${label}`); // if D goto label
    this.writeLine("D;JNE");
  }

  /**
   * Writes assembly code that effects the function command.
   */
  writeFunction(functionName: string, nVars: number): void {
    // TODO: Implement this.
    // (f)
    // repeat nVars times:
    // push 0
    throw new Error("writeFunction not implemented");
  }

  /**
   * Writes assembly code that effects the call command.
   */
  writeCall(functionName: string, nArgs: number): void {
    // TODO: Implement this.
    // push returnAddress
    // push LCL
    // push ARG
    // push THIS
    // push THAT
    // ARG=SP-5-nArgs
    // LCL=SP
    // goto f
    // (returnAddress)
    throw new Error("writeCall not implemented");
  }

  /**
   * Writes assembly code that effects the return command.
   */
  writeReturn(): void {
    // TODO: Implement this.
    // frame = LCL
    // retAddr = *(frame-5)
    // *ARG = pop()
    // SP = ARG+1
    // THAT = *(frame-1)
    // THIS = *(frame-2)
    // ARG = *(frame-3)
    // LCL = *(frame-4)
    // goto retAddr
    throw new Error("writeReturn not implemented");
  }

  /**
   * Closes the output file / stream.
   */
  close(): void {
    this.writeInfiniteLoop();
    Deno.close(this.file.rid);
  }

  private getLabelNumber(): number {
    return this.labelNumber++;
  }

  private writeLine(line: string): void {
    this.file.writeSync(encoder.encode(`${line}\n`));
  }

  private writeInfiniteLoop(): void {
    this.writeLine("// infinite loop");
    this.writeLine("(END)");
    this.writeLine("@END");
    this.writeLine("0;JMP");
  }
}

export default CodeWriter;
