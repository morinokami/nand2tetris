import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

import JackTokenizer, { TokenType } from "./jackTokenizer.ts";

const encoder = new TextEncoder();

async function writeLine(
  file: Deno.File,
  tag: string,
  value: string
): Promise<void> {
  await file.write(encoder.encode(`<${tag}> ${value} </${tag}>\n`));
}

async function analyze(inputPath?: string) {
  let outputDir = "";
  const jackFiles: path.ParsedPath[] = [];
  if (!inputPath) {
    outputDir = ".";
    for await (const dirEntry of Deno.readDir(".")) {
      if (dirEntry.isFile && dirEntry.name.endsWith(".jack")) {
        jackFiles.push(path.parse(dirEntry.name));
      }
    }
  } else {
    const fileInfo = await Deno.stat(inputPath);
    if (fileInfo.isFile && inputPath.endsWith(".jack")) {
      outputDir = path.dirname(inputPath);
      jackFiles.push(path.parse(inputPath));
    } else if (fileInfo.isDirectory) {
      outputDir = inputPath;
      for await (const dirEntry of Deno.readDir(inputPath)) {
        if (dirEntry.isFile && dirEntry.name.endsWith(".jack")) {
          const filePath = path.join(inputPath, dirEntry.name);
          jackFiles.push(path.parse(filePath));
        }
      }
    }
  }

  for (const jackFile of jackFiles) {
    const outputPath = path.join(outputDir, `${jackFile.name}T.xml`);
    const result = await Deno.open(outputPath, {
      create: true,
      write: true,
      truncate: true,
    });

    const source = await Deno.readTextFile(
      path.join(jackFile.dir, `${jackFile.name}.jack`)
    );
    const tokenizer = new JackTokenizer(source);

    await result.write(encoder.encode("<tokens>\n"));
    while (tokenizer.hasMoreTokens()) {
      tokenizer.advance();

      const tokenType = tokenizer.tokenType();
      switch (tokenType) {
        case TokenType.KEYWORD:
          await writeLine(result, "keyword", tokenizer.keyword());
          break;
        case TokenType.SYMBOL: {
          let symbol = "";
          switch (tokenizer.symbol()) {
            case "<":
              symbol = "&lt;";
              break;
            case ">":
              symbol = "&gt;";
              break;
            case "&":
              symbol = "&amp;";
              break;
            default:
              symbol = tokenizer.symbol();
              break;
          }
          writeLine(result, "symbol", symbol);
          break;
        }
        case TokenType.IDENTIFIER:
          writeLine(result, "identifier", tokenizer.identifier());
          break;
        case TokenType.INT_CONST:
          writeLine(result, "integerConstant", String(tokenizer.intVal()));
          break;
        case TokenType.STRING_CONST:
          writeLine(result, "stringConstant", tokenizer.stringVal());
          break;
        default:
          throw new Error(`Unexpected token type: ${tokenType}`);
      }
    }
    await result.write(encoder.encode("</tokens>\n"));

    result.close();
  }
}

const inputPath = Deno.args[0];
await analyze(inputPath);
