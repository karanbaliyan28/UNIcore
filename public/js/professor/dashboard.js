let profTimeout;

const profSearch = document.getElementById("profSearch");
const profStatus = document.getElementById("profStatus");
const profSort = document.getElementById("profSort");

function applyProfessorFilters() {
  const params = new URLSearchParams();

  if (profSearch.value.trim()) params.set("search", profSearch.value.trim());

  if (profStatus.value !== "all") params.set("status", profStatus.value);

  if (profSort.value) params.set("sort", profSort.value);

  window.location.href = "/professor/dashboard?" + params.toString();
}

// Search debounce
profSearch.addEventListener("input", () => {
  clearTimeout(profTimeout);
  profTimeout = setTimeout(applyProfessorFilters, 500);
});

// Dropdown instant apply
profStatus.addEventListener("change", applyProfessorFilters);
profSort.addEventListener("change", applyProfessorFilters);
