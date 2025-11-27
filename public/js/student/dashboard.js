let timeout;
const searchInput = document.getElementById("searchInput");
const statusSelect = document.getElementById("statusSelect");
const sortSelect = document.getElementById("sortSelect");

function applyFilters() {
  const params = new URLSearchParams();

  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (statusSelect.value !== "all") params.set("status", statusSelect.value);
  if (sortSelect.value) params.set("sort", sortSelect.value);

  window.location.href = "/student/dashboard?" + params.toString();
}

// Debounced search
searchInput.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(applyFilters, 500);
});

// Instant apply for dropdowns
statusSelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
