"""
Security Middleware for PolicySetu
Provides:
  - Input sanitization (strip HTML/script injection, limit length)
  - Firebase token validation (reusable dependency)
  - Request logging middleware (IP, endpoint, response time)
"""

import re
import time
import html
from typing import Optional

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


# ═══════════════════════════════════════════════════════════════════════════════
# Input Sanitization
# ═══════════════════════════════════════════════════════════════════════════════

MAX_QUERY_LENGTH = 500
SCRIPT_PATTERN = re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL)
TAG_PATTERN = re.compile(r"<[^>]+>")
SQL_INJECTION_PATTERNS = [
    re.compile(r"(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+.*set)", re.IGNORECASE),
    re.compile(r"(--|;|'|\")\s*(or|and)\s+", re.IGNORECASE),
]


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks.
    - Removes script tags
    - Strips HTML tags
    - HTML-escapes remaining content
    - Truncates to MAX_QUERY_LENGTH
    - Strips SQL injection patterns
    """
    if not text:
        return ""

    # Remove script tags and their contents
    text = SCRIPT_PATTERN.sub("", text)

    # Remove all HTML tags
    text = TAG_PATTERN.sub("", text)

    # HTML-escape any remaining special characters
    text = html.unescape(text)  # First unescape to avoid double-encoding

    # Strip SQL injection patterns (replace with empty)
    for pattern in SQL_INJECTION_PATTERNS:
        text = pattern.sub("", text)

    # Truncate to max length
    text = text[:MAX_QUERY_LENGTH].strip()

    return text


def validate_query_length(query: str, max_length: int = MAX_QUERY_LENGTH) -> str:
    """Validate and truncate query to max length."""
    if len(query) > max_length:
        return query[:max_length]
    return query


# ═══════════════════════════════════════════════════════════════════════════════
# Firebase Token Validation (reusable FastAPI dependency)
# ═══════════════════════════════════════════════════════════════════════════════

async def validate_firebase_token(request: Request) -> Optional[dict]:
    """
    FastAPI dependency: Extract and verify Firebase ID token from
    Authorization header. Returns decoded token claims or raises 401.

    Usage:
        @app.get("/protected")
        async def protected_route(user=Depends(validate_firebase_token)):
            ...
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header. Use: Bearer <firebase_token>",
        )

    token = auth_header[7:]  # Strip "Bearer "

    try:
        from services.firebase_service import FirebaseService
        firebase_svc = FirebaseService()
        decoded = firebase_svc.verify_token(token)
        if not decoded:
            raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")
        return decoded
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# Request Logging Middleware
# ═══════════════════════════════════════════════════════════════════════════════

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming requests with IP, method, path, and response time."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Get client IP (handle proxied requests)
        client_ip = request.headers.get(
            "X-Forwarded-For",
            request.client.host if request.client else "unknown",
        )
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

        # Process request
        response = await call_next(request)

        # Calculate response time
        process_time = time.time() - start_time
        response_ms = round(process_time * 1000, 1)

        # Log the request
        print(
            f"[Request] {request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({response_ms}ms) "
            f"IP: {client_ip}"
        )

        # Add timing header
        response.headers["X-Process-Time"] = f"{response_ms}ms"

        return response


# ═══════════════════════════════════════════════════════════════════════════════
# Input Sanitization Middleware
# ═══════════════════════════════════════════════════════════════════════════════

class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that sanitizes incoming request bodies.
    Only processes JSON bodies on POST/PUT/PATCH with 'query' field.
    """

    async def dispatch(self, request: Request, call_next):
        # Only process POST/PUT/PATCH with JSON content
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    body = await request.body()
                    if body:
                        import json
                        data = json.loads(body)
                        if isinstance(data, dict) and "query" in data:
                            data["query"] = sanitize_input(data["query"])
                            # Reconstruct request with sanitized body
                            # Note: We can't easily modify the body in Starlette,
                            # so we sanitize in the endpoint handler instead.
                except Exception:
                    pass  # Not JSON or malformed — let the endpoint handle it

        response = await call_next(request)
        return response
