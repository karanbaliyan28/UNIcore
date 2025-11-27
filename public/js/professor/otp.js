// Focus Input
document.getElementById("otp").focus();

// Numeric Only
document.getElementById("otp").addEventListener("input", function (e) {
  this.value = this.value.replace(/[^0-9]/g, "");
});

// Main Timer
let timeLeft = 600;
const timerDisplay = document.getElementById("timer");
const timerInterval = setInterval(() => {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerDisplay.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  if (timeLeft <= 0) {
    timerDisplay.textContent = "Expired";
    timerDisplay.classList.add("text-red-500");
    document.getElementById("submitBtn").disabled = true;
    document.getElementById("submitBtn").classList.add("opacity-50");
  }
  timeLeft--;
}, 1000);

// Resend Timer
let resendCooldown = 60;
const resendBtn = document.getElementById("resendBtn");
const resendTimerSpan = document.getElementById("resendTimer");
const resendInterval = setInterval(() => {
  if (resendCooldown > 0) {
    resendTimerSpan.textContent = resendCooldown;
    resendCooldown--;
  } else {
    clearInterval(resendInterval);
    resendBtn.disabled = false;
    document.getElementById("resendText").textContent = "Resend OTP";
  }
}, 1000);

function resendOTP() {
  alert("Resend feature coming soon.");
}

// Loading State
document.getElementById("otpForm").addEventListener("submit", function () {
  const btn = document.getElementById("submitBtn");
  btn.innerHTML = "Verifying...";
  btn.classList.add("opacity-75", "cursor-wait");
});
