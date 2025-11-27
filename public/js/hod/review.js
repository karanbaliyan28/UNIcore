const textInput = document.getElementById("signatureTextInput");
const textPreview = document.getElementById("signaturePreview");

if (textInput) {
  textInput.addEventListener("input", function (e) {
    textPreview.textContent = e.target.value || "Sign above...";
  });
}

// 2. Toggle between Text and Image
function selectSignatureType(type) {
  const textSec = document.getElementById("textSignatureSection");
  const imgSec = document.getElementById("imageSignatureSection");
  const textBtn = document.getElementById("textSigBtn");
  const imgBtn = document.getElementById("imageSigBtn");
  const textInput = document.getElementById("signatureTextInput");
  const imgInput = document.getElementById("signatureImageInput");

  if (type === "text") {
    // Show Text
    textSec.style.display = "block";
    imgSec.style.display = "none";

    // Update Buttons
    textBtn.classList.add(
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    textBtn.classList.remove("border-gray-200", "bg-white", "text-gray-600");

    imgBtn.classList.remove(
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    imgBtn.classList.add("border-gray-200", "bg-white", "text-gray-600");

    // Manage Required Attributes
    textInput.required = true;
    // Clear image input to avoid submission errors if hidden
    imgInput.value = "";
    document.getElementById("imagePreviewContainer").classList.add("hidden");
    document.getElementById("uploadPlaceholder").classList.remove("hidden");
  } else {
    // Show Image
    textSec.style.display = "none";
    imgSec.style.display = "block";

    // Update Buttons
    imgBtn.classList.add(
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    imgBtn.classList.remove("border-gray-200", "bg-white", "text-gray-600");

    textBtn.classList.remove(
      "border-purple-600",
      "bg-purple-50",
      "text-purple-700"
    );
    textBtn.classList.add("border-gray-200", "bg-white", "text-gray-600");

    // Manage Required Attributes
    textInput.required = false;
  }
}

// 3. Image Upload Preview
function previewSignatureImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById("signatureImagePreview");
      preview.src = e.target.result;
      document
        .getElementById("imagePreviewContainer")
        .classList.remove("hidden");
      document.getElementById("uploadPlaceholder").classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }
}
