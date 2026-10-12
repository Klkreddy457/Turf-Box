from django.db import models


class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    password_hash = models.CharField(max_length=255)

    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('owner', 'Owner'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')

    created_at = models.DateTimeField(auto_now_add=True)
    @property
    def is_authenticated(self):
        return True
    @property
    def is_anonymous(self):
        return False
            
    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return self.name

class TurfGround(models.Model):
    id = models.AutoField(primary_key=True)

    owner = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column='owner_id'
    )

    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    address = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    price_per_hour = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'turf_grounds'

    def __str__(self):
        return self.name

class TurfImage(models.Model):

    id = models.AutoField(
        primary_key=True
    )

    turf = models.ForeignKey(
        TurfGround,
        on_delete=models.CASCADE,
        db_column='turf_id',
        related_name='images'
    )

    image = models.ImageField(
        upload_to='turf_images/'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        managed = False
        db_table = 'turf_images'

    def __str__(self):
        return f"Image for {self.turf.name}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]

    id = models.AutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column='user_id'
    )

    turf = models.ForeignKey(
        TurfGround,
        on_delete=models.DO_NOTHING,
        db_column='turf_id'
    )

    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'bookings'

    def __str__(self):
        return f"Booking {self.id}"

class AuthToken(models.Model):
    key = models.CharField(
        max_length=40,
        primary_key=True
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        db_column='user_id'
    )

    created = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        managed = False
        db_table = 'auth_tokens'

    def __str__(self):
        return self.key

class Payment(models.Model):

    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    id = models.AutoField(primary_key=True)

    booking = models.ForeignKey(
        Booking,
        on_delete=models.DO_NOTHING,
        db_column='booking_id'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column='user_id'
    )

    provider = models.CharField(
        max_length=50,
        default='RAZORPAY'
    )

    payment_order_id = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    payment_id = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    payment_signature = models.CharField(
        max_length=500,
        null=True,
        blank=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    currency = models.CharField(
        max_length=10,
        default='INR'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CREATED'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'payments'

    def __str__(self):
        return f"Payment {self.id}"