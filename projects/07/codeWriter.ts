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
  constructor(filenameWithoutExtension: string) {
    this.file = Deno.openSync(`${filenameWithoutExtension}.asm`, {
      create: true,
      write: true,
      truncate: true,
    });
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
        break;
      case "gt":
        break;
      case "lt":
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
      case "constant":
        this.writeLine(`// push ${segment} ${index}`);
        this.writeLine(`@${index}`); // D=index
        this.writeLine("D=A");
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
    throw new Error("writePop not implemented");
  }

  /**
   * Closes the output file / stream.
   */
  close(): void {
    this.writeInfiniteLoop();
    Deno.close(this.file.rid);
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
