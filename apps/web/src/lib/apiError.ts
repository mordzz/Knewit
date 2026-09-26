/** Mirrors `ApiError` in the mobile app's `src/types/api.ts`  every
 * error response from this backend must match `{ code, message }`
 * exactly, since `apiRequest` (mobile) parses the body against that
 * shape. See docs/API.md, "Conventions." */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }

  toResponse(): Response {
    return Response.json({ code: this.code, message: this.message }, { status: this.status });
  }
}

export function notFound(message: string): ApiError {
  return new ApiError(404, 'not_found', message);
}

export function unauthorized(message = 'Missing or invalid authentication.'): ApiError {
  return new ApiError(401, 'unauthorized', message);
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, 'bad_request', message);
}

export function upstreamError(message = 'Upstream data source is unavailable.'): ApiError {
  return new ApiError(502, 'upstream_error', message);
}

/** Wrap a route handler body so any thrown `ApiError` (or unexpected
 * error) becomes a correctly-shaped JSON response instead of Next.js's
 * default HTML error page. */
export function withErrorHandling(
  handler: () => Promise<Response>
): Promise<Response> {
  return handler().catch((error: unknown) => {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error('[api] unhandled error', error);
    return new ApiError(500, 'internal_error', 'Something went wrong.').toResponse();
  });
}
