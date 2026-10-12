import os
import sys
import urllib.request
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.core.files.base import ContentFile
from booking.models import TurfGround, TurfImage

# Curated high-resolution sport-specific photos from Unsplash
SPORT_IMAGES = {
    "Football": [
        "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&q=80",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80"
    ],
    "Cricket": [
        "https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?w=1200&q=80",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80",
        "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=1200&q=80"
    ],
    "Badminton": [
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80",
        "https://images.unsplash.com/photo-1613918431703-aa503f1eb933?w=1200&q=80",
        "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1200&q=80"
    ],
    "Basketball": [
        "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80",
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
        "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=1200&q=80"
    ],
    "Tennis": [
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80",
        "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&q=80",
        "https://images.unsplash.com/photo-1560012057-4372e14c5085?w=1200&q=80"
    ],
    "Futsal": [
        "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&q=80",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80",
        "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80"
    ],
    "Volleyball": [
        "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80",
        "https://images.unsplash.com/photo-1592656094267-764a45160876?w=1200&q=80",
        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1200&q=80"
    ]
}

def detect_sport(turf_name):
    name_lower = turf_name.lower()
    if "football" in name_lower:
        return "Football"
    elif "cricket" in name_lower:
        return "Cricket"
    elif "badminton" in name_lower:
        return "Badminton"
    elif "basketball" in name_lower:
        return "Basketball"
    elif "tennis" in name_lower:
        return "Tennis"
    elif "futsal" in name_lower:
        return "Futsal"
    elif "volleyball" in name_lower:
        return "Volleyball"
    return "Football"

def upload_images():
    print("=" * 60)
    print("ATTACHING DISTINCT SPORT PHOTOS TO ALL TURFS")
    print("=" * 60)

    turfs = TurfGround.objects.all().order_by('id')
    print(f"Found {turfs.count()} turfs in database.")

    headers = {'User-Agent': 'Mozilla/5.0'}

    for turf in turfs:
        sport = detect_sport(turf.name)
        urls = SPORT_IMAGES.get(sport, SPORT_IMAGES["Football"])
        print(f"\nProcessing [{turf.name}] -> Sport: {sport}")

        # Clear existing images for this turf if any
        TurfImage.objects.filter(turf=turf).delete()

        for idx, url in enumerate(urls, 1):
            try:
                print(f"   Downloading image {idx}/{len(urls)} for {sport}...")
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    content = resp.read()

                filename = f"turf_{turf.id}_{sport.lower()}_{idx}.jpg"
                turf_img = TurfImage(turf=turf)
                turf_img.image.save(filename, ContentFile(content), save=True)
                print(f"   [OK] Saved image #{turf_img.id}: {filename}")
            except Exception as e:
                print(f"   [WARN] Could not download image {idx}: {e}")

    print("\n" + "=" * 60)
    print("ALL SPORT-SPECIFIC TURF IMAGES UPLOADED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    upload_images()
