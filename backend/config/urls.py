from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static


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
]


if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )