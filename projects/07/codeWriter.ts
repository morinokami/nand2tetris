import { Command } from "./parser.ts";
class CodeWriter {
  file: Deno.File;
  constructor(filenameWithoutExtension: string) {
    this.file = Deno.openSync(`${filenameWithoutExtension}.asm`);
  }

  /**
   * Writes to the output file the assembly code that implements the given
   * arithmetic-logical command.
   */
  writeArithmetic(command: string): void {
    switch (command) {
      case "add":
        break;
      case "sub":
        break;
      case "neg":
        break;
      case "eq":
        break;
      case "gt":
        break;
      case "lt":
        break;
      case "and":
        break;
      case "or":
        break;
      case "not":
        break;
    }
  }

  /**
   * Writes to the output file the assembly code that implements the given
   * push or pop command.
   */
  writePushPop(
    command: Command.C_PUSH | Command.C_POP,
    segment: string,
    index: number
  ): void {}

  /**
   * Closes the output file / stream.
   */
  close(): void {
    Deno.close(this.file.rid);
  }
}

export default CodeWriter;
