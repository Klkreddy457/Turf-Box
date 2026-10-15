from rest_framework import serializers
from datetime import datetime, date
from .models import Booking, TurfGround, User, Payment, TurfImage
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            'min_length': 'Password must be at least 8 characters long.',
            'required': 'Password is required.',
        }
    )
    role = serializers.CharField(
        required=False,
        default='customer'
    )

    class Meta:
        model = User
        fields = [
            'name',
            'email',
            'phone',
            'password',
            'role',
        ]
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'email': {'required': True, 'allow_blank': False},
        }

    def validate_name(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('Full name is required.')
        return str(value).strip()

    def validate_email(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('Email address is required.')
        normalized = str(value).strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                'A user with this email already exists.'
            )
        return normalized

    def validate_phone(self, value):
        if not value or not str(value).strip():
            return None
        cleaned = str(value).strip()
        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError(
                'A user with this phone number already exists.'
            )
        return cleaned

    def validate_role(self, value):
        if not value:
            return 'customer'
        role = str(value).strip().lower()
        if role == 'admin':
            raise serializers.ValidationError(
                'Registration as admin is not permitted.'
            )
        if role not in ['customer', 'owner']:
            raise serializers.ValidationError(
                'Account type must be either Customer or Owner.'
            )
        return role

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(password)
        if not validated_data.get('phone'):
            validated_data['phone'] = None
        if not validated_data.get('role'):
            validated_data['role'] = 'customer'
        return User.objects.create(**validated_data) 

class TurfImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = TurfImage
        fields = [
            'id',
            'image',
            'image_url',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
        ]
    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(
                obj.image.url
            )
        url = obj.image.url
        if url.startswith('http://') or url.startswith('https://'):
            return url
        from django.conf import settings
        backend_host = getattr(settings, 'BACKEND_HOST', 'http://127.0.0.1:8000')
        if url.startswith('/'):
            return f"{backend_host}{url}"
        return f"{backend_host}/{url}"

class TurfGroundSerializer(
    serializers.ModelSerializer
):
    owner_id = serializers.PrimaryKeyRelatedField(
        read_only=True,
        source='owner'
    )
    images = TurfImageSerializer(
        many=True,
        read_only=True
    )
    class Meta:
        model = TurfGround
        fields = [
            'id',
            'owner_id',
            'name',
            'location',
            'address',
            'description',
            'price_per_hour',
            'opening_time',
            'closing_time',
            'is_active',
            'images',
        ]

class BookingSerializer(serializers.ModelSerializer):

    user_id = serializers.PrimaryKeyRelatedField(
        read_only=True,
        source='user'
    )

    turf_id = serializers.PrimaryKeyRelatedField(
        queryset=TurfGround.objects.filter(
            is_active=True
        ),
        source='turf'
    )


    class Meta:

        model = Booking

        fields = [

            'id',

            'user_id',

            'turf_id',

            'booking_date',

            'start_time',

            'end_time',

            'total_amount',

            'status',

            'created_at',

        ]


        read_only_fields = [

            'id',

            'user_id',

            'total_amount',

            'status',

            'created_at',

        ]


    def validate(self, data):

        turf = data['turf']

        booking_date = data['booking_date']

        start_time = data['start_time']

        end_time = data['end_time']


        if booking_date < date.today():

            raise serializers.ValidationError({
                'booking_date':
                'You cannot book a turf for a past date.'
            })


        if booking_date == date.today():

            current_time = datetime.now().time()

            if start_time <= current_time:

                raise serializers.ValidationError({
                    'start_time':
                    'You cannot book a time slot that has already started.'
                })


        if start_time >= end_time:

            raise serializers.ValidationError({
                'end_time':
                'End time must be after start time.'
            })


        if start_time.minute not in [0, 30]:

            raise serializers.ValidationError({
                'start_time':
                'Start time must use a 30-minute interval.'
            })


        if end_time.minute not in [0, 30]:

            raise serializers.ValidationError({
                'end_time':
                'End time must use a 30-minute interval.'
            })


        if start_time < turf.opening_time:

            raise serializers.ValidationError({
                'start_time':
                'Booking starts before turf opening time.'
            })


        if end_time > turf.closing_time:

            raise serializers.ValidationError({
                'end_time':
                'Booking ends after turf closing time.'
            })


        start_datetime = datetime.combine(
            booking_date,
            start_time
        )

        end_datetime = datetime.combine(
            booking_date,
            end_time
        )


        duration_minutes = int(

            (end_datetime - start_datetime)
            .total_seconds() / 60

        )


        if duration_minutes < 30:

            raise serializers.ValidationError({
                'end_time':
                'Minimum booking duration is 30 minutes.'
            })


        if duration_minutes % 30 != 0:

            raise serializers.ValidationError({
                'end_time':
                'Booking duration must use 30-minute intervals.'
            })


        overlapping = Booking.objects.filter(

            turf=turf,

            booking_date=booking_date,

            start_time__lt=end_time,

            end_time__gt=start_time

        ).exclude(
            status='CANCELLED'
        )


        if overlapping.exists():

            raise serializers.ValidationError({
                'time':
                'This turf is already booked for the selected time.'
            })


        return data
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True
    )

    def validate(self, data):
        email = data['email']
        password = data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )

        if not check_password(
            password,
            user.password_hash
        ):
            raise serializers.ValidationError(
                'Invalid email or password.'
            )

        data['user'] = user

        return data

class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment

        fields = [
            'id',
            'booking',
            'user',
            'provider',
            'payment_order_id',
            'payment_id',
            'amount',
            'currency',
            'status',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'user_id',
            'payment_order_id',
            'payment_id',
            'status',
            'created_at',
        ]