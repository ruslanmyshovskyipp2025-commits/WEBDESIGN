document.querySelectorAll(".site-header").forEach((header) => {
  const toggle = header.querySelector(".menu-toggle");
  const navigation = header.querySelector(".header-navigation");
  const headerContent = header.querySelector(".header-content");

  if (!toggle || !navigation || !headerContent) {
    return;
  }

  const setMenuOpen = (isOpen) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Закрити меню" : "Меню");
    navigation.classList.toggle("is-open", isOpen);
    headerContent.classList.toggle("menu-open", isOpen);
  };

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      toggle.focus();
    }
  });
});
