import psycopg2
from psycopg2 import sql

# Connect to default 'postgres' database to create a new database
conn = psycopg2.connect(
    host='localhost',
    database='postgres',
    user='postgres',
    password='25101989ad',
    port=5432
)

# Set autocommit to allow database creation
conn.autocommit = True

try:
    with conn.cursor() as cur:
        # Check if database exists
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = 'practice_for_practice'"
        )
        if not cur.fetchone():
            cur.execute("CREATE DATABASE practice_for_practice")
            print("Database 'practice_for_practice' created successfully!")
        else:
            print("Database 'practice_for_practice' already exists.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
    print("Setup complete. You can now run database_json_reader.py")
