const GRADES = [
  { id: 3, name: "3.º grado", label: "Tercero" },
  { id: 5, name: "5.º grado", label: "Quinto" },
  { id: 7, name: "7.º grado", label: "Séptimo" },
  { id: 9, name: "9.º grado", label: "Noveno" },
];
const SUBJECTS = [
  { id: "Lenguaje", icon: "⌑", summary: "Comprensión lectora, textos y comunicación." },
  { id: "Matemáticas", icon: "＋", summary: "Razonamiento, números y solución de problemas." },
  { id: "Socioemocionales", icon: "♡", summary: "Situaciones para reflexionar sobre emociones y convivencia." },
];
const state = { grade: 3, subject: null, filter: "Todas", search: "" };
const content = document.querySelector("#content");
const nav = document.querySelector("#grade-nav");
const storageKey = (grade, subject) => `qsqs-fase3:${grade}:${subject}`;
let exams = {};
let answerKeys = {};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function gradeData(grade, subject) { return exams?.[grade]?.[subject] ?? null; }
function readAnswers(grade, subject) {
  try { return JSON.parse(localStorage.getItem(storageKey(grade, subject)) || "{}"); } catch { return {}; }
}
function readFlags(grade, subject) {
  try { return new Set(JSON.parse(localStorage.getItem(`${storageKey(grade, subject)}:flags`) || "[]").map(String)); } catch { return new Set(); }
}
function saveAnswer(grade, subject, questionId, value) {
  const answers = readAnswers(grade, subject);
  if (value === "" || value == null) delete answers[questionId]; else answers[questionId] = value;
  localStorage.setItem(storageKey(grade, subject), JSON.stringify(answers));
}
function allQuestions(exam) { return (exam?.groups || []).flatMap(group => group.questions || []); }
function answeredCount(exam, answers) {
  return allQuestions(exam).filter(q => answers[q.id] != null && String(answers[q.id]).trim() !== "").length;
}
function scoreSummary(exam, answers) {
  const scored = allQuestions(exam).filter(q => answerKeys[q.id]?.accepted?.length);
  const points = scored.filter(q => answerKeys[q.id].accepted.includes(Number(answers[q.id]))).length;
  return { points, total: scored.length };
}
function selectedGrade() { return GRADES.find(g => g.id === state.grade); }
function renderNav() {
  nav.innerHTML = GRADES.map(g => `<button class="grade-link ${g.id === state.grade ? "active" : ""}" data-grade="${g.id}" type="button"><span class="grade-name"><strong>${g.name}</strong><small>${g.label}</small></span><span class="grade-chevron">›</span></button>`).join("");
  nav.querySelectorAll("[data-grade]").forEach(button => button.addEventListener("click", () => {
    state.grade = Number(button.dataset.grade); state.subject = null; state.filter = "Todas"; state.search = ""; renderNav(); renderHome();
  }));
}
function gradeHeading() { const g = selectedGrade(); return `${g.name} · ${g.label}`; }
function renderHome() {
  state.subject = null;
  const subjectsHTML = SUBJECTS.map(s => {
    const exam = gradeData(state.grade, s.id);
    const total = allQuestions(exam).length;
    const answers = readAnswers(state.grade, s.id);
    const answered = answeredCount(exam, answers);
    const score = scoreSummary(exam, answers);
    const pct = total ? Math.round(answered / total * 100) : 0;
    return `<article class="subject-card">
      <span class="subject-icon" aria-hidden="true">${s.icon}</span>
      <div class="subject-title-row"><h3>${escapeHTML(s.id)}</h3><span>${total} preguntas</span></div>
      <p class="subject-description">${escapeHTML(s.summary)}</p>
      <div class="progress-meta"><span>Tu avance</span><span>${answered} de ${total}</span></div>
      <div class="progress-meta score-meta"><span>${score.total ? "Puntos" : "Sin puntaje"}</span><span>${score.total ? `${score.points} de ${score.total}` : "Reflexión"}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <button class="open-subject" data-subject="${escapeHTML(s.id)}" type="button">${answered ? "Continuar práctica" : "Comenzar práctica"} <span aria-hidden="true">→</span></button>
    </article>`;
  }).join("");
  content.innerHTML = `<section class="hero">
    <div class="hero-top">Quiero ser, quiero saber · Tercera fase</div>
    <h1>IE Rafael Soto Fuentes<br>Pruebas QSQS tercera fase</h1>
    <p>Un espacio para practicar, pensar y descubrir lo que sabes. Elige tu grado y explora cada área a tu ritmo.</p>
    <span class="hero-badge" aria-hidden="true">${state.grade}°</span>
  </section>
  <div class="section-heading"><div><h2>¿Qué vas a practicar?</h2><p>Selecciona un área para ver las preguntas de tu grado.</p></div><span class="grade-chip">${gradeHeading()}</span></div>
  <section class="subject-grid" aria-label="Áreas de práctica">${subjectsHTML}</section>
  <div class="info-strip"><span class="info-icon" aria-hidden="true">ⓘ</span><div><strong>Aprende con cada respuesta.</strong> En Lenguaje y Matemáticas cada acierto suma un punto y aparece una explicación. La clave se elaboró revisando los cuadernillos y no es oficial. Socioemocionales se guarda para reflexionar, sin nota.</div></div>`;
  content.querySelectorAll("[data-subject]").forEach(button => button.addEventListener("click", () => openSubject(button.dataset.subject)));
}
function openSubject(subject) { state.subject = subject; state.filter = "Todas"; state.search = ""; renderExam(); window.scrollTo({ top: 0, behavior: "smooth" }); }
function normalizedText(html) { const div = document.createElement("div"); div.innerHTML = html || ""; return (div.textContent || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function filteredQuestions(exam, answers, flags) {
  return allQuestions(exam).filter(q => {
    const answer = answers[q.id];
    const answered = answer != null && String(answer).trim() !== "";
    if (state.filter === "Pendientes" && answered) return false;
    if (state.filter === "Respondidas" && !answered) return false;
    if (state.filter === "Marcadas" && !flags.has(String(q.id))) return false;
    if (state.search && !normalizedText(`${q.number} ${q.content} ${(q.options || []).join(" ")}`).includes(normalizedText(state.search))) return false;
    return true;
  });
}
function renderExam() {
  const exam = gradeData(state.grade, state.subject);
  if (!exam) { content.innerHTML = `<div class="empty-state">No encontramos preguntas para este grado y área.</div>`; return; }
  const answers = readAnswers(state.grade, state.subject);
  const flags = readFlags(state.grade, state.subject);
  const total = allQuestions(exam).length;
  const done = answeredCount(exam, answers);
  const score = scoreSummary(exam, answers);
  const order = new Map(allQuestions(exam).map((q, index) => [String(q.id), index + 1]));
  const filters = ["Todas", "Pendientes", "Respondidas", "Marcadas"];
  let visibleIds = new Set(filteredQuestions(exam, answers, flags).map(q => String(q.id)));
  const groupsHTML = exam.groups.map(group => {
    const shown = group.questions.filter(q => visibleIds.has(String(q.id))).map(q => ({ ...q, displayNumber: order.get(String(q.id)), flagged: flags.has(String(q.id)) }));
    if (!shown.length) return "";
    return `<section class="reading-group"><h2 class="reading-heading">${escapeHTML(group.title || "Preguntas")}</h2>${group.context ? `<div class="reading-context">${group.context}</div>` : ""}${shown.map(q => questionHTML(q, answers[q.id], state.subject)).join("")}</section>`;
  }).join("");
  content.innerHTML = `<div class="test-header">
    <div><button class="back-link" id="back-home" type="button">← Volver a las áreas</button><div class="eyebrow">${gradeHeading()} · TERCERA FASE</div><h1>${escapeHTML(state.subject)}</h1><p>Responde con calma. Puedes salir y continuar después desde este dispositivo.</p></div>
    <div class="test-count"><span id="done-count">${done}</span> / ${total} respondidas<br><strong>${score.total ? `<span id="score-count">${score.points}</span> / ${score.total} puntos` : "Área de reflexión · sin puntaje"}</strong></div>
  </div>
  <div class="test-toolbar"><span class="filter-label">Mostrar:</span>${filters.map(f => `<button type="button" class="filter-button ${state.filter === f ? "active" : ""}" data-filter="${f}">${f}</button>`).join("")}<span class="toolbar-spacer"></span><input class="search-input" id="question-search" type="search" placeholder="Buscar una pregunta…" value="${escapeHTML(state.search)}" aria-label="Buscar una pregunta"><button class="clear-button" id="clear-answers" type="button">Borrar respuestas</button></div>
  ${groupsHTML || `<div class="empty-state">No hay preguntas en este filtro.</div>`}
  <div class="info-strip"><span class="info-icon" aria-hidden="true">ⓘ</span><div><strong>${state.subject === "Socioemocionales" ? "Reflexiona a tu ritmo." : "La clave es de práctica."}</strong> ${state.subject === "Socioemocionales" ? "Estas respuestas son personales y no se califican con una única opción correcta." : "Cada acierto suma un punto. Las respuestas y explicaciones se basan en la revisión de los cuadernillos; no se recibió una clave oficial."}</div></div>`;
  document.querySelector("#back-home").addEventListener("click", () => { state.subject = null; renderHome(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  content.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { state.filter = button.dataset.filter; renderExam(); }));
  const search = document.querySelector("#question-search");
  search.addEventListener("input", event => { const val = event.target.value; const pos = event.target.selectionStart; state.search = val; renderExam(); const next = document.querySelector("#question-search"); next.focus(); next.setSelectionRange(pos, pos); });
  document.querySelector("#clear-answers").addEventListener("click", () => {
    if (!confirm("¿Borrar las respuestas guardadas de esta área? Esta acción no se puede deshacer.")) return;
    localStorage.removeItem(storageKey(state.grade, state.subject)); renderExam();
  });
  content.querySelectorAll("[data-question]").forEach(card => {
    const id = card.dataset.question;
    card.querySelectorAll("input[type=radio]").forEach(radio => radio.addEventListener("change", () => {
      saveAnswer(state.grade, state.subject, id, radio.value); card.querySelectorAll(".answer-option").forEach(label => label.classList.toggle("selected", label.querySelector("input").checked));
      const question = allQuestions(exam).find(item => String(item.id) === String(id));
      renderAnswerFeedback(card, question, radio.value); updateProgress();
    }));
    const text = card.querySelector("textarea");
    if (text) text.addEventListener("input", () => { saveAnswer(state.grade, state.subject, id, text.value); renderAnswerFeedback(card, allQuestions(exam).find(item => String(item.id) === String(id)), text.value); updateProgress(); });
    card.querySelector(".flag-button")?.addEventListener("click", () => {
      const current = readFlags(state.grade, state.subject);
      if (current.has(id)) current.delete(id); else current.add(id);
      localStorage.setItem(`${storageKey(state.grade, state.subject)}:flags`, JSON.stringify([...current]));
      renderExam();
    });
  });
}
function questionHTML(q, selected, subject) {
  const number = escapeHTML(q.displayNumber || q.number || "—");
  const options = q.options || [];
  const answerBlock = subject === "Socioemocionales" && options.length < 2
    ? `<div class="answer-entry"><small>Escribe tu reflexión</small><textarea class="text-answer" placeholder="Escribe aquí tu respuesta…">${escapeHTML(selected || "")}</textarea></div>`
    : `<div class="options-list">${options.map((option, index) => `<label class="answer-option ${String(selected) === String(index) ? "selected" : ""}"><input type="radio" name="question-${escapeHTML(q.id)}" value="${index}" ${String(selected) === String(index) ? "checked" : ""}><span class="answer-label"><span class="option-letter">${String.fromCharCode(65 + index)}.</span>${option}</span></label>`).join("")}</div>`;
  const feedback = selected != null && String(selected).trim() !== "" ? answerFeedbackHTML(q, selected, subject) : "";
  const sourceNotice = answerKeys[q.id]?.unscored ? `<div class="answer-feedback reflective"><strong>Falta contexto para calificar.</strong><p>${escapeHTML(answerKeys[q.id].unscored)}</p></div>` : "";
  return `<article class="question-card" data-question="${escapeHTML(q.id)}" id="q-${escapeHTML(q.id)}"><div class="question-top"><span class="question-number">PREGUNTA ${number}</span><div class="question-actions"><span class="saved-state">Guardado automáticamente</span><button class="flag-button ${q.flagged ? "flagged" : ""}" type="button" aria-pressed="${Boolean(q.flagged)}">${q.flagged ? "⚑ Marcada" : "⚐ Marcar"}</button></div></div><div class="question-body">${q.content || ""}</div>${sourceNotice}${answerBlock}<div class="answer-feedback-slot">${feedback}</div></article>`;
}
function answerFeedbackHTML(q, selected, subject) {
  const key = answerKeys[q.id];
  if (subject === "Socioemocionales") return `<div class="answer-feedback reflective"><strong>Respuesta guardada para reflexionar.</strong><p>Esta situación no tiene una única respuesta correcta y no suma ni resta puntos.</p></div>`;
  if (key?.unscored) return "";
  if (!key || key.unscored || !key.accepted?.length) return `<div class="answer-feedback reflective"><strong>No se califica esta pregunta.</strong><p>${escapeHTML(key?.unscored || "No hay suficiente información en el material recibido para confirmar una respuesta correcta.")}</p></div>`;
  const accepted = key.accepted.map(index => String.fromCharCode(65 + index));
  const correct = key.accepted.includes(Number(selected));
  const letters = accepted.join(" o ");
  if (correct) return `<div class="answer-feedback correct"><strong>¡Correcto! +1 punto</strong><p>${escapeHTML(key.explanation)}</p></div>`;
  return `<div class="answer-feedback incorrect"><strong>Esta vez no suma punto. La mejor respuesta es ${letters}.</strong><p>${escapeHTML(key.explanation)}</p></div>`;
}
function renderAnswerFeedback(card, question, selected) {
  const slot = card.querySelector(".answer-feedback-slot");
  if (slot && question) slot.innerHTML = answerFeedbackHTML(question, selected, state.subject);
}
function updateProgress() {
  const exam = gradeData(state.grade, state.subject);
  const answers = readAnswers(state.grade, state.subject);
  const done = answeredCount(exam, answers);
  const score = scoreSummary(exam, answers);
  const counter = document.querySelector("#done-count"); if (counter) counter.textContent = done;
  const scoreCounter = document.querySelector("#score-count"); if (scoreCounter) scoreCounter.textContent = score.points;
}
async function init() {
  try {
    const [response, keyResponse] = await Promise.all([fetch("data/questions.json?v=11a83d0"), fetch("data/answer-key.json?v=11a83d0")]);
    if (!response.ok) throw new Error(`Preguntas: HTTP ${response.status}`);
    if (!keyResponse.ok) throw new Error(`Clave: HTTP ${keyResponse.status}`);
    [exams, answerKeys] = await Promise.all([response.json(), keyResponse.json()]);
    renderNav(); renderHome();
  } catch (error) {
    content.innerHTML = `<div class="empty-state"><strong>No se pudieron cargar las pruebas.</strong><br>Abre el aplicativo desde GitHub Pages o desde un servidor web local para que el archivo de preguntas pueda cargarse.</div>`;
  }
}
document.querySelector("#help-button").addEventListener("click", () => document.querySelector("#help-dialog").showModal());
init();
