// helper to read data- attributes and call the main confirmDelete
function confirmDeleteFromDataset(el) {
  const id = el.dataset.id;
  const name = el.dataset.name;
  const userCount = Number(el.dataset.usercount || 0);
  confirmDelete(id, name, userCount);
}

function confirmDelete(id, name, userCount) {
  const modal = document.getElementById("deleteModal");
  const message = document.getElementById("deleteMessage");
  const form = document.getElementById("deleteForm");
  const btn = form.querySelector("button");

  if (userCount > 0) {
    message.innerHTML = `Cannot delete <strong>${name}</strong> because it has ${userCount} active user(s).`;
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    message.innerHTML = `Are you sure you want to delete <strong>${name}</strong>? This cannot be undone.`;
    form.action = "/admin/departments/delete/" + id;
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
  }
  modal.classList.remove("hidden");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.add("hidden");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDeleteModal();
});

// --- Client-side Search & Filter ---
let searchTimeout;
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 500);
  });
}

if (filterType) {
  filterType.addEventListener("change", applyFilters);
}

function applyFilters() {
  const search = searchInput.value.trim();
  const type = filterType.value;
  let url = "/admin/departments?";
  if (search) url += "search=" + encodeURIComponent(search) + "&";
  if (type) url += "type=" + type + "&";
  if (url.endsWith("&") || url.endsWith("?")) url = url.slice(0, -1);
  window.location.href = url || "/admin/departments";
}
