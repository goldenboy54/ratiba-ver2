// Navigation.js - Mobile menu toggle and active link highlighting

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');

  // Toggle sidebar on mobile
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
      // Add class to body to prevent scrolling when sidebar is open
      document.body.classList.toggle('sidebar-open');
    });
  }

  // Close sidebar when clicking overlay
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    });
  }

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

  // Close sidebar on window resize if opened
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 992) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    }, 250);
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
        document.body.style.overflow = '';
      }
    }, 250);
  });

  // Prevent body scroll when sidebar is open on mobile
  if (sidebar.classList.contains('active') && window.innerWidth <= 992) {
    document.body.style.overflow = 'hidden';
  }
});
