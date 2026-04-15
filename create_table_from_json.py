import json
import psycopg2
from psycopg2 import sql
import sys
from pathlib import Path

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'practice_for_practice',
    'user': 'postgres',
    'password': '25101989ad',
    'port': 5432
}

def flatten_json(data, prefix=''):
    """Recursively flatten nested JSON structures into a list of flat dictionaries."""
    records = []
    
    if isinstance(data, dict):
        flat_record = {}
        has_expanded_array = False
        
        for key, value in data.items():
            if isinstance(value, list):
                if len(value) == 1:
                    # Single-element array: flatten it
                    flat_record[key] = value[0]
                elif value and isinstance(value[0], dict):
                    # Array of dicts: expand into multiple records
                    for item in value:
                        new_record = flat_record.copy()
                        # Recursively flatten the item
                        flattened_item = flatten_json(item)[0] if flatten_json(item) else {}
                        new_record.update(flattened_item)
                        records.append(new_record)
                    has_expanded_array = True
                else:
                    # Multi-element array of primitives: keep as JSON
                    flat_record[key] = value
            else:
                flat_record[key] = value
        
        # Only add flat_record if we didn't expand arrays
        if not has_expanded_array:
            records.append(flat_record)
    
    elif isinstance(data, list):
        # If it's a list, flatten each item
        for item in data:
            records.extend(flatten_json(item))
    else:
        # If it's a primitive, wrap in a dict
        records.append({prefix: data})
    
    return records

def infer_column_types(records):
    """Infer SQL column types from the flattened records."""
    if not records:
        return {}
    
    column_types = {}
    for record in records:
        for key, value in record.items():
            if key not in column_types:
                if isinstance(value, bool):
                    sql_type = 'BOOLEAN'
                elif isinstance(value, int):
                    sql_type = 'INTEGER'
                elif isinstance(value, float):
                    sql_type = 'FLOAT'
                elif isinstance(value, str):
                    sql_type = 'TEXT'
                else:
                    sql_type = 'JSONB'
                column_types[key] = sql_type
    
    return column_types


def determine_primary_key(records):
    """Determine a set of columns that uniquely identify each record.

    Returns a tuple of column names or None if no unique combination was found.
    The function first tries single columns, then pairs of columns.
    Skips unhashable types like lists and dicts.
    """
    if not records:
        return None
    cols = list(records[0].keys())

    # check singles
    for col in cols:
        seen = set()
        unique = True
        can_hash = True
        
        for r in records:
            val = r.get(col)
            # Skip columns with unhashable types (lists, dicts)
            if isinstance(val, (list, dict)):
                can_hash = False
                break
            
            if val in seen:
                unique = False
                break
            seen.add(val)
        
        if can_hash and unique:
            return (col,)

    # check pairs
    import itertools
    for combo in itertools.combinations(cols, 2):
        seen = set()
        unique = True
        can_hash = True
        
        for r in records:
            # Convert values to hashable form, skip if unhashable
            key_parts = []
            for c in combo:
                val = r.get(c)
                if isinstance(val, (list, dict)):
                    can_hash = False
                    break
                key_parts.append(val)
            
            if not can_hash:
                break
                
            key = tuple(key_parts)
            if key in seen:
                unique = False
                break
            seen.add(key)
        
        if can_hash and unique:
            return combo

    return None

def create_table(conn, table_name, column_types, pk_cols=None):
    """Create table based on inferred column types.

    pk_cols may be a tuple of column names to serve as primary key.
    If None, no primary key is added.
    """
    if not column_types:
        print(f"Warning: No columns to create for table {table_name}")
        return
    
    # Drop table if it exists to ensure clean recreation
    drop_query = sql.SQL("DROP TABLE IF EXISTS {}").format(sql.Identifier(table_name))
    
    try:
        with conn.cursor() as cur:
            cur.execute(drop_query)
        conn.commit()
        print(f"Dropped existing table '{table_name}' if it existed.")
    except psycopg2.Error as e:
        print(f"Error dropping table: {e}")
        conn.rollback()
    
    columns_sql = []
    for col_name, col_type in column_types.items():
        if pk_cols and col_name in pk_cols:
            columns_sql.append(f"{col_name} {col_type}")
        else:
            columns_sql.append(f"{col_name} {col_type}")
    
    create_table_query = sql.SQL(
        f"CREATE TABLE {table_name} ({', '.join(columns_sql)}" +
        (f", PRIMARY KEY ({', '.join(pk_cols)})" if pk_cols else "") +
        ")"
    )
    
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
        conn.commit()
        print(f"Table '{table_name}' created successfully.")
        if pk_cols:
            print(f"Primary key set to: {pk_cols}")
    except psycopg2.Error as e:
        print(f"Error creating table: {e}")
        conn.rollback()

def insert_data(conn, table_name, records, column_types, pk_cols=None):
    """Insert records into the table. Optionally use ON CONFLICT if primary key exists."""
    if not records:
        print(f"No records to insert into {table_name}")
        return
    
    columns = list(column_types.keys())
    placeholders = ', '.join(['%s'] * len(columns))
    col_names = ', '.join(columns)

    if pk_cols:
        insert_query_with_conflict = sql.SQL(
            f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders}) "
            f"ON CONFLICT ({', '.join(pk_cols)}) DO NOTHING"
        )
        insert_query_simple = sql.SQL(
            f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})"
        )
    else:
        insert_query_simple = sql.SQL(
            f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})"
        )
        insert_query_with_conflict = None
    
    try:
        with conn.cursor() as cur:
            for record in records:
                values = []
                for col in columns:
                    val = record.get(col, None)
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val)
                    values.append(val)
                
                # Try with conflict clause first if PK exists, fall back to simple insert
                if insert_query_with_conflict:
                    try:
                        cur.execute(insert_query_with_conflict, values)
                    except psycopg2.Error:
                        # If ON CONFLICT fails, use simple INSERT
                        cur.execute(insert_query_simple, values)
                else:
                    cur.execute(insert_query_simple, values)
        
        conn.commit()
        print(f"Inserted {len(records)} records into '{table_name}'.")
    
    except psycopg2.Error as e:
        print(f"Error inserting records: {e}")
        conn.rollback()

def process_json_file(json_file_path):
    """Process a JSON file and create/insert into database."""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Flatten the JSON data
        flattened_records = flatten_json(data)
        
        print(f"Flattened records: {flattened_records[:2]}")  # Debug: show first 2 records
        
        if not flattened_records:
            print("No records found in JSON file.")
            return
        
        # Get table name from file name
        table_name = Path(json_file_path).stem.lower()
        
        # Infer column types
        column_types = infer_column_types(flattened_records)
        
        print(f"Column types: {column_types}")  # Debug: show inferred types
        
        # Determine possible primary key columns
        pk_cols = determine_primary_key(flattened_records)
        print(f"Determined primary key columns: {pk_cols}")
        
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        
        # Create table with primary key info
        create_table(conn, table_name, column_types, pk_cols=pk_cols)
        
        # Insert data, respect primary key if present
        insert_data(conn, table_name, flattened_records, column_types, pk_cols=pk_cols)
        
        # Verify table contents
        try:
            with conn.cursor() as cur:
                cur.execute(sql.SQL("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = %s"), (table_name,))
                cols = cur.fetchall()
                print(f"Columns in '{table_name}': {cols}")
                cur.execute(sql.SQL("SELECT * FROM {} LIMIT 5").format(sql.Identifier(table_name)))
                sample_rows = cur.fetchall()
                print(f"Sample rows (up to 5): {sample_rows}")
        except Exception as e:
            print(f"Error verifying table: {e}")
        
        conn.close()
        print(f"Successfully processed {json_file_path}")
    
    except Exception as e:
        print(f"Error processing file: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python create_table_from_json.py <json_file_path>")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    process_json_file(json_file_path)