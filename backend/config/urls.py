import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from django.http import JsonResponse


def api_root(request):
    db_host_env = os.getenv('DB_HOST') or os.getenv('MYSQL_HOST') or os.getenv('MYSQLHOST')
    is_remote_host = bool(db_host_env and db_host_env not in ('127.0.0.1', 'localhost'))
    has_db_url = bool(os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL'))

    return JsonResponse({
        "status": "online",
        "service": "TurfBox Backend API",
        "database_configured": is_remote_host or has_db_url,
        "database_host_type": "remote" if is_remote_host else ("url" if has_db_url else ("localhost_default" if not db_host_env else "localhost_explicit")),
        "env_presence": {
            "DB_HOST": bool(os.getenv('DB_HOST')),
            "DB_NAME": bool(os.getenv('DB_NAME')),
            "DB_USER": bool(os.getenv('DB_USER')),
            "DB_PASSWORD": bool(os.getenv('DB_PASSWORD')),
            "DB_PORT": bool(os.getenv('DB_PORT')),
            "DATABASE_URL": bool(os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')),
            "MYSQLHOST": bool(os.getenv('MYSQLHOST') or os.getenv('MYSQL_HOST')),
        },
        "endpoints": {
            "turfs": "/api/turfs/",
            "bookings": "/api/bookings/",
            "register": "/api/register/",
            "login": "/api/login/",
            "admin": "/admin/",
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('booking.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]