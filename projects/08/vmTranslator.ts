import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

import CodeWriter, { ArithmeticLogicalCommand, Segment } from "./codeWriter.ts";
import Parser, { Command } from "./parser.ts";

async function translate(inputPath: string): Promise<void> {
  const fileInfo = await Deno.stat(inputPath);
  const vmFiles: path.ParsedPath[] = [];
  if (fileInfo.isFile && inputPath.endsWith(".vm")) {
    vmFiles.push(path.parse(inputPath));
  } else if (fileInfo.isDirectory) {
    for await (const file of Deno.readDir(inputPath)) {
      const filePath = path.join(inputPath, file.name);
      const stat = await Deno.stat(filePath);
      if (stat.isFile && file.name.endsWith(".vm")) {
        vmFiles.push(path.parse(filePath));
      }
    }
  }

  const parsedPath = path.parse(inputPath);
  const outputPath = fileInfo.isFile
    ? path.join(parsedPath.dir, `${parsedPath.name}.asm`)
    : path.join(parsedPath.dir, parsedPath.name, `${parsedPath.name}.asm`);
  const codeWriter = new CodeWriter(outputPath);

  for (const vmFile of vmFiles) {
    const source = await Deno.readTextFile(
      path.join(vmFile.dir, `${vmFile.name}.vm`)
    );
    const parser = new Parser(source);
    codeWriter.setFileName(vmFile.name);

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
  }
  codeWriter.close();
}

const inputPath = Deno.args[0];
await translate(inputPath);
