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

class LabelNumberManager {
  private currentLabelNumber = 0;
  private labelMap: Map<string, number> = new Map();

  getNextNumber(functionName = ""): number {
    if (functionName.length > 0 && this.labelMap.has(functionName)) {
      return this.labelMap.get(functionName) as number;
    }

    const labelNumber = this.currentLabelNumber++;
    if (functionName.length > 0) {
      this.labelMap.set(functionName, labelNumber);
    }
    return labelNumber;
  }
}

class CodeWriter {
  file: Deno.File;
  filename = "";
  labelNumberManager = new LabelNumberManager();
  constructor(outputPath: string) {
    this.file = Deno.openSync(outputPath, {
      create: true,
      write: true,
      truncate: true,
    });
    this.writeInit();
  }

  /**
   * Informs that the translation of a new VM file has started (called by the
   * VMTranslator).
   */
  setFileName(filename: string): void {
    this.filename = filename;
  }

  writeInit(): void {
    this.writeLine("// Init");
    this.writeLine("@256"); // SP=256
    this.writeLine("D=A");
    this.writeLine("@SP");
    this.writeLine("M=D");
    this.writeCall("Sys.init", 0); // call Sys.init
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
      case "eq": {
        const eqLabelNumber = this.labelNumberManager.getNextNumber();
        const neqLabelNumber = this.labelNumberManager.getNextNumber();
        this.writeLine("// eq");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=*SP-D
        this.writeLine("D=M-D");
        this.writeLine(`@EQ${eqLabelNumber}`); // if D=0 goto EQ
        this.writeLine("D;JEQ");
        this.writeLine("@SP"); // *SP=false
        this.writeLine("A=M");
        this.writeLine("M=0");
        this.writeLine(`@NEQ${neqLabelNumber}`); // goto NEQ
        this.writeLine("0;JMP");
        this.writeLine(`(EQ${eqLabelNumber})`);
        this.writeLine("@SP"); // *SP=true
        this.writeLine("A=M");
        this.writeLine("M=-1");
        this.writeLine(`(NEQ${neqLabelNumber})`);
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      }
      case "gt": {
        const gtLabel = this.labelNumberManager.getNextNumber();
        const ngtLabel = this.labelNumberManager.getNextNumber();
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
      }
      case "lt": {
        const ltLabelNumber = this.labelNumberManager.getNextNumber();
        const nltLabelNumber = this.labelNumberManager.getNextNumber();
        this.writeLine("// lt");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // D=*SP
        this.writeLine("D=M");
        this.writeLine("@SP"); // SP--
        this.writeLine("M=M-1");
        this.writeLine("A=M"); // *SP=*SP-D
        this.writeLine("D=M-D");
        this.writeLine(`@LT${ltLabelNumber}`); // if D<0 goto LT
        this.writeLine("D;JLT");
        this.writeLine("@SP"); // *SP=false
        this.writeLine("A=M");
        this.writeLine("M=0");
        this.writeLine(`@NLT${nltLabelNumber}`); // goto NLT
        this.writeLine("0;JMP");
        this.writeLine(`(LT${ltLabelNumber})`);
        this.writeLine("@SP"); // *SP=true
        this.writeLine("A=M");
        this.writeLine("M=-1");
        this.writeLine(`(NLT${nltLabelNumber})`);
        this.writeLine("@SP"); // SP++
        this.writeLine("M=M+1");
        break;
      }
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
    const labelNumber = this.labelNumberManager.getNextNumber(functionName);
    this.writeLine(`// function ${functionName} ${nVars}`);
    this.writeLabel(`${functionName}$${labelNumber}`); // (f)
    // repeat nVars times:
    // push 0
    for (let i = 0; i < nVars; i++) {
      this.writePush("constant", 0);
    }
  }

  /**
   * Writes assembly code that effects the call command.
   */
  writeCall(functionName: string, nArgs: number): void {
    const functionLabelNumber =
      this.labelNumberManager.getNextNumber(functionName);
    const returnAddressLabelNumber = this.labelNumberManager.getNextNumber();
    this.writeLine(`// call ${functionName} ${nArgs}`);
    this.writeLine(`@${functionName}$ret.${returnAddressLabelNumber}`); // push returnAddress
    this.writeLine(`D=A`);
    this.writeLine(`@SP`);
    this.writeLine(`A=M`);
    this.writeLine(`M=D`);
    this.writeLine(`@SP`);
    this.writeLine(`M=M+1`);
    this.writeLine(`@LCL`); // push LCL
    this.writeLine(`D=M`);
    this.writeLine(`@SP`);
    this.writeLine(`A=M`);
    this.writeLine(`M=D`);
    this.writeLine(`@SP`);
    this.writeLine(`M=M+1`);
    this.writeLine(`@ARG`); // push ARG
    this.writeLine(`D=M`);
    this.writeLine(`@SP`);
    this.writeLine(`A=M`);
    this.writeLine(`M=D`);
    this.writeLine(`@SP`);
    this.writeLine(`M=M+1`);
    this.writeLine(`@THIS`); // push THIS
    this.writeLine(`D=M`);
    this.writeLine(`@SP`);
    this.writeLine(`A=M`);
    this.writeLine(`M=D`);
    this.writeLine(`@SP`);
    this.writeLine(`M=M+1`);
    this.writeLine(`@THAT`); // push THAT
    this.writeLine(`D=M`);
    this.writeLine(`@SP`);
    this.writeLine(`A=M`);
    this.writeLine(`M=D`);
    this.writeLine(`@SP`);
    this.writeLine(`M=M+1`);
    this.writeLine(`@${5 + nArgs}`); // ARG=SP-5-nArgs
    this.writeLine(`D=A`);
    this.writeLine(`@SP`);
    this.writeLine(`D=M-D`);
    this.writeLine("@ARG");
    this.writeLine(`M=D`);
    this.writeLine("@SP"); // LCL=SP
    this.writeLine("D=M");
    this.writeLine("@LCL");
    this.writeLine("M=D");
    this.writeLine(`@${functionName}$${functionLabelNumber}`); // goto f
    this.writeLine("0;JMP");
    this.writeLabel(`${functionName}$ret.${returnAddressLabelNumber}`); // (returnAddress)
  }

  /**
   * Writes assembly code that effects the return command.
   */
  writeReturn(): void {
    this.writeLine("// return");
    this.writeLine("@LCL"); // frame = LCL
    this.writeLine("D=M");
    this.writeLine("@frame");
    this.writeLine("M=D");
    this.writeLine("@5"); // retAddr = *(frame-5)
    this.writeLine("A=D-A");
    this.writeLine("D=M");
    this.writeLine("@retAddr");
    this.writeLine("M=D");
    this.writeLine("@SP"); // *ARG = pop()
    this.writeLine("A=M-1");
    this.writeLine("D=M");
    this.writeLine("@ARG");
    this.writeLine("A=M");
    this.writeLine("M=D");
    this.writeLine("@ARG"); // SP = ARG+1
    this.writeLine("D=M+1");
    this.writeLine("@SP");
    this.writeLine("M=D");
    this.writeLine("@frame"); // THAT = *(frame-1)
    this.writeLine("A=M-1");
    this.writeLine("D=M");
    this.writeLine("@THAT");
    this.writeLine("M=D");
    this.writeLine("@2"); // THIS = *(frame-2)
    this.writeLine("D=A");
    this.writeLine("@frame");
    this.writeLine("A=M-D");
    this.writeLine("D=M");
    this.writeLine("@THIS");
    this.writeLine("M=D");
    this.writeLine("@3"); // ARG = *(frame-3)
    this.writeLine("D=A");
    this.writeLine("@frame");
    this.writeLine("A=M-D");
    this.writeLine("D=M");
    this.writeLine("@ARG");
    this.writeLine("M=D");
    this.writeLine("@4"); // LCL = *(frame-4)
    this.writeLine("D=A");
    this.writeLine("@frame");
    this.writeLine("A=M-D");
    this.writeLine("D=M");
    this.writeLine("@LCL");
    this.writeLine("M=D");
    this.writeLine("@retAddr"); // goto retAddr
    this.writeLine("A=M");
    this.writeLine("0;JMP");
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
