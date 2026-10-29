from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

def rate_limit_key(request: Request) -> str:
    # If authenticated, rate-limit by user ID header or auth bearer, else IP
    auth = request.headers.get("Authorization")
    if auth:
        return auth
    return get_remote_address(request)

limiter = Limiter(key_func=rate_limit_key)

