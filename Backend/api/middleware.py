import re

from django.conf import settings
from django.http import HttpResponse


class LocalCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS" and self._is_allowed_origin(request):
            response = HttpResponse()
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin")
        if origin and self._origin_is_allowed(origin):
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        return response

    def _is_allowed_origin(self, request):
        origin = request.headers.get("Origin")
        return bool(origin and self._origin_is_allowed(origin))

    def _origin_is_allowed(self, origin):
        allowed_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
        allowed_regexes = getattr(settings, "CORS_ALLOWED_ORIGIN_REGEXES", [])

        return origin in allowed_origins or any(
            re.match(pattern, origin) for pattern in allowed_regexes
        )
