import {
  DestMnemonicType,
  CompMnemonicType,
  JumpMnemonicType,
} from "./code.ts";

export enum Instruction {
  A,
  C,
  L,
}

type ParsedCInstruction = {
  dest: DestMnemonicType;
  comp: CompMnemonicType;
  jump: JumpMnemonicType;
};

class Parser {
  current = 0;
  instructions: string[];
  constructor(program: string) {
    this.instructions = program
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("//"));
  }

  /**
   * Are there more lines in the input?
   */
  hasMoreLines(): boolean {
    return this.current < this.instructions.length;
  }

  /**
   * Skips over white space and comments, if necessary.
   *
   * Reads the next instruction from the input, and makes it the current
   * instruction.
   *
   * This routine should be called only if hasMoreLines is true.
   *
   * Initially there is no current instruction.
   */
  advance(): void {
    this.current++;
  }

  /**
   * Returns the type of the current instruction.
   *
   * A_INSTRUCTION for @xxx, where xxx is either a decimal number or a symbol.
   *
   * C_INSTRUCTION for dest=comp;jump.
   *
   * L_INSTRUCTION for (xxx), where xxx is a symbol.
   */
  instructionType(): Instruction {
    const instruction = this.instructions[this.current].trim();
    if (instruction.startsWith("@")) {
      return Instruction.A;
    } else if (instruction.startsWith("(")) {
      return Instruction.L;
    } else {
      return Instruction.C;
    }
  }

  /**
   * If the current instruction is (xxx), returns the symbol xxx. If the
   * current instruction is @xxx, returns the symbol or decimal xxx (as a
   * string).
   *
   * Shold be called only if instructionType is A_INSTRUCTION or L_INSTRUCTION.
   */
  symbol(): string {
    if (this.instructionType() === Instruction.A) {
      return this.instructions[this.current].trim().substring(1);
    } else if (this.instructionType() === Instruction.L) {
      const instruction = this.instructions[this.current].trim();
      return instruction.substring(1, instruction.length - 1);
    }
    return "";
  }

  /**
   * Returns the symbolic dest part of the current C-instruction (8
   * possibilities).
   *
   * Should be called only if instructionType is C_INSTRUCTION.
   */
  dest(): DestMnemonicType {
    const instruction = this.instructions[this.current];
    return this.parseCInstruction(instruction).dest;
  }

  /**
   * Returns the symbolic comp part of the current C-instruction (28
   * possibilities).
   *
   * Should be called only if instructionType is C_INSTRUCTION.
   */
  comp(): CompMnemonicType {
    const instruction = this.instructions[this.current];
    return this.parseCInstruction(instruction).comp;
  }

  /**
   * Returns the symbolic jump part of the current C-instruction (8
   * possibilities).
   *
   * Should be called only if instructionType is C_INSTRUCTION.
   */
  jump(): JumpMnemonicType {
    const instruction = this.instructions[this.current];
    return this.parseCInstruction(instruction).jump;
  }

  private parseCInstruction(instruction: string): ParsedCInstruction {
    const destPattern = "M|D|MD|A|AM|AD|ADM";
    const compPattern =
      "0|1|-1|D|A|!D|!A|-D|-A|D\\+1|A\\+1|D-1|A-1|D\\+A|D-A|A-D|D&A|D\\|A|M|!M|-M|M\\+1|M-1|D\\+M|D-M|M-D|D&M|D\\|M";
    const jumpPattern = "JGT|JEQ|JGE|JLT|JNE|JLE|JMP";
    const cInstRegex = new RegExp(
      `^(?<dest>${destPattern})?=?(?<comp>${compPattern});?(?<jump>${jumpPattern})?$`
    );

    const match = instruction.match(cInstRegex);
    if (match === null) {
      throw new Error(`Invalid C-instruction: ${instruction}`);
    }

    return {
      dest: (match.groups?.dest ?? "null") as DestMnemonicType,
      comp: match.groups!.comp as CompMnemonicType,
      jump: (match.groups?.jump ?? "null") as JumpMnemonicType,
    };
  }
}

export default Parser;
