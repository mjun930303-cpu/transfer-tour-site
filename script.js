let DATA = null;
let activeTerminal = "ALL";

const els = {
  subtitle: document.getElementById("site-subtitle"),
  notes: document.getElementById("tour-notes"),
  contact: document.getElementById("tour-contact"),
  termsTitle: document.getElementById("terms-title"),
  termsList: document.getElementById("terms-list"),

  grid: document.getElementById("course-grid"),
  empty: document.getElementById("empty-state"),
  listView: document.getElementById("list-view"),
  detailView: document.getElementById("detail-view"),
  backBtn: document.getElementById("back-btn"),

  dImg: document.getElementById("detail-image"),
  dTitle: document.getElementById("detail-title"),
  dSub: document.getElementById("detail-subtitle"),
  dMeta: document.getElementById("detail-meta"),
  dHighlights: document.getElementById("detail-highlights"),
  dReserve: document.getElementById("detail-reserve")
};

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[s]));
}

function setActiveChip(value){
  activeTerminal = value;
  document.querySelectorAll(".chip").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.terminal === value);
  });
  renderList();
}

function courseMatchesTerminal(course){
  if(activeTerminal === "ALL") return true;
  return (course.terminals || []).includes(activeTerminal);
}

function buildBadge(text){
  const span = document.createElement("span");
  span.className = "badge";
  span.textContent = text;
  return span;
}

function renderList(){
  if(!DATA) return;

  const courses = (DATA.courses || []).filter(courseMatchesTerminal);
  els.grid.innerHTML = "";

  if(courses.length === 0){
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  courses.forEach(course => {
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;

    const img = document.createElement("img");
    img.src = course.image || "";
    img.alt = course.title || "";

    const body = document.createElement("div");
    body.className = "body";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = course.title || "";

    const sub = document.createElement("div");
    sub.className = "sub muted";
    sub.textContent = course.subtitle || "";

    const badges = document.createElement("div");
    badges.className = "badges";
    badges.appendChild(buildBadge((course.days || []).join(" / ")));
    badges.appendChild(buildBadge((course.terminals || []).join(" & ")));
    badges.appendChild(buildBadge(`${course.time || ""} (${course.duration || ""})`));
    if(course.fee) badges.appendChild(buildBadge(course.fee)); // 유료만 표시

    const more = document.createElement("button");
    more.className = "more-mini";
    more.type = "button";
    more.textContent = "More Info";
    more.addEventListener("click", (e) => {
      e.stopPropagation();
      openDetail(course.slug);
    });

    card.addEventListener("click", () => openDetail(course.slug));
    card.addEventListener("keypress", (e) => {
      if(e.key === "Enter") openDetail(course.slug);
    });

    body.appendChild(title);
    body.appendChild(sub);
    body.appendChild(badges);
    body.appendChild(more);

    card.appendChild(img);
    card.appendChild(body);
    els.grid.appendChild(card);
  });
}

function openDetail(slug){
  if(!DATA) return;
  const course = (DATA.courses || []).find(c => c.slug === slug);
  if(!course) return;

  location.hash = `course=${encodeURIComponent(slug)}`;

  els.dImg.src = course.image || "";
  els.dImg.alt = course.title || "";

  els.dTitle.textContent = course.title || "";
  els.dSub.textContent = course.subtitle || "";

  els.dMeta.innerHTML = "";
  els.dMeta.appendChild(buildBadge((course.days || []).join(" / ")));
  els.dMeta.appendChild(buildBadge((course.terminals || []).join(" & ")));
  els.dMeta.appendChild(buildBadge(`${course.time || ""} (${course.duration || ""})`));
  if(course.fee) els.dMeta.appendChild(buildBadge(course.fee));

  els.dHighlights.innerHTML = "";
  (course.highlights || []).forEach(h => {
    const li = document.createElement("li");
    li.textContent = h;
    els.dHighlights.appendChild(li);
  });

  els.dReserve.href = course.reserveLink || DATA.reserveLinkDefault || "#";

  els.listView.classList.add("hidden");
  els.detailView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeDetail(){
  if(location.hash.startsWith("#course=")) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }
  els.detailView.classList.add("hidden");
  els.listView.classList.remove("hidden");
}

function handleHash(){
  const hash = (location.hash || "").replace(/^#/, "");
  if(hash.startsWith("course=")){
    const slug = decodeURIComponent(hash.replace("course=", ""));
    openDetail(slug);
  } else {
    els.detailView.classList.add("hidden");
    els.listView.classList.remove("hidden");
  }
}

function init(){
  document.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => setActiveChip(btn.dataset.terminal));
  });

  els.backBtn.addEventListener("click", closeDetail);
  window.addEventListener("hashchange", handleHash);

  // ✅ 핵심: 상대경로로 로드 ("/data/..."가 아니라 "data/...")
  fetch("data/tour.json")
    .then(res => {
      if(!res.ok) throw new Error(`HTTP ${res.status} loading data/tour.json`);
      return res.json();
    })
    .then(data => {
      DATA = data;

      els.subtitle.textContent = data.tourInfo?.subtitle || "";

      els.notes.innerHTML = "";
      (data.tourInfo?.notes || []).forEach(n => {
        const li = document.createElement("li");
        li.textContent = n;
        els.notes.appendChild(li);
      });

      const email = data.tourInfo?.contact?.email || "";
      const phone = data.tourInfo?.contact?.phone || "";
      els.contact.innerHTML = `
        <div><strong>Contact</strong></div>
        <div>${email ? `Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : ""}</div>
        <div>${phone ? `Tel: ${escapeHtml(phone)}` : ""}</div>
      `;

      if(els.termsTitle) els.termsTitle.textContent = data.tourInfo?.termsTitle || "Terms & Conditions";
      if(els.termsList){
        els.termsList.innerHTML = "";
        (data.tourInfo?.terms || []).forEach(t => {
          const li = document.createElement("li");
          li.textContent = t;
          els.termsList.appendChild(li);
        });
      }

      renderList();
      handleHash();
    })
    .catch(err => {
      console.error(err);
      els.grid.innerHTML = `<p class="muted">Failed to load data/tour.json</p>`;
    });
}

init();
