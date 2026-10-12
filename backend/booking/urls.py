from os import name
from django.urls import path
from . import views

from .views import (
    turf_list,
    turf_detail,
    turf_availability,
    booking_list,
    booking_detail,
    cancel_booking,
    user_bookings,
    deactivate_turf,
    register_user,
    login_user,
    current_user,
    my_bookings,
    confirm_booking,
    complete_booking,
    admin_bookings,
    admin_turfs,
    admin_update_turf_status,
    owner_turfs,
    owner_bookings,
    owner_dashboard,
    admin_dashboard,
    update_booking_status,
    deactivate_turf,
    reactivate_turf,
    owner_dashboard,
    create_payment_order,
    verify_payment,
    turf_images,
    delete_turf_image,
)


urlpatterns = [
    path(
        'turfs/',
        turf_list,
        name='turf-list'
    ),

    path(
        'turfs/<int:turf_id>/',
        turf_detail,
        name='turf-detail'
    ),

    path(
        'turfs/<int:turf_id>/availability/',
        turf_availability,
        name='turf-availability'
    ),

    path(
        'bookings/',
        booking_list,
        name='booking-list'
    ),

    path(
        'bookings/<int:booking_id>/',
        booking_detail,
        name='booking-detail'
    ),

    path(
        'bookings/<int:booking_id>/cancel/',
        cancel_booking,
        name='cancel-booking'
    ),

    path(
        'users/<int:user_id>/bookings/',
        user_bookings,
        name='user-bookings'
    ),

    # path(
    #     'turfs/<int:turf_id>/',
    #     turf_detail,
    #     name='turf-detail'
    # ),

    path(
        'turfs/<int:turf_id>/deactivate/',
        deactivate_turf,
        name='turf-deactivate'
    ),

    path(
        'register/',
        register_user,
        name='register'
    ),

    path(
        'login/',
        login_user,
        name='login'
    ),

    path(
        'me/',
        current_user,
        name='current-user'
    ),

    path(
        'my-bookings/',
        my_bookings,
        name='my-bookings'
    ),

    path(
        'bookings/<int:booking_id>/confirm/',
        confirm_booking,
        name='confirm-booking'
    ),  

    path(
        'bookings/<int:booking_id>/complete/',
        complete_booking,
        name='complete-booking'
    ),

    path(
        'admin/bookings/',
        admin_bookings,
        name='admin-bookings'
    ),

    path(
        'admin/turfs/',
        admin_turfs,
        name='admin-turfs'
    ),

    path(
        'admin/turfs/<int:turf_id>/status/',
        admin_update_turf_status,
        name='admin-update-turfs-status'
    ),

    path(
        'owner/turfs/',
        owner_turfs,
        name='owner-turfs'
    ),

    path(
        'owner/bookings/',
        owner_bookings,
        name='owner-bookings'
    ),

    path(
        'owner/dashboard/',
        owner_dashboard,
        name='owner-dashboard'
    ),

    path(
        'admin/dashboard/',
        admin_dashboard,
        name='admin-dashboard'
    ),

    path(
        'owner/bookings/<int:booking_id>/status/',
        update_booking_status,
        name='update-booking-status',
    ),

    path(
        'turfs/<int:turf_id>/reactivate/',
        reactivate_turf,
        name='reactivate_turf'
    ),


    path(
        'payments/create-order/',
        views.create_payment_order,
        name='create-payment-order'
    ),

    path(
        'payments/verify/',
        views.verify_payment,
        name='verify-payment'
    ),

    path(
        'turfs/<int:turf_id>/images/',
        turf_images,
        name='turf-images'
    ),

    path(
        'images/<int:image_id>/',
        delete_turf_image,
        name='delete-turf-image',
    ),

]