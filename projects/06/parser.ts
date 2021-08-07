enum Instruction {
  A,
  C,
  L,
}

class Parser {
  file: File;
  constructor(file: File) {
    this.file = file;
  }

  /**
   * Are there more lines in the input?
   */
  hasMoreLines(): boolean {
    //
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
  advance(): void {}

  /**
   * Returns the type of the current instruction.
   *
   * A_INSTRUCTION for @xxx, where xxx is either a decimal number or a symbol.
   *
   * C_INSTRUCTION for dest=comp;jump.
   *
   * L_INSTRUCTION for (xxx), where xxx is a symbol.
   */
  instructionType(): Instruction {}

  /**
   * If the current instruction is (xxx), returns the symbol xxx. If the
   * current instruction is @xxx, returns the symbol or decimal xxx (as a
   * string).
   *
   * Shold be called only if instructionType is A_INSTRUCTION or L_INSTRUCTION.
   */
  symbol(): string {}

  /**
   * Returns the symbolic dest part of the current C-instruction (8
   * possibilities).
   *
   * Should be called only if instructionType is C_INSTRUCTION.
   */
  dest(): string {}

  /**
   * Returns the symbolic comp part of the current C-instruction (28
   * possibilities).
   *
   * Should be called only if instructionType is C_INSTRUCTION.
   */
  comp(): string {}

  /**
   * Returns the symbolic jump part of the current C-instruction (8
   * possibilities).
   *
   * Should be called only if instructionType is C_INSTRUCTION.
   */
  jump(): string {}
}

export default Parser;
