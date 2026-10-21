
const form = document.getElementById("assessmentForm");
const message = document.getElementById("formMessage");
const printButton = document.getElementById("printButton");

// Local testing address. We will change this for deployment.
const API_URL = "http://localhost:3000/api/assessments";

if (form && message) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    message.classList.remove("error");
    message.textContent = "Submitting assessment...";

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      const formData = new FormData(form);
      const data = {};
      const answers = {};

      // Preserve checkbox selections as arrays.
      for (const [key, value] of formData.entries()) {
        if (key === "consent") {
          data.consent = true;
          continue;
        }

        if (
          [
            "fullName",
            "age",
            "email",
            "country",
            "phone",
            "gender"
          ].includes(key)
        ) {
          data[key] = value;
          continue;
        }

        if (Object.prototype.hasOwnProperty.call(answers, key)) {
          if (!Array.isArray(answers[key])) {
            answers[key] = [answers[key]];
          }
          answers[key].push(value);
        } else {
          answers[key] = value;
        }
      }

      data.answers = answers;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not save the assessment."
        );
      }

      message.classList.remove("error");
      message.textContent =
        "Assessment submitted successfully! Your information has been saved.";

      message.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });

      form.reset();
    } catch (error) {
      console.error("Submission error:", error);
      message.classList.add("error");
      message.textContent =
        "Submission failed. Your form has not been confirmed as saved. Please try again.";

      message.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  form.addEventListener("reset", () => {
    message.textContent = "";
    message.classList.remove("error");
  });
}

if (printButton) {
  printButton.addEventListener("click", () => {
    window.print();
  });
}
