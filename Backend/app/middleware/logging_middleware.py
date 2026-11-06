

import logging
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("fraudshield.requests")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    ASGI middleware that logs all HTTP requests and their response times.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        # Process the request
        response: Response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        client_ip = (
            request.client.host if request.client else "unknown"
        )

        # Color-code log level based on status code
        if response.status_code >= 500:
            log_fn = logger.error
        elif response.status_code >= 400:
            log_fn = logger.warning
        else:
            log_fn = logger.info

        log_fn(
            "%s %s %s | %.2fms | IP: %s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            client_ip,
        )

        # Add processing time to response headers for frontend debugging
        response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

        return response
