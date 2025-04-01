import time
import pickle
import os
import getpass
import sys
import traceback

print("Python version:", sys.version)
print("Starting Instagram Scraper...")

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import NoSuchElementException, TimeoutException
    print("Selenium successfully imported!")
except ImportError as e:
    print(f"ERROR: Failed to import Selenium: {e}")
    print("Please make sure Selenium is installed by running:")
    print("pip install selenium")
    print("Then retry running this script.")
    sys.exit(1)

# --- Configuration ---
TARGET_USERNAME = "yaa.scene"
INSTAGRAM_URL = "https://www.instagram.com/"
LOGIN_URL = "https://www.instagram.com/accounts/login/"
COOKIES_FILE = "instagram_cookies.pkl"
FOLLOWER_COUNT_FILE = "follower_count.txt"

# Initialize driver variable to None
driver = None

def save_cookies(driver, location):
    """Saves browser cookies to a file."""
    print("Saving cookies...")
    with open(location, 'wb') as filehandler:
        pickle.dump(driver.get_cookies(), filehandler)
    print(f"Cookies saved to {location}")

def load_cookies(driver, location):
    """Loads browser cookies from a file."""
    if os.path.exists(location):
        print("Loading cookies...")
        with open(location, 'rb') as cookiesfile:
            cookies = pickle.load(cookiesfile)
            driver.get(INSTAGRAM_URL) # Need to be on the domain to add cookies
            time.sleep(2)
            for cookie in cookies:
                # Skip cookies with invalid SameSite attribute if necessary
                if 'sameSite' in cookie and cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                    print(f"Skipping cookie with invalid SameSite value: {cookie['name']}")
                    continue
                try:
                    driver.add_cookie(cookie)
                except Exception as e:
                    print(f"Warning: Could not add cookie {cookie.get('name', 'N/A')}. Error: {e}")
            print("Cookies loaded.")
            return True
    return False

def is_logged_in(driver):
    """Checks if the user appears to be logged in."""
    driver.get(INSTAGRAM_URL)
    time.sleep(3) # Allow page to load
    try:
        # Look for a common element indicating logged-in state (e.g., profile icon)
        # This selector might need updating if Instagram changes its UI
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'svg[aria-label="Home"]'))
            # Alternative selector: Look for profile link/icon specific to logged-in users
            # EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/{}/')]".format(YOUR_USERNAME))) # Replace YOUR_USERNAME if checking specific profile link
        )
        print("Already logged in.")
        return True
    except (NoSuchElementException, TimeoutException):
        print("Not logged in.")
        return False


def login_to_instagram(driver, username, password):
    """Logs into Instagram using username and password."""
    print("Attempting to log in...")
    driver.get(LOGIN_URL)
    time.sleep(3) # Wait for login page to load

    try:
        # Wait for username field and enter username
        user_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        user_field.send_keys(username)
        print("Entered username.")
        time.sleep(1)

        # Wait for password field and enter password
        pass_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "password"))
        )
        pass_field.send_keys(password)
        print("Entered password.")
        time.sleep(1)

        # Find and click login button
        # Using a more specific XPath that looks for the button within the form
        login_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//form[@id='loginForm']//button[@type='submit']"))
            # Alternative: (By.XPATH, "//button[.//div[text()='Log in']]") # Check button text
        )
        login_button.click()
        print("Clicked login button.")

        # Wait for potential login success indicators or error messages
        time.sleep(5) # Increase wait time for login process & potential 2FA

        # Check for "Save Your Login Info?" pop-up
        try:
            not_now_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Not Now'] | //div[text()='Not Now']/parent::button"))
            )
            print("Handling 'Save Login Info' pop-up...")
            not_now_button.click()
            time.sleep(2)
        except TimeoutException:
            print("'Save Login Info' pop-up not found or timed out.")
            # Check for login failure (e.g., incorrect password message)
            try:
                error_message = driver.find_element(By.ID, "slfErrorAlert")
                print(f"Login failed: {error_message.text}")
                return False
            except NoSuchElementException:
                pass # No obvious error message, proceed

        # Check for "Turn on Notifications?" pop-up
        try:
            not_now_notifications = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Not Now']")) # Often the same text
            )
            print("Handling 'Turn on Notifications' pop-up...")
            not_now_notifications.click()
            time.sleep(2)
        except TimeoutException:
            print("'Turn on Notifications' pop-up not found or timed out.")


        # Final check if login seems successful (e.g., redirected to feed)
        if "login" in driver.current_url:
             print("Login may have failed - still on login page or related page.")
             # Add more robust error checking here if needed
             return False

        print("Login successful.")
        save_cookies(driver, COOKIES_FILE)
        return True

    except TimeoutException as e:
        print(f"Login failed: Timed out waiting for element. {e}")
        # driver.save_screenshot('login_error.png') # Optional: save screenshot for debugging
        return False
    except Exception as e:
        print(f"An unexpected error occurred during login: {e}")
        # driver.save_screenshot('login_unexpected_error.png')
        return False


def get_follower_count(driver, target_username):
    """Navigates to the target profile and extracts the follower count."""
    profile_url = f"{INSTAGRAM_URL}{target_username}/"
    print(f"Navigating to profile: {profile_url}")
    driver.get(profile_url)
    time.sleep(5) # Allow profile page to load

    try:
        # --- Find Follower Count ---
        # Instagram's structure changes. Inspect the element carefully.
        # Common patterns:
        # 1. Using link text (might include ' followers')
        #    follower_element = WebDriverWait(driver, 15).until(
        #        EC.presence_of_element_located((By.XPATH, f"//a[contains(@href, '/{target_username}/followers/')]/span"))
        #    )
        # 2. Using a more specific structure (may break easily)
        #    Find the list item containing "followers" and get the preceding span's title or text
        #    Adjust the index [2] based on current layout (posts=1, followers=2, following=3 usually)
        follower_xpath = "//header//li[contains(., 'followers')]//span" # Try to get the span inside the followers li
        follower_element = WebDriverWait(driver, 15).until(
             EC.presence_of_element_located((By.XPATH, follower_xpath))
        )


        # Check if the span has a 'title' attribute (often used for exact numbers)
        follower_count_text = follower_element.get_attribute('title')
        if not follower_count_text or not follower_count_text.replace(',', '').isdigit():
             # If title attribute is not available or not numeric, try the text content
             follower_count_text = follower_element.text
             print(f"Using text content for followers: '{follower_count_text}'")


        print(f"Found follower count text: '{follower_count_text}'")

        # Clean the text (remove commas, convert K/M if necessary - simple version here)
        count = follower_count_text.replace(',', '').strip()
        
        # Handle text that includes "followers"
        if "followers" in count.lower():
            count = count.lower().split("followers")[0].strip()
        
        # Handle K/M notation if needed
        if 'k' in count.lower():
            count = str(int(float(count.lower().replace('k', '')) * 1000))
        elif 'm' in count.lower():
            count = str(int(float(count.lower().replace('m', '')) * 1000000))

        if count.isdigit():
            print(f"Follower count for {target_username}: {count}")
            return int(count)
        else:
            print(f"Could not parse follower count: '{count}'")
            # driver.save_screenshot('follower_parsing_error.png')
            return None

    except TimeoutException:
        print(f"Could not find follower count element for {target_username}. Page structure might have changed.")
        # driver.save_screenshot('follower_not_found_error.png')
        return None
    except Exception as e:
        print(f"An error occurred while getting follower count: {e}")
        # driver.save_screenshot('follower_unexpected_error.png')
        return None

def save_follower_count(count, filename):
    """Saves the follower count to a file."""
    try:
        with open(filename, 'w') as f:
            f.write(str(count))
        print(f"Follower count saved to {filename}")
    except Exception as e:
        print(f"Error saving follower count to {filename}: {e}")


# --- Main Execution ---
if __name__ == "__main__":
    try:
        print("Setting up Chrome options...")
        chrome_options = Options()
        # Uncomment these as needed for troubleshooting
        # chrome_options.add_argument("--no-sandbox")
        # chrome_options.add_argument("--disable-dev-shm-usage")
        # chrome_options.add_argument("--headless")  # Run in headless mode (no visible browser)
        
        print("Initializing Chrome driver...")
        try:
            # First attempt: standard initialization
            driver = webdriver.Chrome(options=chrome_options)
            print("Chrome WebDriver successfully initialized!")
        except Exception as e:
            print(f"Standard Chrome initialization failed: {e}")
            print("Attempting to initialize with Service...")
            
            # Second attempt: with explicit ChromeDriver path
            # You might need to adjust this path to where you placed your chromedriver
            # For Mac users, default paths could be /usr/local/bin/chromedriver
            webdriver_path = '/usr/local/bin/chromedriver'
            
            if os.path.exists(webdriver_path):
                print(f"Found WebDriver at {webdriver_path}")
                service = Service(executable_path=webdriver_path)
                driver = webdriver.Chrome(service=service, options=chrome_options)
                print("Chrome WebDriver initialized with explicit path!")
            else:
                webdriver_path = './chromedriver'  # Try local path
                if os.path.exists(webdriver_path):
                    print(f"Found WebDriver at {webdriver_path}")
                    service = Service(executable_path=webdriver_path)
                    driver = webdriver.Chrome(service=service, options=chrome_options)
                    print("Chrome WebDriver initialized with local path!")
                else:
                    print("ERROR: ChromeDriver not found at default or local paths.")
                    print("Please download ChromeDriver from https://chromedriver.chromium.org/downloads")
                    print("Place it in /usr/local/bin/ or in the same directory as this script.")
                    sys.exit(1)
        
        if driver is None:
            print("ERROR: Failed to initialize Chrome WebDriver.")
            sys.exit(1)
            
        logged_in_via_cookies = False
        if os.path.exists(COOKIES_FILE):
            if load_cookies(driver, COOKIES_FILE):
                driver.refresh()
                time.sleep(5) # Wait for page refresh
                if is_logged_in(driver):
                    logged_in_via_cookies = True
                else:
                    print("Cookie login failed. Clearing cookies and attempting manual login.")
                    os.remove(COOKIES_FILE) # Remove invalid cookies
                    driver.delete_all_cookies() # Clear browser cookies for fresh start

        if not logged_in_via_cookies:
            # Get credentials securely if not logged in via cookies
            insta_username = input("Enter your Instagram username: ")
            insta_password = getpass.getpass("Enter your Instagram password: ")
            if not login_to_instagram(driver, insta_username, insta_password):
                print("Login failed. Exiting.")
                if driver:
                    driver.quit()
                sys.exit(1)

        # Proceed to get follower count
        follower_count = get_follower_count(driver, TARGET_USERNAME)

        if follower_count is not None:
            save_follower_count(follower_count, FOLLOWER_COUNT_FILE)

        # Close the browser
        print("Closing browser.")
        if driver:
            driver.quit()
            
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        traceback.print_exc()
        if driver:
            driver.quit()
        sys.exit(1)