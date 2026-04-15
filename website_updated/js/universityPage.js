function findValueByNameHints(row, hints) {
  const keys = Object.keys(row || {});
  const matchedKey = keys.find((key) => hints.some((hint) => key.toLowerCase().includes(hint)));
  return matchedKey ? row[matchedKey] ?? "" : "";
}

function getValueByPosition(row, position) {
  return Object.values(row || {})[position] ?? "";
}

function pickValue(row, hints, position) {
  const byName = findValueByNameHints(row, hints);
  if (String(byName).trim() !== "") {
    return byName;
  }
  return getValueByPosition(row, position);
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }
  const parsed = Number.parseFloat(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function formatMoney(value) {
  const numeric = toNumber(value);
  if (Number.isFinite(numeric)) {
    return `${Math.round(numeric).toLocaleString("ru-RU")} KZT`;
  }
  return "Нет данных";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCorrectedRow(row) {
  const programName = pickValue(row, ["specialty", "faculty", "program", "major", "direction", "col_9"], 8);
  const passScore = pickValue(row, ["pass", "ent", "threshold", "min score", "minimum", "col_16"], 15);

  return {
    name: String(pickValue(row, ["university_name", "university", "name", "title", "col"], 0) || ""),
    city: String(pickValue(row, ["region", "city", "location", "col_2"], 1) || ""),
    type: String(pickValue(row, ["type", "ownership", "status", "col_3"], 2) || ""),
    email: String(pickValue(row, ["email", "mail", "col_4"], 3) || ""),
    phone: String(pickValue(row, ["phone", "contact", "tel", "col_5"], 4) || ""),
    website: String(pickValue(row, ["website", "site", "url", "col_6"], 5) || ""),
    subjectCombination: String(pickValue(row, ["subject", "profile", "col_7"], 6) || ""),
    programCode: String(pickValue(row, ["code", "col_8"], 7) || ""),
    programName: String(programName || "Не указано"),
    passScoreValue: toNumber(passScore),
    passScoreText: Number.isFinite(toNumber(passScore)) ? String(Math.round(toNumber(passScore))) : "Не указано",
    degree: String(pickValue(row, ["degree", "qualification", "level", "col_10"], 9) || ""),
    language: String(pickValue(row, ["language", "lang", "col_11"], 10) || ""),
    duration: String(pickValue(row, ["duration", "term", "length", "col_12"], 11) || ""),
    tuitionRaw: pickValue(row, ["tuition", "price", "cost", "fee", "col_13"], 12),
    transport: pickValue(row, ["transport", "col_17"], 16),
    apartment: pickValue(row, ["apartment", "flat", "room", "col_1"], 17),
    food: pickValue(row, ["food", "col_18"], 18),
    dormitory: pickValue(row, ["dormitory", "hostel_cost", "col_19"], 19),
    leisure: pickValue(row, ["leisure", "col_20"], 20),
    total: pickValue(row, ["sum", "total", "col_21"], 21),
    link: String(pickValue(row, ["link", "url", "col_14"], 13) || ""),
    row
  };
}

function findRowsByUniversity(rows, universityName) {
  const target = normalizeName(universityName);

  return rows.filter((row) => {
    const candidate = normalizeName(row.name);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}

function resolveCanonicalUniversityName(rows, universityName) {
  const target = normalizeName(universityName);
  if (!target) {
    return "";
  }

  const exact = rows.find((row) => normalizeName(row.name) === target);
  if (exact) {
    return exact.name;
  }

  const partial = rows.find((row) => {
    const candidate = normalizeName(row.name);
    return candidate.includes(target) || target.includes(candidate);
  });

  return partial ? partial.name : "";
}

function findRowsByCanonicalName(rows, canonicalName) {
  const canonical = normalizeName(canonicalName);
  if (!canonical) {
    return [];
  }

  return rows.filter((row) => normalizeName(row.name) === canonical);
}

function getRequestedUniversityName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "";
}

function getRequestedDirectionName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("direction") || "";
}

function findProgramIndexByDirection(programs, directionName) {
  const target = normalizeName(directionName);
  if (!target || !Array.isArray(programs) || programs.length === 0) {
    return 0;
  }

  const exactIndex = programs.findIndex((program) => normalizeName(program?.programName) === target);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const partialIndex = programs.findIndex((program) => {
    const candidate = normalizeName(program?.programName);
    return candidate.includes(target) || target.includes(candidate);
  });

  return partialIndex >= 0 ? partialIndex : 0;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = html;
  }
}

function setPageTitle(universityName) {
  const cleanName = String(universityName || "Университет").trim() || "Университет";
  document.title = `${cleanName} | UniFinder`;
}

function populateProgramSelects(programs) {
  const entSelect = document.getElementById("programSelectEnt");
  const tuitionSelect = document.getElementById("programSelectTuition");
  const chanceSelect = document.getElementById("chanceProgramSelect");

  [entSelect, tuitionSelect, chanceSelect].forEach((select) => {
    if (!select) return;
    select.innerHTML = '<option value="">Выберите направление</option>';

    programs.forEach((program, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${program.programName}${program.programCode ? ` (${program.programCode})` : ""}`;
      select.appendChild(option);
    });
  });
}

function renderProgramList(programs) {
  const list = document.getElementById("programList");
  if (!list) return;

  list.innerHTML = "";
  programs.forEach((program) => {
    const item = document.createElement("li");
    item.textContent = `${program.programName}${program.degree ? ` • ${program.degree}` : ""}${program.language ? ` • ${program.language}` : ""}`;
    list.appendChild(item);
  });

  const searchInput = document.getElementById("programSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const items = list.querySelectorAll("li");
    items.forEach((item) => {
      const isMatch = item.textContent.toLowerCase().includes(query);
      item.style.display = isMatch ? "list-item" : "none";
    });
  });
}

function renderRawData(correctedRows, transportRows) {
  const rows = [];

  correctedRows.forEach((entry, index) => {
    rows.push(`<h4>Запись программы ${index + 1}</h4>`);
    Object.entries(entry.row).forEach(([key, value]) => {
      rows.push(`<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value ?? "")}</div>`);
    });
  });

  transportRows.forEach((entry, index) => {
    rows.push(`<h4>Запись расходов ${index + 1}</h4>`);
    Object.entries(entry.row).forEach(([key, value]) => {
      rows.push(`<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value ?? "")}</div>`);
    });
  });

  setHtml("dbRawData", rows.length > 0 ? rows.join("") : "Нет данных по выбранному университету");
}

function updateProgramDependentBlocks(programs, selectedIndex) {
  if (programs.length === 0) {
    setText("entMinScore", "Минимальный балл: Нет данных");
    setText("entThreshold", "Пороговый балл: Нет данных");
    setText("entGrant", "Гранты: Нет данных");
    setText("entCompetition", "Конкурс: Нет данных");
    setText("tuitionValue", "Стоимость: Нет данных");
    setText("tuitionGrant", "Гранты: Нет данных");
    return;
  }

  const fallbackIndex = Number.isFinite(selectedIndex) && selectedIndex >= 0 && selectedIndex < programs.length ? selectedIndex : 0;
  const current = programs[fallbackIndex];

  const tuitionText = formatMoney(current.tuitionRaw);
  setText("entMinScore", "Минимальный балл: Нет данных");
  setText("entThreshold", "Пороговый балл: Нет данных");
  setText("entGrant", "Гранты: Нет данных");
  setText("entCompetition", "Конкурс: Нет данных");
  setText("tuitionValue", `Стоимость: ${tuitionText}`);
  setText("tuitionGrant", "Гранты: Нет данных");
}

function getChanceByScoreGap(scoreGap) {
  if (!Number.isFinite(scoreGap)) {
    return "Нет данных";
  }

  if (scoreGap >= 20) {
    return "Высокий";
  }

  if (scoreGap >= 0) {
    return "Средний";
  }

  return "Низкий";
}

function setupChanceCalculator(programs, transport, initialIndex = 0) {
  const entInput = document.getElementById("chanceEntInput");
  const programSelect = document.getElementById("chanceProgramSelect");

  if (programSelect && programs.length > 0) {
    const safeIndex = Number.isFinite(initialIndex) && initialIndex >= 0 && initialIndex < programs.length ? initialIndex : 0;
    programSelect.value = String(safeIndex);
  }

  function renderChance() {
    const entValue = toNumber(entInput?.value);
    const selectedIndex = Number.parseInt(programSelect?.value || "", 10);
    const selectedProgram = Number.isFinite(selectedIndex) && programs[selectedIndex] ? programs[selectedIndex] : programs[0];
    const requiredScore = toNumber(selectedProgram?.passScoreValue);

    if (!Number.isFinite(entValue)) {
      setText("chanceResult", "Шанс поступления: Укажите балл ЕНТ");
      return;
    }

    if (!Number.isFinite(requiredScore)) {
      setText("chanceResult", "Шанс поступления: Нет данных по выбранному направлению");
      return;
    }

    const scoreGap = entValue - requiredScore;
    const chance = getChanceByScoreGap(scoreGap);
    const gapText = `${scoreGap >= 0 ? "+" : ""}${Math.round(scoreGap)}`;

    setText("chanceResult", `Шанс поступления: ${chance} (разница ${gapText} баллов)`);
  }

  [entInput, programSelect].forEach((el) => {
    if (el) {
      el.addEventListener("input", renderChance);
      el.addEventListener("change", renderChance);
    }
  });

  renderChance();
}

function renderMainBlocks(universityName, programs, transportRows) {
  const firstProgram = programs[0];
  const firstTransport = transportRows[0] || null;

  setPageTitle(universityName);

  setText("uniName", universityName || "Университет не найден");
  setText("uniCity", firstProgram?.city || "Город: Нет данных");

  setText("uniType", `Тип: ${firstProgram?.type || "Нет данных"}`);
  setText("uniEmail", `Email: ${firstProgram?.email || "Нет данных"}`);
  setText("uniPhone", `Телефон: ${firstProgram?.phone || "Нет данных"}`);
  setHtml("uniWebsite", `Сайт: ${firstProgram?.website ? `<a href="${escapeHtml(firstProgram.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(firstProgram.website)}</a>` : "Нет данных"}`);
  setHtml("uniProgramLink", `Ссылка на программу: ${firstProgram?.link ? `<a href="${escapeHtml(firstProgram.link)}" target="_blank" rel="noopener noreferrer">Открыть</a>` : "Нет данных"}`);

  setText("dormYearly", `Общежитие: ${formatMoney(firstTransport?.dormitory)}`);
  setText("apartmentCost", `Аренда: ${formatMoney(firstTransport?.apartment)}`);
  setText("livingTotal", `Итого расходов/мес: ${formatMoney(firstTransport?.total)}`);

  setText("foodCost", `Питание: ${formatMoney(firstTransport?.food)}`);
  setText("transportCost", `Транспорт: ${formatMoney(firstTransport?.transport)}`);
  setText("leisureCost", `Досуг: ${formatMoney(firstTransport?.leisure)}`);

  setupLivingModeSwitch(firstTransport);
}

function setupLivingModeSwitch(transport) {
  const dormRadio = document.getElementById("livingModeDorm");
  const apartmentRadio = document.getElementById("livingModeApartment");

  if (!dormRadio || !apartmentRadio) {
    return;
  }

  const dormCost = toNumber(transport?.dormitory);
  const apartmentCost = toNumber(transport?.apartment);
  const foodCost = toNumber(transport?.food);
  const transportCost = toNumber(transport?.transport);
  const leisureCost = toNumber(transport?.leisure);
  const fallbackTotal = toNumber(transport?.total);

  const extraCosts = [foodCost, transportCost, leisureCost]
    .filter((value) => Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0);

  function computeTotal(mode) {
    const livingCost = mode === "apartment" ? apartmentCost : dormCost;
    if (Number.isFinite(livingCost) && Number.isFinite(extraCosts)) {
      return livingCost + extraCosts;
    }
    return fallbackTotal;
  }

  function renderTotal() {
    const mode = apartmentRadio.checked ? "apartment" : "dorm";
    const total = computeTotal(mode);
    setText("livingTotal", `Итого расходов/мес: ${formatMoney(total)}`);
  }

  dormRadio.addEventListener("change", renderTotal);
  apartmentRadio.addEventListener("change", renderTotal);
  renderTotal();
}

function setupProgramLinkedFields(programs, initialIndex = 0) {
  const entSelect = document.getElementById("programSelectEnt");
  const tuitionSelect = document.getElementById("programSelectTuition");

  function syncSelection(sourceValue) {
    const idx = Number.parseInt(sourceValue || "", 10);
    if (entSelect) entSelect.value = sourceValue;
    if (tuitionSelect) tuitionSelect.value = sourceValue;
    updateProgramDependentBlocks(programs, idx);
  }

  if (entSelect) {
    entSelect.addEventListener("change", () => syncSelection(entSelect.value));
  }
  if (tuitionSelect) {
    tuitionSelect.addEventListener("change", () => syncSelection(tuitionSelect.value));
  }

  const safeIndex = Number.isFinite(initialIndex) && initialIndex >= 0 && initialIndex < programs.length ? initialIndex : 0;
  const initialValue = String(safeIndex);
  if (entSelect) entSelect.value = initialValue;
  if (tuitionSelect) tuitionSelect.value = initialValue;
  updateProgramDependentBlocks(programs, safeIndex);
}

async function loadUniversityPage() {
  const targetName = getRequestedUniversityName();
  const targetDirection = getRequestedDirectionName();

  const unifiedResponse = await fetch("/api/universities?limit=1000&offset=0");

  if (!unifiedResponse.ok) {
    throw new Error("Не удалось загрузить данные");
  }

  const unifiedPayload = await unifiedResponse.json();
  const unifiedRows = (Array.isArray(unifiedPayload.rows) ? unifiedPayload.rows : []).map(normalizeCorrectedRow);

  const canonicalName = resolveCanonicalUniversityName(unifiedRows, targetName)
    || targetName;

  const filteredPrograms = findRowsByCanonicalName(unifiedRows, canonicalName);
  const filteredTransport = filteredPrograms;
  const initialProgramIndex = findProgramIndexByDirection(filteredPrograms, targetDirection);

  const resolvedName = canonicalName || filteredPrograms[0]?.name || filteredTransport[0]?.name || "Университет";

  renderMainBlocks(resolvedName, filteredPrograms, filteredTransport);
  populateProgramSelects(filteredPrograms);
  renderProgramList(filteredPrograms);
  setupProgramLinkedFields(filteredPrograms, initialProgramIndex);
  setupChanceCalculator(filteredPrograms, filteredTransport[0], initialProgramIndex);
  renderRawData(filteredPrograms, filteredTransport);
}

loadUniversityPage().catch(() => {
  setPageTitle("Университет");
  setText("uniName", "Не удалось загрузить данные университета");
  setText("uniCity", "Проверьте подключение к API");
  setHtml("dbRawData", "Ошибка загрузки данных.");
});
