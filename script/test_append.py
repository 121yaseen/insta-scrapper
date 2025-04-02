import json
import os
from datetime import datetime

def save_profile_data_array(data_array, filename):
    """Saves the profile data array to a JSON file.
    If the file exists, it will append new data and update existing entries."""
    existing_data = []
    existing_usernames = set()
    
    try:
        # Try to open and read existing data
        if os.path.exists(filename) and os.path.getsize(filename) > 0:
            with open(filename, 'r', encoding='utf-8') as f:
                try:
                    existing_data = json.load(f)
                    # Create a set of existing usernames for faster lookup
                    existing_usernames = {profile.get('username') for profile in existing_data}
                    print(f"Loaded existing data with {len(existing_data)} profiles")
                except json.JSONDecodeError:
                    print(f"Error parsing existing JSON file: {filename}. Creating a new file.")
                    existing_data = []
        
        # Update existing entries or append new ones
        for new_profile in data_array:
            username = new_profile.get('username')
            if username in existing_usernames:
                # Replace the existing profile with the new one
                for i, profile in enumerate(existing_data):
                    if profile.get('username') == username:
                        existing_data[i] = new_profile
                        print(f"Updated existing profile for {username}")
                        break
            else:
                # Append the new profile
                existing_data.append(new_profile)
                existing_usernames.add(username)
                print(f"Added new profile for {username}")
        
        # Save the updated data
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        print(f"Profile data array saved to {filename}")
    except Exception as e:
        print(f"Error saving profile data to {filename}: {e}")

# Test data
test_data = [
    {
        "username": "test_profile",
        "scrape_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "full_name": "Test Profile Updated", 
        "is_verified": True,
        "bio": "This is an updated test profile",
        "external_url": "https://example.com",
        "profile_pic_url": "https://example.com/profile_updated.jpg",
        "is_private": False,
        "posts_count": 150,
        "followers_count": 1500,
        "following_count": 700,
        "recent_posts": [],
        "reels_count": 3,
        "reels": [
            {
                "id": "test_reel_1",
                "url": "https://www.instagram.com/test_profile/reel/test_reel_1/",
                "thumbnail": None,
                "views": 600,
                "likes": 60,
                "comments": 10,
                "posted_date": None
            },
            {
                "id": "test_reel_3",
                "url": "https://www.instagram.com/test_profile/reel/test_reel_3/",
                "thumbnail": None,
                "views": 200,
                "likes": 25,
                "comments": 5,
                "posted_date": None
            }
        ]
    },
    {
        "username": "new_profile",
        "scrape_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "full_name": "New Profile",
        "is_verified": False,
        "bio": "This is a new profile",
        "external_url": None,
        "profile_pic_url": "https://example.com/new_profile.jpg",
        "is_private": False,
        "posts_count": 50,
        "followers_count": 500,
        "following_count": 200,
        "recent_posts": [],
        "reels_count": 1,
        "reels": [
            {
                "id": "new_reel_1",
                "url": "https://www.instagram.com/new_profile/reel/new_reel_1/",
                "thumbnail": None,
                "views": 100,
                "likes": 20,
                "comments": 5,
                "posted_date": None
            }
        ]
    }
]

# Run the test
TEST_FILE = "test_profile_data.json"

print("Before saving:")
if os.path.exists(TEST_FILE):
    with open(TEST_FILE, 'r') as f:
        print(json.dumps(json.load(f), indent=2))
else:
    print(f"File {TEST_FILE} does not exist yet")

print("\nSaving data...")
save_profile_data_array(test_data, TEST_FILE)

print("\nAfter saving:")
with open(TEST_FILE, 'r') as f:
    print(json.dumps(json.load(f), indent=2)) 