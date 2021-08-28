import * as path from "https://deno.land/std@0.103.0/path/mod.ts";

import CompilationEngine from "./compilationEngine.ts";
import JackTokenizer from "./jackTokenizer.ts";
import {
  TokenType,
  TokenKindKeyword,
  TokenKindSymbol,
  TokenKindIdentifier,
  TokenKindIntegerConstant,
  TokenKindStringConstant,
} from "./types.ts";
import VMWriter from "./vmWriter.ts";

const encoder = new TextEncoder();

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
    const tokens: TokenType[] = [];
    const source = await Deno.readTextFile(
      path.join(jackFile.dir, `${jackFile.name}.jack`)
    );

    // Tokenize
    const tokenizer = new JackTokenizer(source);
    while (tokenizer.hasMoreTokens()) {
      tokenizer.advance();

      const tokenType = tokenizer.tokenType();
      switch (tokenType) {
        case TokenKindKeyword:
          tokens.push({
            kind: TokenKindKeyword,
            value: tokenizer.keyword(),
            position: tokenizer.tokenPosition(),
          });
          break;
        case TokenKindSymbol: {
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
          tokens.push({
            kind: TokenKindSymbol,
            value: symbol,
            position: tokenizer.tokenPosition(),
          });
          break;
        }
        case TokenKindIdentifier:
          tokens.push({
            kind: TokenKindIdentifier,
            value: tokenizer.identifier(),
            position: tokenizer.tokenPosition(),
          });
          break;
        case TokenKindIntegerConstant:
          tokens.push({
            kind: TokenKindIntegerConstant,
            value: String(tokenizer.intVal()),
            position: tokenizer.tokenPosition(),
          });
          break;
        case TokenKindStringConstant:
          tokens.push({
            kind: TokenKindStringConstant,
            value: tokenizer.stringVal(),
            position: tokenizer.tokenPosition(),
          });
          break;
        default:
          throw new Error(`Unexpected token type: ${tokenType}`);
      }
    }

    // Parse and compile
    // const outputPath = path.join(outputDir, `${jackFile.name}.xml`);
    // const file = await Deno.open(outputPath, {
    //   create: true,
    //   write: true,
    //   truncate: true,
    // });
    const writeCloser = {
      write: async (str: string): Promise<void> => {
        // await file.write(encoder.encode(str));
        console.log(str);
      },
      close: async (): Promise<void> => {},
    };
    const vmWriter = new VMWriter(writeCloser);
    const parser = new CompilationEngine(tokens, vmWriter);
    try {
      await parser.compileClass();
    } finally {
      vmWriter.close();
    }
  }
}

const inputPath = Deno.args[0];
await analyze(inputPath);
