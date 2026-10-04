export function success<T>(data: T) {
  return { data };
}

export function error(code: string, message: string, details?: unknown) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
