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
    const outputPath = path.join(outputDir, `${jackFile.name}T.xml`);
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
          tokens.push({ kind: "keyword", value: tokenizer.keyword() });
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
          tokens.push({ kind: "symbol", value: symbol });
          break;
        }
        case TokenKindIdentifier:
          tokens.push({ kind: "identifier", value: tokenizer.identifier() });
          break;
        case TokenKindIntegerConstant:
          tokens.push({
            kind: "integerConstant",
            value: String(tokenizer.intVal()),
          });
          break;
        case TokenKindStringConstant:
          tokens.push({ kind: "stringConstant", value: tokenizer.stringVal() });
          break;
        default:
          throw new Error(`Unexpected token type: ${tokenType}`);
      }
    }

    // TODO: Parse
    // @ts-ignore
    const writer = { write: (str: string): Promise<void> => console.log(str) };
    const parser = new CompilationEngine(tokens, writer);
    parser.compileClass();

    // TODO: Delete this
    // Write output
    const file = await Deno.open(outputPath, {
      create: true,
      write: true,
      truncate: true,
    });
    await file.write(encoder.encode("<tokens>\n"));
    for (const token of tokens) {
      await file.write(
        encoder.encode(`<${token.kind}> ${token.value} </${token.kind}>\n`)
      );
    }
    await file.write(encoder.encode("</tokens>\n"));
    file.close();
  }
}

const inputPath = Deno.args[0];
await analyze(inputPath);
