class SymbolTable {
  table: Map<string, number>;
  constructor() {
    this.table = new Map([
      ["R0", 0],
      ["R1", 1],
      ["R2", 2],
      ["R3", 3],
      ["R4", 4],
      ["R5", 5],
      ["R6", 6],
      ["R7", 7],
      ["R8", 8],
      ["R9", 9],
      ["R10", 10],
      ["R11", 11],
      ["R12", 12],
      ["R13", 13],
      ["R14", 14],
      ["R15", 15],
      ["SP", 0],
      ["LCL", 1],
      ["ARG", 2],
      ["THIS", 3],
      ["THAT", 4],
      ["SCREEN", 16384],
      ["KBD", 24576],
    ]);
  }

  /**
   * Adds <symbol, address> to the table.
   */
  addEntry(symbol: string, address: number): void {
    this.table.set(symbol, address);
  }

  /**
   * Does the symbol table contain the given symbol?
   */
  contains(symbol: string): boolean {
    return this.table.has(symbol);
  }

  /**
   * Returns the address associated with the symbol.
   */
  getAddress(symbol: string): number | undefined {
    return this.table.get(symbol);
  }
}

export default SymbolTable;
