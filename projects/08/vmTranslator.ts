import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

import CodeWriter, { ArithmeticLogicalCommand, Segment } from "./codeWriter.ts";
import Parser, { Command } from "./parser.ts";

async function translate(filename: string): Promise<void> {
  const commands = await Deno.readTextFile(filename);
  const parsedPath = path.parse(filename);
  const filenameWithoutExtension = parsedPath.name;
  const output = `${parsedPath.dir}/${filenameWithoutExtension}.asm`;

  const parser = new Parser(commands);
  const codeWriter = new CodeWriter(output, filenameWithoutExtension);

  while (parser.hasMoreLines()) {
    const commandType = parser.commandType();
    if (commandType === Command.C_ARITHMETIC) {
      const command = parser.arg1() as ArithmeticLogicalCommand;
      codeWriter.writeArithmetic(command);
    } else if (commandType === Command.C_PUSH) {
      const segment = parser.arg1() as Segment;
      const index = parser.arg2();
      codeWriter.writePushPop(Command.C_PUSH, segment, index);
    } else if (commandType === Command.C_POP) {
      const segment = parser.arg1() as Segment;
      const index = parser.arg2();
      codeWriter.writePushPop(Command.C_POP, segment, index);
    } else if (commandType === Command.C_LABEL) {
      const label = parser.arg1();
      codeWriter.writeLabel(label);
    } else if (commandType === Command.C_GOTO) {
      const label = parser.arg1();
      codeWriter.writeGoto(label);
    } else if (commandType === Command.C_IF) {
      const label = parser.arg1();
      codeWriter.writeIf(label);
    }
    parser.advance();
  }

  codeWriter.close();
}

const filename = Deno.args[0];
await translate(filename);
