import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

import CodeWriter from "./codeWriter.ts";
import Parser, { Command } from "./parser.ts";

async function translate(filename: string): Promise<void> {
  const filenameWithoutExtension = path.parse(filename).name;
  const commands = await Deno.readTextFile(filename);

  const parser = new Parser(commands);
  // const codeWriter = new CodeWriter(filenameWithoutExtension);

  while (parser.hasMoreLines()) {
    const commandType = parser.commandType();
    if (commandType === Command.C_ARITHMETIC) {
      // TODO: Call CodeWriter.writeArithmetic()
      console.log("writeArithmetic");
    } else if (
      commandType === Command.C_PUSH ||
      commandType === Command.C_POP
    ) {
      // TODO: Call CodeWriter.writePushPop()
      console.log("writePushPop");
    }
    parser.advance();
  }
}

const filename = Deno.args[0];
await translate(filename);
