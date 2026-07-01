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
    // Activate TEXT button
    textBtn.classList.add(
      "border-indigo-500",
      "bg-indigo-50",
      "text-indigo-700"
    );
    textBtn.classList.remove("border-gray-300", "bg-white", "text-gray-700");

    // Deactivate IMAGE button
    imageBtn.classList.remove(
      "border-indigo-500",
      "bg-indigo-50",
      "text-indigo-700"
    );
    imageBtn.classList.add("border-gray-300", "bg-white", "text-gray-700");

    // Show text box
    textSection.style.display = "block";
    imageSection.style.display = "none";

    textInput.required = true;
    imageInput.required = false;
    imageInput.value = "";
  } else {
    // Activate IMAGE button
    imageBtn.classList.add(
      "border-indigo-500",
      "bg-indigo-50",
      "text-indigo-700"
    );
    imageBtn.classList.remove("border-gray-300", "bg-white", "text-gray-700");

    // Deactivate TEXT button
    textBtn.classList.remove(
      "border-indigo-500",
      "bg-indigo-50",
      "text-indigo-700"
    );
    textBtn.classList.add("border-gray-300", "bg-white", "text-gray-700");

    // Show image upload
    textSection.style.display = "none";
    imageSection.style.display = "block";

    textInput.required = false;
    imageInput.required = true;
  }
}

// LIVE TEXT SIGNATURE PREVIEW
document
  .getElementById("signatureTextInput")
  ?.addEventListener("input", function (e) {
    const preview = document.getElementById("signaturePreview");
    preview.textContent = e.target.value || "Your signature will appear here";
  });

// IMAGE PREVIEW
function previewSignatureImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("signatureImagePreview").src = e.target.result;
      document
        .getElementById("imagePreviewContainer")
        .classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
}

function clearSignatureImage() {
  document.getElementById("signatureImageInput").value = "";
  document.getElementById("imagePreviewContainer").classList.add("hidden");
}

// FORM VALIDATION
document.getElementById("reviewForm").addEventListener("submit", function (e) {
  const remark = document.querySelector("textarea[name='remark']").value.trim();
  if (remark.length < 10) {
    e.preventDefault();
    alert("Please provide at least 10 characters in remarks.");
    return;
  }

  if (currentSignatureType === "text") {
    const signature = document
      .getElementById("signatureTextInput")
      .value.trim();
    if (signature.length < 2) {
      e.preventDefault();
      alert("Signature cannot be empty.");
      return;
    }
  } else {
    const imageFile = document.getElementById("signatureImageInput").files[0];
    if (!imageFile) {
      e.preventDefault();
      alert("Please upload a signature image.");
      return;
    }
  }
});
