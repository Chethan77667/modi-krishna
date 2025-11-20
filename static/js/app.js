const htmlElement = document.documentElement;
const supportsIntersectionObserver = 'IntersectionObserver' in window;

if (supportsIntersectionObserver) {
  htmlElement.classList.add('js-enabled');
}

// Scroll to top on page load/refresh
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// Also handle before page unload to ensure scroll position is reset
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

document.addEventListener("DOMContentLoaded", () => {
  // Ensure page is at top on load
  window.scrollTo(0, 0);
  const scrollElements = document.querySelectorAll("[data-scroll]");

  if (!supportsIntersectionObserver) {
    scrollElements.forEach(el => el.classList.add("in-view"));
  } else {
    htmlElement.classList.add('js-animate');

    const revealIfVisible = el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("in-view");
      }
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    scrollElements.forEach(el => {
      observer.observe(el);
      revealIfVisible(el);
    });
  }

  const hero = document.querySelector(".hero-visual img");
  if (hero) {
    window.addEventListener("mousemove", e => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 10;
      const y = (e.clientY / innerHeight - 0.5) * 10;
      hero.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
    });

    window.addEventListener("mouseleave", () => {
      hero.style.transform = "none";
    });
  }
});

// Mobile menu open function (on hover) - disabled for mobile, only for desktop hover
function openMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const divider = document.querySelector('.college-divider');
  
  // Only work on hover for desktop, not mobile
  if (navLinks && mobileToggle && window.innerWidth > 767) {
    navLinks.classList.add('mobile-open');
    if (divider) {
      divider.classList.add('menu-open');
    }
  }
}

// Mobile menu close function (on mouse leave) - disabled for mobile
function closeMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const divider = document.querySelector('.college-divider');
  
  // Only work on hover for desktop, not mobile
  if (navLinks && mobileToggle && window.innerWidth > 767) {
    navLinks.classList.remove('mobile-open');
    if (divider) {
      divider.classList.remove('menu-open');
    }
  }
}

// Toggle mobile menu function (for click) - Main function for mobile
function toggleMobileMenu(event) {
  // Prevent event bubbling
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  const navLinks = document.querySelector('.nav-links');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const divider = document.querySelector('.college-divider');
  
  if (!navLinks || !mobileToggle) {
    console.error('Menu elements not found');
    return;
  }
  
  const isOpen = navLinks.classList.contains('mobile-open');
  const isMobile = window.innerWidth <= 767;
  
  if (isOpen) {
    // Close menu
    navLinks.classList.remove('mobile-open');
    if (divider) {
      divider.classList.remove('menu-open');
    }
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    mobileToggle.setAttribute('aria-expanded', 'false');
  } else {
    // Open menu
    navLinks.classList.add('mobile-open');
    if (divider) {
      divider.classList.add('menu-open');
    }
    mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
    mobileToggle.setAttribute('aria-expanded', 'true');
  }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
  const navLinks = document.querySelector('.nav-links');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const divider = document.querySelector('.college-divider');
  
  // Only close if menu is open and click is outside (mobile only)
  if (navLinks && mobileToggle && window.innerWidth <= 767 && navLinks.classList.contains('mobile-open')) {
    // Check if click is outside the menu and toggle button
    if (!event.target.closest('.nav-links') && 
        !event.target.closest('.mobile-menu-toggle') &&
        !event.target.closest('.college-right-section')) {
      navLinks.classList.remove('mobile-open');
      if (divider) {
        divider.classList.remove('menu-open');
      }
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  }
});

// Handle window resize
window.addEventListener('resize', function() {
  const navLinks = document.querySelector('.nav-links');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const divider = document.querySelector('.college-divider');
  
  if (navLinks && mobileToggle) {
    if (window.innerWidth > 767) {
      navLinks.classList.remove('mobile-open');
      if (divider) {
        divider.classList.remove('menu-open');
      }
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  }
});

// Gallery fullscreen lightbox
document.addEventListener('DOMContentLoaded', function() {
  const triggers = document.querySelectorAll('.gallery-fullscreen-trigger');
  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const closeButton = document.querySelector('.modal-close');

  if (!lightbox || !lightboxImage || triggers.length === 0) return;

  const openLightbox = trigger => {
    const src = trigger.dataset.src;
    const alt = trigger.dataset.alt || 'Gallery image';
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.removeAttribute('hidden');
    document.body.classList.add('modal-open');
  };

  const closeLightbox = () => {
    lightbox.setAttribute('hidden', '');
    lightboxImage.src = '';
    document.body.classList.remove('modal-open');
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      openLightbox(trigger);
    });
  });

  closeButton?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
      closeLightbox();
    }
  });
});

(function () {
  const MODAL_IDS = ["registrationSuccessModal", "registrationDuplicateModal"];

  const handleModal = modal => {
    if (!modal) return;
    const hideModal = () => {
      modal.classList.add("hidden");
      setTimeout(() => modal.remove(), 300);
    };
    setTimeout(hideModal, 2000);
    modal.addEventListener("click", event => {
      if (event.target === modal) hideModal();
    });
  };

  const initRegistrationModals = () => {
    if (!MODAL_IDS.some(id => document.getElementById(id))) {
      return;
    }

    MODAL_IDS.forEach(id => {
      const modal = document.getElementById(id);
      handleModal(modal);
      modal?.querySelectorAll(".close-modal-btn").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          modal.classList.add("hidden");
          setTimeout(() => modal.remove(), 300);
        });
      });
      modal?.querySelectorAll(".modal-refresh-btn").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          window.location.replace(window.location.href);
        });
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegistrationModals);
  } else {
    initRegistrationModals();
  }
})();

(function () {
  const initDeleteModal = () => {
    const modal = document.getElementById("deleteModal");
    if (!modal) return;

    const modalText = document.getElementById("deleteModalText");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    let formToSubmit = null;

    const closeModal = () => {
      modal.classList.remove("is-open");
      formToSubmit = null;
    };

    document.querySelectorAll(".delete-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetForm = document.getElementById(btn.dataset.target);
        if (!targetForm) return;

        formToSubmit = targetForm;
        modalText.textContent = `Are you sure you want to delete the registration for "${btn.dataset.name}"? This cannot be undone.`;
        modal.classList.add("is-open");
        confirmBtn?.focus();
      });
    });

    document.querySelectorAll("[data-modal-cancel]").forEach(btn => {
      btn.addEventListener("click", closeModal);
    });

    confirmBtn?.addEventListener("click", () => {
      if (formToSubmit) {
        formToSubmit.submit();
      }
    });

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeleteModal);
  } else {
    initDeleteModal();
  }
})();

