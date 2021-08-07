import * as Code from "./code.ts";
import Parser from "./parser.ts";
import SymbolTable from "./symbolTable.ts";

const filename = Deno.args[0];
console.log(`Parsing ${filename}`);
