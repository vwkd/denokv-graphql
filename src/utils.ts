export class DatabaseCorruption extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "DatabaseCorruption";
  }
}

export class InvalidSchema extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "InvalidSchema";
  }
}
