import json
import os
import psycopg2
from psycopg2 import sql, extras
from pathlib import Path

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'practice_for_practice',
    'user': 'postgres',
    'password': '25101989ad',
    'port': 5432
}

def get_table_name_from_file(file_path):
    """Extract table name from JSON file name (removes .json extension)."""
    return Path(file_path).stem.lower()

def infer_column_types(records):
    """Infer SQL column types from the JSON data."""
    if not records:
        return {}
    
    column_types = {}
    first_record = records[0]
    
    for key, value in first_record.items():
        if isinstance(value, bool):
            sql_type = 'BOOLEAN'
        elif isinstance(value, int):
            sql_type = 'INTEGER'
        elif isinstance(value, float):
            sql_type = 'FLOAT'
        elif isinstance(value, list) or isinstance(value, dict):
            sql_type = 'JSONB'
        else:
            sql_type = 'TEXT'
        
        column_types[key] = sql_type
    
    return column_types

def create_table_if_not_exists(conn, table_name, column_types):
    """Create table if it doesn't exist based on inferred column types."""
    if not column_types:
        print(f"Warning: No columns to create for table {table_name}")
        return
    
    # Assuming first key is the primary key
    first_key = next(iter(column_types))
    
    columns_sql = []
    for col_name, col_type in column_types.items():
        if col_name == first_key:
            columns_sql.append(f"{col_name} {col_type} PRIMARY KEY")
        else:
            columns_sql.append(f"{col_name} {col_type}")
    
    create_table_query = sql.SQL(
        f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(columns_sql)})"
    )
    
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
        conn.commit()
        print(f"Table '{table_name}' created or already exists.")
    except psycopg2.Error as e:
        print(f"Error creating table: {e}")
        conn.rollback()

def upsert_records(conn, table_name, records, column_types):
    """Insert or update records using UPSERT (INSERT ... ON CONFLICT)."""
    if not records:
        print(f"No records to insert into {table_name}")
        return
    
    first_key = next(iter(column_types))
    columns = list(column_types.keys())
    
    try:
        with conn.cursor() as cur:
            for record in records:
                # Build INSERT query with conflict handling
                placeholders = ', '.join(['%s'] * len(columns))
                col_names = ', '.join(columns)
                
                # Build SET clause for UPDATE part
                update_set = ', '.join([f"{col} = EXCLUDED.{col}" for col in columns if col != first_key])
                
                query = sql.SQL(
                    f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders}) "
                    f"ON CONFLICT ({first_key}) DO UPDATE SET {update_set}"
                )
                
                # Convert complex types to JSON strings
                values = []
                for col in columns:
                    val = record.get(col, None)
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val)
                    values.append(val)
                
                cur.execute(query, values)
        
        conn.commit()
        print(f"Successfully inserted/updated {len(records)} records into '{table_name}'")
    
    except psycopg2.Error as e:
        print(f"Error inserting records: {e}")
        conn.rollback()

def upload_json_to_db(json_file_path):
    """Main function to read JSON file and upload to PostgreSQL."""
    try:
        # Read JSON file
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Ensure data is a list of records
        if isinstance(data, dict):
            records = [data]
        elif isinstance(data, list):
            records = data
        else:
            print("Error: JSON must be an object or array of objects")
            return
        
        # Get table name from file name
        table_name = get_table_name_from_file(json_file_path)
        
        # Infer column types
        column_types = infer_column_types(records)
        
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        
        # Create table if needed
        create_table_if_not_exists(conn, table_name, column_types)
        
        # Upsert records
        upsert_records(conn, table_name, records, column_types)
        
        conn.close()
        print(f"Successfully processed {json_file_path}")
    
    except FileNotFoundError:
        print(f"Error: File not found - {json_file_path}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in file - {json_file_path}")
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def upload_all_json_in_folder(folder_path):
    """Upload all JSON files in a folder to PostgreSQL."""
    json_files = Path(folder_path).glob('*.json')
    
    for json_file in json_files:
        print(f"\nProcessing {json_file.name}...")
        upload_json_to_db(str(json_file))

if __name__ == "__main__":
    # Upload all JSON files in the folder
    upload_all_json_in_folder(r'C:\Users\Lenovo\Desktop\practice database')