export const successResponse = (
  data: any = null,
  message: string = 'Success',
  statusCode: number = 200
) => ({
  success: true,
  message,
  data,
  statusCode,
});

export const errorResponse = (
  message: string = 'An error occurred',
  data: any = null,
  errorCode: string = 'ERROR',
  statusCode: number = 500
) => ({
  success: false,
  message,
  data,
  errorCode,
  statusCode,
});
