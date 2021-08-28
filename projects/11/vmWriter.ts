import { WriteCloser } from "./types.ts";

const ConstantSegment = "constant";
const ArgumentSegment = "argument";
const LocalSegment = "local";
const StaticSegment = "static";
const ThisSegment = "this";
const ThatSegment = "that";
const PointerSegment = "pointer";
const TempSegment = "temp";

type PushSegmentType =
  | typeof ConstantSegment
  | typeof ArgumentSegment
  | typeof LocalSegment
  | typeof StaticSegment
  | typeof ThisSegment
  | typeof ThatSegment
  | typeof PointerSegment
  | typeof TempSegment;

type PopSegmentType =
  | typeof ArgumentSegment
  | typeof LocalSegment
  | typeof StaticSegment
  | typeof ThisSegment
  | typeof ThatSegment
  | typeof PointerSegment
  | typeof TempSegment;

const AddCommnad = "add";
const SubCommand = "sub";
const NegCommand = "neg";
const EqCommand = "eq";
const GtCommand = "gt";
const LtCommand = "lt";
const AndCommand = "and";
const OrCommand = "or";
const NotCommand = "not";

type VMCommandType =
  | typeof AddCommnad
  | typeof SubCommand
  | typeof NegCommand
  | typeof EqCommand
  | typeof GtCommand
  | typeof LtCommand
  | typeof AndCommand
  | typeof OrCommand
  | typeof NotCommand;

class VMWriter {
  output: WriteCloser;
  constructor(output: WriteCloser) {
    this.output = output;
  }

  /**
   * Writes a VM push command.
   */
  writePush(segment: PushSegmentType, index: number) {
    this.output.write(`push ${segment} ${index}\n`);
  }

  /**
   * Writes a VM pop command.
   */
  writePop(segment: PopSegmentType, index: number) {
    this.output.write(`pop ${segment} ${index}\n`);
  }

  /**
   * Writes a VM arithmetic-logical command.
   */
  writeArithmetic(command: VMCommandType) {
    this.output.write(`${command}\n`);
  }

  /**
   * Writes a VM label command.
   */
  writeLabel(label: string) {
    this.output.write(`label ${label}\n`);
  }

  /**
   * Writes a VM goto command.
   */
  writeGoto(label: string) {
    this.output.write(`goto ${label}\n`);
  }

  /**
   * Writes a VM if-goto command.
   */
  writeIf(label: string) {
    this.output.write(`if-goto ${label}\n`);
  }

  /**
   * Writes a VM call command.
   */
  writeCall(name: string, nArgs: number) {
    this.output.write(`call ${name} ${nArgs}\n`);
  }

  /**
   * Writes a VM function command.
   */
  writeFunction(name: string, nVals: number) {
    this.output.write(`function ${name} ${nVals}\n`);
  }

  /**
   * Writes a VM return command.
   */
  writeReturn() {
    this.output.write(`return\n`);
  }

  /**
   * Closes the output file / stream.
   */
  close() {
    this.output.close();
  }
}

export default VMWriter;
