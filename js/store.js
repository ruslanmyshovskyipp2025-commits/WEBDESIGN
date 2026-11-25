(() => {
  const STORAGE_KEY = "smashena-kava-cart-v1";
  const currency = new Intl.NumberFormat("uk-UA");
  const beanPrices = { ethiopia: 460, brazil: 380, colombia: 420, guatemala: 435 };
  const beanNames = { ethiopia: "Ефіопія", brazil: "Бразилія", colombia: "Колумбія", guatemala: "Гватемала" };
  const roastNames = { light: "світле", medium: "середнє", dark: "темне" };
  const grindNames = { beans: "у зернах", whole: "у зернах", espresso: "еспресо", filter: "фільтр", drip: "дріп", cezve: "турка" };
  let toastTimer;
  let cartItemTemplate;

  const money = (amount) => `₴${currency.format(amount)}`;

  const showToast = (message) => {
    let toast = document.querySelector(".site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "site-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  };

  const readCart = () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const cart = JSON.parse(saved);
      if (!Array.isArray(cart)) throw new TypeError("Cart data must be an array.");
      return cart.filter((item) =>
        item
        && typeof item.id === "string"
        && typeof item.name === "string"
        && Number.isFinite(Number(item.price))
        && Number(item.price) >= 0
        && Number.isInteger(Number(item.quantity))
        && Number(item.quantity) > 0
      ).map((item) => ({ ...item, price: Number(item.price), quantity: Number(item.quantity) }));
    } catch (error) {
      console.error("Unable to read the saved cart.", error);
      return [];
    }
  };

  const writeCart = (cart) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error("Unable to save the cart.", error);
      showToast("Не вдалося зберегти кошик у цьому браузері.");
      return false;
    }
  };

  const updateCartCounters = (cart = readCart()) => {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('header a[href="cart.html"]').forEach((link) => {
      link.classList.add("cart-icon");
      let counter = link.querySelector("[data-cart-count]");
      if (!counter) {
        counter = document.createElement("span");
        counter.className = "cart-count";
        counter.dataset.cartCount = "";
        link.append(counter);
      }
      counter.textContent = String(count);
      counter.hidden = count === 0;
      link.setAttribute("aria-label", count === 0 ? "Кошик" : `Кошик, товарів: ${count}`);
    });
  };

  const addToCart = (item) => {
    if (!item || !item.name || !Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
      showToast("Не вдалося додати товар до кошика.");
      return false;
    }
    const cart = readCart();
    const existing = item.kind === "blend"
      ? cart.find((entry) => entry.signature === item.signature)
      : cart.find((entry) => entry.sku === item.sku && entry.kind === item.kind);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, price: Number(item.price), quantity: 1 });
    }
    if (!writeCart(cart)) return false;
    updateCartCounters(cart);
    renderCart(cart);
    showToast(`${item.name} додано до кошика.`);
    return true;
  };

  const slugify = (value) => value.toLocaleLowerCase("uk-UA")
    .replace(/[’'"]/g, "")
    .replace(/[^a-zа-яіїєґ0-9]+/giu, "-")
    .replace(/^-|-$/g, "");

  const productFromCard = (card) => {
    const title = card.querySelector("h3");
    const priceText = card.querySelector(".price, p.whitespace-nowrap");
    const description = card.querySelector(".product-description") || title?.nextElementSibling;
    const details = card.querySelector(".product-details");
    const image = card.querySelector("img");
    const price = Number((priceText?.textContent || "").replace(/[^\d]/g, ""));
    if (!title || !Number.isFinite(price) || price <= 0) return null;
    return {
      kind: "product",
      sku: card.dataset.productId || slugify(title.textContent),
      name: title.textContent.trim(),
      description: [description?.textContent.trim(), details?.textContent.trim()].filter(Boolean).join(", "),
      price,
      image: image?.getAttribute("src") || "assets/images/image_2026-11-05_8629.jpg"
    };
  };

  const renderCart = (cart = readCart()) => {
    const cartItems = document.getElementById("cart-items");
    if (!cartItems) return;
    const template = cartItems.querySelector(".cart-item");
    if (template && !cartItemTemplate) cartItemTemplate = template.cloneNode(true);
    if (!cartItemTemplate) return;
    cartItems.replaceChildren();
    let total = 0;
    let count = 0;
    cart.forEach((entry) => {
      const row = cartItemTemplate.cloneNode(true);
      row.dataset.product = entry.id;
      row.dataset.unitPrice = String(entry.price);
      const image = row.querySelector(".cart-item-image");
      const title = row.querySelector(".cart-item-title");
      const description = row.querySelector(".cart-item-description");
      const quantity = row.querySelector(".quantity-value");
      const lineTotal = row.querySelector("[data-line-total]");
      const quantityControl = row.querySelector(".quantity-control");
      const decreaseButton = row.querySelector("[data-quantity-decrease]");
      const increaseButton = row.querySelector("[data-quantity-increase]");
      const removeButton = row.querySelector("[data-remove-item]");
      if (image) {
        image.src = entry.image || "assets/images/image_2026-11-05_8629.jpg";
        image.alt = entry.name;
      }
      if (title) title.textContent = entry.name;
      if (description) description.textContent = entry.description || "";
      if (quantity) quantity.textContent = String(entry.quantity);
      if (lineTotal) lineTotal.textContent = currency.format(entry.price * entry.quantity);
      if (quantityControl) quantityControl.setAttribute("aria-label", `Кількість: ${entry.name}`);
      if (decreaseButton) decreaseButton.setAttribute("aria-label", `Зменшити кількість: ${entry.name}`);
      if (increaseButton) increaseButton.setAttribute("aria-label", `Збільшити кількість: ${entry.name}`);
      if (removeButton) removeButton.setAttribute("aria-label", `Видалити: ${entry.name}`);
      const editLink = row.querySelector(".cart-edit-link");
      if (editLink) {
        if (entry.kind === "blend") {
          editLink.href = "builder.html";
        } else {
          editLink.remove();
        }
      }
      cartItems.append(row);
      total += entry.price * entry.quantity;
      count += entry.quantity;
    });

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    setText("cart-subtotal", money(total));
    setText("checkout-total", money(total));
    setText("confirmation-total", money(total));
    setText("summary-item-count", String(count));
    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;
    const noun = lastDigit === 1 && lastTwoDigits !== 11
      ? "позиція"
      : lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)
        ? "позиції"
        : "позицій";
    setText("cart-item-count", `${count} ${noun}`);
    const emptyMessage = document.getElementById("cart-empty-message");
    if (emptyMessage) emptyMessage.hidden = cart.length > 0;
    const checkoutSection = document.getElementById("checkout-section");
    if (checkoutSection) checkoutSection.hidden = cart.length === 0;
    const checkoutError = document.getElementById("checkout-error");
    if (checkoutError) checkoutError.hidden = true;
  };

  const makeBlend = (form, isHomepage = false, notifyInvalid = true) => {
    const getValue = (selector) => form.querySelector(selector)?.value || "";
    const beanAValue = getValue(isHomepage ? "#coffee-beans" : 'input[name="bean-a"]:checked');
    const beanBValue = getValue(isHomepage ? "#coffee-beans-b" : 'input[name="bean-b"]:checked');
    const shareAInput = isHomepage ? form.querySelector("#coffee-ratio") : form.querySelector("#share-a");
    const shareA = Number(shareAInput?.value);
    const shareB = isHomepage ? 100 - shareA : Number(form.querySelector("#share-b")?.value);
    const sharesAreValid = Number.isInteger(shareA) && Number.isInteger(shareB)
      && shareA >= 0 && shareA <= 100 && shareB >= 0 && shareB <= 100
      && shareA + shareB === 100;
    if (!beanAValue || !beanBValue || !Number.isInteger(shareA) || !Number.isInteger(shareB)
      || shareA < 0 || shareA > 100 || shareB < 0 || shareB > 100 || (notifyInvalid && !sharesAreValid)) {
      if (notifyInvalid) showToast("Перевірте склад міксу: сума часток має дорівнювати 100%.");
      return null;
    }
    const roast = getValue(isHomepage ? "#roast-level" : "#roast-level");
    const grind = getValue(isHomepage ? "#grind" : "#grind-level");
    const weight = isHomepage ? getValue("#packaging") : getValue("#package-weight");
    const packaging = isHomepage ? "kraft" : getValue("#package-type");
    const beanA = beanNames[beanAValue] || beanAValue;
    const beanB = beanNames[beanBValue] || beanBValue;
    const basePrices = isHomepage
      ? { "250g": 420, "500g": 780 }
      : { "250": 420, "500": 780, "1000": 1500 };
    const weightGrams = isHomepage ? Number.parseInt(weight, 10) : Number(weight);
    const selectedWeight = form.querySelector(isHomepage ? "#packaging" : "#package-weight");
    const basePrice = basePrices[weight] || Number(selectedWeight?.selectedOptions[0]?.dataset.price);
    const weightedBeanPrice = ((beanPrices[beanAValue] || 420) * shareA + (beanPrices[beanBValue] || 420) * shareB) / 100;
    const baselineBeanPrice = isHomepage ? 428 : 420;
    const grindSurcharge = grind === "beans" || grind === "whole" ? 0 : 20;
    const price = Math.round(basePrice + (weightedBeanPrice - baselineBeanPrice) * (weightGrams / 250)
      + grindSurcharge
      + (packaging === "gift-tube" ? 180 : 0));
    const packagingName = packaging === "gift-tube" ? "подарунковий тубус" : "крафт-пакет із клапаном";
    const roastLabel = roastNames[roast] || "середнє";
    const grindLabel = grindNames[grind] || "у зернах";
    return {
      kind: "blend",
      sku: `blend-${beanAValue}-${shareA}-${beanBValue}-${shareB}-${roast}-${grind}-${weight}-${packaging}`,
      signature: `${beanAValue}:${shareA}|${beanBValue}:${shareB}|${roast}|${grind}|${weight}|${packaging}`,
      name: "Власний мікс",
      description: `${beanA} ${shareA}% + ${beanB} ${shareB}%, ${roastLabel} обсмаження, ${grindLabel}, ${weightGrams} г, ${packagingName}`,
      price,
      image: "assets/images/image_2026-11-05_8629.jpg"
    };
  };

  const setupFullBuilder = () => {
    const form = document.getElementById("blend-builder-form");
    if (!form) return;
    const shareAInput = form.querySelector("#share-a");
    const shareBInput = form.querySelector("#share-b");
    const shareARange = form.querySelector("#share-a-range");
    const shareBRange = form.querySelector("#share-b-range");
    const shareStatus = form.querySelector("#share-status");
    const priceInput = form.querySelector("#blend-price");
    const update = () => {
      const shareA = shareAInput.value.trim() === "" ? NaN : Number(shareAInput.value);
      const shareB = shareBInput.value.trim() === "" ? NaN : Number(shareBInput.value);
      const valid = Number.isInteger(shareA) && Number.isInteger(shareB)
        && shareA >= 0 && shareA <= 100 && shareB >= 0 && shareB <= 100
        && shareA + shareB === 100;
      shareStatus.classList.toggle("is-valid", valid);
      shareStatus.textContent = valid
        ? "Разом 100% — готово до замовлення"
        : Number.isFinite(shareA) && Number.isFinite(shareB)
          ? `Сума має становити 100%. Зараз: ${shareA + shareB}%.`
          : "Вкажіть обидві частки від 0 до 100%.";
      const sharePreviewA = form.querySelector("#preview-share-a");
      const sharePreviewB = form.querySelector("#preview-share-b");
      if (sharePreviewA) sharePreviewA.textContent = `${shareAInput.value || 0}%`;
      if (sharePreviewB) sharePreviewB.textContent = `${shareBInput.value || 0}%`;
      form.querySelectorAll('button[type="submit"]').forEach((button) => { button.disabled = !valid; });
      const blend = makeBlend(form, false, false);
      if (!blend) return;
      const beans = form.querySelectorAll('input[name="bean-a"], input[name="bean-b"]');
      beans.forEach((input) => {
        if (!input.checked) return;
        const target = form.querySelector(input.name === "bean-a" ? "#preview-bean-a" : "#preview-bean-b");
        if (target) target.textContent = input.dataset.name;
      });
      const roastSelect = form.querySelector("#roast-level");
      const grindSelect = form.querySelector("#grind-level");
      const weightSelect = form.querySelector("#package-weight");
      const packageSelect = form.querySelector("#package-type");
      const roastPreview = form.querySelector("#preview-roast");
      const grindPreview = form.querySelector("#preview-grind");
      const weightPreview = form.querySelector("#preview-weight");
      const packagePreview = form.querySelector("#preview-package");
      if (roastPreview && roastSelect) roastPreview.textContent = roastSelect.selectedOptions[0].textContent;
      if (grindPreview && grindSelect) grindPreview.textContent = grindSelect.selectedOptions[0].textContent;
      if (weightPreview && weightSelect) weightPreview.textContent = `${weightSelect.value} г`;
      if (packagePreview && packageSelect) packagePreview.textContent = packageSelect.selectedOptions[0].textContent.split(" (+")[0].toLowerCase();
      form.querySelectorAll("[data-live-price]").forEach((element) => { element.textContent = money(blend.price); });
      if (priceInput) priceInput.value = String(blend.price);
    };

    const syncShare = (input, range) => {
      const value = Number(input.value);
      if (input.value.trim() !== "" && Number.isFinite(value)) {
        range.value = String(Math.min(100, Math.max(0, value)));
      }
      form.querySelectorAll(".preset-button").forEach((button) => button.setAttribute("aria-pressed", "false"));
      update();
    };
    shareAInput.addEventListener("input", () => syncShare(shareAInput, shareARange));
    shareBInput.addEventListener("input", () => syncShare(shareBInput, shareBRange));
    shareARange.addEventListener("input", () => { shareAInput.value = shareARange.value; form.querySelectorAll(".preset-button").forEach((button) => button.setAttribute("aria-pressed", "false")); update(); });
    shareBRange.addEventListener("input", () => { shareBInput.value = shareBRange.value; form.querySelectorAll(".preset-button").forEach((button) => button.setAttribute("aria-pressed", "false")); update(); });
    form.querySelectorAll(".preset-button").forEach((preset) => {
      preset.addEventListener("click", () => {
        shareAInput.value = preset.dataset.shareA;
        shareBInput.value = preset.dataset.shareB;
        shareARange.value = preset.dataset.shareA;
        shareBRange.value = preset.dataset.shareB;
        form.querySelectorAll(".preset-button").forEach((button) => button.setAttribute("aria-pressed", String(button === preset)));
        update();
      });
    });
    form.addEventListener("input", (event) => {
      if (!event.target.matches("#share-a, #share-b, #share-a-range, #share-b-range")) update();
    });
    form.addEventListener("change", update);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const blend = makeBlend(form);
      if (!blend) {
        shareBInput.focus();
        return;
      }
      addToCart(blend);
    });
    update();
  };

  const setupHomepageBuilder = () => {
    const form = document.getElementById("homepage-blend-form");
    if (!form) return;
    const update = () => {
      const share = Number(form.querySelector("#coffee-ratio")?.value || 60);
      const blend = makeBlend(form, true, false);
      const beanA = beanNames[form.querySelector("#coffee-beans")?.value] || "";
      const beanB = beanNames[form.querySelector("#coffee-beans-b")?.value] || "";
      const roast = roastNames[form.querySelector("#roast-level")?.value] || "середнє";
      const grind = grindNames[form.querySelector("#grind")?.value] || "у зернах";
      const weight = form.querySelector("#packaging")?.value || "250g";
      const description = document.getElementById("home-blend-description");
      const price = document.getElementById("home-blend-price");
      const ratioLabel = form.querySelector('label[for="coffee-ratio"]');
      if (description) description.textContent = `Ваш власний мікс: ${beanA} — ${share}%, ${beanB} — ${100 - share}%. Обсмаження: ${roast}. Помел: ${grind}. Пакування: ${Number.parseInt(weight, 10)} г.`;
      if (ratioLabel) ratioLabel.textContent = `Пропорції зерна А (${share}%)`;
      if (price && blend) price.textContent = money(blend.price);
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", (event) => event.preventDefault());
    form.querySelector("#home-add-blend")?.addEventListener("click", () => {
      const blend = makeBlend(form, true);
      if (blend) addToCart(blend);
    });
    update();
  };

  const setupCatalog = () => {
    const filterForm = document.querySelector(".catalog-filters form");
    if (!filterForm) return;
    const cards = [...document.querySelectorAll(".catalog-products-grid .product-card")];
    const applyFilters = () => {
      const data = new FormData(filterForm);
      let visible = 0;
      cards.forEach((card) => {
        const category = card.dataset.category || "";
        const taste = (card.dataset.taste || "").split(/\s+/).filter(Boolean);
        const brewing = (card.dataset.brewing || "").split(/\s+/).filter(Boolean);
        const roast = card.dataset.roast || "";
        const price = Number((card.querySelector(".price")?.textContent || "").replace(/[^\d]/g, ""));
        const chosenCategory = data.get("category") || "all";
        const chosenRoast = data.get("roast") || "all";
        const chosenTastes = data.getAll("taste");
        const chosenBrewing = data.getAll("brewing");
        const min = Number(data.get("price-min")) || 0;
        const max = Number(data.get("price-max")) || Infinity;
        const match = (chosenCategory === "all" || category === chosenCategory)
          && (!chosenTastes.length || chosenTastes.some((value) => taste.includes(value)))
          && (!chosenBrewing.length || chosenBrewing.some((value) => brewing.includes(value)))
          && (chosenRoast === "all" || roast === chosenRoast)
          && price >= min && price <= max;
        card.hidden = !match;
        if (match) visible += 1;
      });
      const resultCount = document.querySelector(".catalog-results-count");
      if (resultCount) resultCount.textContent = `${visible} товарів`;
    };
    filterForm.addEventListener("submit", (event) => event.preventDefault());
    filterForm.addEventListener("input", applyFilters);
    filterForm.addEventListener("change", applyFilters);
    filterForm.addEventListener("reset", () => window.setTimeout(applyFilters, 0));
    applyFilters();
  };

  const setupCart = () => {
    const cartItems = document.getElementById("cart-items");
    if (!cartItems) return;
    renderCart(readCart());
    cartItems.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      const row = button?.closest(".cart-item");
      if (!button || !row) return;
      const id = row.dataset.product;
      const cart = readCart();
      const item = cart.find((entry) => entry.id === id);
      if (!item) return;
      if (button.hasAttribute("data-remove-item")) {
        writeCart(cart.filter((entry) => entry.id !== id));
      } else if (button.hasAttribute("data-quantity-increase")) {
        item.quantity += 1;
        writeCart(cart);
      } else if (button.hasAttribute("data-quantity-decrease")) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
          writeCart(cart.filter((entry) => entry.id !== id));
        } else {
          writeCart(cart);
        }
      } else {
        return;
      }
      const updated = readCart();
      renderCart(updated);
      updateCartCounters(updated);
    });
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const cart = readCart();
        if (!cart.length) {
          const error = document.getElementById("checkout-error");
          if (error) {
            error.textContent = "Додайте товар до кошика, щоб оформити замовлення.";
            error.hidden = false;
          }
          return;
        }
        const summary = cart.map((item) => `${item.name} × ${item.quantity}`);
        const confirmationItems = document.getElementById("confirmation-items");
        if (confirmationItems) confirmationItems.textContent = summary.join(" • ");
        if (!writeCart([])) return;
        const cartSection = document.getElementById("cart-section");
        const confirmationSection = document.getElementById("confirmation-section");
        if (cartSection) cartSection.hidden = true;
        if (confirmationSection) confirmationSection.hidden = false;
        updateCartCounters([]);
        document.getElementById("confirmation-title")?.focus();
      });
    }
  };

  const setupProduct = () => {
    const form = document.querySelector(".product-buy-form");
    if (!form) return;
    const weight = form.querySelector("#package-weight");
    const priceInput = form.querySelector("#package-price");
    const priceOutput = form.querySelector("#product-price");
    const buttonPrice = form.querySelector("#purchase-button-price");
    const updatePrice = () => {
      if (!weight) return;
      const amount = Number(weight.selectedOptions[0]?.dataset.price);
      if (!Number.isFinite(amount)) return;
      if (priceInput) priceInput.value = String(amount);
      if (priceOutput) priceOutput.textContent = money(amount);
      if (buttonPrice) buttonPrice.textContent = money(amount);
    };
    weight?.addEventListener("input", updatePrice);
    weight?.addEventListener("change", updatePrice);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = document.getElementById("product-title");
      const image = document.querySelector(".product-hero-image img");
      const grind = form.querySelector("#coffee-grind");
      const selectedWeight = weight?.selectedOptions[0];
      const price = Number(selectedWeight?.dataset.price);
      if (!title || !selectedWeight || !Number.isFinite(price)) return;
      const grindName = grindNames[grind?.value || "beans"] || "у зернах";
      addToCart({
        kind: "product",
        sku: `balance-${selectedWeight.value}-${grind?.value || "beans"}`,
        name: title.textContent.trim(),
        description: `Темний шоколад, фундук і карамель, середнє обсмаження, ${grindName}, ${selectedWeight.textContent.split(" — ")[0]}`,
        price,
        image: image?.getAttribute("src") || "assets/images/image_2026-11-05_8629.jpg"
      });
    });
    updatePrice();
  };

  const setupGenericInteractions = () => {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const addButton = target.closest("[data-add-product]");
      if (addButton) {
        const card = addButton.closest("article");
        if (card) {
          const item = productFromCard(card);
          if (item) addToCart(item);
        }
      }
    });
    document.querySelectorAll(".subscription-form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        showToast("Дякуємо за підписку!");
        form.reset();
      });
    });
  };

  const onStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      const cart = readCart();
      updateCartCounters(cart);
      renderCart(cart);
    }
  };

  updateCartCounters();
  setupFullBuilder();
  setupHomepageBuilder();
  setupCatalog();
  setupCart();
  setupProduct();
  setupGenericInteractions();
  window.addEventListener("storage", onStorageChange);
})();
