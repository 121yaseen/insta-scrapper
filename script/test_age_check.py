import json
import os
from datetime import datetime, timedelta

def is_profile_data_outdated(username, filename, max_age_days=365):
    """Check if profile data is older than specified number of days or doesn't exist.
    Returns True if data should be reparsed, False otherwise."""
    if not os.path.exists(filename) or os.path.getsize(filename) == 0:
        print(f"No existing data file found for {username}")
        return True
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                for profile in data:
                    if profile.get('username') == username:
                        scrape_time_str = profile.get('scrape_time')
                        if not scrape_time_str:
                            print(f"No scrape time found for {username}")
                            return True
                        
                        try:
                            scrape_time = datetime.strptime(scrape_time_str, "%Y-%m-%d %H:%M:%S")
                            current_time = datetime.now()
                            age = current_time - scrape_time
                            
                            if age > timedelta(days=max_age_days):
                                print(f"Data for {username} is {age.days} days old (older than {max_age_days} days)")
                                return True
                            else:
                                print(f"Data for {username} is {age.days} days old (within {max_age_days} days)")
                                return False
                        except ValueError as e:
                            print(f"Error parsing date for {username}: {e}")
                            return True
                
                # If we get here, the username wasn't found in the data
                print(f"No data found for {username}")
                return True
            except json.JSONDecodeError:
                print(f"Error parsing JSON file: {filename}")
                return True
    except Exception as e:
        print(f"Error reading data file: {e}")
        return True

# Create test data with different ages
TEST_FILE = "test_age_data.json"

# Create profiles with different dates
today = datetime.now()
one_month_ago = today - timedelta(days=30)
six_months_ago = today - timedelta(days=180)
one_year_ago = today - timedelta(days=366)  # Just over a year
two_years_ago = today - timedelta(days=730)

test_data = [
    {
        "username": "recent_profile",
        "scrape_time": one_month_ago.strftime("%Y-%m-%d %H:%M:%S"),
        "full_name": "Recent Profile"
    },
    {
        "username": "semi_old_profile",
        "scrape_time": six_months_ago.strftime("%Y-%m-%d %H:%M:%S"),
        "full_name": "Semi Old Profile"
    },
    {
        "username": "just_over_year_profile",
        "scrape_time": one_year_ago.strftime("%Y-%m-%d %H:%M:%S"), 
        "full_name": "Just Over Year Profile"
    },
    {
        "username": "very_old_profile",
        "scrape_time": two_years_ago.strftime("%Y-%m-%d %H:%M:%S"),
        "full_name": "Very Old Profile"
    }
]

# Save test data
with open(TEST_FILE, 'w', encoding='utf-8') as f:
    json.dump(test_data, f, indent=2, ensure_ascii=False)
print(f"Created test file with profiles of different ages")

# Test each profile
print("\nTesting with default max age (365 days):")
for profile in test_data:
    username = profile["username"]
    result = is_profile_data_outdated(username, TEST_FILE)
    print(f"Should reparse {username}? {result}")

print("\nTesting with custom max age (180 days):")
for profile in test_data:
    username = profile["username"] 
    result = is_profile_data_outdated(username, TEST_FILE, max_age_days=180)
    print(f"Should reparse {username}? {result}")

# Test non-existent profile
print("\nTesting non-existent profile:")
result = is_profile_data_outdated("non_existent_profile", TEST_FILE)
print(f"Should reparse non_existent_profile? {result}")

# Clean up test file
os.remove(TEST_FILE)
print(f"\nRemoved test file {TEST_FILE}") 