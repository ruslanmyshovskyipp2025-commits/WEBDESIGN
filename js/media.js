// Ініціалізація Swiper.js, Fancybox та Typed.js
document.addEventListener('DOMContentLoaded', () => {
  const typedText = document.querySelector('#typed-text');

  if (typedText && typeof Typed !== 'undefined') {
    new Typed('#typed-text', {
      strings: [
        'Свіже обсмаження зерна під ваше замовлення.',
        'Добірна арабіка та авторські кавові мікси.',
        'Ідеальний помел під турку, фільтр чи еспресо.'
      ],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 1800,
      loop: true
    });
  }

  const reviewsEl = document.querySelector('.reviews-swiper');
  if (reviewsEl && typeof Swiper !== 'undefined') {
    new Swiper('.reviews-swiper', {
      loop: true,
      spaceBetween: 24,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        320: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  }

  const galleryItems = document.querySelectorAll('[data-fancybox="coffee-gallery"]');
  if (galleryItems.length > 0 && typeof Fancybox !== 'undefined') {
    Fancybox.bind("[data-fancybox='coffee-gallery']", {
      Carousel: { Transition: "fade" },
      Images: { Panzoom: { maxScale: 3 } }
    });
  }
});