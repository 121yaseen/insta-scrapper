import time, pickle, os, sys, traceback, random, json, re
from datetime import datetime
from collections import deque
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import (
    NoSuchElementException, TimeoutException, NoSuchWindowException,
    WebDriverException, MoveTargetOutOfBoundsException, JavascriptException
)

# --- Configuration ---
USERNAMES_FILE = "usernames.txt"
INSTAGRAM_URL = "https://www.instagram.com/"
LOGIN_URL = "https://www.instagram.com/accounts/login/"
REELS_URL = "https://www.instagram.com/reels/"
COOKIES_FILE = "instagram_cookies.pkl"
MIN_USERNAMES = 5
MAX_USERNAMES = 8

def human_like_delay(min_seconds=1.0, max_seconds=3.5):
    time.sleep(random.uniform(min_seconds, max_seconds))

def human_like_scroll(driver, min_pixels=300, max_pixels=700):
    pixels = random.randint(min_pixels, max_pixels)
    driver.execute_script(f"window.scrollBy(0, {pixels});")
    human_like_delay(0.7, 2.0)

def save_cookies(driver, location):
    print("Saving cookies...")
    with open(location, 'wb') as filehandler:
        pickle.dump(driver.get_cookies(), filehandler)
    print(f"Cookies saved to {location}")

def load_cookies(driver, location):
    if os.path.exists(location):
        print("Loading cookies...")
        with open(location, 'rb') as cookiesfile:
            cookies = pickle.load(cookiesfile)
            driver.get(INSTAGRAM_URL)
            time.sleep(2)
            for cookie in cookies:
                if 'sameSite' in cookie and cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                    print(f"Skipping cookie: {cookie['name']}")
                    continue
                try:
                    driver.add_cookie(cookie)
                except Exception as e:
                    print(f"Warning: Could not add cookie {cookie.get('name', 'N/A')}. Error: {e}")
            print("Cookies loaded.")
            return True
    return False

def is_logged_in(driver):
    driver.get(INSTAGRAM_URL)
    time.sleep(3)
    try:
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'svg[aria-label="Home"]'))
        )
        print("Already logged in.")
        return True
    except (NoSuchElementException, TimeoutException):
        print("Not logged in.")
        return False

def login_to_instagram(driver, username, password):
    print("Attempting to log in...")
    driver.get(LOGIN_URL)
    time.sleep(3)
    try:
        user_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        user_field.send_keys(username)
        human_like_delay(0.8, 1.5)
        pass_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "password"))
        )
        pass_field.send_keys(password)
        human_like_delay(0.8, 1.5)
        login_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//form[@id='loginForm']//button[@type='submit']"))
        )
        login_button.click()
        print("Clicked login button.")
        time.sleep(5)
    except Exception as e:
        print(f"Error during login: {e}")
        sys.exit(1)

def debug_dump_html(driver, filename="reel_debug.html"):
    try:
        html = driver.page_source
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Dumped page HTML to {filename}")
        try:
            # Fixed the JS error by using "||" instead of "or"
            reel_html = driver.execute_script("""
                const reelElement = document.querySelector('div[role="presentation"]') || document.querySelector('article');
                return reelElement ? reelElement.outerHTML : "No reel element found";
            """)
            with open(f"reel_container_{filename}", "w", encoding="utf-8") as f:
                f.write(reel_html)
            print(f"Dumped reel container HTML to reel_container_{filename}")
        except Exception as e:
            print(f"Failed to dump reel container: {e}")
    except Exception as e:
        print(f"Error dumping HTML: {e}")

def read_existing_usernames():
    if os.path.exists(USERNAMES_FILE):
        with open(USERNAMES_FILE, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]
    return []

def write_usernames(usernames):
    with open(USERNAMES_FILE, "w", encoding="utf-8") as f:
        for username in usernames:
            f.write(username + "\n")
    print(f"Saved {len(usernames)} usernames to {USERNAMES_FILE}")


def wait_for_reel_change(driver, current_signature, timeout=7):
    start_time = time.time()
    while time.time() - start_time < timeout:
        new_signature = get_current_reel_signature(driver)
        if new_signature != current_signature:
            return True
        time.sleep(0.5)
    return False
def get_current_reel_signature(driver):
    """Return a unique, serializable string representing the current reel by combining the URL and username."""
    try:
        signature = driver.execute_script("""
            const url = window.location.href;
            let username = null;
            const container = document.querySelector('div[role="presentation"]') || document.querySelector('article');
            if (container) {
                const profileLinks = container.querySelectorAll('a[href^="/"]');
                for (const link of profileLinks) {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    if (href && href.startsWith('/') && text && text.length > 1 && text.length < 35 && !text.includes(' ')) {
                        username = text;
                        break;
                    }
                }
            }
            return JSON.stringify({url: url, username: username});
        """)
        return signature
    except Exception as e:
        print(f"Error getting current reel signature: {e}")
        return "error-getting-signature"

def navigate_to_next_reel(driver):
    """Navigate to the next reel using only the ARROW_DOWN key."""
    current_signature = get_current_reel_signature(driver)
    print("Navigating to next reel by sending ARROW_DOWN.")
    try:
        ActionChains(driver).send_keys(Keys.ARROW_DOWN).perform()
        # Give the URL time to update
        time.sleep(2)
        if wait_for_reel_change(driver, current_signature, timeout=7):
            print("Navigation successful using ARROW_DOWN.")
            return True
        else:
            print("Navigation using ARROW_DOWN did not produce a change.")
            return False
    except Exception as e:
        print(f"Error sending ARROW_DOWN: {e}")
        return False

def extract_username_from_reel(driver):
    print("\n----- STARTING USERNAME EXTRACTION -----")
    try:
        if random.random() < 0.2:
            debug_dump_html(driver, f"reel_debug_{int(time.time())}.html")
    except:
        pass
    try:
        username = driver.execute_script("""
            const spans = document.querySelectorAll("span.x1lliihq.x1plvlek.xryxfnj");
            for (const span of spans) {
                const text = span.textContent.trim();
                if (text && text.length > 2 && !text.includes(' ')) {
                    return text;
                }
            }
            const links = document.querySelectorAll("a[href^='/']");
            for (const link of links) {
                const href = link.getAttribute("href");
                if (href && /^(?!.*(reel|explore|p)).+/.test(href)) {
                    const parts = href.split("/").filter(p => p);
                    if (parts.length > 0 && parts[0].length > 2 && parts[0].length < 31) {
                        return parts[0];
                    }
                }
            }
            return null;
        """)
        if username:
            print(f"SUCCESS: Found username '{username}'")
            return username
        else:
            print("Failed to extract username with primary strategies.")
            return None
    except Exception as e:
        print(f"Error extracting username: {e}")
        traceback.print_exc()
        return None

def navigate_to_reels(driver):
    print("Navigating to Instagram Reels...")
    driver.get(REELS_URL)
    human_like_delay(3.0, 5.0)
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog'] | //section/main/div"))
        )
        print("Reels page loaded.")
        return True
    except TimeoutException:
        print("Failed to load reels page.")
        return False

def interact_with_reel(driver):
    if random.random() < 0.7:
        time.sleep(random.uniform(2.0, 8.0))
    try:
        if random.random() < 0.3:
            reel = driver.find_element(By.XPATH, "//div[@role='presentation'] | //article")
            ActionChains(driver).move_to_element(reel).perform()
            human_like_delay(0.5, 1.5)
    except:
        pass

def collect_usernames_from_reels():
    collected_usernames = []
    existing_usernames = read_existing_usernames()
    print(f"Found {len(existing_usernames)} existing usernames.")
    target_count = random.randint(MIN_USERNAMES, MAX_USERNAMES)
    print(f"Target: collecting {target_count} new usernames this session.")
    if not navigate_to_reels(driver):
        print("Failed to navigate to reels.")
        return collected_usernames
    attempts = 0
    max_attempts = target_count * 6
    consecutive_failures = 0
    recent_signatures = deque(maxlen=5)
    refresh_attempts = 0
    max_refresh_attempts = 3
    while len(collected_usernames) < target_count and attempts < max_attempts:
        attempts += 1
        print(f"\n--- Attempt #{attempts} (Found: {len(collected_usernames)}/{target_count}) ---")
        try:
            WebDriverWait(driver, 7).until(
                EC.presence_of_element_located((By.XPATH, "//div[@role='presentation'] | //article"))
            )
            time.sleep(random.uniform(0.3, 0.8))
        except TimeoutException:
            print("Warning: Timed out waiting for reel container.")
            if consecutive_failures > 3:
                print("Attempting refresh due to timeout.")
                try:
                    driver.refresh()
                    time.sleep(5)
                    recent_signatures.clear()
                    consecutive_failures = 0
                    continue
                except Exception as refresh_err:
                    print(f"Refresh failed: {refresh_err}")
                    break
            else:
                print("Continuing despite timeout.")
        current_signature = get_current_reel_signature(driver)
        print(f"Current reel signature: {current_signature}")
        loop_detected = current_signature in recent_signatures
        recent_signatures.append(current_signature)
        if loop_detected and refresh_attempts < max_refresh_attempts:
            print(f"Loop detected. Refreshing page ({refresh_attempts+1}/{max_refresh_attempts}).")
            try:
                driver.refresh()
                time.sleep(random.uniform(4.0,6.0))
                recent_signatures.clear()
                refresh_attempts += 1
                consecutive_failures = 0
                continue
            except Exception as e_refresh:
                print(f"Refresh attempt failed: {e_refresh}")
                break
        elif loop_detected and refresh_attempts >= max_refresh_attempts:
            print("Loop detected but max refresh attempts reached. Trying final navigation...")
            if not navigate_to_next_reel(driver):
                print("Still stuck. Exiting loop.")
                break
        if random.random() < 0.05:
            time.sleep(random.uniform(2.0,5.0))
        username = None
        try:
            username = extract_username_from_reel(driver)
        except Exception as e:
            print(f"Critical error during extraction: {e}")
            raise
        if username and username not in collected_usernames and username not in existing_usernames:
            collected_usernames.append(username)
            print(f"+++ Added username: {username} ({len(collected_usernames)}/{target_count}) +++")
            refresh_attempts = 0
            consecutive_failures = 0
            interact_with_reel(driver)
        else:
            consecutive_failures += 1
            if username:
                print(f"--- Skipping username '{username}' (duplicate) ---")
            else:
                print(f"--- No username found (failure #{consecutive_failures}) ---")
            if consecutive_failures >= 7:
                print(f"Warning: {consecutive_failures} consecutive failures. Attempting proactive refresh.")
                try:
                    driver.refresh()
                    time.sleep(random.uniform(4.0,6.0))
                    recent_signatures.clear()
                    refresh_attempts += 1
                    consecutive_failures = 0
                    continue
                except Exception as e_refresh:
                    print(f"Proactive refresh failed: {e_refresh}")
        print("Navigating to next reel...")
        if not navigate_to_next_reel(driver):
            print("Navigation failed after processing. Relying on loop detection/refresh.")
        time.sleep(random.uniform(0.5,1.5))
    print(f"\nCollection complete. Found {len(collected_usernames)} new usernames in {attempts} attempts.")
    return collected_usernames

if __name__ == "__main__":
    driver = None
    try:
        print("Starting Instagram Reels Username Collector.")
        chrome_options = Options()
        # Uncomment below if you want headless mode:
        # chrome_options.add_argument("--headless")
        try:
            driver = webdriver.Chrome(options=chrome_options)
            print("Chrome WebDriver initialized!")
        except Exception as e:
            print(f"Standard initialization failed: {e}")
            webdriver_path = '/usr/local/bin/chromedriver'
            if os.path.exists(webdriver_path):
                service = Service(executable_path=webdriver_path)
                driver = webdriver.Chrome(service=service, options=chrome_options)
                print("Chrome WebDriver initialized with explicit path!")
            else:
                webdriver_path = './chromedriver'
                if os.path.exists(webdriver_path):
                    service = Service(executable_path=webdriver_path)
                    driver = webdriver.Chrome(service=service, options=chrome_options)
                    print("Chrome WebDriver initialized with local path!")
                else:
                    print("ERROR: ChromeDriver not found.")
                    sys.exit(1)
        if driver is None:
            print("ERROR: Failed to initialize driver.")
            sys.exit(1)
        driver.set_window_size(1366,768)
        logged_in_via_cookies = False
        if os.path.exists(COOKIES_FILE):
            if load_cookies(driver, COOKIES_FILE):
                driver.refresh()
                time.sleep(5)
                if is_logged_in(driver):
                    logged_in_via_cookies = True
                else:
                    print("Cookie login failed; clearing cookies.")
                    os.remove(COOKIES_FILE)
                    driver.delete_all_cookies()
        if not logged_in_via_cookies:
            username_input = input("Enter Instagram username: ")
            password_input = input("Enter Instagram password: ")
            login_to_instagram(driver, username_input, password_input)
            save_cookies(driver, COOKIES_FILE)
        collected = collect_usernames_from_reels()
        if collected:
            all_usernames = list(set(read_existing_usernames() + collected))
            write_usernames(all_usernames)
        print("Closing Chrome driver...")
        driver.quit()
        print("Script finished.")
    except Exception as e:
        print(f"Fatal error: {e}")
        traceback.print_exc()
        if driver:
            driver.quit()
        sys.exit(1)
