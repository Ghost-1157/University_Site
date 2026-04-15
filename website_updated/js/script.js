const baseUniversities = [
  { name: "Eurasian National University", short: "ENU", region: "Astana", logo: "assets/images/logos/enu.png", page: "university.html" },
  { name: "Al-Farabi Kazakh National University", short: "KazNU", region: "Almaty", logo: "assets/images/logos/kaznu.png", page: "university.html" },
  { name: "Satbayev University", short: "Satbayev", region: "Almaty", logo: "assets/images/logos/satbayev.png", page: "university.html" },
  { name: "Abai Kazakh National Pedagogical University", short: "Abai", region: "Almaty", logo: "assets/images/logos/abai.png", page: "university.html" },
  { name: "Kazakh National Agrarian Research University", short: "Agro", region: "Almaty", logo: "assets/images/logos/agro.png", page: "university.html" },
  { name: "Auezov South Kazakhstan University", short: "Auezov", region: "Shymkent", logo: "assets/images/logos/auezov.png", page: "university.html" },
  { name: "Yasawi International Kazakh-Turkish University", short: "Yasawi", region: "Turkistan", logo: "assets/images/logos/yasawi.png", page: "university.html" },
  { name: "Buketov Karaganda University", short: "Buketov", region: "Karagandy", logo: "assets/images/logos/buketov.png", page: "university.html" },
  { name: "Saginov Technical University", short: "Saginov", region: "Karagandy", logo: "assets/images/logos/saginov.png", page: "university.html" },
  { name: "Almaty Technological University", short: "ATU", region: "Almaty", logo: "assets/images/logos/atu.png", page: "university.html" },
  { name: "Asfendiyarov Kazakh National Medical University", short: "KazNMU", region: "Almaty", logo: "assets/images/logos/med.png", page: "university.html" },
  { name: "D. Serikbayev East Kazakhstan Technical University", short: "VKTU", region: "Ust-Kamenogorsk", logo: "assets/images/logos/vktu.png", page: "university.html" },
  { name: "KBTU", short: "KBTU", region: "Almaty", logo: "assets/images/logos/kbtu.png", page: "university.html" },
  { name: "Narxoz University", short: "Narxoz", region: "Almaty", logo: "assets/images/logos/narxoz.png", page: "university.html" },
  { name: "KazUIR and WL", short: "KazUIR", region: "Almaty", logo: "assets/images/logos/umo.png", page: "university.html" },
  { name: "S.Seifullin Kazakh Agrotechnical University", short: "KATU", region: "Astana", logo: "assets/images/logos/katu.png", page: "university.html" },
  { name: "Yessenov University", short: "Yessenov", region: "Aktau", logo: "assets/images/logos/yessenov.png", page: "university.html" },
  { name: "Kozybayev University", short: "SKU", region: "Petropavlovsk", logo: "assets/images/logos/sku.png", page: "university.html" },
  { name: "Toraighyrov University", short: "Toraighyrov", region: "Pavlodar", logo: "assets/images/logos/toraighyrov.png", page: "university.html" },
  { name: "Shakarim University", short: "Shakarim", region: "Semey", logo: "assets/images/logos/shakarim.png", page: "university.html" }
];

const UNIVERSITY_NAME_ALIASES = {
  "евразийский национальный университет имени л н гумилева": "Eurasian National University",
  "казахский национальный университет им аль фараби": "Al-Farabi Kazakh National University",
  "казахский национальный педагогический университет имени абая": "Abai Kazakh National Pedagogical University",
  "казахский национальный аграрный исследовательский университет": "Kazakh National Agrarian Research University",
  "южно казахстанский университет имени м о ауэзова": "Auezov South Kazakhstan University",
  "южно казахста нский университет имени м о ауэзова": "Auezov South Kazakhstan University",
  "международный казахско турецкий университет им ходжа ахмет ясауи": "Yasawi International Kazakh-Turkish University",
  "карагандинский национальный исследовательский университет им академика е а букетова": "Buketov Karaganda University",
  "карагандинский технический университет имени абылкаса сагинова": "Saginov Technical University",
  "алматинский технологический университет": "Almaty Technological University",
  "казахский национальный медицинский университет имени с д асфендиярова": "Asfendiyarov Kazakh National Medical University",
  "восточно казахстанский технический университет им д серикбаева": "D. Serikbayev East Kazakhstan Technical University",
  "казахстанско британский технический университет": "KBTU",
  "университет нархоз": "Narxoz University",
  "казахский университет международных отношений и мировых языков имени абылай хана": "KazUIR and WL",
  "казахский агротехнический университет имени с сейфуллина": "S.Seifullin Kazakh Agrotechnical University",
  "каспийский университет технологий и инжиниринга им ш есенова": "Yessenov University",
  "северо казахстанский университет имени манаша козыбаева": "Kozybayev University",
  "торайгыров университет": "Toraighyrov University",
  "шәкәрім университет": "Shakarim University",
  "шакарім университет": "Shakarim University",
  "шакарим университет": "Shakarim University",
  "казахский национальный исследовательский технический университет": "Satbayev University"
};

const universitiesList = document.getElementById("universitiesList");
const resultsCount = document.getElementById("resultsCount");
const recommendationsList = document.getElementById("recommendationsList");
const recommendationsBlock = document.getElementById("recommendationsBlock");
const applyBtn = document.getElementById("applyFilters");
const resetBtn = document.getElementById("resetFilters");
const searchInput = document.getElementById("searchInput");
const facultySelect = document.getElementById("faculty");
const directionSelect = document.getElementById("direction");

let universities = [];

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
  if (String(byName).trim() !== "") return byName;
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
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const parsed = Number.parseFloat(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function formatMoney(value) {
  const numeric = toNumber(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric).toLocaleString("ru-RU")} ₸` : "Не указано";
}

function formatDirectionCost(program) {
  const direction = String(program?.name || "Направление не указано").trim();
  return `${direction}: ${formatMoney(program?.tuition)}`;
}

function summarizeDirectionCosts(programs) {
  const unique = [];
  const seen = new Set();

  programs.forEach((program) => {
    const key = normalizeName(program?.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(formatDirectionCost(program));
  });

  if (unique.length === 0) return "Не указано";

  const visible = unique.slice(0, 3).join("; ");
  const remaining = unique.length - 3;
  return remaining > 0 ? `${visible}; и еще ${remaining}` : visible;
}

function priceBucketFromTuition(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "";
  if (n <= 500000) return "low";
  if (n <= 800000) return "midlow";
  if (n <= 1200000) return "mid";
  if (n <= 1800000) return "midhigh";
  return "high";
}

function facultyTagFromText(value) {
  const text = String(value || "").toLowerCase();
  if (/it|program|informat|data/.test(text)) return "IT";
  if (/finance|econom|business|management/.test(text)) return "Business";
  if (/engineer|technical|construction|robot/.test(text)) return "Engineering";
  if (/med|bio|chem|pharma|dental/.test(text)) return "Medicine";
  if (/law|juris/.test(text)) return "Law";
  if (/pedagog|education/.test(text)) return "Pedagogy";
  if (/history|human|philolog/.test(text)) return "Humanities";
  if (/journal/.test(text)) return "Journalism";
  if (/architect/.test(text)) return "Architecture";
  if (/design|art|music/.test(text)) return "Arts";
  return "";
}

function facultyTagFromSubjects(value) {
  const text = String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return "";

  if (/математика.*физика|физика.*математика/.test(text)) return "IT";
  if (/география.*математика|математика.*география/.test(text)) return "Business";
  if (/биология.*химия|химия.*биология/.test(text)) return "Medicine";
  if (/всемирная история.*основы права|основы права.*всемирная история/.test(text)) return "Law";
  if (/биология.*география|география.*биология/.test(text)) return "Pedagogy";
  if (/история.*чоп|чоп.*история/.test(text)) return "Humanities";
  if (/творческий экзамен.*творческий экзамен/.test(text)) return "Arts";
  if (/математика.*творческий экзамен|творческий экзамен.*математика/.test(text)) return "Architecture";
  if (/творческий экзамен/.test(text)) return "Journalism";

  return "";
}

function findBestRow(rows, universityName) {
  const target = normalizeName(universityName);
  const exact = rows.find((row) => normalizeName(row.name) === target);
  if (exact) return exact;

  return rows.find((row) => {
    const candidate = normalizeName(row.name);
    return candidate.includes(target) || target.includes(candidate);
  }) || null;
}

function resolveBaseUniversity(universityName) {
  const direct = findBestRow(baseUniversities, universityName);
  if (direct) return direct;

  const normalized = normalizeName(universityName);
  const aliasTargetName = UNIVERSITY_NAME_ALIASES[normalized];
  if (aliasTargetName) {
    return baseUniversities.find((item) => normalizeName(item.name) === normalizeName(aliasTargetName)) || null;
  }

  return null;
}

function getUniversityNameTokens(value) {
  const stopwords = new Set([
    "university", "universitet", "университет", "университета", "университеті",
    "kazakh", "kazakhstan", "казахский", "казахстанский", "national", "национальный",
    "state", "государственный", "named", "имени", "international", "международный",
    "research", "technical", "технический", "education", "образования"
  ]);

  return normalizeName(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function assignMissingLogosFromKnownCards(list) {
  const withLogo = list
    .filter((item) => item.logo)
    .map((item) => ({
      ...item,
      tokens: getUniversityNameTokens(item.name)
    }));

  list.forEach((item) => {
    if (item.logo || withLogo.length === 0) return;

    const itemTokens = getUniversityNameTokens(item.name);
    if (itemTokens.length === 0) return;

    let best = null;

    withLogo.forEach((candidate) => {
      const common = itemTokens.filter((token) => candidate.tokens.includes(token)).length;
      const regionBonus = item.region && candidate.region && item.region === candidate.region ? 2 : 0;
      const score = common * 10 + regionBonus;

      if (!best || score > best.score) {
        best = { candidate, score, common };
      }
    });

    const canUseMatch = best && (best.common >= 2 || (best.common >= 1 && best.score >= 12));
    if (!canUseMatch) return;

    item.logo = best.candidate.logo;
    if (!item.short || item.short === item.name) {
      item.short = best.candidate.short || item.short;
    }
  });
}

function normalizeCorrectedRow(row) {
  const name = pickValue(row, ["university_name", "university", "name", "title", "col"], 0);
  const region = pickValue(row, ["region", "city", "location"], 1);
  const faculty = pickValue(row, ["specialty", "faculty", "program", "major", "direction"], 8);
  const subjectPair = pickValue(row, ["subject", "profile", "combination", "col_15"], 14);
  const passScore = pickValue(row, ["pass", "ent", "threshold"], 14);
  const lastYearScore = pickValue(row, ["last", "previous", "year"], 15);
  const tuition = pickValue(row, ["tuition", "price", "cost", "fee"], 12);
  const dormValue = pickValue(row, ["dorm", "hostel"], 6);
  const transportValue = pickValue(row, ["transport", "col_2"], 1);
  const apartmentValue = pickValue(row, ["apartment", "flat", "col_1"], 2);
  const foodValue = pickValue(row, ["food", "col_3"], 3);
  const dormLivingValue = pickValue(row, ["dormitory", "hostel_cost", "col_4"], 4);
  const leisureValue = pickValue(row, ["leisure", "col_5"], 5);
  const totalLivingValue = pickValue(row, ["sum", "total", "col_6"], 6);

  const dormText = String(dormValue || "").toLowerCase();

  return {
    name: String(name || ""),
    region: String(region || ""),
    faculty: String(faculty || ""),
    facultyTag: facultyTagFromSubjects(subjectPair) || facultyTagFromText(faculty),
    passScoreValue: toNumber(passScore),
    passScoreText: Number.isFinite(toNumber(passScore)) ? String(Math.round(toNumber(passScore))) : "Не указано",
    lastYearScoreText: Number.isFinite(toNumber(lastYearScore)) ? String(Math.round(toNumber(lastYearScore))) : "Не указано",
    tuitionValue: toNumber(tuition),
    tuitionText: formatMoney(tuition),
    price: priceBucketFromTuition(tuition),
    dorm: /yes|true|1|available|has/.test(dormText),
    transportValue: toNumber(transportValue),
    apartmentValue: toNumber(apartmentValue),
    foodValue: toNumber(foodValue),
    dormLivingValue: toNumber(dormLivingValue),
    totalLivingValue: toNumber(totalLivingValue),
    leisureValue: toNumber(leisureValue)
  };
}
function mergeUniversityData(unifiedRows) {
  const corrected = unifiedRows.map(normalizeCorrectedRow).filter((row) => row.name);
  const seen = new Set();
  const merged = corrected.map((c) => {
    const base = resolveBaseUniversity(c.name);
    seen.add(normalizeName(base?.name || c.name));

    return {
      name: c.name,
      short: base?.short || c.name,
      logo: base?.logo || "",
      page: base?.page || "university.html",
      region: c.region || base?.region || "Не указано",
      dorm: typeof c.dorm === "boolean" ? c.dorm : true,
      faculty: c.faculty || "Не указано",
      facultyTag: c.facultyTag || "",
      facultyTags: c.facultyTag ? [c.facultyTag] : [],
      directions: c.faculty ? [c.faculty] : [],
      passScoreValue: Number.isFinite(c.passScoreValue) ? c.passScoreValue : NaN,
      passScore: c.passScoreText || "Не указано",
      lastYearScore: c.lastYearScoreText || "Не указано",
      tuitionValue: Number.isFinite(c.tuitionValue) ? c.tuitionValue : NaN,
      tuitionText: c.tuitionText || "Не указано",
      price: c.price || "",
      programPriceBuckets: c.price ? [c.price] : [],
      totalLivingValue: Number.isFinite(c.totalLivingValue) ? c.totalLivingValue : NaN
    };
  });

  baseUniversities.forEach((base) => {
    const key = normalizeName(base.name);
    if (seen.has(key)) {
      return;
    }

    merged.push({
      name: base.name,
      short: base.short,
      logo: base.logo,
      page: base.page,
      region: base.region || "Не указано",
      dorm: true,
      faculty: "Не указано",
      facultyTag: "",
      facultyTags: [],
      directions: [],
      passScoreValue: NaN,
      passScore: "Не указано",
      lastYearScore: "Не указано",
      tuitionValue: NaN,
      tuitionText: "Не указано",
      price: "",
      programPriceBuckets: [],
      totalLivingValue: NaN
    });
  });

  assignMissingLogosFromKnownCards(merged);

  return merged;
}

function getElementValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function populateDirectionFilter(list, selectedFaculty = "", selectedDirection = "") {
  if (!directionSelect) return;

  const filteredByFaculty = selectedFaculty
    ? list.filter((uni) => Array.isArray(uni.facultyTags) && uni.facultyTags.includes(selectedFaculty))
    : list;

  const allDirections = [...new Set(
    filteredByFaculty
      .flatMap((uni) => Array.isArray(uni.directions) ? uni.directions : [])
      .map((direction) => String(direction || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "ru"));

  directionSelect.innerHTML = '<option value="">Все направления</option>';
  allDirections.forEach((direction) => {
    const option = document.createElement("option");
    option.value = direction;
    option.textContent = direction;
    directionSelect.appendChild(option);
  });

  if (selectedDirection && allDirections.includes(selectedDirection)) {
    directionSelect.value = selectedDirection;
  } else {
    directionSelect.value = "";
  }
}

function renderRecommendations(list) {
  if (!recommendationsBlock || !recommendationsList) return;

  if (list.length === 0) {
    recommendationsBlock.classList.add("hidden");
    recommendationsList.innerHTML = "";
    return;
  }

  const top = list.slice(0, 3);
  recommendationsList.innerHTML = "";

  top.forEach((uni, index) => {
    const grantChance =
      !Number.isFinite(uni.passScoreValue) || uni.passScoreValue <= 80 ? "Высокий" :
      uni.passScoreValue <= 100 ? "Средний" :
      "Низкий";

    const paidChance =
      !Number.isFinite(uni.passScoreValue) || uni.passScoreValue <= 110 ? "Высокий" : "Средний";

    const card = document.createElement("div");
    card.className = "recommendation-card";
    card.innerHTML = `
      <h5>Вариант ${index + 1}: ${uni.name}</h5>
      <p>Специальность: ${uni.faculty}</p>
      <p>Шанс получить грант: ${grantChance}</p>
      <p>Шанс на платное обучение: ${paidChance}</p>
    `;
    recommendationsList.appendChild(card);
  });

  recommendationsBlock.classList.remove("hidden");
}

function renderUniversities(list) {
  if (!universitiesList || !resultsCount) return;

  universitiesList.innerHTML = "";

  if (list.length === 0) {
    universitiesList.innerHTML = "<p>Нет результатов по заданным фильтрам.</p>";
    resultsCount.textContent = "Найдено: 0";
    return;
  }

  list.forEach((uni) => {
    const card = document.createElement("div");
    card.className = "university-card";
    const fallbackMark = String(uni.short || uni.name).slice(0, 3).replace(/['"<>]/g, "");

    const livingText = Number.isFinite(uni.totalLivingValue)
      ? `${Math.round(uni.totalLivingValue).toLocaleString("ru-RU")} ₸`
      : "Не указано";

    card.innerHTML = `
      <div class="university-logo">
        ${uni.logo
          ? `<img src="${uni.logo}" alt="${uni.name} логотип" loading="lazy" decoding="async" onerror="this.onerror=null; this.parentElement.innerHTML='<span>${fallbackMark}</span>';" />`
          : `<span>${fallbackMark}</span>`}
      </div>
      <div class="university-info">
        <h4>${uni.name}</h4>
        <div class="university-details">
          <span><strong>Город:</strong> ${uni.region}</span>
          <span><strong>Направление:</strong> ${uni.faculty || "Не указано"}</span>
          <span><strong>Общежитие:</strong> ${uni.dorm ? "Да" : "Нет"}</span>
          <span><strong>Проходной балл:</strong> ${uni.passScore}</span>
          <span><strong>Минимум прошлого года:</strong> ${uni.lastYearScore}</span>
          <span><strong>Обучение:</strong> ${uni.tuitionText}</span>
          <span><strong>Проживание/месяц:</strong> ${livingText}</span>
        </div>
        <div class="university-action">
          <a href="${uni.page || "university.html"}?name=${encodeURIComponent(uni.name)}&direction=${encodeURIComponent(uni.faculty || "")}">Подробнее</a>
        </div>
      </div>
    `;

    universitiesList.appendChild(card);
  });

  resultsCount.textContent = `Найдено: ${list.length}`;
}

function getFilteredUniversities() {
  const regionValue = getElementValue("region");
  const priceValue = getElementValue("price");
  const facultyValue = getElementValue("faculty");
  const directionValue = getElementValue("direction");
  const entValue = toNumber(getElementValue("ent"));
  const dormValue = getElementValue("dorm");
  const livingBudgetValue = toNumber(getElementValue("livingBudget"));
  const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";

  return universities.filter((uni) => {
    const matchRegion = !regionValue || uni.region === regionValue;
    const matchPrice = !priceValue || (Array.isArray(uni.programPriceBuckets) && uni.programPriceBuckets.includes(priceValue));
    const matchFaculty = !facultyValue || (Array.isArray(uni.facultyTags) && uni.facultyTags.includes(facultyValue));
    const matchDirection = !directionValue || (Array.isArray(uni.directions) && uni.directions.includes(directionValue));
    const matchEnt = !Number.isFinite(entValue) || !Number.isFinite(uni.passScoreValue) || entValue >= uni.passScoreValue;
    const matchDorm = !dormValue || (dormValue === "yes" ? uni.dorm : !uni.dorm);
    const matchLivingBudget = !Number.isFinite(livingBudgetValue) || !Number.isFinite(uni.totalLivingValue) || uni.totalLivingValue <= livingBudgetValue;
    const matchSearch = !searchValue || [uni.name, uni.region, uni.faculty, ...(uni.directions || [])].join(" ").toLowerCase().includes(searchValue);

    return matchRegion && matchPrice && matchFaculty && matchDirection && matchEnt && matchDorm && matchLivingBudget && matchSearch;
  });
}

function filterUniversities() {
  const filtered = getFilteredUniversities();
  renderUniversities(filtered);
  renderRecommendations(filtered);
}

function resetFilters() {
  ["region", "price", "faculty", "direction", "ent", "dorm", "livingBudget", "studyType"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  if (searchInput) searchInput.value = "";
  populateDirectionFilter(universities);

  renderUniversities(universities);
  if (recommendationsBlock) recommendationsBlock.classList.add("hidden");
  if (recommendationsList) recommendationsList.innerHTML = "";
}

async function loadUniversitiesFromApi() {
  const unifiedResponse = await fetch("/api/universities?limit=1000&offset=0");

  if (!unifiedResponse.ok) {
    throw new Error("Ошибка при запросе данных");
  }

  const unifiedPayload = await unifiedResponse.json();
  const unifiedRows = Array.isArray(unifiedPayload.rows) ? unifiedPayload.rows : [];

  universities = mergeUniversityData(unifiedRows);
}

if (applyBtn) applyBtn.addEventListener("click", filterUniversities);
if (resetBtn) resetBtn.addEventListener("click", resetFilters);
if (searchInput) searchInput.addEventListener("input", filterUniversities);
if (facultySelect) {
  facultySelect.addEventListener("change", () => {
    populateDirectionFilter(universities, getElementValue("faculty"), getElementValue("direction"));
  });
}

loadUniversitiesFromApi()
  .then(() => {
    populateDirectionFilter(universities, getElementValue("faculty"), getElementValue("direction"));
    renderUniversities(universities);
    if (recommendationsBlock) recommendationsBlock.classList.add("hidden");
  })
  .catch(() => {
    universities = baseUniversities.map((uni) => ({
      ...uni,
      dorm: true,
      faculty: "Не указано",
      facultyTag: "",
      facultyTags: [],
      directions: [],
      passScore: "Не указано",
      passScoreValue: NaN,
      lastYearScore: "Не указано",
      tuitionText: "Не указано",
      tuitionValue: NaN,
      price: "",
      programPriceBuckets: [],
      totalLivingValue: NaN
    }));
    populateDirectionFilter(universities, getElementValue("faculty"), getElementValue("direction"));
    renderUniversities(universities);
  });

const accordionHeaders = document.querySelectorAll(".accordion-header");
accordionHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const item = header.parentElement;
    item.classList.toggle("active");
  });
});
