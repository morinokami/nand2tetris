export const SymbolKindStatic = "static";
export const SymbolKindField = "field";
export const SymbolKindArg = "arg";
export const SymbolKindVar = "var";
export const SymbolKindNone = "none";
export type SymbolKindType =
  | typeof SymbolKindStatic
  | typeof SymbolKindField
  | typeof SymbolKindArg
  | typeof SymbolKindVar
  | typeof SymbolKindNone;

class SymbolTable {
  private table = new Map<
    string,
    { type: string; kind: SymbolKindType; index: number }
  >();
  private staticIndex = 0;
  private fieldIndex = 0;
  private argIndex = 0;
  private varIndex = 0;

  /**
   * Empties the symbol table, and resets the four indexes to 0. Should be
   * called when starting to compile a subroutine declaration.
   */
  reset() {
    this.table.clear();
    this.staticIndex = 0;
    this.fieldIndex = 0;
    this.argIndex = 0;
    this.varIndex = 0;
  }

  /**
   * Defines (adds to the table) a new variable of the given name, type, and
   * kind. Assigns to it the index value of that kind, and adds 1 to the index.
   */
  define(name: string, type: string, kind: SymbolKindType) {
    let index = 0;
    if (kind === SymbolKindStatic) {
      index = this.staticIndex;
      this.staticIndex++;
    } else if (kind === SymbolKindField) {
      index = this.fieldIndex;
      this.fieldIndex++;
    } else if (kind === SymbolKindArg) {
      index = this.argIndex;
      this.argIndex++;
    } else {
      index = this.varIndex;
      this.varIndex++;
    }
    this.table.set(name, { type, kind, index });
  }

  /**
   * Returns the number of variables of the given kind already defined in the
   * table.
   */
  varCount(kind: SymbolKindType): number {
    if (kind === SymbolKindStatic) {
      return this.staticIndex;
    } else if (kind === SymbolKindField) {
      return this.fieldIndex;
    } else if (kind === SymbolKindArg) {
      return this.argIndex;
    } else {
      return this.varIndex;
    }
  }

  /**
   * Returns the kind of the named identifier. If the identifier is not found,
   * returns NONE.
   */
  kindOf(name: string): SymbolKindType {
    return this.table.get(name)?.kind ?? SymbolKindNone;
  }

  /**
   * Returns the type of the named variable.
   */
  typeOf(name: string): string {
    return this.table.get(name)?.type ?? "";
  }

  /**
   * Returns the index of the named variable.
   */
  indexOf(name: string): number {
    return this.table.get(name)?.index ?? -1;
  }
}

export default SymbolTable;
