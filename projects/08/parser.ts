export enum Command {
  C_ARITHMETIC,
  C_PUSH,
  C_POP,
  C_LABEL,
  C_GOTO,
  C_IF,
  C_FUNCTION,
  C_RETURN,
  C_CALL,
}

type ParsedNonArithmeticCommand = {
  arg1: string;
  arg2: number;
};

function removeComment(line: string): string {
  return line.replace(/\/\/.*/, "");
}

class Parser {
  currentLine = 0;
  commands: string[];
  constructor(commands: string) {
    this.commands = commands
      .split("\n")
      .map((line) => removeComment(line))
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /**
   * Are there more lines in the input?
   */
  hasMoreLines(): boolean {
    return this.currentLine < this.commands.length;
  }

  /**
   * Reads the next command from the input and makes it the current command.
   *
   * This routine should be called only if hasMoreLines is true.
   *
   * Initially there is no current command.
   */
  advance(): void {
    this.currentLine++;
  }

  /**
   * Returns a constant representing the type of the current command.
   *
   * If the current command is an arithmetic-logical command, returns
   * C_ARITHMETIC.
   */
  commandType(): Command {
    const command = this.commands[this.currentLine];
    if (command.startsWith("push")) {
      return Command.C_PUSH;
    } else if (command.startsWith("pop")) {
      return Command.C_POP;
    } else if (
      command.startsWith("add") ||
      command.startsWith("sub") ||
      command.startsWith("neg") ||
      command.startsWith("eq") ||
      command.startsWith("gt") ||
      command.startsWith("lt") ||
      command.startsWith("and") ||
      command.startsWith("or") ||
      command.startsWith("not")
    ) {
      return Command.C_ARITHMETIC;
    } else if (command.startsWith("label")) {
      return Command.C_LABEL;
    } else if (command.startsWith("goto")) {
      return Command.C_GOTO;
    } else if (command.startsWith("if-goto")) {
      return Command.C_IF;
    } else {
      throw new Error("not implemented");
    }
  }

  /**
   * Returns the first argument of the current command.
   *
   * In the case of C_ARITHMETIC, the command itself (add, sub, etc.) is
   * returned.
   *
   * Should not be called if the current command is C_RETURN.
   */
  arg1(): string {
    const command = this.commands[this.currentLine];
    if (this.commandType() === Command.C_ARITHMETIC) {
      return command;
    } else {
      return this.parseNonArithmeticCommand(command).arg1;
    }
  }

  /**
   * Returns the second argument of the current command.
   *
   * Should be called only if the current command is C_PUSH, C_POP, C_FUNCTION,
   * or C_CALL.
   */
  arg2(): number {
    const command = this.commands[this.currentLine];
    return this.parseNonArithmeticCommand(command).arg2;
  }

  private parseNonArithmeticCommand(
    command: string
  ): ParsedNonArithmeticCommand {
    const splitCommand = command.split(" ");
    return { arg1: splitCommand[1], arg2: Number(splitCommand[2]) };
  }
}

export default Parser;
