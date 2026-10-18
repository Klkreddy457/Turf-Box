from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.db import connections

from .models import AuthToken
import logging

logger = logging.getLogger(__name__)

class CustomTokenAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2:
            raise AuthenticationFailed(
                'Invalid Authorization header.'
            )

        if parts[0].lower() != 'token':
            raise AuthenticationFailed(
                'Authentication scheme must be Token.'
            )

        token_key = parts[1]

        db_config = AuthToken.objects.db
        db_settings = connections[db_config].settings_dict

        logger.info(
            "Auth check: token_length=%s, db_alias=%s, db_host=%s, db_name=%s",
            len(token_key),
            db_config,
            db_settings.get("HOST"),
            db_settings.get("NAME"),
        )

        try:
            token = AuthToken.objects.select_related(
                'user'
            ).get(
                key=token_key
            )
        except AuthToken.DoesNotExist:
            logger.warning(
                "Auth check failed: token not found in configured database"
            )
            raise AuthenticationFailed(
                'Invalid or expired token.'
            )

        return (
            token.user,
            token
        )

    def authenticate_header(self, request):
        return 'Token'