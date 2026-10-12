import os
import hmac
import hashlib
from datetime import date, time, datetime, timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, Client
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.hashers import make_password

from booking.models import User, TurfGround, TurfImage, Booking, AuthToken, Payment


class BaseTestCase(TestCase):
    """Base setup helper for creating test accounts and sample data."""

    def setUp(self):
        self.client = Client()
        self.now = timezone.now()

        # 1. Customer User
        self.customer = User.objects.create(
            name="Customer User",
            email="customer@example.com",
            phone="9876543210",
            password_hash=make_password("password123"),
            role="customer",
            created_at=self.now,
        )
        self.customer_token = AuthToken.objects.create(
            key="customer_test_token_1234567890",
            user=self.customer,
        )

        # 2. Owner User
        self.owner = User.objects.create(
            name="Turf Owner",
            email="owner@example.com",
            phone="9876543211",
            password_hash=make_password("password123"),
            role="owner",
            created_at=self.now,
        )
        self.owner_token = AuthToken.objects.create(
            key="owner_test_token_12345678901234567",
            user=self.owner,
        )

        # 3. Second Owner User (for cross-ownership testing)
        self.owner2 = User.objects.create(
            name="Turf Owner 2",
            email="owner2@example.com",
            phone="9876543212",
            password_hash=make_password("password123"),
            role="owner",
            created_at=self.now,
        )
        self.owner2_token = AuthToken.objects.create(
            key="owner2_test_token_1234567890123456",
            user=self.owner2,
        )

        # 4. Admin User
        self.admin = User.objects.create(
            name="Admin User",
            email="admin@example.com",
            phone="9876543213",
            password_hash=make_password("password123"),
            role="admin",
            created_at=self.now,
        )
        self.admin_token = AuthToken.objects.create(
            key="admin_test_token_12345678901234567",
            user=self.admin,
        )

        # Sample Turf
        self.turf = TurfGround.objects.create(
            owner=self.owner,
            name="Premier Football Arena",
            location="Downtown",
            address="123 Main St",
            description="Premium 7v7 Football Turf with floodlights",
            price_per_hour=1000.00,
            opening_time=time(6, 0),
            closing_time=time(22, 0),
            is_active=True,
            created_at=self.now,
        )

    def auth_headers(self, token_key):
        return {"HTTP_AUTHORIZATION": f"Token {token_key}"}


class AccountAuthenticationTests(BaseTestCase):
    """Tests for registration, login, token auth, and user profile APIs."""

    def test_user_registration_success(self):
        payload = {
            "name": "New Customer",
            "email": "newcustomer@example.com",
            "phone": "9998887776",
            "password": "securepassword123",
            "role": "customer",
        }
        response = self.client.post("/api/register/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertIn("user", response.json())
        self.assertEqual(response.json()["user"]["email"], "newcustomer@example.com")
        self.assertTrue(User.objects.filter(email="newcustomer@example.com").exists())

    def test_user_registration_duplicate_email(self):
        payload = {
            "name": "Duplicate User",
            "email": "customer@example.com",
            "phone": "9998887775",
            "password": "securepassword123",
            "role": "customer",
        }
        response = self.client.post("/api/register/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_user_login_success(self):
        payload = {
            "email": "customer@example.com",
            "password": "password123",
        }
        response = self.client.post("/api/login/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())
        self.assertEqual(response.json()["token"], self.customer_token.key)

    def test_user_login_invalid_password(self):
        payload = {
            "email": "customer@example.com",
            "password": "wrongpassword",
        }
        response = self.client.post("/api/login/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_current_user_profile(self):
        response = self.client.get("/api/me/", **self.auth_headers(self.customer_token.key))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "customer@example.com")
        self.assertEqual(response.json()["role"], "customer")

    def test_current_user_profile_unauthorized(self):
        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, 401)


class RolePermissionTests(BaseTestCase):
    """Tests for role-based access controls across Customer, Owner, and Admin."""

    def test_customer_cannot_create_turf(self):
        payload = {
            "name": "Illegal Turf",
            "location": "Downtown",
            "price_per_hour": "500.00",
            "opening_time": "08:00:00",
            "closing_time": "20:00:00",
        }
        response = self.client.post(
            "/api/turfs/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 403)

    def test_owner_can_create_turf(self):
        payload = {
            "name": "Owner Ground",
            "location": "Uptown",
            "address": "456 North St",
            "description": "Cricket Box Turf",
            "price_per_hour": "1200.00",
            "opening_time": "06:00:00",
            "closing_time": "23:00:00",
        }
        response = self.client.post(
            "/api/owner/turfs/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.owner_token.key),
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Owner Ground")

    def test_owner_cannot_modify_other_owner_turf(self):
        payload = {"name": "Hacked Name"}
        response = self.client.patch(
            f"/api/turfs/{self.turf.id}/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.owner2_token.key),
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_dashboard_access(self):
        response = self.client.get(
            "/api/admin/dashboard/",
            **self.auth_headers(self.admin_token.key)
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("users", data)
        self.assertIn("turfs", data)
        self.assertIn("bookings", data)

    def test_non_admin_cannot_access_admin_dashboard(self):
        response = self.client.get(
            "/api/admin/dashboard/",
            **self.auth_headers(self.owner_token.key)
        )
        self.assertEqual(response.status_code, 403)


class TurfCRUDAndSportsTests(BaseTestCase):
    """Tests for Turf management, multi-sport grounds, filters, and status toggles."""

    def test_create_multiple_sports_turfs(self):
        sports_data = [
            ("Smash Badminton Court", "Badminton Indoor Court", "600.00"),
            ("Pro Cricket Turf Box", "Pitch Box Cricket Turf", "1500.00"),
            ("Hoop Basketball Court", "Hardwood Basketball Court", "800.00"),
        ]
        for name, desc, price in sports_data:
            turf = TurfGround.objects.create(
                owner=self.owner,
                name=name,
                location="Sports Complex",
                description=desc,
                price_per_hour=price,
                opening_time=time(6, 0),
                closing_time=time(22, 0),
                is_active=True,
                created_at=self.now,
            )
            self.assertIsNotNone(turf.id)

    def test_filter_turfs_by_location_and_price(self):
        # Create extra turf
        TurfGround.objects.create(
            owner=self.owner,
            name="Expensive Turf",
            location="Suburbs",
            price_per_hour=2500.00,
            opening_time=time(6, 0),
            closing_time=time(22, 0),
            is_active=True,
            created_at=self.now,
        )

        response = self.client.get("/api/turfs/?location=Downtown")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["name"], self.turf.name)

        response = self.client.get("/api/turfs/?max_price=1200.00")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_deactivate_and_reactivate_turf(self):
        response = self.client.patch(
            f"/api/turfs/{self.turf.id}/deactivate/",
            **self.auth_headers(self.owner_token.key)
        )
        self.assertEqual(response.status_code, 200)
        self.turf.refresh_from_db()
        self.assertFalse(self.turf.is_active)

        # Deactivated turf should not appear in active search
        search_res = self.client.get("/api/turfs/")
        self.assertEqual(len(search_res.json()), 0)

        # Reactivate
        response = self.client.patch(
            f"/api/turfs/{self.turf.id}/reactivate/",
            **self.auth_headers(self.owner_token.key)
        )
        self.assertEqual(response.status_code, 200)
        self.turf.refresh_from_db()
        self.assertTrue(self.turf.is_active)


class TurfImageTests(BaseTestCase):
    """Tests for uploading and managing turf images."""

    def test_owner_upload_and_delete_turf_image(self):
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
            b'\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00'
            b'\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
        )
        image_file = SimpleUploadedFile("test_turf.gif", small_gif, content_type="image/gif")

        response = self.client.post(
            f"/api/turfs/{self.turf.id}/images/",
            {"images": [image_file]},
            **self.auth_headers(self.owner_token.key)
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 1)
        image_id = response.json()[0]["id"]

        # Delete image
        del_res = self.client.delete(
            f"/api/images/{image_id}/",
            **self.auth_headers(self.owner_token.key)
        )
        self.assertEqual(del_res.status_code, 200)
        self.assertFalse(TurfImage.objects.filter(id=image_id).exists())


class SlotAvailabilityTests(BaseTestCase):
    """Tests for 30-minute interval availability computation and pending booking expiration."""

    def test_availability_slot_generation(self):
        tomorrow = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.client.get(f"/api/turfs/{self.turf.id}/availability/?date={tomorrow}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["slot_duration_minutes"], 30)
        # 6:00 to 22:00 = 16 hours = 32 slots of 30 mins
        self.assertEqual(len(data["slots"]), 32)

    def test_availability_past_date_error(self):
        yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.client.get(f"/api/turfs/{self.turf.id}/availability/?date={yesterday}")
        self.assertEqual(response.status_code, 400)

    def test_expire_pending_bookings(self):
        tomorrow = date.today() + timedelta(days=1)
        old_time = timezone.now() - timedelta(minutes=15)

        old_pending = Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            total_amount=1000.00,
            status="PENDING",
        )
        Booking.objects.filter(id=old_pending.id).update(created_at=old_time)

        # Trigger availability call which calls expire_pending_bookings
        self.client.get(f"/api/turfs/{self.turf.id}/availability/?date={tomorrow.strftime('%Y-%m-%d')}")
        old_pending.refresh_from_db()
        self.assertEqual(old_pending.status, "CANCELLED")



class BookingValidationAndWorkflowTests(BaseTestCase):
    """Tests for booking creation, rules, pricing, status lifecycle, and cancellations."""

    def test_create_valid_booking(self):
        tomorrow = date.today() + timedelta(days=1)
        payload = {
            "turf_id": self.turf.id,
            "booking_date": tomorrow.strftime("%Y-%m-%d"),
            "start_time": "14:00:00",
            "end_time": "15:30:00",
        }
        response = self.client.post(
            "/api/bookings/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["status"], "PENDING")
        # 1.5 hours @ 1000/hr = 1500.00
        self.assertEqual(float(data["total_amount"]), 1500.00)

    def test_booking_invalid_non_30_min_interval(self):
        tomorrow = date.today() + timedelta(days=1)
        payload = {
            "turf_id": self.turf.id,
            "booking_date": tomorrow.strftime("%Y-%m-%d"),
            "start_time": "14:15:00",
            "end_time": "15:15:00",
        }
        response = self.client.post(
            "/api/bookings/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 400)

    def test_booking_outside_operating_hours(self):
        tomorrow = date.today() + timedelta(days=1)
        payload = {
            "turf_id": self.turf.id,
            "booking_date": tomorrow.strftime("%Y-%m-%d"),
            "start_time": "05:00:00",
            "end_time": "07:00:00",
        }
        response = self.client.post(
            "/api/bookings/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 400)

    def test_overlapping_booking_rejection(self):
        tomorrow = date.today() + timedelta(days=1)
        Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 30),
            total_amount=1500.00,
            status="CONFIRMED",
            created_at=self.now,
        )

        payload = {
            "turf_id": self.turf.id,
            "booking_date": tomorrow.strftime("%Y-%m-%d"),
            "start_time": "11:00:00",
            "end_time": "12:00:00",
        }
        response = self.client.post(
            "/api/bookings/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 400)

    def test_customer_cancel_own_booking(self):
        tomorrow = date.today() + timedelta(days=1)
        booking = Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(16, 0),
            end_time=time(17, 0),
            total_amount=1000.00,
            status="PENDING",
            created_at=self.now,
        )

        response = self.client.patch(
            f"/api/bookings/{booking.id}/cancel/",
            **self.auth_headers(self.customer_token.key)
        )
        self.assertEqual(response.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "CANCELLED")


class PaymentStateTransitionTests(BaseTestCase):
    """Tests for payment order creation, razorpay signature verification, and state transitions."""

    @patch("booking.views.razorpay_client")
    def test_create_payment_order_success(self, mock_razorpay):
        mock_razorpay.order.create.return_value = {
            "id": "order_mock123456",
            "amount": 100000,
            "currency": "INR",
            "status": "created",
        }

        tomorrow = date.today() + timedelta(days=1)
        booking = Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(18, 0),
            end_time=time(19, 0),
            total_amount=1000.00,
            status="PENDING",
            created_at=self.now,
        )

        response = self.client.post(
            "/api/payments/create-order/",
            {"booking_id": booking.id},
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["order_id"], "order_mock123456")
        self.assertTrue(Payment.objects.filter(payment_order_id="order_mock123456").exists())

    @patch("booking.views.razorpay_client")
    def test_verify_payment_success(self, mock_razorpay):
        mock_razorpay.utility.verify_payment_signature.return_value = True

        tomorrow = date.today() + timedelta(days=1)
        booking = Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(19, 0),
            end_time=time(20, 0),
            total_amount=1000.00,
            status="PENDING",
            created_at=self.now,
        )
        payment = Payment.objects.create(
            booking=booking,
            user=self.customer,
            provider="RAZORPAY",
            payment_order_id="order_mock987654",
            amount=1000.00,
            currency="INR",
            status="PENDING",
            created_at=self.now,
        )

        payload = {
            "razorpay_order_id": "order_mock987654",
            "razorpay_payment_id": "pay_mock123456",
            "razorpay_signature": "mock_signature_string",
        }
        response = self.client.post(
            "/api/payments/verify/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, "SUCCESS")
        self.assertEqual(booking.status, "CONFIRMED")


class RegressionDefectFixesTests(BaseTestCase):
    """Regression test suite for fixed security, isolation, and state machine defects."""

    def test_registration_duplicate_phone(self):
        """DEF-05: Duplicate phone number must return 400 validation error, not 500 IntegrityError."""
        payload = {
            "name": "User Duplicate Phone",
            "email": "unique_email_123@example.com",
            "phone": "9876543210",  # Same as self.customer
            "password": "password123",
            "role": "customer",
        }
        response = self.client.post("/api/register/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.json())

    def test_booking_list_customer_isolation(self):
        """DEF-01: Customer querying GET /api/bookings/ must only see their own bookings."""
        tomorrow = date.today() + timedelta(days=1)
        # Create booking for Customer A (self.customer)
        bk_a = Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(8, 0),
            end_time=time(9, 0),
            total_amount=1000.00,
            status="CONFIRMED",
        )
        # Create booking for Owner user (self.owner)
        bk_b = Booking.objects.create(
            user=self.owner,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(9, 0),
            end_time=time(10, 0),
            total_amount=1000.00,
            status="CONFIRMED",
        )

        response = self.client.get("/api/bookings/", **self.auth_headers(self.customer_token.key))
        self.assertEqual(response.status_code, 200)
        returned_ids = [b["id"] for b in response.json()]
        self.assertIn(bk_a.id, returned_ids)
        self.assertNotIn(bk_b.id, returned_ids)

    def test_booking_detail_owner_access(self):
        """DEF-04: Turf owner must be permitted to view booking detail for a booking on their turf."""
        tomorrow = date.today() + timedelta(days=1)
        booking = Booking.objects.create(
            user=self.customer,
            turf=self.turf,  # Owned by self.owner
            booking_date=tomorrow,
            start_time=time(11, 0),
            end_time=time(12, 0),
            total_amount=1000.00,
            status="CONFIRMED",
        )
        response = self.client.get(
            f"/api/bookings/{booking.id}/",
            **self.auth_headers(self.owner_token.key)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], booking.id)

    def test_completed_booking_slot_overlap(self):
        """DEF-02: COMPLETED booking slots must be treated as unavailable for new bookings."""
        tomorrow = date.today() + timedelta(days=1)
        Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(13, 0),
            end_time=time(14, 0),
            total_amount=1000.00,
            status="COMPLETED",
        )

        payload = {
            "turf_id": self.turf.id,
            "booking_date": tomorrow.strftime("%Y-%m-%d"),
            "start_time": "13:00:00",
            "end_time": "14:00:00",
        }
        response = self.client.post(
            "/api/bookings/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 400)

    @patch("booking.views.razorpay_client")
    def test_payment_verification_cancelled_booking(self, mock_razorpay):
        """DEF-03: Submitting payment verification for a CANCELLED booking must fail."""
        mock_razorpay.utility.verify_payment_signature.return_value = True

        tomorrow = date.today() + timedelta(days=1)
        booking = Booking.objects.create(
            user=self.customer,
            turf=self.turf,
            booking_date=tomorrow,
            start_time=time(15, 0),
            end_time=time(16, 0),
            total_amount=1000.00,
            status="CANCELLED",
        )
        payment = Payment.objects.create(
            booking=booking,
            user=self.customer,
            provider="RAZORPAY",
            payment_order_id="order_cancelled_123",
            amount=1000.00,
            currency="INR",
            status="PENDING",
        )

        payload = {
            "razorpay_order_id": "order_cancelled_123",
            "razorpay_payment_id": "pay_mock_cancelled",
            "razorpay_signature": "mock_signature_cancelled",
        }
        response = self.client.post(
            "/api/payments/verify/",
            payload,
            content_type="application/json",
            **self.auth_headers(self.customer_token.key),
        )
        self.assertEqual(response.status_code, 400)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, "FAILED")
        self.assertEqual(booking.status, "CANCELLED")

