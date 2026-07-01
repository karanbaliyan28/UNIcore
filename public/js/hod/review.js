// public/js/hod/review.js

let currentSignatureType = "text";

function selectSignatureType(type) {
  currentSignatureType = type;

  const textBtn = document.getElementById("textSigBtn");
  const imageBtn = document.getElementById("imageSigBtn");
  const textSection = document.getElementById("textSignatureSection");
  const imageSection = document.getElementById("imageSignatureSection");
  const textInput = document.getElementById("signatureTextInput");
  const imageInput = document.getElementById("signatureImageInput");

  if (type === "text") {
    // Activate text button
    textBtn.classList.add(
      "active",
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    textBtn.classList.remove("border-gray-200", "bg-white", "text-gray-600");

    // Deactivate image button
    imageBtn.classList.remove(
      "active",
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    imageBtn.classList.add("border-gray-200", "bg-white", "text-gray-600");

    // Show/hide sections
    textSection.style.display = "block";
    imageSection.style.display = "none";

    // Set required attributes
    textInput.required = true;
    imageInput.required = false;
    imageInput.value = "";
  } else {
    // Activate image button
    imageBtn.classList.add(
      "active",
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    imageBtn.classList.remove("border-gray-200", "bg-white", "text-gray-600");

    // Deactivate text button
    textBtn.classList.remove(
      "active",
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    textBtn.classList.add("border-gray-200", "bg-white", "text-gray-600");

    // Show/hide sections
    textSection.style.display = "none";
    imageSection.style.display = "block";

    // Set required attributes
    textInput.required = false;
    imageInput.required = true;
  }
}

// Live preview for text signature
document
  .getElementById("signatureTextInput")
  ?.addEventListener("input", function (e) {
    const preview = document.getElementById("signaturePreview");
    preview.textContent = e.target.value || "Sign above...";
  });

// Preview uploaded signature image
function previewSignatureImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("signatureImagePreview").src = e.target.result;
      document.getElementById("uploadPlaceholder").classList.add("hidden");
      document
        .getElementById("imagePreviewContainer")
        .classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
}

// Form validation before submit
document.getElementById("reviewForm")?.addEventListener("submit", function (e) {
  const remark = document.querySelector('textarea[name="remark"]').value.trim();

  if (remark.length < 10) {
    e.preventDefault();
    alert("Please provide at least 10 characters in remarks.");
    return false;
  }

  if (currentSignatureType === "text") {
    const signature = document
      .getElementById("signatureTextInput")
      .value.trim();
    if (signature.length < 2) {
      e.preventDefault();
      alert("Signature cannot be empty.");
      return false;
    }
  } else {
    const imageFile = document.getElementById("signatureImageInput").files[0];
    if (!imageFile) {
      e.preventDefault();
      alert("Please upload a signature image.");
      return false;
    }
  }

  return true;
});
