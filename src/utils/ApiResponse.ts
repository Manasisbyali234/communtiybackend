export class ApiResponse<T> {
  public success: boolean;
  public statusCode: number;
  public data: T;
  public message: string;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
