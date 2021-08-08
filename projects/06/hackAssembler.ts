import * as Code from "./code.ts";
import Parser, { Instruction } from "./parser.ts";
import SymbolTable from "./symbolTable.ts";

function toBinary(value: string, length = 16): string {
  let result = parseInt(value, 10).toString(2);
  for (let i = result.length; i < length; i++) {
    result = "0" + result;
  }
  return result;
}

const filename = Deno.args[0];
const filenameWithoutExtension = filename.substr(0, filename.lastIndexOf("."));
const program = await Deno.readTextFile(filename);
const parser = new Parser(program);

const result: string[] = [];
while (parser.hasMoreLines()) {
  const instructionType = parser.instructionType();
  if (instructionType === Instruction.A) {
    result.push(toBinary(parser.symbol()));
  } else if (instructionType === Instruction.L) {
    // TODO: Implement this
    console.log(parser.symbol());
  } else if (instructionType === Instruction.C) {
    const dest = parser.dest();
    const comp = parser.comp();
    const jump = parser.jump();
    result.push(`111${Code.comp(comp)}${Code.dest(dest)}${Code.jump(jump)}`);
  }
  parser.advance();
}

await Deno.writeTextFile(`${filenameWithoutExtension}.hack`, result.join("\n"));
