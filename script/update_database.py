import os
import sys
import psycopg2
import json
import dotenv
from datetime import datetime

# Path to the profile data file
PROFILE_DATA_FILE = "profile_data.json"

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

def load_profile_data():
    """Load profile data from the JSON file."""
    try:
        if not os.path.exists(PROFILE_DATA_FILE):
            print(f"Error: {PROFILE_DATA_FILE} not found")
            return []
            
        with open(PROFILE_DATA_FILE, 'r') as f:
            data = json.load(f)
            
        print(f"Loaded {len(data)} profiles from {PROFILE_DATA_FILE}")
        return data
    except Exception as e:
        print(f"Error loading profile data: {e}")
        return []

def format_datetime(datetime_str):
    """Format datetime string to PostgreSQL compatible format."""
    try:
        dt = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
        return dt.isoformat()
    except:
        return datetime.now().isoformat()

def get_table_columns(conn, table_name):
    """Get a list of column names for a given table."""
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}'
        """)
        columns = [row[0] for row in cursor.fetchall()]
        cursor.close()
        return columns
    except Exception as e:
        print(f"Error getting columns for table {table_name}: {e}")
        return []

def get_or_create_instagram_profile(conn, profile_data):
    """Get or create an InstagramProfile record in the database."""
    try:
        # Get table columns to check which fields exist
        columns = get_table_columns(conn, 'InstagramProfile')
        print(f"Available columns in InstagramProfile: {columns}")
        
        cursor = conn.cursor()
        
        # Check if profile exists
        query = 'SELECT id FROM "InstagramProfile" WHERE username = %s'
        cursor.execute(query, (profile_data["username"],))
        result = cursor.fetchone()
        
        scrape_time = format_datetime(profile_data.get("scrape_time", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        
        # Build column names and values dynamically based on what's available in the database
        # Use the exact column names as they appear in the database
        column_map = {}
        
        # Use the exact column names from the database
        for column in columns:
            col_lower = column.lower()
            
            if col_lower == 'fullname':
                column_map[column] = profile_data.get("full_name")
            elif col_lower == 'bio':
                column_map[column] = profile_data.get("bio", "")
            elif col_lower == 'profilepicurl':
                column_map[column] = profile_data.get("profile_pic_url")
            elif col_lower == 'followercount' or col_lower == 'followerscount':
                column_map[column] = profile_data.get("followers_count")
            elif col_lower == 'followingcount':
                column_map[column] = profile_data.get("following_count")
            elif col_lower == 'postscount':
                column_map[column] = profile_data.get("posts_count")
            elif col_lower == 'isverified':
                column_map[column] = profile_data.get("is_verified", False)
            elif col_lower == 'isprivate':
                column_map[column] = profile_data.get("is_private", False)
            elif col_lower == 'externalurl':
                column_map[column] = profile_data.get("external_url")
            elif col_lower == 'reelscount':
                column_map[column] = profile_data.get("reels_count")
            elif col_lower == 'lastscraped':
                column_map[column] = scrape_time
            elif col_lower == 'scrapetime':
                column_map[column] = scrape_time
            elif col_lower == 'updatedat':
                column_map[column] = datetime.now().isoformat()
        
        # Exclude id, username, and createdAt from the map as they're handled separately
        if 'id' in column_map:
            del column_map['id']
        if 'username' in column_map:
            del column_map['username']
        if 'createdAt' in column_map:
            del column_map['createdAt']
        
        if result:
            # Update existing profile
            profile_id = result[0]
            
            if not column_map:
                print(f"No valid columns to update for {profile_data['username']}")
                return profile_id
            
            # Build update query with exact column names
            set_clauses = [f'"{col}" = %s' for col in column_map.keys()]
            update_query = f'''
            UPDATE "InstagramProfile" SET 
                {", ".join(set_clauses)}
            WHERE id = %s
            '''
            
            # Build parameters list
            params = list(column_map.values()) + [profile_id]
            
            cursor.execute(update_query, params)
            
            print(f"Updated InstagramProfile for {profile_data['username']} (ID: {profile_id})")
        else:
            # Create new profile
            # Generate a unique ID (CUID-like format for compatibility)
            import uuid
            profile_id = f"clg{uuid.uuid4().hex[:21]}"
            now = datetime.now().isoformat()
            
            # Add id, username, and createdAt to the insert
            insert_columns = list(column_map.keys()) + ["id", "username"]
            
            # Add createdAt if it exists
            if "createdAt" in columns:
                insert_columns.append("createdAt")
                values = list(column_map.values()) + [profile_id, profile_data["username"], now]
            else:
                values = list(column_map.values()) + [profile_id, profile_data["username"]]
            
            placeholders = ", ".join(["%s"] * len(insert_columns))
            
            insert_query = f'''
            INSERT INTO "InstagramProfile" (
                "{('", "').join(insert_columns)}"
            ) 
            VALUES ({placeholders})
            RETURNING id
            '''
            
            cursor.execute(insert_query, values)
            result = cursor.fetchone()
            profile_id = result[0] if result else profile_id
            
            print(f"Created new InstagramProfile for {profile_data['username']} (ID: {profile_id})")
        
        conn.commit()
        return profile_id
    except Exception as e:
        print(f"Error processing profile {profile_data.get('username')}: {e}")
        print(f"Query attempted: {cursor.query.decode() if hasattr(cursor, 'query') else 'Unknown'}")
        conn.rollback()
        return None
    finally:
        cursor.close()

def update_reel_data(conn, profile_id, reels_data):
    """Update or create Reel records for a profile."""
    if not reels_data or not profile_id:
        return
        
    try:
        cursor = conn.cursor()
        
        # Get columns for Reel table
        columns = get_table_columns(conn, 'Reel')
        print(f"Available columns in Reel: {columns}")
        
        # Get existing reels for this profile
        cursor.execute('SELECT "reelId" FROM "Reel" WHERE "instagramProfileId" = %s', (profile_id,))
        existing_reel_ids = {row[0] for row in cursor.fetchall()}
        
        reels_updated = 0
        reels_created = 0
        
        for reel in reels_data:
            reel_id = reel.get("id")
            if not reel_id:
                continue
                
            now = datetime.now().isoformat()
            
            # Map reel data to column names (using exact case from database)
            column_map = {}
            
            for column in columns:
                col_lower = column.lower()
                
                if col_lower == 'url':
                    column_map[column] = reel.get("url")
                elif col_lower == 'thumbnail':
                    column_map[column] = reel.get("thumbnail")
                elif col_lower == 'views':
                    column_map[column] = reel.get("views")
                elif col_lower == 'likes':
                    column_map[column] = reel.get("likes")
                elif col_lower == 'comments':
                    column_map[column] = reel.get("comments")
                elif col_lower == 'posteddate':
                    column_map[column] = reel.get("posted_date")
                elif col_lower == 'updatedat':
                    column_map[column] = now
            
            # Remove fields that should be handled separately
            if 'id' in column_map:
                del column_map['id']
            if 'reelId' in column_map:
                del column_map['reelId']
            if 'instagramProfileId' in column_map:
                del column_map['instagramProfileId']
            if 'createdAt' in column_map:
                del column_map['createdAt']
            
            if reel_id in existing_reel_ids:
                # Update existing reel
                if not column_map:
                    print(f"No valid columns to update for reel {reel_id}")
                    continue
                
                set_clauses = [f'"{col}" = %s' for col in column_map.keys()]
                update_query = f'''
                UPDATE "Reel" SET 
                    {", ".join(set_clauses)}
                WHERE "reelId" = %s AND "instagramProfileId" = %s
                '''
                
                # Build parameters list
                params = list(column_map.values()) + [reel_id, profile_id]
                
                cursor.execute(update_query, params)
                
                reels_updated += 1
            else:
                # Create new reel
                # Generate a unique ID
                import uuid
                new_id = f"clg{uuid.uuid4().hex[:21]}"
                
                # Add required fields
                insert_columns = list(column_map.keys()) + ["id", "reelId", "instagramProfileId"]
                
                # Add createdAt if it exists
                if "createdAt" in columns:
                    insert_columns.append("createdAt")
                    values = list(column_map.values()) + [new_id, reel_id, profile_id, now]
                else:
                    values = list(column_map.values()) + [new_id, reel_id, profile_id]
                
                placeholders = ", ".join(["%s"] * len(insert_columns))
                
                insert_query = f'''
                INSERT INTO "Reel" (
                    "{('", "').join(insert_columns)}"
                ) 
                VALUES ({placeholders})
                '''
                
                cursor.execute(insert_query, values)
                
                reels_created += 1
        
        conn.commit()
        print(f"Updated {reels_updated} reels and created {reels_created} new reels for profile {profile_id}")
    except Exception as e:
        print(f"Error updating reels for profile {profile_id}: {e}")
        print(f"Query attempted: {cursor.query.decode() if hasattr(cursor, 'query') else 'Unknown'}")
        conn.rollback()
    finally:
        cursor.close()

def update_user_requests(conn, username, profile_id):
    """Update UserRequest records with the InstagramProfile ID."""
    if not username or not profile_id:
        return
        
    try:
        cursor = conn.cursor()
        
        # Check if UserRequest table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'UserRequest'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print(f"UserRequest table does not exist, skipping update")
            return 0
        
        # Update UserRequest records
        update_query = '''
        UPDATE "UserRequest" 
        SET "instagramProfileId" = %s
        WHERE username = %s AND "instagramProfileId" IS NULL
        '''
        
        cursor.execute(update_query, (profile_id, username))
        updated_rows = cursor.rowcount
        
        conn.commit()
        
        if updated_rows > 0:
            print(f"Updated {updated_rows} UserRequest records for {username}")
        
        return updated_rows
    except Exception as e:
        print(f"Error updating UserRequest records for {username}: {e}")
        conn.rollback()
        return 0
    finally:
        cursor.close()

def update_scrape_requests(conn, username, profile_id):
    """Update ScrapeRequest records with the InstagramProfile ID and mark as completed."""
    if not username or not profile_id:
        return
        
    try:
        cursor = conn.cursor()
        
        # Check if ScrapeRequest table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'ScrapeRequest'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print(f"ScrapeRequest table does not exist, skipping update")
            return 0
        
        # Update ScrapeRequest records
        update_query = '''
        UPDATE "ScrapeRequest" 
        SET "instagramProfileId" = %s, status = 'completed', "updatedAt" = %s
        WHERE username = %s AND status = 'processing'
        '''
        
        cursor.execute(update_query, (profile_id, datetime.now().isoformat(), username))
        updated_rows = cursor.rowcount
        
        conn.commit()
        
        if updated_rows > 0:
            print(f"Updated {updated_rows} ScrapeRequest records for {username}")
        
        return updated_rows
    except Exception as e:
        print(f"Error updating ScrapeRequest records for {username}: {e}")
        conn.rollback()
        return 0
    finally:
        cursor.close()

def main():
    print(f"=== Instagram Scraper Database Update ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load environment variables
    if not load_env():
        sys.exit(1)
    
    # Load profile data from JSON file
    profile_data_list = load_profile_data()
    
    if not profile_data_list:
        print("No profile data to process")
        sys.exit(0)
    
    # Connect to database
    conn = connect_to_database()
    
    try:
        total_profiles = 0
        total_reels = 0
        total_user_requests = 0
        total_scrape_requests = 0
        
        # Process each profile
        for profile_data in profile_data_list:
            username = profile_data.get("username")
            if not username:
                continue
                
            # Create or update InstagramProfile
            profile_id = get_or_create_instagram_profile(conn, profile_data)
            if not profile_id:
                continue
                
            total_profiles += 1
                
            # Update Reel data
            reels = profile_data.get("reels", [])
            update_reel_data(conn, profile_id, reels)
            total_reels += len(reels)
            
            # Update UserRequest records
            user_requests = update_user_requests(conn, username, profile_id)
            total_user_requests += user_requests
            
            # Update ScrapeRequest records
            scrape_requests = update_scrape_requests(conn, username, profile_id)
            total_scrape_requests += scrape_requests
        
        print(f"\nDatabase update summary:")
        print(f"- Profiles processed: {total_profiles}")
        print(f"- Reels processed: {total_reels}")
        print(f"- UserRequest records updated: {total_user_requests}")
        print(f"- ScrapeRequest records updated: {total_scrape_requests}")
        
        print(f"\nProcess completed successfully at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    finally:
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main() 