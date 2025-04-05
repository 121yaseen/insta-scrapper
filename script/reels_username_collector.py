import time
import pickle
import os
import getpass
import sys
import traceback
import random
import json
from datetime import datetime
import re
from collections import deque # Add deque for tracking recent signatures

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import (
        NoSuchElementException, TimeoutException, NoSuchWindowException, 
        WebDriverException, MoveTargetOutOfBoundsException, JavascriptException
    )
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.common.action_chains import ActionChains
    print("Selenium successfully imported!")
except ImportError as e:
    print(f"ERROR: Failed to import Selenium: {e}")
    print("Please make sure Selenium is installed by running:")
    print("pip install selenium")
    print("Then retry running this script.")
    sys.exit(1)

# --- Configuration ---
USERNAMES_FILE = "usernames.txt"
INSTAGRAM_URL = "https://www.instagram.com/"
LOGIN_URL = "https://www.instagram.com/accounts/login/"
REELS_URL = "https://www.instagram.com/reels/"
COOKIES_FILE = "instagram_cookies.pkl"
MIN_USERNAMES = 5
MAX_USERNAMES = 8

# Initialize driver variable to None
driver = None

def human_like_delay(min_seconds=1.0, max_seconds=3.5):
    """Add a random delay to simulate human behavior."""
    delay = random.uniform(min_seconds, max_seconds)
    time.sleep(delay)

def human_like_scroll(driver, min_pixels=300, max_pixels=700):
    """Scroll down in a human-like way with variable scroll amounts."""
    pixels = random.randint(min_pixels, max_pixels)
    driver.execute_script(f"window.scrollBy(0, {pixels});")
    human_like_delay(0.7, 2.0)  # Shorter delay for scrolling

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
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'svg[aria-label="Home"]'))
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
        human_like_delay(0.8, 1.5)

        # Wait for password field and enter password
        pass_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "password"))
        )
        pass_field.send_keys(password)
        print("Entered password.")
        human_like_delay(0.8, 1.5)

        # Find and click login button
        login_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//form[@id='loginForm']//button[@type='submit']"))
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
            human_like_delay()
        except TimeoutException:
            print("'Save Login Info' pop-up not found or timed out.")
            # Check for login failure
            try:
                error_message = driver.find_element(By.ID, "slfErrorAlert")
                print(f"Login failed: {error_message.text}")
                return False
            except NoSuchElementException:
                pass # No obvious error message, proceed

        # Check for "Turn on Notifications?" pop-up
        try:
            not_now_notifications = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Not Now']"))
            )
            print("Handling 'Turn on Notifications' pop-up...")
            not_now_notifications.click()
            human_like_delay()
        except TimeoutException:
            print("'Turn on Notifications' pop-up not found or timed out.")

        # Final check if login seems successful
        if "login" in driver.current_url:
             print("Login may have failed - still on login page or related page.")
             return False

        print("Login successful.")
        save_cookies(driver, COOKIES_FILE)
        return True

    except TimeoutException as e:
        print(f"Login failed: Timed out waiting for element. {e}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred during login: {e}")
        return False

def read_existing_usernames():
    """Read existing usernames from file to avoid duplicates."""
    existing_usernames = set()
    if os.path.exists(USERNAMES_FILE):
        with open(USERNAMES_FILE, 'r') as f:
            for line in f:
                username = line.strip()
                if username:
                    existing_usernames.add(username)
    return existing_usernames

def save_usernames(usernames):
    """Save new usernames to the file, avoiding duplicates."""
    existing = read_existing_usernames()
    new_usernames = [u for u in usernames if u not in existing]
    
    if not new_usernames:
        print("No new usernames to save.")
        return 0
    
    with open(USERNAMES_FILE, 'a') as f:
        for username in new_usernames:
            f.write(f"{username}\n")
    
    print(f"Saved {len(new_usernames)} new usernames to {USERNAMES_FILE}")
    return len(new_usernames)

def navigate_to_reels(driver):
    """Navigate to the reels section of Instagram."""
    print("Navigating to Instagram Reels...")
    driver.get(REELS_URL)
    human_like_delay(3.0, 5.0)
    
    # Wait for reels content to load
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog'] | //section/main/div"))
        )
        print("Reels page loaded.")
        return True
    except TimeoutException:
        print("Failed to load reels page properly.")
        return False

def extract_username_from_bottom_layout(driver):
    """Extract username from the bottom layout seen in the screenshot where username is near 'Follow' button."""
    try:
        print("Trying to extract username from bottom layout...")
        
        # Check for username near "Follow" button (as shown in screenshot)
        try:
            script_result = driver.execute_script("""
                // Find any "Follow" elements
                const followElements = Array.from(document.querySelectorAll('button, div, span'))
                    .filter(el => el.textContent === 'Follow');
                    
                if (followElements.length === 0) return null;
                
                const followElement = followElements[0];
                console.log("Found Follow button:", followElement);
                
                // Navigate upwards to find common container
                let container = followElement.parentElement;
                while (container && container.children.length < 2) {
                    container = container.parentElement;
                    if (!container) return null;
                }
                
                // Look for username element - typically the first child that's not the Follow button
                const children = Array.from(container.children);
                
                // Filter out the Follow button and look for username
                const potentialUsernames = children.filter(child => {
                    // Skip the Follow button
                    if (child.contains(followElement)) return false;
                    
                    // Check if this element or its children have text content
                    const hasText = child.textContent && child.textContent.trim().length > 0;
                    return hasText;
                });
                
                if (potentialUsernames.length === 0) return null;
                
                // Best candidate is usually the first element that's not the Follow button
                const usernameElement = potentialUsernames[0];
                return usernameElement.textContent.trim();
            """)
            
            if script_result:
                print(f"Found username from bottom layout: {script_result}")
                if script_result.startswith('@'):
                    script_result = script_result[1:]
                return script_result
        except Exception as e:
            print(f"Error extracting from bottom layout with JavaScript: {e}")
        
        # Try using XPath to find username near Follow button
        follow_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Follow')]")
        if follow_button:
            print("Found Follow button with XPath")
            
            # Try several strategies to find username relative to the Follow button
            username_candidates = []
            
            # Strategy 1: Look for sibling elements
            siblings = driver.find_elements(By.XPATH, "//button[contains(text(), 'Follow')]/parent::*/child::*")
            for sibling in siblings:
                if sibling.text and "Follow" not in sibling.text and len(sibling.text.strip()) > 0:
                    username_candidates.append(sibling.text.strip())
            
            # Strategy 2: Look for elements just before the Follow button
            try:
                before_elements = driver.find_elements(By.XPATH, "//button[contains(text(), 'Follow')]/preceding-sibling::*")
                for elem in before_elements:
                    if elem.text and len(elem.text.strip()) > 0:
                        username_candidates.append(elem.text.strip())
            except:
                pass
                
            # Strategy 3: Look for elements in the same row
            try:
                parent = driver.find_element(By.XPATH, "//button[contains(text(), 'Follow')]/parent::*")
                if parent:
                    row_elements = driver.find_elements(By.XPATH, f"//button[contains(text(), 'Follow')]/parent::*/parent::*/child::*/child::*[not(contains(text(), 'Follow'))]")
                    for elem in row_elements:
                        if elem.text and len(elem.text.strip()) > 0:
                            username_candidates.append(elem.text.strip())
            except:
                pass
            
            # Filter and prioritize candidates
            if username_candidates:
                # Sort by likelihood of being a username (no spaces, shorter length)
                candidates = sorted([c for c in username_candidates if c], key=lambda x: (len(x.split()), len(x)))
                if candidates:
                    username = candidates[0]
                    if username.startswith('@'):
                        username = username[1:]
                    print(f"Found username from XPath near Follow button: {username}")
                    return username
    
    except Exception as e:
        print(f"Error in bottom layout extraction: {e}")
    
    return None

def extract_username_from_reel_footer(driver):
    """Extract username specifically from the footer area as shown in the provided HTML example."""
    try:
        print("Trying to extract username from reel footer layout...")
        
        # NEW: Try exact structure from the provided HTML example
        try:
            script_result = driver.execute_script("""
                // Target the exact HTML structure from the example
                const usernameElements = document.querySelectorAll('a[aria-label*="reels"] span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x1ji0vk5');
                if (usernameElements.length > 0) {
                    console.log('Found username from exact structure match:', usernameElements[0].textContent);
                    return usernameElements[0].textContent.trim();
                }
                
                // Also look for username in audio attribution
                const audioElements = document.querySelectorAll('a[href*="/reels/audio/"] span.x1lliihq');
                for (const elem of audioElements) {
                    const text = elem.textContent;
                    if (text && text.includes('·')) {
                        const username = text.split('·')[0].trim();
                        if (username && username.length > 2 && !username.includes(' ')) {
                            console.log('Found username from audio attribution:', username);
                            return username;
                        }
                    }
                }
                
                // Look for profile links with reels
                const reelsLinks = document.querySelectorAll('a[aria-label*="reels"]');
                for (const link of reelsLinks) {
                    const href = link.getAttribute('href');
                    if (href && href.includes('/reels/')) {
                        const parts = href.split('/').filter(p => p);
                        if (parts.length > 1) {
                            console.log('Found username from reels link:', parts[0]);
                            return parts[0];
                        }
                    }
                }
                
                return null;
            """)
            
            if script_result:
                print(f"Found username with exact HTML structure match: {script_result}")
                return script_result
        except Exception as e:
            print(f"Error in exact structure extraction: {e}")
        
        # Try specific XPath selectors based on the provided HTML
        new_footer_selectors = [
            # Target the exact structure in the latest example
            "//a[contains(@aria-label, 'reels')]//span[contains(@class, 'x1lliihq') and contains(@class, 'x1plvlek') and contains(@class, 'xryxfnj')]",
            "//a[contains(@href, '/reels/audio/')]//span[contains(@class, 'x1lliihq')][contains(text(), '·')]",
            "//div[.//svg[@aria-label='Audio image']]//span[contains(@class, 'x1lliihq')]",
            
            # Try to get username directly from href attribute
            "//a[contains(@aria-label, 'reels')]"
        ]
        
        for selector in new_footer_selectors:
            try:
                elements = driver.find_elements(By.XPATH, selector)
                print(f"Trying new footer selector: {selector}, found {len(elements)} elements")
                
                for element in elements:
                    # Check if we have an anchor element with href
                    if selector.endswith('reels"]'):
                        href = element.get_attribute("href")
                        if href and '/reels/' in href:
                            parts = href.split('/')
                            username = None
                            for i, part in enumerate(parts):
                                if part and part != 'reels' and len(part) > 2 and '.' not in part and 'instagram' not in part:
                                    username = part
                                    break
                            
                            if username:
                                print(f"Found username from reels href: {username}")
                                return username
                            continue
                    
                    # For text elements
                    text = element.text.strip()
                    if not text:
                        continue
                        
                    # Handle audio attribution format: "username · Original audio"
                    if '·' in text:
                        username = text.split('·')[0].strip()
                        if username and len(username) > 2 and ' ' not in username:
                            print(f"Found username from audio attribution: {username}")
                            return username
                    elif text and len(text) > 2 and text != "•" and " " not in text and "\n" not in text:
                        print(f"Found username from footer text: {text}")
                        return text
            except Exception as e:
                print(f"Error with new footer selector '{selector}': {e}")
                continue
                
        # Original selectors and methods follow
        # Try targeted JavaScript approach for the specific HTML structure shown
        try:
            script_result = driver.execute_script("""
                // First look for username in span with specific text pattern
                const usernameSpans = Array.from(document.querySelectorAll('span.x1lliihq.x1plvlek.xryxfnj:not([role="link"])'))
                    .filter(span => {
                        // Filter for spans that likely contain usernames (not bullets or other symbols)
                        const text = span.textContent.trim();
                        return text && text.length > 2 && text !== '•' && !text.includes(' ');
                    });
                
                if (usernameSpans.length > 0) {
                    // Most likely the first match is what we want
                    console.log('Found username span:', usernameSpans[0]);
                    return usernameSpans[0].textContent.trim();
                }
                
                // Second approach: look for profile links that go to /username/reels/
                const reelLinks = Array.from(document.querySelectorAll('a[href*="/reels/"]'));
                for (const link of reelLinks) {
                    const href = link.getAttribute('href');
                    const match = href.match(/\\/(.*?)\\/reels\\//);
                    if (match && match[1] && match[1].length > 2) {
                        console.log('Found username from reels link:', match[1]);
                        return match[1];
                    }
                }
                
                // Third approach: Look for profile picture container and get nearby text
                const profilePics = document.querySelectorAll('img[alt*="profile picture"]');
                for (const pic of profilePics) {
                    const alt = pic.getAttribute('alt');
                    if (alt) {
                        const match = alt.match(/(.*?)('s profile picture)/);
                        if (match && match[1]) {
                            console.log('Found username from profile pic alt:', match[1]);
                            return match[1];
                        }
                    }
                    
                    // Look for nearby text elements
                    const container = pic.closest('div[class*="x"]');
                    if (container) {
                        const parent = container.parentElement;
                        if (parent) {
                            const textElements = parent.querySelectorAll('span:not([role="link"])');
                            for (const elem of textElements) {
                                const text = elem.textContent.trim();
                                if (text && text.length > 2 && text !== '•' && !text.includes(' ')) {
                                    console.log('Found username near profile pic:', text);
                                    return text;
                                }
                            }
                        }
                    }
                }
                
                return null;
            """)
            
            if script_result:
                print(f"Found username from footer layout JS: {script_result}")
                return script_result
        except Exception as e:
            print(f"Error in JS footer extraction: {e}")
        
        # Try specific XPath selectors based on the provided HTML
        footer_selectors = [
            # Target the exact structure in the example HTML
            "//span[contains(@class, 'x1lliihq') and contains(@class, 'x1plvlek') and contains(@class, 'xryxfnj') and not(@role='link')]/text()",
            "//a[contains(@href, '/reels/')]//span[contains(@class, 'x1lliihq')][not(contains(text(), '•')) and string-length(normalize-space()) > 2]",
            "//a[contains(@aria-label, 'reels')]//following-sibling::span[not(contains(text(), '•'))]",
            "//img[contains(@alt, 'profile picture')]/ancestor::a/following-sibling::span",
            "//div[.//span[text()='Follow']]/preceding-sibling::div//span[contains(@class, 'x1lliihq')]"
        ]
        
        for selector in footer_selectors:
            try:
                elements = driver.find_elements(By.XPATH, selector)
                print(f"Trying footer selector: {selector}, found {len(elements)} elements")
                
                for element in elements:
                    text = element.text.strip()
                    if text and len(text) > 2 and text != "•" and " " not in text and "\n" not in text:
                        print(f"Found username from footer XPath: {text}")
                        return text
            except Exception as e:
                print(f"Error with footer selector '{selector}': {e}")
                continue
        
        # Try to extract from href attribute
        try:
            reels_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/reels/')]")
            for link in reels_links:
                href = link.get_attribute("href")
                if href:
                    # Pattern: /username/reels/
                    match = re.search(r'/([^/]+)/reels/', href)
                    if match:
                        username = match.group(1)
                        if username and len(username) > 2 and username != "explore":
                            print(f"Found username from reels link: {username}")
                            return username
        except Exception as e:
            print(f"Error extracting from reels href: {e}")
                
        return None
    except Exception as e:
        print(f"Error in footer extraction method: {e}")
        return None

def debug_dump_html(driver, filename="reel_debug.html"):
    """Dump the current page HTML for debugging."""
    try:
        html = driver.page_source
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Dumped page HTML to {filename} for debugging")
        
        # Also try to get just the reel container HTML
        try:
            reel_html = driver.execute_script("""
                const reelElement = document.querySelector('div[role="presentation"]') || 
                                    document.querySelector('article');
                return reelElement ? reelElement.outerHTML : "No reel element found";
            """)
            
            with open(f"reel_container_{filename}", "w", encoding="utf-8") as f:
                f.write(reel_html)
            print(f"Dumped reel container HTML to reel_container_{filename}")
        except Exception as e:
            print(f"Failed to dump reel container: {e}")
            
    except Exception as e:
        print(f"Error dumping HTML: {e}")

def extract_username_directly_from_html(driver):
    """Extract username using direct HTML analysis focused on specific Instagram structures."""
    try:
        print("Attempting direct HTML structure analysis for username...")
        
        # This approach directly targets the profile links in reels which have consistent patterns
        result = driver.execute_script("""
            // ---- STRATEGY 1: Find username from profile links ----
            // Check for reel author links - most reliable pattern
            const authorLinks = document.querySelectorAll('a[href*="/reels/"]');
            for (const link of authorLinks) {
                const href = link.getAttribute('href');
                // Extract username from URLs like /username/reels/
                if (href.includes('/reels/')) {
                    const match = href.match(/^\\/([^\\/]+)\\/reels\\//);
                    if (match && match[1]) {
                        console.log('Found username from author reels link:', match[1]);
                        return { source: 'author_link', username: match[1] };
                    }
                }
            }
            
            // ---- STRATEGY 2: Find username from profile pictures ----
            // Profile pictures often have reliable alt attributes
            const profilePics = document.querySelectorAll('img[alt*="profile picture"]');
            for (const pic of profilePics) {
                const alt = pic.getAttribute('alt');
                if (alt) {
                    // Pattern: "username's profile picture"
                    const match = alt.match(/(.*?)(?:'s profile picture|'s profile)/i);
                    if (match && match[1]) {
                        const username = match[1].trim();
                        console.log('Found username from profile pic:', username);
                        return { source: 'profile_pic', username: username };
                    }
                }
                
                // Also check if this image is inside a profile link
                const parentLink = pic.closest('a[href]');
                if (parentLink) {
                    const href = parentLink.getAttribute('href');
                    if (href && href.startsWith('/') && !href.includes('/p/') && href !== '/') {
                        // Simple username pattern: /username/
                        const parts = href.split('/').filter(p => p);
                        if (parts.length === 1) {
                            console.log('Found username from profile pic link:', parts[0]);
                            return { source: 'profile_pic_link', username: parts[0] };
                        }
                    }
                }
            }
            
            // ---- STRATEGY 3: Audio attribution ----
            // Audio often contains username with format "username · Original audio"
            const audioLinks = document.querySelectorAll('a[href*="/reels/audio/"]');
            for (const link of audioLinks) {
                // Check the link text first
                let text = link.textContent.trim();
                if (text && text.includes('·')) {
                    const username = text.split('·')[0].trim();
                    if (username && username.length > 2) {
                        console.log('Found username from audio text:', username);
                        return { source: 'audio_text', username: username };
                    }
                }
                
                // Also check child spans which often contain this text
                const spans = link.querySelectorAll('span');
                for (const span of spans) {
                    text = span.textContent.trim();
                    if (text && text.includes('·')) {
                        const username = text.split('·')[0].trim();
                        if (username && username.length > 2) {
                            console.log('Found username from audio span:', username);
                            return { source: 'audio_span', username: username };
                        }
                    }
                }
            }
            
            // ---- STRATEGY 4: Find username spans with specific class patterns ----
            // Target the spans with class patterns seen in examples
            const usernameSpans = document.querySelectorAll('span.x1lliihq.x1plvlek.xryxfnj, span[class*="x1lliihq"]');
            for (const span of usernameSpans) {
                const text = span.textContent.trim();
                // Skip bullet points and other non-username content
                if (text && text !== '•' && text.length > 2 && !text.includes(' ')) {
                    console.log('Found username from class pattern span:', text);
                    return { source: 'class_pattern', username: text };
                }
            }
            
            // ---- STRATEGY 5: Follow button context ----
            // Look for username near Follow button
            const followButtons = Array.from(document.querySelectorAll('button, div, span')).filter(
                el => el.textContent === 'Follow'
            );
            
            if (followButtons.length > 0) {
                const followBtn = followButtons[0];
                
                // Go up to find container
                let container = followBtn.parentElement;
                while (container && container.children.length < 3) {
                    container = container.parentElement;
                    if (!container) break;
                }
                
                if (container) {
                    // Check siblings for username
                    const siblings = Array.from(container.children);
                    
                    // Get text nodes that could be usernames (before the Follow button)
                    const potentialUsernames = [];
                    for (const sibling of siblings) {
                        if (sibling.contains(followBtn)) continue; // Skip the Follow button itself
                        
                        // Check if this element has text that could be a username
                        const childSpans = sibling.querySelectorAll('span');
                        for (const span of childSpans) {
                            const text = span.textContent.trim();
                            if (text && text !== '•' && text.length > 2 && !text.includes(' ')) {
                                potentialUsernames.push(text);
                            }
                        }
                        
                        // Also check the element's own text
                        const text = sibling.textContent.trim();
                        if (text && text !== '•' && text.length > 2 && !text.includes(' ')) {
                            potentialUsernames.push(text);
                        }
                    }
                    
                    if (potentialUsernames.length > 0) {
                        console.log('Found username near Follow button:', potentialUsernames[0]);
                        return { source: 'follow_context', username: potentialUsernames[0] };
                    }
                    
                    // Also check previous sibling container (for the layout in examples)
                    const prevContainer = container.previousElementSibling;
                    if (prevContainer) {
                        const spans = prevContainer.querySelectorAll('span');
                        for (const span of spans) {
                            const text = span.textContent.trim();
                            if (text && text !== '•' && text.length > 2 && !text.includes(' ')) {
                                console.log('Found username in container before Follow:', text);
                                return { source: 'prev_container', username: text };
                            }
                        }
                    }
                }
            }
            
            // If we get here, we couldn't find a username with our targeted approaches
            return null;
        """)
        
        if result:
            username = result['username']
            source = result['source']
            print(f"SUCCESS: Found username '{username}' via {source}")
            return username
            
        return None
    except Exception as e:
        print(f"Error in direct HTML analysis: {e}")
        return None

def extract_username_from_reel(driver):
    """Extract the username of the poster from a currently visible reel."""
    try:
        print("\n----- STARTING USERNAME EXTRACTION -----")
        print("Attempting to extract username from current reel...")
        
        # First, let's debug by dumping the current HTML structure
        if random.random() < 0.2:  # Only dump HTML occasionally to avoid too many files
            debug_dump_html(driver, f"reel_debug_{int(time.time())}.html")
        
        # Check what elements are present to get a better sense of the structure
        try:
            element_counts = driver.execute_script("""
                const counts = {
                    'a[aria-label*="reels"]': document.querySelectorAll('a[aria-label*="reels"]').length,
                    'a[href*="/reels/"]': document.querySelectorAll('a[href*="/reels/"]').length,
                    'span.x1lliihq': document.querySelectorAll('span.x1lliihq').length,
                    'span.x1lliihq.x1plvlek.xryxfnj': document.querySelectorAll('span.x1lliihq.x1plvlek.xryxfnj').length,
                    'span[contains(@class, "x1lliihq")]': document.querySelectorAll('span[class*="x1lliihq"]').length,
                    'a[href*="/audio/"]': document.querySelectorAll('a[href*="/audio/"]').length,
                    'buttons with text "Follow"': Array.from(document.querySelectorAll('button, div, span')).filter(el => el.textContent === 'Follow').length,
                    'img[alt*="profile picture"]': document.querySelectorAll('img[alt*="profile picture"]').length,
                    'div[role="presentation"]': document.querySelectorAll('div[role="presentation"]').length
                };
                return counts;
            """)
            print("Element counts in current view:")
            for selector, count in element_counts.items():
                print(f"  {selector}: {count}")
        except Exception as e:
            print(f"Error counting elements: {e}")
        
        # Try our most direct method first
        username = extract_username_directly_from_html(driver)
        if username:
            return username
        
        # Then try our specialized footer approach
        username = extract_username_from_reel_footer(driver)
        if username:
            print(f"SUCCESS: Username '{username}' found from footer layout")
            return username
        
        # Then try the bottom layout with Follow button
        username = extract_username_from_bottom_layout(driver)
        if username:
            print(f"SUCCESS: Username '{username}' found from bottom layout")
            return username
        
        # Add a new direct approach that's more brute force to find any username
        print("Trying brute force approach for usernames...")
        try:
            brute_force_result = driver.execute_script("""
                // A more aggressive approach to find anything that looks like a username
                
                // First get all links that might be profile links
                const allLinks = Array.from(document.querySelectorAll('a[href]'));
                const profileLinks = allLinks.filter(link => {
                    const href = link.getAttribute('href');
                    // Profile links typically have pattern: /username or /username/
                    // But exclude known non-profile paths
                    return href && 
                           href.startsWith('/') && 
                           href.split('/').length <= 3 &&
                           !href.includes('/p/') && 
                           !href.includes('/explore/') && 
                           !href.includes('/stories/') &&
                           !href.includes('/direct/') &&
                           href !== '/';
                });
                
                console.log("Found " + profileLinks.length + " potential profile links");
                
                // Extract usernames from these links
                const usernames = profileLinks.map(link => {
                    const href = link.getAttribute('href');
                    // Extract username from /username or /username/
                    const parts = href.split('/').filter(p => p);
                    if (parts.length > 0) {
                        return {
                            username: parts[0],
                            element: link,
                            href: href,
                            text: link.textContent.trim()
                        };
                    }
                    return null;
                }).filter(item => item !== null);
                
                console.log("Extracted " + usernames.length + " potential usernames from links");
                
                // Also try to find elements that could contain usernames
                const textElements = Array.from(document.querySelectorAll('span, div'))
                    .filter(el => {
                        const text = el.textContent.trim();
                        // Username-like text: 3-30 chars, no spaces
                        return text && 
                               text.length >= 3 && 
                               text.length <= 30 && 
                               !text.includes(' ') &&
                               text !== '•' &&
                               !/^\\d+$/.test(text); // not just numbers
                    })
                    .map(el => ({ 
                        username: el.textContent.trim(),
                        element: el,
                        text: el.textContent.trim()
                    }));
                
                console.log("Found " + textElements.length + " text elements with potential usernames");
                
                // Combine results from profile links and text elements
                const allResults = [...usernames, ...textElements];
                
                // If we have results, return a summary of the top 5
                if (allResults.length > 0) {
                    const topResults = allResults.slice(0, 5);
                    return {
                        count: allResults.length,
                        topResults: topResults
                    };
                }
                
                return null;
            """)
            
            if brute_force_result:
                print(f"Brute force found {brute_force_result['count']} potential usernames")
                
                for i, result in enumerate(brute_force_result['topResults']):
                    username = result['username']
                    print(f"  Candidate {i+1}: '{username}'")
                    
                    # Use the first candidate if it looks like a valid username
                    if i == 0 and username and len(username) > 2 and ' ' not in username:
                        print(f"SUCCESS: Using brute force username: '{username}'")
                        return username
        except Exception as e:
            print(f"Error in brute force approach: {e}")
        
        # New selectors targeting the author section at bottom of reels
        username_selectors = [
            # Target username near "Follow" button as seen in screenshot
            "//span[text()='Follow']/preceding-sibling::*[1]",
            "//span[text()='Follow']/parent::*/preceding-sibling::*/a",
            "//span[text()='Follow']/../../preceding-sibling::*/a",
            
            # Target the username display at bottom of reel
            "//div[contains(@style, 'bottom') or @class='bottom']//a[not(contains(@href, '/p/')) and not(contains(@href, '/reels/'))]",
            "//div[@role='presentation']//section//a[not(contains(@href, '/p/')) and not(contains(@href, '/reels/'))]",
            
            # Try direct selection of username components
            "//a[contains(@href, '/') and contains(@role, 'link')]",
            "//header//a[contains(@href, '/')]",
            
            # Last resort - try to find any anchor element with short text (likely a username)
            "//a[string-length(text()) > 0 and string-length(text()) < 30 and not(contains(@href, '/p/')) and not(contains(@href, '/reels/'))]"
        ]
        
        # Print HTML snippet for debugging
        try:
            html_snippet = driver.execute_script("""
                return document.querySelector('div[role="presentation"]').innerHTML.substring(0, 5000);
            """)
            print(f"HTML snippet from current view (first 100 chars): {html_snippet[:100]}...")
        except:
            print("Could not extract HTML snippet for debugging")
        
        # Try each selector strategy
        for selector in username_selectors:
            try:
                print(f"Trying selector: {selector}")
                elements = driver.find_elements(By.XPATH, selector)
                print(f"  Found {len(elements)} elements")
                
                for element in elements:
                    # Try to get username from href
                    href = element.get_attribute("href")
                    if href and INSTAGRAM_URL in href:
                        username = href.replace(INSTAGRAM_URL, "").strip("/").split("/")[0]
                        if username and username != 'explore' and username != 'reels' and username != 'p' and len(username) > 2:
                            print(f"Found username from href: {username}")
                            return username
                    
                    # Try to get username from text content
                    text = element.text.strip()
                    if text and 3 <= len(text) <= 30 and ' ' not in text and '\n' not in text:
                        print(f"Found potential username from text: {text}")
                        return text
                    
                    # Look for aria-label that might contain username
                    aria_label = element.get_attribute("aria-label")
                    if aria_label and "profile" in aria_label.lower():
                        potential_username = aria_label.split("'s")[0].strip()
                        if potential_username and 3 <= len(potential_username) <= 30:
                            print(f"Found username from aria-label: {potential_username}")
                            return potential_username
            except Exception as inner_e:
                print(f"  Error with selector '{selector}': {inner_e}")
                continue
        
        # Try JavaScript to directly extract username from specific locations
        try:
            print("Trying JavaScript extraction method...")
            username = driver.execute_script("""
                // Try to get username from various locations
                let possibleUsernameElements = [];
                
                // Find elements near "Follow" button
                const followButtons = Array.from(document.querySelectorAll('button, div, span')).filter(
                    el => el.textContent === 'Follow'
                );
                
                if (followButtons.length > 0) {
                    const followBtn = followButtons[0];
                    // Look for username near the Follow button
                    const parent = followBtn.parentElement;
                    const container = parent ? parent.parentElement : null;
                    
                    if (container) {
                        // Check siblings or nearby elements
                        const potentialUsernames = Array.from(container.querySelectorAll('a, span'));
                        potentialUsernames.forEach(el => {
                            if (el !== followBtn && el.textContent && el.textContent.trim().length > 2 && 
                                el.textContent.trim() !== '•' && !el.textContent.trim().includes(' ')) {
                                possibleUsernameElements.push({
                                    element: el,
                                    text: el.textContent.trim(),
                                    href: el.href || ''
                                });
                            }
                        });
                    }
                    
                    // Also check previous siblings
                    let prevContainer = container ? container.previousElementSibling : null;
                    if (prevContainer) {
                        const usernameElements = prevContainer.querySelectorAll('span, a');
                        Array.from(usernameElements).forEach(el => {
                            if (el.textContent && el.textContent.trim().length > 2 && 
                                el.textContent.trim() !== '•' && !el.textContent.trim().includes(' ')) {
                                possibleUsernameElements.push({
                                    element: el, 
                                    text: el.textContent.trim(),
                                    href: el.href || ''
                                });
                            }
                        });
                    }
                }
                
                // Sort by likely username characteristics (no spaces, shorter length)
                possibleUsernameElements.sort((a, b) => {
                    // Usernames don't have spaces - prioritize those
                    const aHasSpace = a.text.includes(' ');
                    const bHasSpace = b.text.includes(' ');
                    if (aHasSpace !== bHasSpace) return aHasSpace ? 1 : -1;
                    
                    // Usernames are typically shorter
                    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
                    
                    // Prefer elements with href (likely links to profile)
                    return b.href ? 1 : -1;
                });
                
                return possibleUsernameElements.length > 0 ? 
                    possibleUsernameElements[0].text : null;
            """)
            
            if username:
                print(f"Found username via JavaScript: {username}")
                # Clean up the username - remove @ if present
                if username.startswith('@'):
                    username = username[1:]
                # Check it meets basic username criteria
                if 2 < len(username) < 31 and ' ' not in username and '\n' not in username:
                    return username
        except Exception as js_error:
            print(f"JavaScript extraction error: {js_error}")
        
        print("Failed to find username with all strategies")
        return None
    except Exception as e:
        print(f"Error extracting username: {e}")
        traceback.print_exc()
        return None

def interact_with_reel(driver):
    """Interact with a reel in a human-like way (without actually liking or commenting)."""
    # Sometimes watch the reel for a bit longer
    if random.random() < 0.7:  # 70% chance to watch longer
        watch_time = random.uniform(2.0, 8.0)
        time.sleep(watch_time)
        
    # Sometimes move mouse over the reel to simulate interest
    try:
        if random.random() < 0.3:  # 30% chance to hover
            reel = driver.find_element(By.XPATH, "//div[@role='presentation'] | //article")
            ActionChains(driver).move_to_element(reel).perform()
            human_like_delay(0.5, 1.5)
    except:
        pass

def wait_for_reel_change(driver, current_html_signature, timeout=7):
    """Wait for the reel content to change, indicating we've successfully navigated to a new reel."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            # Get a "signature" of the current reel to detect changes
            # Use the author's profile link href as the primary identifier
            new_html_signature = driver.execute_script("""
                const container = document.querySelector('div[role="presentation"]') || document.querySelector('article');
                if (!container) return 'no-container';

                // Try to find the author's profile link within the container
                const profileLinks = container.querySelectorAll('a[href^="/"][href*="/"]:not([href*="/reel"]):not([href*="/p/"]):not([href*="/explore"])');
                let authorHref = 'no-author-link';

                // Iterate through potential links to find one that looks like a profile link
                for (const link of profileLinks) {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    // Basic checks: has text, not excessively long, no spaces, likely a username
                    if (href && href.startsWith('/') && href.split('/').length <= 3 &&
                        text && text.length > 1 && text.length < 35 && !text.includes(' ')) {
                         // Prioritize links where text matches the last part of the href (username)
                        const parts = href.split('/').filter(p => p);
                        if (parts.length > 0 && parts[parts.length - 1] === text) {
                            authorHref = href;
                            break; // Found a likely candidate
                        }
                        // Fallback: take the first plausible link if no perfect match
                        if (authorHref === 'no-author-link') {
                             authorHref = href;
                        }
                    }
                }

                // Secondary check: if author link didn't provide a clear signature, check video src
                if (authorHref === 'no-author-link' || authorHref.startsWith('fallback|')) {
                     const video = container.querySelector('video');
                     const videoSrc = video ? video.src.substring(0, 100) : 'no-video'; // Check first 100 chars of video src
                     if (videoSrc !== 'no-video') {
                         authorHref += '|' + videoSrc; // Append video src to the signature
                     }
                 }

                // If still no link or video, use fallback based on text content
                if (authorHref === 'no-author-link' || authorHref === 'no-author-link|no-video') {
                    const textContent = container.textContent.substring(0, 50).replace(/\\s+/g, ' ').trim();
                    authorHref = 'fallback|' + textContent;
                }

                return authorHref;
            """)

            # Check against the signature provided when the function was called
            if new_html_signature != current_html_signature and new_html_signature != 'no-container' and not new_html_signature.startswith("error"):
                # Basic check to prevent considering very short/simple fallbacks as definite changes
                if len(new_html_signature) > 15 or new_html_signature.startswith('/'): # Likely a real link or complex fallback
                    print(f"Reel change detected! New signature: {new_html_signature}")
                    return True
                else:
                    # print(f"Debug: Ignoring minor potential change: {new_html_signature}") # Uncomment for debugging
                    pass

        except JavascriptException as js_ex:
             print(f"Warning: JavaScript error during reel change check: {js_ex}")
             # Continue loop, maybe temporary issue
        except Exception as e:
            # Ignore other potential errors (e.g., element not found temporarily)
            # print(f"Debug: Error during reel change check: {e}") # Uncomment for deep debugging
            pass
        time.sleep(0.4) # Check slightly less frequently

    # print(f"Timed out waiting for reel content to change (Signature: {current_html_signature})") # Less verbose timeout log
    return False

def handle_popups(driver, timeout=5):
    """Handles common post-login/refresh popups."""
    popup_selectors = [
        # "Save Your Login Info?" - "Not Now" button
        "//button[text()='Not Now']",
        "//div[text()='Not Now']/parent::button",
        # "Turn on Notifications?" - "Not Now" button
        "//button[contains(text(), 'Not Now')]", 
        # Sometimes it's a different dialog structure
        "//div[@role='dialog']//button[contains(text(), 'Not Now')]"
    ]
    
    for selector in popup_selectors:
        try:
            # Wait briefly for the popup button to appear and be clickable
            popup_button = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, selector))
            )
            print(f"Handling popup with button found via selector: {selector}")
            popup_button.click()
            print("Clicked 'Not Now' on popup.")
            human_like_delay(1.0, 2.0) # Wait a bit after clicking
            # Once one popup is handled, we might not need to check others immediately
            # but sometimes multiple popups appear, so we continue checking
        except TimeoutException:
            # Popup defined by this selector was not found within the timeout
            # print(f"Popup with selector '{selector}' not found.") # Debug log
            pass
        except Exception as e:
            # Handle other potential errors like element becoming stale
            print(f"Error handling popup with selector '{selector}': {e}")
            pass # Continue to next selector

def get_current_reel_signature(driver):
    """Gets the signature of the currently visible reel."""
    try:
        # Use the same JS logic as in wait_for_reel_change
        signature = driver.execute_script("""
            const container = document.querySelector('div[role="presentation"]') || document.querySelector('article');
            if (!container) return 'no-container';

            // Try to find the author's profile link within the container
            const profileLinks = container.querySelectorAll('a[href^="/"][href*="/"]:not([href*="/reel"]):not([href*="/p/"]):not([href*="/explore"])');
            let authorHref = 'no-author-link';

             // Iterate through potential links to find one that looks like a profile link
            for (const link of profileLinks) {
                const href = link.getAttribute('href');
                const text = link.textContent.trim();
                 // Basic checks: has text, not excessively long, no spaces, likely a username
                 if (href && href.startsWith('/') && href.split('/').length <= 3 &&
                    text && text.length > 1 && text.length < 35 && !text.includes(' ')) {
                     // Prioritize links where text matches the last part of the href (username)
                    const parts = href.split('/').filter(p => p);
                    if (parts.length > 0 && parts[parts.length - 1] === text) {
                        authorHref = href;
                        break; // Found a likely candidate
                    }
                    // Fallback: take the first plausible link if no perfect match
                    if (authorHref === 'no-author-link') {
                         authorHref = href;
                    }
                }
            }
                
            // If no link found, use a fallback based on some text content
            if (authorHref === 'no-author-link') {
                const textContent = container.textContent.substring(0, 50).replace(/\\s+/g, ' ').trim();
                 authorHref = 'fallback|' + textContent;
            }

            return authorHref;
        """)
        # print(f"Debug: Current reel signature: {signature}") # Uncomment for debugging
        return signature
    except Exception as e:
        print(f"Error getting current reel signature: {e}")
        return "error-getting-signature"

def navigate_to_next_reel(driver):
    """Navigate to the next reel using a prioritized sequence of methods."""
    current_signature = get_current_reel_signature(driver)
    if current_signature.startswith("error") or current_signature == 'no-container':
        print("Warning: Could not get initial signature before navigation.")

    # Prioritized methods: Keyboard is usually most reliable
    methods = ['keyboard', 'script', 'swipe']
    # Increase timeout when waiting *after* an action
    wait_timeout_after_action = 5 # Increased from 3

    for method in methods:
        print(f"Attempting navigation: {method}")
        success = False
        try:
            if method == 'keyboard':
                actions = ActionChains(driver)
                actions.send_keys(Keys.SPACE).perform() # Prioritize SPACE key
                success = wait_for_reel_change(driver, current_signature, timeout=wait_timeout_after_action)
                if not success: # Try ARROW_DOWN if SPACE failed
                    print("  SPACE key failed, trying ARROW_DOWN...")
                    actions = ActionChains(driver)
                    actions.send_keys(Keys.ARROW_DOWN).perform()
                    success = wait_for_reel_change(driver, current_signature, timeout=wait_timeout_after_action)

            elif method == 'script':
                # Try a significant scroll first
                scroll_amount = random.randint(700, 1000)
                driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
                success = wait_for_reel_change(driver, current_signature, timeout=wait_timeout_after_action)
                if not success:
                     print("  Large scroll failed, trying smooth scroll...")
                     # Try smooth scroll as fallback
                     total_scroll = random.randint(700, 1000)
                     step_count = random.randint(8, 15)
                     step_size = total_scroll / step_count
                     for _ in range(step_count):
                         driver.execute_script(f"window.scrollBy(0, {step_size});")
                         time.sleep(random.uniform(0.02, 0.06))
                     success = wait_for_reel_change(driver, current_signature, timeout=wait_timeout_after_action)

            elif method == 'swipe':
                # Try to perform swipe relative to the main reels container
                try:
                    # Find the main container that holds reels (might need adjustment based on actual structure)
                    # Targeting a potentially scrollable area or the main presentation div
                    reel_container = WebDriverWait(driver, 3).until(
                        EC.presence_of_element_located((By.XPATH, "//div[contains(@style,'flex-direction: column')] | //div[@role='presentation']/div/div | //article/../.."))
                    )
                    container_size = reel_container.size
                    container_location = reel_container.location

                    # Calculate swipe coordinates relative to the container
                    # Start near the bottom-center, end near the top-center
                    start_x = container_size['width'] / 2
                    start_y = container_size['height'] * 0.8 # 80% down
                    end_y = container_size['height'] * 0.2 # 20% down

                    # Use ActionChains relative to the found element
                    actions = ActionChains(driver)
                    actions.move_to_element_with_offset(reel_container, start_x, start_y)
                    actions.click_and_hold()
                    actions.pause(random.uniform(0.1, 0.3))
                    # Move relative to the current pointer position (which is start_x, start_y within the element)
                    actions.move_by_offset(0, end_y - start_y)
                    actions.release()
                    actions.perform()

                    success = wait_for_reel_change(driver, current_signature, timeout=wait_timeout_after_action)

                except (NoSuchElementException, TimeoutException):
                    print("  Could not find suitable element for relative swipe.")
                    # Fallback to less precise window-based swipe if element not found
                    print("  Falling back to window-based swipe simulation...")
                    window_size = driver.get_window_size()
                    start_y_abs = window_size['height'] * 0.8
                    end_y_abs = window_size['height'] * 0.2
                    # Perform swipe based on window coordinates (might be less reliable)
                    actions = ActionChains(driver)
                    actions.move_by_offset(window_size['width'] / 2, start_y_abs) # Move to start position
                    actions.click_and_hold()
                    actions.pause(random.uniform(0.1, 0.3))
                    actions.move_by_offset(0, end_y_abs - start_y_abs) # Swipe up
                    actions.release()
                    actions.perform()
                    # Move mouse back to avoid interfering? (optional)
                    actions.move_by_offset(-window_size['width'] / 2, -end_y_abs).perform()
                    success = wait_for_reel_change(driver, current_signature, timeout=wait_timeout_after_action)
                except MoveTargetOutOfBoundsException:
                     print("  Swipe failed: MoveTargetOutOfBoundsException. Skipping swipe attempt.")
                except Exception as e_swipe:
                     print(f"  Swipe navigation failed with unexpected error: {e_swipe}")

            if success:
                print(f"Navigation successful using: {method}")
                return True
            else:
                 print(f"Navigation method {method} failed to produce change.")
                 time.sleep(random.uniform(0.5, 1.0)) # Small pause before next method

        except (NoSuchWindowException, WebDriverException) as fatal_ex:
             print(f"CRITICAL ERROR during navigation ({method}): Browser window closed or driver unresponsive: {fatal_ex}")
             raise # Re-raise fatal exceptions to stop the script
        except Exception as e:
            print(f"Error during navigation method {method}: {e}")
            # Allow loop to continue to the next method

    print("All primary navigation methods failed.")
    return False

def collect_usernames_from_reels():
    """Main function to collect usernames from Instagram reels."""
    collected_usernames = []
    existing_usernames = read_existing_usernames()
    print(f"Found {len(existing_usernames)} existing usernames in file.")
    
    target_count = random.randint(MIN_USERNAMES, MAX_USERNAMES)
    print(f"Target: collecting {target_count} new usernames this session.")
    
    if not navigate_to_reels(driver):
        print("Failed to navigate to reels section.")
        return collected_usernames
    
    # Main collection loop
    attempts = 0
    max_attempts = target_count * 6 # Slightly increased max attempts multiplier
    consecutive_failures = 0
    # Use deque for efficient tracking of recent signatures
    recent_signatures = deque(maxlen=5) # Keep track of last 5 signatures
    refresh_attempts = 0
    max_refresh_attempts = 3

    while len(collected_usernames) < target_count and attempts < max_attempts:
        attempts += 1
        print(f"\n--- Attempt #{attempts}/{max_attempts} (Found: {len(collected_usernames)}/{target_count}) ---")

        # Wait for reel content to load/stabilize before getting signature
        try:
            WebDriverWait(driver, 7).until( # Increased wait time slightly
                EC.presence_of_element_located((By.XPATH, "//div[@role='presentation'] | //article"))
            )
            time.sleep(random.uniform(0.3, 0.8)) # Shorter stabilization delay
        except TimeoutException:
            print("Warning: Timed out waiting for main reel container presence.")
            # Maybe try a refresh if this happens too often?
            if consecutive_failures > 3:
                 print("Attempting refresh due to container timeout...")
                 try:
                    driver.refresh()
                    time.sleep(5)
                    recent_signatures.clear() # Clear history after refresh
                    consecutive_failures = 0
                    continue # Restart loop iteration
                 except Exception as refresh_err:
                    print(f"Refresh failed: {refresh_err}")
                    # If refresh fails, maybe best to exit? Or try one last navigation.
                    if not navigate_to_next_reel(driver):
                         print("Cannot recover after container timeout and failed refresh. Exiting loop.")
                         break # Exit the main loop
            else:
                 print("Continuing despite container timeout...")

        current_signature = get_current_reel_signature(driver)
        print(f"Current reel signature: {current_signature}")

        # Loop Detection: Check if current signature is repeated in recent history
        loop_detected = False
        if current_signature != 'no-container' and not current_signature.startswith("error"):
            if current_signature in recent_signatures:
                print(f"WARNING: Signature '{current_signature}' seen recently. Potential loop.")
                loop_detected = True
            recent_signatures.append(current_signature) # Add current signature to tracking

        if loop_detected and refresh_attempts < max_refresh_attempts:
            print(f"Loop detected. Attempting page refresh ({refresh_attempts + 1}/{max_refresh_attempts})...")
            try:
                driver.refresh()
                time.sleep(random.uniform(4.0, 6.0)) # Wait for page to reload
                recent_signatures.clear() # Clear history after refresh
                refresh_attempts += 1
                consecutive_failures = 0 # Reset failure count after successful refresh
                continue # Skip to next iteration after refresh
            except (NoSuchWindowException, WebDriverException) as fatal_ex:
                 print(f"CRITICAL ERROR during refresh: {fatal_ex}")
                 raise # Re-raise fatal exceptions
            except Exception as e_refresh:
                print(f"Refresh attempt failed: {e_refresh}")
                # Don't increment refresh_attempts if refresh itself fails
                # Decide whether to try navigating or just give up
                print("Trying one navigation attempt after failed refresh...")
                if navigate_to_next_reel(driver):
                    recent_signatures.clear() # Clear history as we might be unstuck
                    continue
                else:
                    print("Navigation failed after refresh failure. Exiting loop.")
                    break # Exit loop if refresh fails and can't navigate

        elif loop_detected and refresh_attempts >= max_refresh_attempts:
             print("Loop detected, but max refresh attempts reached. Trying final navigation...")
             if not navigate_to_next_reel(driver):
                  print("Still stuck after max refreshes. Exiting loop.")
                  break # Exit loop

        # Occasional longer pause
        if random.random() < 0.05: # Reduced frequency
            time.sleep(random.uniform(2.0, 5.0))

        # Try to extract username
        username = None
        try:
            username = extract_username_from_reel(driver)
        except (NoSuchWindowException, WebDriverException) as fatal_ex:
             print(f"CRITICAL ERROR during username extraction: {fatal_ex}")
             raise # Re-raise fatal exceptions

        if username and username not in collected_usernames and username not in existing_usernames:
            collected_usernames.append(username)
            print(f"+++ SUCCESS: Added username: {username} ({len(collected_usernames)}/{target_count}) +++")
            refresh_attempts = 0 # Reset refresh counter on success
            consecutive_failures = 0
            # Simulate human behavior
            interact_with_reel(driver)
        else:
            consecutive_failures += 1
            if username:
                print(f"--- Skipping username '{username}' - already collected or exists. ---")
            else:
                print(f"--- Could not find a username on this reel (Failure #{consecutive_failures}) ---")

            # If we fail many times, maybe navigation is truly stuck
            if consecutive_failures >= 7: # Increased threshold
                print(f"Warning: {consecutive_failures} consecutive reels without finding a new username.")
                # Consider a refresh if haven't refreshed recently due to loops
                if refresh_attempts < max_refresh_attempts:
                     print("Attempting proactive refresh due to high consecutive failures...")
                     try:
                         driver.refresh()
                         time.sleep(random.uniform(4.0, 6.0))
                         recent_signatures.clear()
                         refresh_attempts += 1
                         consecutive_failures = 0 # Reset count after refresh
                         continue
                     except (NoSuchWindowException, WebDriverException) as fatal_ex:
                          print(f"CRITICAL ERROR during proactive refresh: {fatal_ex}")
                          raise
                     except Exception as e_refresh:
                          print(f"Proactive refresh failed: {e_refresh}")
                          # Fall through to navigation attempt if refresh fails

        # Navigate to next reel ONLY if we haven't just refreshed
        if not loop_detected or refresh_attempts == 0 or consecutive_failures < 7: # Avoid double navigation after refresh
             print("Navigating to next reel...")
             if not navigate_to_next_reel(driver):
                 print("Navigation failed after username processing. Will rely on loop detection/refresh.")
                 # No need to sleep here, the loop detection will handle repeated failures

        # Random short delays within the loop
        time.sleep(random.uniform(0.5, 1.5)) # General short delay between attempts

    print(f"\nCollection complete. Found {len(collected_usernames)} new usernames in {attempts} attempts.")
    return collected_usernames

# --- Main Execution ---
if __name__ == "__main__":
    driver = None # Ensure driver is initialized to None
    try:
        print("Starting Instagram Reels Username Collector...")
        
        print("Setting up Chrome options...")
        chrome_options = Options()
        # Uncomment these as needed for troubleshooting
        # chrome_options.add_argument("--no-sandbox")
        # chrome_options.add_argument("--disable-dev-shm-usage")
        # chrome_options.add_argument("--headless")  # Headless mode might be detected more easily
        
        print("Initializing Chrome driver...")
        try:
            # First attempt: standard initialization
            driver = webdriver.Chrome(options=chrome_options)
            print("Chrome WebDriver successfully initialized!")
        except Exception as e:
            print(f"Standard Chrome initialization failed: {e}")
            print("Attempting to initialize with Service...")
            
            # Second attempt: with explicit ChromeDriver path
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
            
        # Set window size to a typical desktop resolution
        driver.set_window_size(1366, 768)
        
        # Log in to Instagram
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

        # Handle potential popups after login/refresh
        print("Checking for initial popups...")
        handle_popups(driver)

        # Collect usernames
        print("\nStarting reel scraping process...")
        new_usernames = collect_usernames_from_reels()

        # Save collected usernames
        if new_usernames:
            save_usernames(new_usernames)
            print(f"\nSuccessfully saved {len(new_usernames)} new usernames to {USERNAMES_FILE}")
        else:
            print("\nNo new usernames were collected in this session.")

    except (NoSuchWindowException, WebDriverException) as fatal_err:
        print(f"\nCRITICAL ERROR encountered: {fatal_err}")
        print("The browser window may have been closed or the WebDriver became unresponsive.")
        traceback.print_exc()
    except KeyboardInterrupt:
        print("\nKeyboard interrupt detected. Exiting gracefully...")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        traceback.print_exc()
        # Optional: Save debug info on unexpected error
        # save_debug_info(driver, "unexpected_error")
    finally:
        if driver:
            print("\nClosing Chrome driver...")
            driver.quit()
        print("Script finished.") 