from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve

from django.conf import settings
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        "status": "online",
        "service": "TurfBox Backend API",
        "endpoints": {
            "turfs": "/api/turfs/",
            "bookings": "/api/bookings/",
            "admin": "/admin/",
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('booking.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]