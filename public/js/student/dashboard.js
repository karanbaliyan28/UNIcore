let searchTimeout;

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");

function applyFilters() {
  const params = new URLSearchParams();

  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());

  if (statusFilter.value !== "all") params.set("status", statusFilter.value);

  if (sortFilter.value) params.set("sort", sortFilter.value);

  window.location.href = "/student/dashboard?" + params.toString();
}

// Debounced search
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 500);
});

// Instant dropdown filters
statusFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);
