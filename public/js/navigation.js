// Navigation.js - Mobile menu toggle and active link highlighting

document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');

  // Check if elements exist
  if (!sidebarToggle || !sidebar || !sidebarOverlay) {
    console.warn('Navigation elements not found');
    return;
  }

  // Toggle sidebar on mobile
  sidebarToggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Hamburger clicked');
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
  });

  // Close sidebar when clicking overlay
  sidebarOverlay.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  });

  // Close sidebar when clicking a link on mobile
  const navLinks = document.querySelectorAll('.nav-link-item');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 992) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    });
  });

  // Highlight active link based on current URL
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    
    // Exact match or starts with (for nested routes)
    if (linkPath === currentPath || (currentPath.startsWith(linkPath) && linkPath !== '/')) {
      link.classList.add('active');
    }
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 992) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
      }
    }, 250);
  });
});
