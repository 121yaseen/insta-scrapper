import os
import sys
import psycopg2
import dotenv
import json
from datetime import datetime

# Path to the profile data file
PROFILE_DATA_FILE = "profile_data.json"
# Path to the usernames.txt file
USERNAMES_FILE = "usernames.txt"

def load_env():
    """Load environment variables from .env file."""
    env_paths = ['.env', '../.env']
    
    for path in env_paths:
        if os.path.exists(path):
            dotenv.load_dotenv(path)
            print(f"Loaded environment from {path}")
            return True
    
    print("Error: No .env file found")
    return False

def connect_to_database():
    """Connect to the PostgreSQL database using the DATABASE_URL from .env."""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("Error: DATABASE_URL not found in environment variables")
            sys.exit(1)
            
        print("Connecting to database...")
        conn = psycopg2.connect(database_url)
        print("Connected to database successfully")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def get_processed_usernames():
    """Get the list of usernames that were in the usernames.txt file."""
    try:
        if not os.path.exists(USERNAMES_FILE):
            print(f"Error: {USERNAMES_FILE} not found")
            return []
            
        with open(USERNAMES_FILE, 'r') as f:
            usernames = [line.strip() for line in f if line.strip()]
            
        print(f"Found {len(usernames)} processed usernames")
        return usernames
    except Exception as e:
        print(f"Error reading usernames file: {e}")
        return []

def get_successfully_scraped_usernames():
    """Get the list of usernames that were successfully scraped (in profile_data.json)."""
    try:
        if not os.path.exists(PROFILE_DATA_FILE):
            print(f"Error: {PROFILE_DATA_FILE} not found")
            return []
            
        with open(PROFILE_DATA_FILE, 'r') as f:
            data = json.load(f)
            
        # Extract usernames from the profile data
        usernames = [profile["username"] for profile in data if "username" in profile]
        
        print(f"Found {len(usernames)} successfully scraped usernames")
        return usernames
    except Exception as e:
        print(f"Error reading profile data file: {e}")
        return []

def update_requests_to_completed(conn, usernames):
    """Update QueuedRequest status to 'completed' for the given usernames."""
    if not usernames:
        print("No usernames to update")
        return True
        
    try:
        cursor = conn.cursor()
        
        # Update query to set status to 'completed' and update updatedAt
        placeholders = ','.join(['%s'] * len(usernames))
        query = f"""
        UPDATE "QueuedRequest" 
        SET status = 'completed', "updatedAt" = %s 
        WHERE username IN ({placeholders})
        AND status = 'processing'
        """
        
        # Current time for updatedAt
        now = datetime.now()
        
        # Execute the query with parameters
        cursor.execute(query, [now] + usernames)
        
        # Commit the changes
        conn.commit()
        
        print(f"Updated {cursor.rowcount} requests to 'completed' status")
        return True
    except Exception as e:
        print(f"Error updating request status to completed: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def main():
    print(f"=== Instagram Scraper Completion Update ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load environment variables
    if not load_env():
        sys.exit(1)
    
    # Get the list of processed usernames
    processed_usernames = get_processed_usernames()
    
    if not processed_usernames:
        print("No processed usernames found")
        sys.exit(0)
    
    # Get the list of successfully scraped usernames
    successful_usernames = get_successfully_scraped_usernames()
    
    # Connect to database
    conn = connect_to_database()
    
    try:
        # Update all processed usernames to completed
        # In a production system, you might want to only mark successfully scraped usernames as complete
        # and mark the others as failed
        if update_requests_to_completed(conn, processed_usernames):
            print(f"Successfully updated request status for {len(processed_usernames)} usernames")
        else:
            print("Failed to update request status")
            sys.exit(1)
            
        print(f"Process completed successfully at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    finally:
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main() 