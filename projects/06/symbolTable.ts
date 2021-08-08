class SymbolTable {
  table: Map<string, number>;
  constructor() {
    this.table = new Map();
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
