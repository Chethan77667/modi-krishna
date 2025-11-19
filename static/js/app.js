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

  scrollElements.forEach(el => observer.observe(el));

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

