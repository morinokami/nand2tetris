import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

import CodeWriter, { ArithmeticLogicalCommand, Segment } from "./codeWriter.ts";
import Parser, { Command } from "./parser.ts";

async function translate(filename: string): Promise<void> {
  const commands = await Deno.readTextFile(filename);
  const parsedPath = path.parse(filename);
  const out = `${parsedPath.dir}/${parsedPath.name}.asm`;

  const parser = new Parser(commands);
  const codeWriter = new CodeWriter(out);

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
    }
    parser.advance();
  }

  codeWriter.close();
}

const filename = Deno.args[0];
await translate(filename);
