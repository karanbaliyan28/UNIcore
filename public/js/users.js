// Client-side search and filter with debounce
let searchTimeout;
const searchInput = document.getElementById("searchInput");
const filterRole = document.getElementById("filterRole");
const filterDepartment = document.getElementById("filterDepartment");

searchInput.addEventListener("input", function (e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
});

filterRole.addEventListener("change", function () {
  applyFilters();
});

filterDepartment.addEventListener("change", function () {
  applyFilters();
});

function applyFilters() {
  const search = searchInput.value;
  const role = filterRole.value;
  const department = filterDepartment.value;
  let url = "/admin/users?";

  if (search) url += "search=" + encodeURIComponent(search) + "&";
  if (role) url += "role=" + role + "&";
  if (department) url += "department=" + encodeURIComponent(department) + "&";

  window.location.href = url;
}

function clearFilters() {
  window.location.href = "/admin/users";
}

function confirmDelete(button) {
  const id = button.dataset.id;
  const name = button.dataset.name;
  const modal = document.getElementById("deleteModal");
  const message = document.getElementById("deleteMessage");
  const form = document.getElementById("deleteForm");

  message.innerHTML =
    "Are you sure you want to delete <strong>" +
    name +
    "</strong>? This action cannot be undone.";
  form.action = "/admin/users/delete/" + id; // ✅ correct route
  modal.classList.remove("hidden");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.add("hidden");
}

// Close modal on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDeleteModal();
  }
});
