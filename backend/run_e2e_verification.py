import os
import sys
import json
import requests
import hmac
import hashlib
from datetime import date, time, datetime, timedelta

API_BASE = "http://127.0.0.1:8000/api"

import time as time_module

def run_e2e_flow():
    ts = str(int(time_module.time()))
    print("=" * 60)
    print(f"STARTING TURFBOX FULL E2E WORKFLOW VERIFICATION (TS: {ts})")
    print("=" * 60)

    # 1. Register Owner A & Create Turf A (Football)
    owner_a_email = f"ownerA_{ts}@example.com"
    owner_a_phone = f"911{ts[-7:]}"
    owner_a_payload = {
        "name": "Owner A",
        "email": owner_a_email,
        "phone": owner_a_phone,
        "password": "password123",
        "role": "owner"
    }
    r = requests.post(f"{API_BASE}/register/", json=owner_a_payload)
    print("1. Owner A Registration:", r.status_code, r.json().get('message'))
    
    r_login_a = requests.post(f"{API_BASE}/login/", json={"email": owner_a_email, "password": "password123"})
    token_a = r_login_a.json()["token"]
    headers_a = {"Authorization": f"Token {token_a}"}


    turf_a_payload = {
        "name": "Owner A Football Arena",
        "location": "North District",
        "address": "100 North Way",
        "description": "7v7 Artificial Grass Football Turf with floodlights",
        "price_per_hour": "1200.00",
        "opening_time": "06:00:00",
        "closing_time": "22:00:00",
        "is_active": True
    }
    r_turf_a = requests.post(f"{API_BASE}/owner/turfs/", json=turf_a_payload, headers=headers_a)
    turf_a_id = r_turf_a.json()["id"]
    print("   Created Turf A (Football) ID:", turf_a_id, "Name:", r_turf_a.json()["name"])

    # Upload Image for Turf A
    gif_bytes = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    files = [('images', ('turf_a.gif', gif_bytes, 'image/gif'))]
    r_img_a = requests.post(f"{API_BASE}/turfs/{turf_a_id}/images/", files=files, headers=headers_a)
    print("   Uploaded Image for Turf A:", r_img_a.status_code, "Count:", len(r_img_a.json()))

    # 2. Register Owner B & Create Turf B (Cricket)
    owner_b_email = f"ownerB_{ts}@example.com"
    owner_b_phone = f"912{ts[-7:]}"
    owner_b_payload = {
        "name": "Owner B",
        "email": owner_b_email,
        "phone": owner_b_phone,
        "password": "password123",
        "role": "owner"
    }
    r = requests.post(f"{API_BASE}/register/", json=owner_b_payload)
    print("\n2. Owner B Registration:", r.status_code, r.json().get('message'))
    
    r_login_b = requests.post(f"{API_BASE}/login/", json={"email": owner_b_email, "password": "password123"})
    token_b = r_login_b.json()["token"]
    headers_b = {"Authorization": f"Token {token_b}"}

    turf_b_payload = {
        "name": "Owner B Pitch Cricket Box",
        "location": "South District",
        "address": "200 South Pitch Road",
        "description": "Indoor Box Cricket Turf with net enclosure",
        "price_per_hour": "1500.00",
        "opening_time": "07:00:00",
        "closing_time": "23:00:00",
        "is_active": True
    }
    r_turf_b = requests.post(f"{API_BASE}/owner/turfs/", json=turf_b_payload, headers=headers_b)
    turf_b_id = r_turf_b.json()["id"]
    print("   Created Turf B (Cricket) ID:", turf_b_id, "Name:", r_turf_b.json()["name"])

    # 3. Register Customer A & Book Turf A
    cust_a_email = f"customerA_{ts}@example.com"
    cust_a_phone = f"921{ts[-7:]}"
    cust_a_payload = {
        "name": "Customer A",
        "email": cust_a_email,
        "phone": cust_a_phone,
        "password": "password123",
        "role": "customer"
    }
    r = requests.post(f"{API_BASE}/register/", json=cust_a_payload)
    print("\n3. Customer A Registration:", r.status_code, r.json().get('message'))
    
    token_ca = requests.post(f"{API_BASE}/login/", json={"email": cust_a_email, "password": "password123"}).json()["token"]
    headers_ca = {"Authorization": f"Token {token_ca}"}

    tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Customer A creates booking for Turf A
    booking_a_payload = {
        "turf_id": turf_a_id,
        "booking_date": tomorrow_str,
        "start_time": "10:00:00",
        "end_time": "11:30:00"
    }
    r_bk_a = requests.post(f"{API_BASE}/bookings/", json=booking_a_payload, headers=headers_ca)
    booking_a_id = r_bk_a.json()["id"]
    print("   Customer A Created Booking ID:", booking_a_id, "Status:", r_bk_a.json()["status"], "Amount: INR", r_bk_a.json()["total_amount"])

    # Customer A payment order & simulated verification
    r_ord_a = requests.post(f"{API_BASE}/payments/create-order/", json={"booking_id": booking_a_id}, headers=headers_ca)
    order_a_id = r_ord_a.json()["order_id"]
    print("   Payment Order Created:", order_a_id)

    # Simulate signature verification
    # Note: In test mode, we use mock signature
    secret = os.getenv("RAZORPAY_KEY_SECRET", "NKWDjqw3rUnlJwLsKhD6y23c")
    mock_pay_id = "pay_mock_a_12345"
    msg = f"{order_a_id}|{mock_pay_id}".encode('utf-8')
    signature_a = hmac.new(secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()

    r_verify_a = requests.post(f"{API_BASE}/payments/verify/", json={
        "razorpay_order_id": order_a_id,
        "razorpay_payment_id": mock_pay_id,
        "razorpay_signature": signature_a
    }, headers=headers_ca)
    print("   Payment Verification Result:", r_verify_a.status_code, r_verify_a.json()["message"], "Booking Status:", r_verify_a.json()["booking_status"])

    # 4. Register Customer B & Book Turf B
    cust_b_email = f"customerB_{ts}@example.com"
    cust_b_phone = f"922{ts[-7:]}"
    cust_b_payload = {
        "name": "Customer B",
        "email": cust_b_email,
        "phone": cust_b_phone,
        "password": "password123",
        "role": "customer"
    }
    r = requests.post(f"{API_BASE}/register/", json=cust_b_payload)
    print("\n4. Customer B Registration:", r.status_code, r.json().get('message'))
    
    token_cb = requests.post(f"{API_BASE}/login/", json={"email": cust_b_email, "password": "password123"}).json()["token"]
    headers_cb = {"Authorization": f"Token {token_cb}"}

    booking_b_payload = {
        "turf_id": turf_b_id,
        "booking_date": tomorrow_str,
        "start_time": "15:00:00",
        "end_time": "16:00:00"
    }
    r_bk_b = requests.post(f"{API_BASE}/bookings/", json=booking_b_payload, headers=headers_cb)
    booking_b_id = r_bk_b.json()["id"]
    print("   Customer B Created Booking ID:", booking_b_id, "Status:", r_bk_b.json()["status"], "Amount: INR", r_bk_b.json()["total_amount"])

    # Customer B payment order & simulation
    r_ord_b = requests.post(f"{API_BASE}/payments/create-order/", json={"booking_id": booking_b_id}, headers=headers_cb)
    order_b_id = r_ord_b.json()["order_id"]
    mock_pay_id_b = "pay_mock_b_67890"
    msg_b = f"{order_b_id}|{mock_pay_id_b}".encode('utf-8')
    signature_b = hmac.new(secret.encode('utf-8'), msg_b, hashlib.sha256).hexdigest()

    r_verify_b = requests.post(f"{API_BASE}/payments/verify/", json={
        "razorpay_order_id": order_b_id,
        "razorpay_payment_id": mock_pay_id_b,
        "razorpay_signature": signature_b
    }, headers=headers_cb)
    print("   Payment Verification Result:", r_verify_b.status_code, r_verify_b.json()["message"], "Booking Status:", r_verify_b.json()["booking_status"])

    # 5. Test Overlapping Slot Attempt (Customer B tries to book Customer A's slot on Turf A)
    r_overlap = requests.post(f"{API_BASE}/bookings/", json={
        "turf_id": turf_a_id,
        "booking_date": tomorrow_str,
        "start_time": "10:30:00",
        "end_time": "11:30:00"
    }, headers=headers_cb)
    print("\n5. Overlapping Slot Booking Attempt:", r_overlap.status_code, r_overlap.json())

    # 6. Test Failed Payment Signature Verification
    booking_c_payload = {
        "turf_id": turf_a_id,
        "booking_date": tomorrow_str,
        "start_time": "18:00:00",
        "end_time": "19:00:00"
    }
    r_bk_c = requests.post(f"{API_BASE}/bookings/", json=booking_c_payload, headers=headers_ca)
    booking_c_id = r_bk_c.json()["id"]
    r_ord_c = requests.post(f"{API_BASE}/payments/create-order/", json={"booking_id": booking_c_id}, headers=headers_ca)
    order_c_id = r_ord_c.json()["order_id"]

    r_fail_verify = requests.post(f"{API_BASE}/payments/verify/", json={
        "razorpay_order_id": order_c_id,
        "razorpay_payment_id": "pay_fake_99999",
        "razorpay_signature": "INVALID_SIGNATURE_STRING"
    }, headers=headers_ca)
    print("\n6. Failed Payment Signature Attempt:", r_fail_verify.status_code, r_fail_verify.json())

    # 7. Test Duplicate Payment Order Submission for Paid Booking
    r_dup_pay = requests.post(f"{API_BASE}/payments/create-order/", json={"booking_id": booking_a_id}, headers=headers_ca)
    print("\n7. Duplicate Payment Submission Attempt on Paid Booking:", r_dup_pay.status_code, r_dup_pay.json())

    # 8. Test Unauthorized Access Controls
    # Customer A attempting Owner A's dashboard
    r_unauth_dash = requests.get(f"{API_BASE}/owner/dashboard/", headers=headers_ca)
    print("\n8. Customer A attempting Owner Dashboard (403 expected):", r_unauth_dash.status_code, r_unauth_dash.json())

    # Owner B attempting to edit Owner A's turf
    r_unauth_edit = requests.patch(f"{API_BASE}/turfs/{turf_a_id}/", json={"name": "Hacked Turf Name"}, headers=headers_b)
    print("   Owner B attempting to edit Owner A's Turf (403 expected):", r_unauth_edit.status_code, r_unauth_edit.json())

    # 9. Verify Dashboard Metrics
    r_dash_a = requests.get(f"{API_BASE}/owner/dashboard/", headers=headers_a)
    print("\n9. Owner A Dashboard Metrics:", r_dash_a.status_code, r_dash_a.json())
    
    r_dash_b = requests.get(f"{API_BASE}/owner/dashboard/", headers=headers_b)
    print("   Owner B Dashboard Metrics:", r_dash_b.status_code, r_dash_b.json())

    # 10. Verify My Bookings for Customer A & Customer B
    r_my_a = requests.get(f"{API_BASE}/my-bookings/", headers=headers_ca)
    print("\n10. Customer A My-Bookings Count:", len(r_my_a.json()))

    r_my_b = requests.get(f"{API_BASE}/my-bookings/", headers=headers_cb)
    print("    Customer B My-Bookings Count:", len(r_my_b.json()))

    print("\n" + "=" * 60)
    print("E2E WORKFLOW VERIFICATION COMPLETE - ALL CHECKS EXECUTED!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_flow()
