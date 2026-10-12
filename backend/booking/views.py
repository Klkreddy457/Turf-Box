from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status

from .models import TurfGround, Booking, AuthToken, User, Payment, TurfImage
from .serializers import (
    TurfGroundSerializer,
    TurfImageSerializer,
    BookingSerializer,
    RegisterSerializer,
    LoginSerializer,
)
from .authentication import CustomTokenAuthentication
from datetime import datetime, timedelta, date
import secrets
from django.db import transaction
from django.db.models import Sum
import razorpay
from django.conf import settings
from django.utils import timezone

def expire_pending_bookings():

    expiry_time = timezone.now() - timedelta(minutes=10)

    Booking.objects.filter(
        status='PENDING',
        created_at__lt=expiry_time
    ).update(
        status='CANCELLED'
    )

razorpay_client = razorpay.Client(
    auth=(
        settings.RAZORPAY_KEY_ID,
        settings.RAZORPAY_KEY_SECRET
    )
)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_order(request):

    booking_id = request.data.get('booking_id')

    if not booking_id:

        return Response(
            {
                'error': 'booking_id is required.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    try:

        booking = Booking.objects.get(
            id=booking_id,
            user=request.user
        )

    except Booking.DoesNotExist:

        return Response(
            {
                'error': 'Booking not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # =========================
    # CHECK BOOKING STATUS
    # =========================

    if booking.status == 'CONFIRMED':

        return Response(
            {
                'error':
                'This booking has already been paid.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    if booking.status == 'CANCELLED':

        return Response(
            {
                'error':
                'Cancelled bookings cannot be paid.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    if booking.status == 'COMPLETED':

        return Response(
            {
                'error':
                'This booking is already completed.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    # =========================
    # CHECK EXISTING PAYMENT
    # =========================

    existing_payment = Payment.objects.filter(

        booking=booking,

        user=request.user,

        status__in=[
            'CREATED',
            'PENDING'
        ]

    ).order_by('-id').first()


    # =========================
    # REUSE EXISTING ORDER
    # =========================

    if existing_payment and existing_payment.payment_order_id:

        return Response({

            'key_id':
            settings.RAZORPAY_KEY_ID,

            'order_id':
            existing_payment.payment_order_id,

            'amount':
            int(existing_payment.amount * 100),

            'currency':
            existing_payment.currency,

            'booking_id':
            booking.id,

            'message':
            'Existing payment order reused.'

        })


    # =========================
    # CREATE NEW RAZORPAY ORDER
    # =========================

    try:

        amount_in_paise = int(
            booking.total_amount * 100
        )


        razorpay_order = razorpay_client.order.create({

            'amount':
            amount_in_paise,

            'currency':
            'INR',

            'payment_capture':
            1

        })


        # =========================
        # CREATE PAYMENT RECORD
        # =========================

        payment = Payment.objects.create(

            booking=booking,

            user=request.user,

            provider='RAZORPAY',

            payment_order_id=razorpay_order['id'],

            amount=booking.total_amount,

            currency='INR',

            status='PENDING'

        )


        return Response({

            'key_id':
            settings.RAZORPAY_KEY_ID,

            'order_id':
            razorpay_order['id'],

            'amount':
            razorpay_order['amount'],

            'currency':
            razorpay_order['currency'],

            'booking_id':
            booking.id,

            'payment_id':
            payment.id,

        })


    except Exception as error:

        return Response(

            {
                'error': str(error)
            },

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):

    razorpay_order_id = request.data.get(
        'razorpay_order_id'
    )

    razorpay_payment_id = request.data.get(
        'razorpay_payment_id'
    )

    razorpay_signature = request.data.get(
        'razorpay_signature'
    )


    # =========================
    # VALIDATE REQUEST DATA
    # =========================

    if (
        not razorpay_order_id
        or not razorpay_payment_id
        or not razorpay_signature
    ):

        return Response(
            {
                'error':
                'Payment verification data is required.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    try:

        payment = Payment.objects.select_related(
            'booking'
        ).get(

            payment_order_id=razorpay_order_id,

            user=request.user

        )


    except Payment.DoesNotExist:

        return Response(
            {
                'error':
                'Payment record not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # =========================
    # PREVENT DOUBLE VERIFICATION
    # =========================

    if payment.status == 'SUCCESS':

        return Response(
            {
                'message':
                'Payment was already verified.',

                'payment_id':
                payment.id,

                'booking_id':
                payment.booking.id,

                'payment_status':
                payment.status,

                'booking_status':
                payment.booking.status,

            },
            status=status.HTTP_200_OK
        )


    try:

        # =========================
        # VERIFY RAZORPAY SIGNATURE
        # =========================

        razorpay_client.utility.verify_payment_signature({

            'razorpay_order_id':
            razorpay_order_id,

            'razorpay_payment_id':
            razorpay_payment_id,

            'razorpay_signature':
            razorpay_signature,

        })


        # =========================
        # UPDATE PAYMENT
        # =========================

        with transaction.atomic():

            payment.status = 'SUCCESS'

            payment.payment_id = (
                razorpay_payment_id
            )

            payment.payment_signature = (
                razorpay_signature
            )

            payment.save()


            # =========================
            # UPDATE BOOKING
            # =========================

            booking = payment.booking

            if booking.status == 'CANCELLED':
                payment.status = 'FAILED'
                payment.save()
                return Response(
                    {
                        'error': 'Cannot pay for a cancelled booking.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            booking.status = 'CONFIRMED'

            booking.save()


        # =========================
        # SUCCESS RESPONSE
        # =========================

        return Response({

            'message':
            'Payment verified successfully.',

            'payment_id':
            payment.id,

            'booking_id':
            booking.id,

            'payment_status':
            payment.status,

            'booking_status':
            booking.status,

        })


    except razorpay.errors.SignatureVerificationError:

        payment.status = 'FAILED'

        payment.save()


        return Response(
            {
                'error':
                'Payment verification failed.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    except Exception as error:

        return Response(
            {
                'error':
                str(error)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
def turf_list(request):

    if request.method == 'GET':

        turfs = TurfGround.objects.filter(
            is_active=True
        )

        location = request.query_params.get('location')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        date_string = request.query_params.get('date')

        if location:
            turfs = turfs.filter(
                location__icontains=location
            )

        if min_price:
            try:
                turfs = turfs.filter(
                    price_per_hour__gte=min_price
                )
            except (ValueError, TypeError):
                return Response(
                    {
                        'error': 'min_price must be a valid number'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        if max_price:
            try:
                turfs = turfs.filter(
                    price_per_hour__lte=max_price
                )
            except (ValueError, TypeError):
                return Response(
                    {
                        'error': 'max_price must be a valid number'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        if date_string:
            try:
                booking_date = datetime.strptime(
                    date_string,
                    '%Y-%m-%d'
                ).date()
            except ValueError:
                return Response(
                    {
                        'error': 'Invalid date format. Use YYYY-MM-DD.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        turfs = turfs.order_by(
            'price_per_hour'
        )

        serializer = TurfGroundSerializer(
            turfs,
            many=True
        )

        response_data = serializer.data

        if date_string:

            for turf_data in response_data:

                turf = TurfGround.objects.get(
                    id=turf_data['id']
                )

                bookings = Booking.objects.filter(
                    turf_id=turf.id,
                    booking_date=booking_date
                ).exclude(
                    status='CANCELLED'
                )

                current_time = datetime.combine(
                    booking_date,
                    turf.opening_time
                )

                closing_datetime = datetime.combine(
                    booking_date,
                    turf.closing_time
                )

                available_slots = 0

                while current_time < closing_datetime:

                    slot_end = (
                        current_time +
                        timedelta(hours=1)
                    )

                    if slot_end > closing_datetime:
                        break

                    slot_start_time = current_time.time()
                    slot_end_time = slot_end.time()

                    overlap = bookings.filter(
                        start_time__lt=slot_end_time,
                        end_time__gt=slot_start_time
                    ).exists()

                    if not overlap:
                        available_slots += 1

                    current_time = slot_end

                turf_data['available_slots'] = available_slots

        return Response(response_data)

    if request.method == 'POST':

        if not request.user.is_authenticated:
            return Response(
                {
                    'error': 'Authentication required'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role not in ['owner', 'admin']:
            return Response(
                {
                    'error': 'Only owners and admins can  turfs'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TurfGroundSerializer(
            data=request.data
        )

        if serializer.is_valid():

            turf = serializer.save(
                owner=request.user
            )

            return Response(
                TurfGroundSerializer(turf).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def turf_images(request, turf_id):

    try:

        turf = TurfGround.objects.get(
            id=turf_id
        )

    except TurfGround.DoesNotExist:

        return Response(
            {
                'error': 'Turf not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # ======================================
    # GET TURF IMAGES
    # ======================================

    if request.method == 'GET':

        images = TurfImage.objects.filter(
            turf=turf
        ).order_by(
            '-id'
        )


        serializer = TurfImageSerializer(

            images,

            many=True,

            context={
                'request': request
            }

        )


        return Response(
            serializer.data
        )


    # ======================================
    # ONLY OWNER CAN UPLOAD
    # ======================================

    if request.user.role != 'owner':

        return Response(

            {
                'error':
                'Only turf owners can upload images.'
            },

            status=status.HTTP_403_FORBIDDEN

        )


    # ======================================
    # CHECK TURF OWNER
    # ======================================

    if turf.owner_id != request.user.id:

        return Response(

            {
                'error':
                'You do not own this turf.'
            },

            status=status.HTTP_403_FORBIDDEN

        )


    # ======================================
    # GET MULTIPLE IMAGES
    # ======================================

    uploaded_images = request.FILES.getlist(
        'images'
    )


    if not uploaded_images:

        return Response(

            {
                'error':
                'Please upload at least one image.'
            },

            status=status.HTTP_400_BAD_REQUEST

        )


    # ======================================
    # LIMIT IMAGE COUNT
    # ======================================

    if len(uploaded_images) > 10:

        return Response(

            {
                'error':
                'Maximum 10 images allowed.'
            },

            status=status.HTTP_400_BAD_REQUEST

        )


    # ======================================
    # SAVE IMAGES
    # ======================================

    created_images = []


    for uploaded_image in uploaded_images:


        # Validate file type

        if not uploaded_image.content_type.startswith(
            'image/'
        ):

            return Response(

                {
                    'error':
                    'Only image files are allowed.'
                },

                status=status.HTTP_400_BAD_REQUEST

            )


        turf_image = TurfImage.objects.create(

            turf=turf,

            image=uploaded_image

        )


        created_images.append(
            turf_image
        )


    serializer = TurfImageSerializer(

        created_images,

        many=True,

        context={
            'request': request
        }

    )


    return Response(

        serializer.data,

        status=status.HTTP_201_CREATED

    )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_turf_image(
    request,
    image_id
):

    try:

        turf_image = TurfImage.objects.select_related(
            'turf'
        ).get(
            id=image_id
        )

    except TurfImage.DoesNotExist:

        return Response(

            {
                'error':
                'Image not found.'
            },

            status=status.HTTP_404_NOT_FOUND

        )


    # ======================================
    # CHECK OWNER
    # ======================================

    if request.user.role != 'owner':

        return Response(

            {
                'error':
                'Only owners can delete images.'
            },

            status=status.HTTP_403_FORBIDDEN

        )


    if turf_image.turf.owner_id != request.user.id:

        return Response(

            {
                'error':
                'You do not own this turf.'
            },

            status=status.HTTP_403_FORBIDDEN

        )


    # ======================================
    # DELETE FILE
    # ======================================

    if turf_image.image:

        turf_image.image.delete(
            save=False
        )


    # ======================================
    # DELETE DATABASE RECORD
    # ======================================

    turf_image.delete()


    return Response(

        {
            'message':
            'Image deleted successfully.'
        },

        status=status.HTTP_200_OK

    )

# @api_view(['GET', 'PATCH'])
# def turf_detail(request, turf_id):
#     try:
#         turf = TurfGround.objects.get(
#             id=turf_id,
#             is_active=True
#         )
#     except TurfGround.DoesNotExist:

#         return Response(
#             {
#                 'error': 'Turf not found'
#             },
#             status=status.HTTP_404_NOT_FOUND
#         )

#     serializer = TurfGroundSerializer(turf)

#     return Response(serializer.data)

@api_view(['GET'])
def turf_availability(request, turf_id):
    expire_pending_bookings()
    date_string = request.query_params.get('date')

    if not date_string:

        return Response(
            {
                'error': 'date parameter is required. Use YYYY-MM-DD.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        booking_date = datetime.strptime(
            date_string,
            '%Y-%m-%d'
        ).date()

    except ValueError:

        return Response(
            {
                'error': 'Invalid date format. Use YYYY-MM-DD.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent past dates
    if booking_date < date.today():

        return Response(
            {
                'error': 'Cannot check availability for a past date.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        turf = TurfGround.objects.get(
            id=turf_id,
            is_active=True
        )

    except TurfGround.DoesNotExist:

        return Response(
            {
                'error': 'Turf not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    bookings = Booking.objects.filter(
        turf_id=turf_id,
        booking_date=booking_date
    ).exclude(
        status='CANCELLED'
    )

    slots = []

    current_time = datetime.combine(
        booking_date,
        turf.opening_time
    )

    closing_datetime = datetime.combine(
        booking_date,
        turf.closing_time
    )

    while current_time < closing_datetime:

        # 30-minute slot
        slot_end = current_time + timedelta(minutes=30)

        if slot_end > closing_datetime:
            break

        slot_start_time = current_time.time()
        slot_end_time = slot_end.time()

        is_available = True
        is_past = False
        is_booked = False

        # Prevent past slots for today
        if booking_date == date.today():
            current_time_now = datetime.now().time()
            if slot_start_time <= current_time_now:
                is_past = True
                is_available = False

        # Check existing bookings
        for booking in bookings:
            booking_start = booking.start_time
            booking_end = booking.end_time

            if (
                slot_start_time < booking_end
                and slot_end_time > booking_start
            ):
                is_booked = True
                is_available = False
                break

        slots.append({
            'start_time': slot_start_time.strftime('%H:%M:%S'),
            'end_time': slot_end_time.strftime('%H:%M:%S'),
            'available': is_available,
            'is_booked': is_booked,
            'is_past': is_past,
        })


        # Move to next 30-minute slot
        current_time = slot_end


    return Response({

        'turf_id': turf.id,
        'turf_name': turf.name,
        'date': date_string,

        'opening_time':
            turf.opening_time.strftime('%H:%M:%S'),

        'closing_time':
            turf.closing_time.strftime('%H:%M:%S'),

        'slot_duration_minutes': 30,

        'price_per_hour':
            str(turf.price_per_hour),

        'slots': slots

    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_list(request):
    if request.method == 'GET':
        if request.user.role == 'admin':
            bookings = Booking.objects.all().order_by('-created_at')
        else:
            bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
        serializer = BookingSerializer(
            bookings,
            many=True
        )
        return Response(serializer.data)
    if request.method == 'POST':
        serializer = BookingSerializer(
            data=request.data,
            context={'request': request}
        )
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            turf = TurfGround.objects.select_for_update().get(
                id=serializer.validated_data['turf'].id,
                is_active=True
            )
            booking_date = serializer.validated_data['booking_date']
            start_time = serializer.validated_data['start_time']
            end_time = serializer.validated_data['end_time']
            # -----------------------------
            # VALIDATE TIME RANGE
            # -----------------------------
            if end_time <= start_time:
                return Response(
                    {
                        'error': (
                            'End time must be after start time.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        # -----------------------------
        # VALIDATE 30 MINUTE INTERVALS
        # -----------------------------
            if start_time.minute not in [0, 30]:
                return Response(
                    {
                        'error': (
                            'Start time must use a 30 minute interval.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            if end_time.minute not in [0, 30]:
                return Response(
                    {
                        'error': (
                            'End time must use a 30 minute interval.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        # -----------------------------
        # VALIDATE TURF HOURS
        # -----------------------------
            if start_time < turf.opening_time:
                return Response(
                    {
                        'error': (
                            'Booking starts before turf opening time.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            if end_time > turf.closing_time:
                return Response(
                    {
                        'error': (
                            'Booking ends after turf closing time.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        # -----------------------------
        # CALCULATE DURATION
        # -----------------------------
            start_minutes = (
                start_time.hour * 60
                + start_time.minute
            )
            end_minutes = (
                end_time.hour * 60
                + end_time.minute
            )
            duration_minutes = (
                end_minutes - start_minutes
            )
            if duration_minutes < 30:
                return Response(
                    {
                        'error': (
                            'Minimum booking duration is 30 minutes.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            # -----------------------------
            # CHECK OVERLAPPING BOOKINGS
            # -----------------------------
            overlapping_booking = Booking.objects.filter(
                turf=turf,
                booking_date=booking_date,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exclude(
                status='CANCELLED'
            ).exists()
            if overlapping_booking:
                return Response(
                    {
                        'error': (
                            'This turf is already booked '
                            'for the selected time.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            # -----------------------------
            # CALCULATE PRICE ON BACKEND
            # -----------------------------
            price_per_minute = (
                turf.price_per_hour / 60
            )
            total_amount = (
                price_per_minute
                * duration_minutes
            )
            # -----------------------------
            # CREATE BOOKING
            # -----------------------------
            booking = serializer.save(
                user=request.user,
                total_amount=total_amount
            )
    return Response(
        BookingSerializer(booking).data,
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_detail(request, booking_id):

    try:
        booking = Booking.objects.get(
            id=booking_id
        )
    except Booking.DoesNotExist:
        return Response(
            {
                'error': 'Booking not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if (
        booking.user_id != request.user.id
        and booking.turf.owner_id != request.user.id
        and request.user.role != 'admin'
    ):
        return Response(
            {
                'error': 'You do not have permission to view this booking'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = BookingSerializer(booking)

    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):

    try:
        booking = Booking.objects.get(
            id=booking_id
        )
    except Booking.DoesNotExist:
        return Response(
            {
                'error': 'Booking not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if (
        booking.user_id != request.user.id
        and request.user.role != 'admin'
    ):
        return Response(
            {
                'error': 'You do not have permission to cancel this booking'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if booking.status == 'CANCELLED':
        return Response(
            {
                'error': 'Booking is already cancelled'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if booking.status == 'COMPLETED':
        return Response(
            {
                'error': 'Completed bookings cannot be cancelled'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    booking.status = 'CANCELLED'

    booking.save(
        update_fields=['status']
    )

    return Response(
        BookingSerializer(booking).data,
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_bookings(request, user_id):

    if (
        request.user.id != user_id
        and request.user.role != 'admin'
    ):
        return Response(
            {
                'error': 'You do not have permission to view these bookings'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    bookings = Booking.objects.filter(
        user_id=user_id
    ).order_by(
        '-booking_date',
        '-start_time'
    )

    serializer = BookingSerializer(
        bookings,
        many=True
    )

    return Response(serializer.data)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticatedOrReadOnly])
def turf_detail(request, turf_id):

    try:
        turf = TurfGround.objects.get(
            id=turf_id,
            is_active=True
        )
    except TurfGround.DoesNotExist:
        return Response(
            {"error": "Turf not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # GET - anyone can view an active turf
    if request.method == 'GET':
        serializer = TurfGroundSerializer(turf)
        return Response(serializer.data)

    # PATCH - only the owner can edit their turf
    if not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.user.role != 'owner':
        return Response(
            {"error": "Only owners can edit turfs"},
            status=status.HTTP_403_FORBIDDEN
        )

    if turf.owner_id != request.user.id:
        return Response(
            {"error": "You do not own this turf"},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = TurfGroundSerializer(
        turf,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        turf = serializer.save()

        return Response(
            TurfGroundSerializer(turf).data,
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def deactivate_turf(request, turf_id):

    if request.user.role != 'owner':
        return Response(
            {'error': 'Only owners can deactivate turfs'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        turf = TurfGround.objects.get(
            id=turf_id,
            owner=request.user
        )
    except TurfGround.DoesNotExist:
        return Response(
            {'error': 'Turf not found or not owned by you'},
            status=status.HTTP_404_NOT_FOUND
        )

    turf.is_active = False
    turf.save(update_fields=['is_active'])

    serializer = TurfGroundSerializer(turf)

    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reactivate_turf(request, turf_id):

    if request.user.role != 'owner':
        return Response(
            {'error': 'Only owners can reactivate turfs'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        turf = TurfGround.objects.get(
            id=turf_id,
            owner=request.user
        )
    except TurfGround.DoesNotExist:
        return Response(
            {'error': 'Turf not found or not owned by you'},
            status=status.HTTP_404_NOT_FOUND
        )

    turf.is_active = True
    turf.save(update_fields=['is_active'])

    serializer = TurfGroundSerializer(turf)

    return Response(serializer.data)

@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            {
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'phone': user.phone,
                    'role': user.role,
                }
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])
def login_user(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data['user']

        token, created = AuthToken.objects.get_or_create(
            user=user,
            defaults={
                'key': secrets.token_hex(20)
            }
        )

        return Response(
            {
                'message': 'Login successful',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'phone': user.phone,
                    'role': user.role,
                }
            },
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):

    user = request.user

    return Response({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone': user.phone,
        'role': user.role,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookings(request):

    bookings = Booking.objects.filter(
        user_id=request.user.id
    ).order_by(
        '-booking_date',
        '-start_time'
    )

    serializer = BookingSerializer(
        bookings,
        many=True
    )

    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def confirm_booking(request, booking_id):

    try:
        booking = Booking.objects.get(
            id=booking_id
        )
    except Booking.DoesNotExist:
        return Response(
            {
                'error': 'Booking not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if request.user.role not in ['owner', 'admin']:
        return Response(
            {
                'error': 'Only owners and admins can confirm bookings'
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    if (request.user.role == 'owner' and booking.turf.owner_id != request.user.id):
        return Response(
        {
            'error': 'You do not have permission to confirm this booking'
        },
        status=status.HTTP_403_FORBIDDEN
    )

    if booking.status == 'CANCELLED':
        return Response(
            {
                'error': 'Cancelled bookings cannot be confirmed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if booking.status == 'COMPLETED':
        return Response(
            {
                'error': 'Completed bookings cannot be confirmed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if booking.status == 'CONFIRMED':
        return Response(
            {
                'error': 'Booking is already confirmed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    booking.status = 'CONFIRMED'

    booking.save(
        update_fields=['status']
    )

    return Response(
        BookingSerializer(booking).data,
        status=status.HTTP_200_OK
    )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_booking(request, booking_id):

    try:
        booking = Booking.objects.get(
            id=booking_id
        )
    except Booking.DoesNotExist:
        return Response(
            {
                'error': 'Booking not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if request.user.role not in ['owner', 'admin']:
        return Response(
            {
                'error': 'Only owners and admins can complete bookings'
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    if (request.user.role == 'owner' and booking.turf.owner_id != request.user.id):
        return Response(
        {
            'error': 'You do not have permission to complete this booking'
        },
        status=status.HTTP_403_FORBIDDEN
    )

    if booking.status == 'CANCELLED':
        return Response(
            {
                'error': 'Cancelled bookings cannot be completed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if booking.status == 'PENDING':
        return Response(
            {
                'error': 'Pending bookings must be confirmed first'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if booking.status == 'COMPLETED':
        return Response(
            {
                'error': 'Booking is already completed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    booking.status = 'COMPLETED'

    booking.save(
        update_fields=['status']
    )

    return Response(
        BookingSerializer(booking).data,
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bookings(request):

    if request.user.role != 'admin':
        return Response(
            {
                'error': 'Only admins can access this endpoint'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    bookings = Booking.objects.all().order_by(
        '-booking_date',
        '-start_time'
    )

    serializer = BookingSerializer(
        bookings,
        many=True
    )

    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_turfs(request):

    if request.user.role != 'admin':
        return Response(
            {
                'error': 'Only admins can access this endpoint'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    turfs = TurfGround.objects.all().order_by('id')

    serializer = TurfGroundSerializer(
        turfs,
        many=True
    )

    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_turf_status(request, turf_id):

    if request.user.role != 'admin':
        return Response(
            {
                'error': 'Only admins can update turf status'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        turf = TurfGround.objects.get(
            id=turf_id
        )
    except TurfGround.DoesNotExist:
        return Response(
            {
                'error': 'Turf not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if 'is_active' not in request.data:
        return Response(
            {
                'error': 'is_active is required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    is_active = request.data['is_active']

    if not isinstance(is_active, bool):
        return Response(
            {
                'error': 'is_active must be true or false'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    turf.is_active = is_active

    turf.save(
        update_fields=['is_active']
    )

    return Response(
        TurfGroundSerializer(turf).data,
        status=status.HTTP_200_OK
    )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def owner_turfs(request):

    if request.user.role != 'owner':
        return Response(
            {
                'error': 'Only owners can access this endpoint'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # GET - list owner's turfs
    if request.method == 'GET':

        turfs = TurfGround.objects.filter(
            owner_id=request.user.id
        ).order_by('-id')

        serializer = TurfGroundSerializer(
            turfs,
            many=True
        )

        return Response(serializer.data)

    # POST - create a new turf
    if request.method == 'POST':

        serializer = TurfGroundSerializer(
            data=request.data
        )

        if serializer.is_valid():

            turf = serializer.save(
                owner=request.user
            )

            return Response(
                TurfGroundSerializer(turf).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_bookings(request):

    if request.user.role != 'owner':
        return Response(
            {
                'error': 'Only owners can access this endpoint'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    bookings = Booking.objects.filter(
        turf__owner_id=request.user.id
    ).select_related(
        'turf',
        'user'
    ).order_by(
        '-booking_date',
        '-start_time'
    )

    serializer = BookingSerializer(
        bookings,
        many=True
    )

    return Response(serializer.data)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def owner_dashboard(request):

#     if request.user.role != 'owner':
#         return Response(
#             {
#                 'error': 'Only owners can access this endpoint'
#             },
#             status=status.HTTP_403_FORBIDDEN
#         )

#     turfs = TurfGround.objects.filter(
#         owner_id=request.user.id
#     )

#     bookings = Booking.objects.filter(
#         turf__owner_id=request.user.id
#     )

#     return Response({
#         'total_turfs': turfs.count(),

#         'active_turfs': turfs.filter(
#             is_active=True
#         ).count(),

#         'total_bookings': bookings.count(),

#         'pending_bookings': bookings.filter(
#             status='PENDING'
#         ).count(),

#         'confirmed_bookings': bookings.filter(
#             status='CONFIRMED'
#         ).count(),

#         'completed_bookings': bookings.filter(
#             status='COMPLETED'
#         ).count(),

#         'cancelled_bookings': bookings.filter(
#             status='CANCELLED'
#         ).count(),
#     })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):

    if request.user.role != 'admin':
        return Response(
            {
                'error': 'Only admins can access this endpoint'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    total_users = User.objects.count()

    total_customers = User.objects.filter(
        role='customer'
    ).count()

    total_owners = User.objects.filter(
        role='owner'
    ).count()

    total_turfs = TurfGround.objects.count()

    active_turfs = TurfGround.objects.filter(
        is_active=True
    ).count()

    inactive_turfs = TurfGround.objects.filter(
        is_active=False
    ).count()

    total_bookings = Booking.objects.count()

    pending_bookings = Booking.objects.filter(
        status='PENDING'
    ).count()

    confirmed_bookings = Booking.objects.filter(
        status='CONFIRMED'
    ).count()

    completed_bookings = Booking.objects.filter(
        status='COMPLETED'
    ).count()

    cancelled_bookings = Booking.objects.filter(
        status='CANCELLED'
    ).count()

    return Response({
        'users': {
            'total': total_users,
            'customers': total_customers,
            'owners': total_owners,
            'admins': User.objects.filter(
                role='admin'
            ).count(),
        },

        'turfs': {
            'total': total_turfs,
            'active': active_turfs,
            'inactive': inactive_turfs,
        },

        'bookings': {
            'total': total_bookings,
            'pending': pending_bookings,
            'confirmed': confirmed_bookings,
            'completed': completed_bookings,
            'cancelled': cancelled_bookings,
        }
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):

    if request.user.role != 'owner':
        return Response(
            {
                'error': 'Only owners can update booking status'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        booking = Booking.objects.select_related(
            'turf'
        ).get(
            id=booking_id
        )
    except Booking.DoesNotExist:
        return Response(
            {
                'error': 'Booking not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if booking.turf.owner_id != request.user.id:
        return Response(
            {
                'error': 'You do not have permission to update this booking'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    new_status = request.data.get('status')

    if new_status not in ['CONFIRMED', 'CANCELLED']:
        return Response(
            {
                'error': 'Status must be CONFIRMED or CANCELLED'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if booking.status != 'PENDING':
        return Response(
            {
                'error': 'Only pending bookings can be updated'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    booking.status = new_status

    booking.save(
        update_fields=['status']
    )

    return Response(
        BookingSerializer(booking).data,
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_dashboard(request):

    user = request.user

    if user.role != 'owner':
        return Response(
            {'error': 'Only turf owners can access the dashboard.'},
            status=403
        )

    turfs = TurfGround.objects.filter(owner=user)

    bookings = Booking.objects.filter(
        turf__owner=user
    )

    total_turfs = turfs.count()

    active_turfs = turfs.filter(
        is_active=True
    ).count()

    total_bookings = bookings.count()

    pending_bookings = bookings.filter(
        status='PENDING'
    ).count()

    confirmed_bookings = bookings.filter(
        status='CONFIRMED'
    ).count()

    completed_bookings = bookings.filter(
        status='COMPLETED'
    ).count()

    cancelled_bookings = bookings.filter(
        status='CANCELLED'
    ).count()

    total_revenue = bookings.filter(
        status__in=['CONFIRMED', 'COMPLETED']
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    return Response({
        'total_turfs': total_turfs,
        'active_turfs': active_turfs,
        'total_bookings': total_bookings,
        'pending_bookings': pending_bookings,
        'confirmed_bookings': confirmed_bookings,
        'completed_bookings': completed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'total_revenue': total_revenue,
    })