import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

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

function assemble(program: string): string {
  const parser = new Parser(program);

  // First pass: initialize the symbol table
  const symbolTable = new SymbolTable();
  while (parser.hasMoreLines()) {
    const instructionType = parser.instructionType();
    if (instructionType === Instruction.L) {
      const symbol = parser.symbol();
      symbolTable.addEntry(symbol, parser.lineNumber);
      parser.lineNumber--;
    }
    parser.advance();
  }
  parser.reset();

  // Second pass: translate the program into Hack binary code
  let variableIndex = 16;
  const result: string[] = [];
  while (parser.hasMoreLines()) {
    const instructionType = parser.instructionType();
    if (instructionType === Instruction.A) {
      let address = parser.symbol();
      if (isNaN(parseInt(address))) {
        // encountered a symbolic reference
        const symbol = address;
        if (!symbolTable.contains(symbol)) {
          symbolTable.addEntry(symbol, variableIndex);
          variableIndex++;
        }
        address = String(symbolTable.getAddress(symbol) as number);
      }
      result.push(toBinary(address));
    } else if (instructionType === Instruction.C) {
      const dest = parser.dest();
      const comp = parser.comp();
      const jump = parser.jump();
      result.push(`111${Code.comp(comp)}${Code.dest(dest)}${Code.jump(jump)}`);
    }
    parser.advance();
  }

  return result.join("\n");
}

const filename = Deno.args[0];
const filenameWithoutExtension = path.parse(filename).name;
const program = await Deno.readTextFile(filename);
const result = assemble(program);
await Deno.writeTextFile(`${filenameWithoutExtension}.hack`, result);
