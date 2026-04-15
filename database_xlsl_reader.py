import re
import sys
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values

# Database connection details
DB_CONFIG = {
	'host': 'localhost',
	'database': 'practice_for_practice',
	'user': 'postgres',
	'password': '25101989ad',
	'port': 5432
}


def normalize_identifier(name):
	"""Convert Excel column/sheet names to safe SQL identifiers."""
	cleaned = re.sub(r'[^0-9a-zA-Z_]+', '_', str(name).strip().lower())
	cleaned = re.sub(r'_+', '_', cleaned).strip('_')

	if not cleaned:
		cleaned = 'col'
	if cleaned[0].isdigit():
		cleaned = f'col_{cleaned}'

	return cleaned


def infer_sql_type(series):
	"""Infer PostgreSQL type from a pandas Series."""
	non_null = series.dropna()

	if non_null.empty:
		return 'TEXT'

	if pd.api.types.is_bool_dtype(series):
		return 'BOOLEAN'
	if pd.api.types.is_integer_dtype(series):
		return 'BIGINT'
	if pd.api.types.is_float_dtype(series):
		return 'DOUBLE PRECISION'
	if pd.api.types.is_datetime64_any_dtype(series):
		return 'TIMESTAMP'

	return 'TEXT'


def prepare_dataframe(df):
	"""Clean dataframe for DB import and return normalized columns + column types."""
	# Keep column names stable and unique after normalization.
	used = {}
	normalized_columns = []
	for col in df.columns:
		base = normalize_identifier(col)
		count = used.get(base, 0)
		final_name = base if count == 0 else f"{base}_{count + 1}"
		used[base] = count + 1
		normalized_columns.append(final_name)

	cleaned = df.copy()
	cleaned.columns = normalized_columns

	# Convert pandas NaN/NaT to Python None for psycopg2.
	cleaned = cleaned.where(pd.notna(cleaned), None)

	column_types = {col: infer_sql_type(cleaned[col]) for col in cleaned.columns}
	return cleaned, column_types


def create_table(conn, table_name, column_types):
	"""Create or replace table for the given Excel data."""
	with conn.cursor() as cur:
		cur.execute(sql.SQL("DROP TABLE IF EXISTS {}") .format(sql.Identifier(table_name)))

		column_defs = [
			sql.SQL("{} {}") .format(sql.Identifier(col), sql.SQL(col_type))
			for col, col_type in column_types.items()
		]

		create_query = sql.SQL("CREATE TABLE {} ({})").format(
			sql.Identifier(table_name),
			sql.SQL(', ').join(column_defs)
		)
		cur.execute(create_query)

	conn.commit()


def insert_rows(conn, table_name, df):
	"""Bulk insert Excel rows into PostgreSQL table."""
	if df.empty:
		print(f"No rows to insert into '{table_name}'.")
		return

	columns = list(df.columns)
	rows = [tuple(row) for row in df.itertuples(index=False, name=None)]

	insert_query = sql.SQL("INSERT INTO {} ({}) VALUES %s").format(
		sql.Identifier(table_name),
		sql.SQL(', ').join(sql.Identifier(col) for col in columns)
	)

	with conn.cursor() as cur:
		execute_values(cur, insert_query, rows)

	conn.commit()
	print(f"Inserted {len(rows)} rows into '{table_name}'.")


def upload_excel_to_db(excel_file_path, sheet_name=0, table_name=None):
	"""Read an Excel sheet and upload it to PostgreSQL."""
	if not Path(excel_file_path).exists():
		raise FileNotFoundError(f"Excel file not found: {excel_file_path}")

	df = pd.read_excel(excel_file_path, sheet_name=sheet_name)

	if table_name is None:
		if isinstance(sheet_name, str):
			table_name = normalize_identifier(sheet_name)
		else:
			table_name = normalize_identifier(Path(excel_file_path).stem)

	cleaned_df, column_types = prepare_dataframe(df)

	conn = psycopg2.connect(**DB_CONFIG)
	try:
		create_table(conn, table_name, column_types)
		insert_rows(conn, table_name, cleaned_df)
		print(f"Successfully uploaded '{excel_file_path}' to table '{table_name}'.")
	finally:
		conn.close()


def upload_all_excel_in_script_folder():
	"""Find all Excel files in this script folder and upload each one."""
	script_folder = Path(__file__).resolve().parent
	excel_files = []
	for pattern in ('*.xlsx', '*.xls', '*.xlsm'):
		excel_files.extend(script_folder.glob(pattern))

	if not excel_files:
		print(f"No Excel files found in: {script_folder}")
		return

	for excel_file in sorted(excel_files):
		try:
			print(f"Processing: {excel_file.name}")
			upload_excel_to_db(str(excel_file), sheet_name=0, table_name=None)
		except Exception as exc:
			print(f"Failed to process '{excel_file.name}': {exc}")


if __name__ == '__main__':
	if len(sys.argv) == 1:
		upload_all_excel_in_script_folder()
		sys.exit(0)

	if len(sys.argv) < 2:
		print("Usage: python database_xlsl_reader.py <excel_file_path> [sheet_name_or_index] [table_name]")
		sys.exit(1)

	file_path = sys.argv[1]
	raw_sheet = sys.argv[2] if len(sys.argv) >= 3 else 0
	target_table = sys.argv[3] if len(sys.argv) >= 4 else None

	try:
		sheet = int(raw_sheet)
	except ValueError:
		sheet = raw_sheet

	try:
		upload_excel_to_db(file_path, sheet_name=sheet, table_name=target_table)
	except Exception as exc:
		print(f"Error: {exc}")
		sys.exit(1)
