from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import AuthToken


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

        try:
            token = AuthToken.objects.select_related(
                'user'
            ).get(
                key=token_key
            )
        except AuthToken.DoesNotExist:
            raise AuthenticationFailed(
                'Invalid or expired token.'
            )

        return (
            token.user,
            token
        )

    def authenticate_header(self, request):
        return 'Token'