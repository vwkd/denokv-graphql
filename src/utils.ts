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

export class InvalidInput extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "InvalidInput";
  }
}

export function isObject(value: unknown): value is object {
  return value != null && value.constructor.name === "Object";
}
