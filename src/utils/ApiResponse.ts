export class ApiResponse {
  public success: boolean = true;
  public statusCode: number;
  public data: any;
  public message?: string;
  public meta?: any;

  constructor(statusCode: number, data: any, message?: string, meta?: any) {
    this.statusCode = statusCode;
    this.data = data;
    if (message) this.message = message;
    if (meta) this.meta = meta;
  }
}
