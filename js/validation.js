const REGEX_PHONE = /^\+380\d{9}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

(() => {
  const form = document.getElementById("feedbackForm");
  const successModal = document.getElementById("successModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  if (!form || !successModal || !closeModalBtn) return;

  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const subject = document.getElementById("subject");
  const message = document.getElementById("message");
  const agreement = document.getElementById("agreement");
  const submitButton = form.querySelector('button[type="submit"]');
  const touched = new Set();
  const fields = [
    { input: username, errorEl: document.getElementById("usernameError"), validate: validateName },
    { input: email, errorEl: document.getElementById("emailError"), validate: validateEmail },
    { input: phone, errorEl: document.getElementById("phoneError"), validate: validatePhone },
    { input: subject, errorEl: document.getElementById("subjectError"), validate: validateSubject },
    { input: message, errorEl: document.getElementById("messageError"), validate: validateMessage },
    { input: agreement, errorEl: document.getElementById("agreementError"), validate: validateAgreement }
  ];

  if (fields.some(({ input, errorEl }) => !input || !errorEl) || !submitButton) return;

  // Displays an error and marks its control invalid for assistive technology.
  function showError(input, errorEl, errorMessage) {
    errorEl.textContent = errorMessage;
    errorEl.classList.remove("hidden");
    input.setAttribute("aria-invalid", "true");
    input.classList.remove("border-[#DED3C7]", "!border-green-500");
    input.classList.add("!border-red-500");
  }

  // Hides an error and gives the valid control its success border.
  function showSuccess(input, errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    input.setAttribute("aria-invalid", "false");
    input.classList.remove("border-[#DED3C7]", "!border-red-500");
    input.classList.add("!border-green-500");
  }

  // Restores a control and its error message to the neutral state.
  function clearError(input, errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    input.setAttribute("aria-invalid", "false");
    input.classList.remove("!border-red-500", "!border-green-500");
    input.classList.add("border-[#DED3C7]");
  }

  // Requires a name containing at least two non-padding characters.
  function validateName() {
    if (username.value.trim().length < 2) {
      showError(username, fields[0].errorEl, "Введіть ім’я — щонайменше 2 символи.");
      return false;
    }

    showSuccess(username, fields[0].errorEl);
    return true;
  }

  // Checks the trimmed email against the required address format.
  function validateEmail() {
    if (!REGEX_EMAIL.test(email.value.trim())) {
      showError(email, fields[1].errorEl, "Введіть коректну адресу електронної пошти.");
      return false;
    }

    showSuccess(email, fields[1].errorEl);
    return true;
  }

  // Gives a specific hint for common formatting mistakes in phone numbers.
  function validatePhone() {
    const value = phone.value;
    let errorMessage = "";

    if (!value) {
      errorMessage = "Введіть номер телефону у форматі +380XXXXXXXXX.";
    } else if (value.startsWith("0")) {
      errorMessage = "Номер починається з 0 — введіть його у форматі +380XXXXXXXXX.";
    } else if (/[\s()-]/.test(value)) {
      errorMessage = "Пробіли, дужки та дефіси не допускаються.";
    } else if (/[A-Za-z\u0400-\u04FF]/.test(value)) {
      errorMessage = "У номері використовуйте лише цифри після +380.";
    } else if (!value.startsWith("+380")) {
      errorMessage = "Введіть номер у форматі +380XXXXXXXXX.";
    } else if (!/^\+380\d*$/.test(value)) {
      errorMessage = "Після +380 використовуйте лише цифри.";
    } else if (!REGEX_PHONE.test(value)) {
      errorMessage = "Після +380 має бути рівно 9 цифр.";
    }

    if (errorMessage) {
      showError(phone, fields[2].errorEl, errorMessage);
      return false;
    }

    showSuccess(phone, fields[2].errorEl);
    return true;
  }

  // Requires a non-empty subject option.
  function validateSubject() {
    if (!subject.value.trim()) {
      showError(subject, fields[3].errorEl, "Оберіть тему звернення.");
      return false;
    }

    showSuccess(subject, fields[3].errorEl);
    return true;
  }

  // Requires a message containing at least ten non-padding characters.
  function validateMessage() {
    if (message.value.trim().length < 10) {
      showError(message, fields[4].errorEl, "Повідомлення має містити щонайменше 10 символів.");
      return false;
    }

    showSuccess(message, fields[4].errorEl);
    return true;
  }

  // Requires explicit consent before the form can be submitted.
  function validateAgreement() {
    if (!agreement.checked) {
      showError(agreement, fields[5].errorEl, "Потрібно надати згоду на обробку персональних даних.");
      return false;
    }

    showSuccess(agreement, fields[5].errorEl);
    return true;
  }

  // Adds the first-interaction state and wires blur/input/change validation.
  function watchField(field) {
    const { input, errorEl, validate } = field;

    input.addEventListener("blur", () => {
      touched.add(input);
      validate();
    });

    if (input === subject || input === agreement) {
      input.addEventListener("change", () => {
        touched.add(input);
        validate();
      });
    } else {
      input.addEventListener("input", () => {
        if (touched.has(input)) validate();
      });
    }

    clearError(input, errorEl);
  }

  // Resets all validation state after a successful demo submission.
  function resetValidationState() {
    touched.clear();
    fields.forEach(({ input, errorEl }) => clearError(input, errorEl));
  }

  // Closes the dialog and returns keyboard focus to the submit button.
  function closeModal() {
    if (successModal.classList.contains("hidden")) return;

    successModal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    submitButton.focus();
  }

  fields.forEach(watchField);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    fields.forEach(({ input }) => touched.add(input));

    const invalidFields = fields.filter(({ validate }) => !validate());
    if (invalidFields.length > 0) {
      invalidFields[0].input.focus();
      return;
    }

    successModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    closeModalBtn.focus();
    form.reset();
    resetValidationState();
  });

  closeModalBtn.addEventListener("click", closeModal);
  successModal.addEventListener("click", (event) => {
    if (event.target === successModal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (successModal.classList.contains("hidden")) return;

    if (event.key === "Tab") {
      event.preventDefault();
      closeModalBtn.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  });
})();