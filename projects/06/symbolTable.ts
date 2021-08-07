class SymbolTable {
  table: Map<string, number>;
  constructor() {
    this.table = new Map();
  }

  /**
   * Adds <symbol, address> to the table.
   */
  addEntry(symbol: string, address: number): void {}

  /**
   * Does the symbol table contain the given symbol?
   */
  contains(symbol: string): boolean {}

  /**
   * Returns the address associated with the symbol.
   */
  getAddress(symbol: string): number {}
}

export default SymbolTable;
