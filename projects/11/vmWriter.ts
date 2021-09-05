import { WriteCloser } from "./types.ts";

export const ConstantSegment = "constant";
export const ArgumentSegment = "argument";
export const LocalSegment = "local";
export const StaticSegment = "static";
export const ThisSegment = "this";
export const ThatSegment = "that";
export const PointerSegment = "pointer";
export const TempSegment = "temp";

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

export const AddCommand = "add";
export const SubCommand = "sub";
export const NegCommand = "neg";
export const EqCommand = "eq";
export const GtCommand = "gt";
export const LtCommand = "lt";
export const AndCommand = "and";
export const OrCommand = "or";
export const NotCommand = "not";

type VMCommandType =
  | typeof AddCommand
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
  async writePush(segment: PushSegmentType, index: number) {
    await this.output.write(`push ${segment} ${index}\n`);
  }

  /**
   * Writes a VM pop command.
   */
  async writePop(segment: PopSegmentType, index: number) {
    await this.output.write(`pop ${segment} ${index}\n`);
  }

  /**
   * Writes a VM arithmetic-logical command.
   */
  async writeArithmetic(command: VMCommandType) {
    await this.output.write(`${command}\n`);
  }

  /**
   * Writes a VM label command.
   */
  async writeLabel(label: string) {
    await this.output.write(`label ${label}\n`);
  }

  /**
   * Writes a VM goto command.
   */
  async writeGoto(label: string) {
    await this.output.write(`goto ${label}\n`);
  }

  /**
   * Writes a VM if-goto command.
   */
  async writeIf(label: string) {
    await this.output.write(`if-goto ${label}\n`);
  }

  /**
   * Writes a VM call command.
   */
  async writeCall(name: string, nArgs: number) {
    await this.output.write(`call ${name} ${nArgs}\n`);
  }

  /**
   * Writes a VM function command.
   */
  async writeFunction(name: string, nVals: number) {
    await this.output.write(`function ${name} ${nVals}\n`);
  }

  /**
   * Writes a VM return command.
   */
  async writeReturn() {
    await this.output.write(`return\n`);
  }

  /**
   * Closes the output file / stream.
   */
  close() {
    this.output.close();
  }
}

export default VMWriter;
