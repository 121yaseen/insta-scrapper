import os
import sys
import psycopg2
import dotenv
from datetime import datetime

# Path to the usernames.txt file
USERNAMES_FILE = "usernames.txt"

def load_env():
    """Load environment variables from .env file."""
    # Look for .env in parent directory if not in current directory
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

def fetch_usernames_from_db(conn):
    """Fetch usernames from QueuedRequest table with pending status."""
    try:
        cursor = conn.cursor()
        
        # Query to get distinct usernames from QueuedRequest where status is pending
        query = """
        SELECT DISTINCT username, id, "lastQueued"
        FROM "QueuedRequest" 
        WHERE status = 'pending' 
        ORDER BY "lastQueued" ASC
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Extract usernames and IDs from results
        usernames = []
        request_ids = []
        for row in results:
            usernames.append(row[0])
            request_ids.append(row[1])

        print (usernames)
        print(f"Fetched {len(usernames)} pending usernames from database")
        return usernames, request_ids
    except Exception as e:
        print(f"Error fetching usernames: {e}")
        return [], []
    finally:
        cursor.close()

def update_status_to_processing(conn, request_ids):
    """Update QueuedRequest status to 'processing' for the given request IDs."""
    if not request_ids:
        return True
        
    try:
        cursor = conn.cursor()
        
        # Update query to set status to 'processing' and update updatedAt
        placeholders = ','.join(['%s'] * len(request_ids))
        query = f"""
        UPDATE "QueuedRequest" 
        SET status = 'processing', "updatedAt" = %s 
        WHERE id IN ({placeholders})
        """
        
        # Current time for updatedAt
        now = datetime.now()
        
        # Execute the query with parameters
        cursor.execute(query, [now] + request_ids)
        
        # Commit the changes
        conn.commit()
        
        print(f"Updated {cursor.rowcount} requests to 'processing' status")
        return True
    except Exception as e:
        print(f"Error updating request status to processing: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def write_usernames_to_file(usernames):
    """Write usernames to the usernames.txt file."""
    try:
        with open(USERNAMES_FILE, 'w') as f:
            for username in usernames:
                f.write(f"{username}\n")
        print(f"Successfully wrote {len(usertolnames)} usernames to {USERNAMES_FILE}")
        return True
    except Exception as e:
        print(f"Error writing to {USERNAMES_FILE}: {e}")
        return False

def main():
    print(f"=== Instagram Scraper Database Fetch ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load environment variables
    if not load_env():
        sys.exit(1)
    
    # Connect to database
    conn = connect_to_database()
    
    try:
        # Fetch usernames from database
        usernames, request_ids = fetch_usernames_from_db(conn)
        
        if not usernames:
            print("No pending usernames found in database")
            sys.exit(0)
            
        # Update status to 'processing'
        if not update_status_to_processing(conn, request_ids):
            print("Warning: Failed to update request status to processing")
            
        # Write usernames to file
        write_usernames_to_file(usernames)
        
        print(f"Process completed successfully at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    finally:
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main() 