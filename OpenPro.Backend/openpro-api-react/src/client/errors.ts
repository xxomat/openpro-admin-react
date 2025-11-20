export class OpenProHttpError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'OpenProHttpError';
    this.status = status;
    this.body = body;
  }
}

export class OpenProApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenProApiError';
  }
}


