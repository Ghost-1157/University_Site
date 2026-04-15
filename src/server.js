require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const correctedService = require("./universityTableService");

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

function registerTableRoutes(routePrefix, service) {
  app.get(routePrefix, async (req, res) => {
    try {
      const result = await service.listRows({
        limit: req.query.limit,
        offset: req.query.offset
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get(`${routePrefix}/columns`, async (_req, res) => {
    try {
      const columns = await service.getColumns();
      res.status(200).json({ table: service.TABLE_NAME, columns });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get(`${routePrefix}/row/:rowNumber`, async (req, res) => {
    try {
      const row = await service.getRowByNumber(req.params.rowNumber);
      if (!row) {
        res.status(404).json({ error: "Row not found" });
        return;
      }

      res.status(200).json(row);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(routePrefix, async (req, res) => {
    try {
      const inserted = await service.insertRow(req.body);
      res.status(201).json(inserted);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch(`${routePrefix}/row/:rowNumber`, async (req, res) => {
    try {
      const updated = await service.updateRowByNumber(req.params.rowNumber, req.body);
      if (!updated) {
        res.status(404).json({ error: "Row not found" });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete(`${routePrefix}/row/:rowNumber`, async (req, res) => {
    try {
      const deleted = await service.deleteRowByNumber(req.params.rowNumber);
      if (!deleted) {
        res.status(404).json({ error: "Row not found" });
        return;
      }

      res.status(200).json({ deleted: true, row: deleted });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "website")));
app.use("/pdfs", express.static(path.join(__dirname, "..", "pdfs")));
app.use("/public", express.static(path.join(__dirname, "..", "public")));
app.use("/website", express.static(path.join(__dirname, "..", "website")));
app.use("/website-old", express.static(path.join(__dirname, "..", "website_old")));
app.use("/website-updated", express.static(path.join(__dirname, "..", "website_updated")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "website", "index.html"));
});

app.get("/website", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "website", "index.html"));
});

app.get("/website-old", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "website_old", "index.html"));
});

app.get("/website-updated", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "website_updated", "index.html"));
});

registerTableRoutes("/api/universities", correctedService);
registerTableRoutes("/api/university-table-corrected", correctedService);
registerTableRoutes("/api/university-transport-food-home", correctedService);

app.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`Node integration running on http://localhost:${port}`);
  console.log(`Focused table: ${correctedService.TABLE_NAME}`);
});

async function shutdown() {
  server.close(async () => {
    await db.closePool();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
