import os
import sys
import django
from datetime import time

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.contrib.auth.hashers import make_password
from booking.models import User, TurfGround, TurfImage, Booking, Payment, AuthToken

def seed_database():
    print("=" * 60)
    print("CLEARING TEST DATA & SEEDING REAL SPORTS TURF DATA")
    print("=" * 60)

    # 1. Delete existing records safely in order of FK dependencies
    print("Deleting old payments...")
    Payment.objects.all().delete()

    print("Deleting old bookings...")
    Booking.objects.all().delete()

    print("Deleting old turf images...")
    TurfImage.objects.all().delete()

    print("Deleting old auth tokens...")
    AuthToken.objects.all().delete()

    print("Deleting old turfs...")
    TurfGround.objects.all().delete()

    print("Deleting old users...")
    User.objects.all().delete()

    print("[OK] Old test data cleared successfully!\n")

    # 2. Create Real Owner & Customer Accounts
    pw_hash = make_password("password123")

    # Owner 1: Apex Sports Group
    owner_apex = User.objects.create(
        name="Apex Sports Group",
        email="owner.apex@turfbox.com",
        phone="9876500001",
        password_hash=pw_hash,
        role="owner"
    )

    # Owner 2: Urban Turf Arena
    owner_urban = User.objects.create(
        name="Urban Turf Management",
        email="owner.urban@turfbox.com",
        phone="9876500002",
        password_hash=pw_hash,
        role="owner"
    )

    # Owner 3: Grand Slam Sports
    owner_grandslam = User.objects.create(
        name="Grand Slam Sports Infra",
        email="owner.grandslam@turfbox.com",
        phone="9876500003",
        password_hash=pw_hash,
        role="owner"
    )

    # Owner 4: Metro Sports Hub
    owner_metro = User.objects.create(
        name="Metro Sports Hub",
        email="owner.metro@turfbox.com",
        phone="9876500004",
        password_hash=pw_hash,
        role="owner"
    )

    # Customer 1: Rahul Sharma
    customer_1 = User.objects.create(
        name="Rahul Sharma",
        email="rahul.customer@turfbox.com",
        phone="9876511111",
        password_hash=pw_hash,
        role="customer"
    )

    # Customer 2: Priya Patel
    customer_2 = User.objects.create(
        name="Priya Patel",
        email="priya.customer@turfbox.com",
        phone="9876511112",
        password_hash=pw_hash,
        role="customer"
    )

    # Admin User
    admin_user = User.objects.create(
        name="System Admin",
        email="admin@turfbox.com",
        phone="9876599999",
        password_hash=pw_hash,
        role="admin"
    )

    print("[OK] Created Owner, Customer, and Admin accounts!")

    # 3. Create Real Sports Turfs
    turfs_data = [
        {
            "owner": owner_apex,
            "name": "Apex FIFA-Grade Football Turf",
            "location": "Gachibowli",
            "address": "Plot 45, Near Financial District, Gachibowli, Hyderabad",
            "description": "Premium 7v7 & 5v5 FIFA-approved 50mm artificial grass football arena. Features high-intensity LED floodlights, automated sprinkler cooling, player dugout, clean changing rooms, showers, and dedicated parking.",
            "price_per_hour": 1500.00,
            "opening_time": time(6, 0),
            "closing_time": time(23, 0),
            "is_active": True
        },
        {
            "owner": owner_urban,
            "name": "Urban Indoor Box Cricket Arena",
            "location": "Jubilee Hills",
            "address": "Road No. 36, Beside Metro Station, Jubilee Hills, Hyderabad",
            "description": "High-octane indoor Box Cricket arena with heavy-duty side and roof netting, turf carpet, bowling machine rental, spectator gallery, live scoreboard, and complimentary drinking water.",
            "price_per_hour": 1200.00,
            "opening_time": time(6, 0),
            "closing_time": time(23, 30),
            "is_active": True
        },
        {
            "owner": owner_grandslam,
            "name": "Grand Slam BWF Badminton Academy",
            "location": "Madhapur",
            "address": "100 Feet Road, Near Cyber Towers, Madhapur, Hyderabad",
            "description": "World-class 4-court indoor Badminton venue with BWF-certified synthetic mats over wooden cushioning. Fully air-conditioned, LED glare-free lighting, racket stringing service, and pro shop.",
            "price_per_hour": 800.00,
            "opening_time": time(5, 30),
            "closing_time": time(22, 30),
            "is_active": True
        },
        {
            "owner": owner_metro,
            "name": "Metro Hardwood Basketball Central",
            "location": "HITECH City",
            "address": "Block B, Mindspace IT Park Complex, HITECH City, Hyderabad",
            "description": "Professional indoor maple hardwood Basketball court with tempered glass backboards, electronic shot clock, team bench seating, sound system, and locker facilities.",
            "price_per_hour": 1100.00,
            "opening_time": time(6, 0),
            "closing_time": time(22, 0),
            "is_active": True
        },
        {
            "owner": owner_apex,
            "name": "Apex Synthetic Pro Tennis Court",
            "location": "Banjara Hills",
            "address": "Road No. 12, Opposite KBR Park, Banjara Hills, Hyderabad",
            "description": "All-weather ITF-approved acrylic hard court for Tennis singles and doubles. Includes nighttime floodlighting, ball machine availability, ball-kid assistance on request, and juice bar.",
            "price_per_hour": 1400.00,
            "opening_time": time(6, 0),
            "closing_time": time(21, 30),
            "is_active": True
        },
        {
            "owner": owner_urban,
            "name": "Champions Indoor Futsal Arena",
            "location": "Kukatpally",
            "address": "KPHB 9th Phase, Near Forum Sujana Mall, Kukatpally, Hyderabad",
            "description": "Fast-paced 5v5 indoor Futsal court with shock-absorption turf, rebound walls, professional futsal balls provided, tournament lighting, and cafe zone.",
            "price_per_hour": 1000.00,
            "opening_time": time(7, 0),
            "closing_time": time(23, 0),
            "is_active": True
        },
        {
            "owner": owner_metro,
            "name": "Spike Zone Beach & Indoor Volleyball Court",
            "location": "Kondapur",
            "address": "Near Botanical Garden Main Gate, Kondapur, Hyderabad",
            "description": "Dual-court facility offering fine silica Sand Beach Volleyball as well as indoor synthetic Volleyball court. Official Mikasa balls, referee stand, and shower rooms included.",
            "price_per_hour": 900.00,
            "opening_time": time(6, 0),
            "closing_time": time(22, 0),
            "is_active": True
        },
        {
            "owner": owner_apex,
            "name": "Ace Dinking Pickleball Arena",
            "location": "Gachibowli",
            "address": "Old Mumbai Highway, Near IIIT Junction, Gachibowli, Hyderabad",
            "description": "Dedicated 4-court pickleball facility with USAPA-regulation cushioned acrylic courts. Includes paddle rentals, tournament lighting, beginner coaching clinic, and lounge.",
            "price_per_hour": 850.00,
            "opening_time": time(6, 0),
            "closing_time": time(23, 0),
            "is_active": True
        },
        {
            "owner": owner_urban,
            "name": "Camp Nou Floodlit Football Turf",
            "location": "Koramangala",
            "address": "80 Feet Road, 4th Block, Koramangala, Bengaluru",
            "description": "Bengaluru's premier 7-a-side artificial football turf equipped with European infill, floodlights, spectator gallery, and post-game beverage lounge.",
            "price_per_hour": 1600.00,
            "opening_time": time(6, 0),
            "closing_time": time(23, 30),
            "is_active": True
        },
        {
            "owner": owner_grandslam,
            "name": "Eden Box Cricket Park",
            "location": "Indiranagar",
            "address": "100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru",
            "description": "Enclosed box cricket arena with high-bounce AstroTurf, automated bowling machine with swing variations, referee service, and digital broadcast screens.",
            "price_per_hour": 1300.00,
            "opening_time": time(6, 0),
            "closing_time": time(23, 59),
            "is_active": True
        },
        {
            "owner": owner_apex,
            "name": "Kickoff Sea-Breeze Football Turf",
            "location": "Bandra West",
            "address": "Carter Road Promenade, Bandra West, Mumbai",
            "description": "Iconic sea-facing 5v5 football turf with all-weather non-abrasive turf carpet, high-powered LED floodlights, sound system, and energetic football community.",
            "price_per_hour": 1800.00,
            "opening_time": time(6, 0),
            "closing_time": time(23, 30),
            "is_active": True
        }
    ]

    created_turfs = []
    for tdata in turfs_data:
        turf = TurfGround.objects.create(**tdata)
        created_turfs.append(turf)
        print(f"   + Created Turf: {turf.name} ({turf.location}) - INR {turf.price_per_hour}/hr")

    print(f"\n[OK] Successfully created {len(created_turfs)} real sports turfs across Football, Cricket, Badminton, Basketball, Tennis, Futsal, Volleyball, and Pickleball!")

    print("\n" + "=" * 60)
    print("SEEDING COMPLETE! ACCOUNTS & REAL DATA READY")
    print("=" * 60)

    print("\nLOGIN CREDENTIALS SUMMARY:")
    print("--------------------------------------------------")
    print("Owner Account 1:    owner.apex@turfbox.com      / password123")
    print("Owner Account 2:    owner.urban@turfbox.com     / password123")
    print("Owner Account 3:    owner.grandslam@turfbox.com / password123")
    print("Owner Account 4:    owner.metro@turfbox.com     / password123")
    print("Customer Account:   rahul.customer@turfbox.com  / password123")
    print("Admin Account:      admin@turfbox.com           / password123")
    print("--------------------------------------------------")

if __name__ == "__main__":
    seed_database()
