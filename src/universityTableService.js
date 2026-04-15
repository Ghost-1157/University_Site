const db = require("./db");

const TABLE_NAME = process.env.UNIFIED_UNIVERSITIES_TABLE || process.env.UNIVERSITIES_TABLE || "university_table_final";

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

async function listRows({ limit, offset }) {
  const safeLimit = Math.min(toPositiveInt(limit, 50), 500);
  const safeOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

  const dataResult = await db.query(
    `SELECT * FROM ${TABLE_NAME} LIMIT $1 OFFSET $2`,
    [safeLimit, safeOffset]
  );

  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM ${TABLE_NAME}`);

  return {
    total: countResult.rows[0]?.total || 0,
    limit: safeLimit,
    offset: safeOffset,
    rows: dataResult.rows
  };
}

async function getColumns() {
  const result = await db.query(
    `
      SELECT
        column_name,
        data_type,
        ordinal_position
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `,
    [TABLE_NAME]
  );

  return result.rows;
}

async function getAllowedColumnSet() {
  const columns = await getColumns();
  return new Set(columns.map((column) => column.column_name));
}

async function tableHasRows() {
  const result = await db.query(`SELECT EXISTS(SELECT 1 FROM ${TABLE_NAME}) AS has_rows`);
  return Boolean(result.rows[0]?.has_rows);
}

async function getRowByNumber(rowNumber) {
  const safeRowNumber = toPositiveInt(rowNumber, 1);

  const result = await db.query(
    `
      SELECT *
      FROM (
        SELECT ROW_NUMBER() OVER () AS row_number, t.*
        FROM ${TABLE_NAME} AS t
      ) AS numbered
      WHERE row_number = $1
    `,
    [safeRowNumber]
  );

  return result.rows[0] || null;
}

async function insertRow(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload must be a JSON object.");
  }

  const columns = Object.keys(payload);
  if (columns.length === 0) {
    throw new Error("Payload cannot be empty.");
  }

  const allowedColumns = await getAllowedColumnSet();
  for (const column of columns) {
    if (!allowedColumns.has(column)) {
      throw new Error(`Column '${column}' does not exist in ${TABLE_NAME}.`);
    }
  }

  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const quotedColumns = columns.map((column) => `"${column.replace(/"/g, '""')}"`).join(", ");
  const values = columns.map((column) => payload[column]);

  const queryText = `
    INSERT INTO ${TABLE_NAME} (${quotedColumns})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await db.query(queryText, values);
  return result.rows[0];
}

async function updateRowByNumber(rowNumber, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload must be a JSON object.");
  }

  const columns = Object.keys(payload);
  if (columns.length === 0) {
    throw new Error("Payload cannot be empty.");
  }

  const safeRowNumber = toPositiveInt(rowNumber, 1);
  const allowedColumns = await getAllowedColumnSet();

  for (const column of columns) {
    if (!allowedColumns.has(column)) {
      throw new Error(`Column '${column}' does not exist in ${TABLE_NAME}.`);
    }
  }

  const assignments = columns
    .map((column, index) => `"${column.replace(/"/g, '""')}" = $${index + 1}`)
    .join(", ");
  const values = columns.map((column) => payload[column]);

  const queryText = `
    WITH target AS (
      SELECT ctid
      FROM (
        SELECT ROW_NUMBER() OVER () AS row_number, ctid
        FROM ${TABLE_NAME}
      ) AS numbered
      WHERE row_number = $${columns.length + 1}
    )
    UPDATE ${TABLE_NAME} AS t
    SET ${assignments}
    FROM target
    WHERE t.ctid = target.ctid
    RETURNING t.*
  `;

  const result = await db.query(queryText, [...values, safeRowNumber]);
  return result.rows[0] || null;
}

async function deleteRowByNumber(rowNumber) {
  const safeRowNumber = toPositiveInt(rowNumber, 1);

  const queryText = `
    WITH target AS (
      SELECT ctid
      FROM (
        SELECT ROW_NUMBER() OVER () AS row_number, ctid
        FROM ${TABLE_NAME}
      ) AS numbered
      WHERE row_number = $1
    )
    DELETE FROM ${TABLE_NAME} AS t
    USING target
    WHERE t.ctid = target.ctid
    RETURNING t.*
  `;

  const result = await db.query(queryText, [safeRowNumber]);
  return result.rows[0] || null;
}

module.exports = {
  TABLE_NAME,
  listRows,
  getColumns,
  getRowByNumber,
  insertRow,
  updateRowByNumber,
  deleteRowByNumber,
  tableHasRows
};
