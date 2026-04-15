const universitiesList = document.getElementById("universitiesList");
const resultsCount = document.getElementById("resultsCount");
const filterError = "Не удалось загрузить данные из базы данных.";

let universities = [];

function findValueByNameHints(row, hints) {
  const keys = Object.keys(row);
  const matchedKey = keys.find((key) => {
    const lowerKey = key.toLowerCase();
    return hints.some((hint) => lowerKey.includes(hint));
  });

  if (!matchedKey) {
    return "";
  }

  return row[matchedKey] ?? "";
}

function getValueByPosition(row, position) {
  return Object.values(row)[position] ?? "";
}

function pickValue(row, hints, position) {
  const hintedValue = findValueByNameHints(row, hints);
  if (String(hintedValue).trim() !== "") {
    return hintedValue;
  }

  return getValueByPosition(row, position);
}

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return `https://${text}`;
}

function toNumber(value) {
  const numericValue = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : NaN;
}

function formatTuitionValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toLocaleString("ru-RU")} ₸`;
  }

  const parsed = toNumber(value);
  if (Number.isFinite(parsed)) {
    return `${parsed.toLocaleString("ru-RU")} ₸`;
  }

  return value || "Не указано";
}

function priceBucketFromTuition(value) {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  if (parsed <= 500000) {
    return "low";
  }

  if (parsed <= 1000000) {
    return "mid";
  }

  return "high";
}

function normalizeUniversityRow(row) {
  const name = pickValue(row, ["university_name", "university", "name", "title"], 0);
  const region = pickValue(row, ["region", "city", "location"], 1);
  const institutionType = pickValue(row, ["type", "status", "ownership"], 2);
  const email = pickValue(row, ["email", "mail"], 3);
  const phone = pickValue(row, ["phone", "tel", "contact"], 4);
  const website = pickValue(row, ["website", "site", "url"], 5);
  const specialty = pickValue(row, ["specialty", "faculty", "program", "major", "direction"], 8);
  const degreeLevel = pickValue(row, ["degree", "level", "qualification"], 9);
  const language = pickValue(row, ["language", "lang"], 10);
  const duration = pickValue(row, ["duration", "term", "length"], 11);
  const tuitionRaw = pickValue(row, ["tuition", "price", "cost", "fee"], 12);
  const link = pickValue(row, ["link", "url"], 13);
  const descriptionParts = [institutionType, specialty, degreeLevel, language, duration].filter((value) => String(value).trim() !== "");

  return {
    name: String(name || "Без названия"),
    region: String(region || "Не указан"),
    price: priceBucketFromTuition(tuitionRaw),
    faculty: String(specialty || "Не указана"),
    tuition: formatTuitionValue(tuitionRaw),
    description: descriptionParts.length > 0 ? descriptionParts.join(" • ") : "Описание отсутствует",
    email: String(email || ""),
    phone: String(phone || ""),
    website: String(website || ""),
    link: String(link || "")
  };
}

function populateFilterOptions(list) {
  const regionSelect = document.getElementById("region");
  const specialtySelect = document.getElementById("faculty");

  const regions = [...new Set(list.map((uni) => uni.region).filter((value) => value && value !== "Не указан"))].sort((a, b) => a.localeCompare(b, "ru"));
  const specialties = [...new Set(list.map((uni) => uni.faculty).filter((value) => value && value !== "Не указана"))].sort((a, b) => a.localeCompare(b, "ru"));

  regionSelect.innerHTML = '<option value="">Все регионы</option>';
  regions.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    regionSelect.appendChild(option);
  });

  specialtySelect.innerHTML = '<option value="">Все специальности</option>';
  specialties.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    specialtySelect.appendChild(option);
  });
}

async function loadUniversitiesFromApi() {
  const response = await fetch("/api/university-table-corrected?limit=500&offset=0");
  if (!response.ok) {
    throw new Error(`API status ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  universities = rows.map(normalizeUniversityRow);
  populateFilterOptions(universities);
  return universities;
}

function renderUniversities(list) {
  universitiesList.innerHTML = "";

  if (list.length === 0) {
    universitiesList.innerHTML = `<p>По вашему запросу ничего не найдено.</p>`;
    resultsCount.textContent = "Найдено: 0";
    return;
  }

  list.forEach((uni) => {
    const card = document.createElement("div");
    card.className = "university-card";

    const websiteLink = normalizeUrl(uni.link || uni.website);
    const linkMarkup = websiteLink
      ? `<p><strong>Сайт:</strong> <a href="${websiteLink}" target="_blank" rel="noreferrer noopener">${websiteLink}</a></p>`
      : "";

    card.innerHTML = `
      <h4>${uni.name}</h4>
      <p><strong>Регион:</strong> ${uni.region}</p>
      <p><strong>Специальность:</strong> ${uni.faculty}</p>
      <p><strong>Стоимость:</strong> ${uni.tuition}</p>
      <p><strong>Описание:</strong> ${uni.description}</p>
      ${linkMarkup}
      ${uni.email ? `<p><strong>Email:</strong> ${uni.email}</p>` : ""}
      ${uni.phone ? `<p><strong>Телефон:</strong> ${uni.phone}</p>` : ""}
      <span class="tag">${uni.region}</span>
    `;

    universitiesList.appendChild(card);
  });

  resultsCount.textContent = `Найдено: ${list.length}`;
}

function filterUniversities() {
  const regionValue = document.getElementById("region").value;
  const priceValue = document.getElementById("price").value;
  const facultyValue = document.getElementById("faculty").value;
  const searchValue = document.getElementById("ent").value.trim().toLowerCase();

  const filtered = universities.filter((uni) => {
    const matchRegion = !regionValue || uni.region === regionValue;
    const matchPrice = !priceValue || uni.price === priceValue;
    const matchFaculty = !facultyValue || uni.faculty === facultyValue;
    const matchSearch =
      !searchValue ||
      [uni.name, uni.region, uni.faculty, uni.description].some((value) =>
        String(value).toLowerCase().includes(searchValue)
      );

    return matchRegion && matchPrice && matchFaculty && matchSearch;
  });

  renderUniversities(filtered);
}

function resetFilters() {
  document.getElementById("region").value = "";
  document.getElementById("price").value = "";
  document.getElementById("faculty").value = "";
  document.getElementById("ent").value = "";

  renderUniversities(universities);
}

document.getElementById("applyFilters").addEventListener("click", filterUniversities);
document.getElementById("resetFilters").addEventListener("click", resetFilters);

loadUniversitiesFromApi()
  .then(() => {
    renderUniversities(universities);
  })
  .catch(() => {
    universitiesList.innerHTML = `<p>${filterError}</p>`;
    resultsCount.textContent = "Найдено: 0";
  });

/* CAROUSEL */
const slides = document.querySelectorAll(".carousel-slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide) => slide.classList.remove("active"));
  slides[index].classList.add("active");
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

function prevSlideFunc() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

nextBtn.addEventListener("click", nextSlide);
prevBtn.addEventListener("click", prevSlideFunc);

setInterval(nextSlide, 5000);