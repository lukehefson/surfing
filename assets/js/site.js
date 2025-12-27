// Sidebar collapse functionality with localStorage persistence

(function() {
  'use strict';
  
  const STORAGE_KEY = 'github-readme-theme-sidebar-collapsed';
  const SIDEBAR_TOGGLE_ID = 'sidebar-toggle';
  const SITE_CONTAINER_CLASS = 'site-container';
  const COLLAPSED_CLASS = 'sidebar-collapsed';
  
  function updateIcons(isCollapsed) {
    // Update sidebar toggle icon (in sidebar header)
    const toggle = document.getElementById(SIDEBAR_TOGGLE_ID);
    if (toggle) {
      const collapseIcon = toggle.querySelector('.icon-collapse');
      const expandIcon = toggle.querySelector('.icon-expand');
      if (collapseIcon && expandIcon) {
        expandIcon.style.display = isCollapsed ? 'none' : 'inline';
        collapseIcon.style.display = isCollapsed ? 'inline' : 'none';
      }
    }
    
    // Update mobile toggle icon (in main header)
    const toggleMobile = document.getElementById('sidebar-toggle-mobile');
    if (toggleMobile) {
      const collapseIcon = toggleMobile.querySelector('.icon-collapse');
      const expandIcon = toggleMobile.querySelector('.icon-expand');
      if (collapseIcon && expandIcon) {
        collapseIcon.style.display = isCollapsed ? 'inline' : 'none';
        expandIcon.style.display = isCollapsed ? 'none' : 'inline';
      }
    }
  }
  
  function toggleSidebar() {
    const container = document.querySelector('.' + SITE_CONTAINER_CLASS);
    if (!container) return;
    
    const currentlyCollapsed = container.classList.contains(COLLAPSED_CLASS);
    const newState = !currentlyCollapsed;
    
    if (newState) {
      container.classList.add(COLLAPSED_CLASS);
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      container.classList.remove(COLLAPSED_CLASS);
      localStorage.setItem(STORAGE_KEY, 'false');
    }
    
    updateIcons(newState);
  }
  
  function initSidebar() {
    const toggle = document.getElementById(SIDEBAR_TOGGLE_ID);
    const toggleMobile = document.getElementById('sidebar-toggle-mobile');
    const container = document.querySelector('.' + SITE_CONTAINER_CLASS);
    
    if (!container) {
      return;
    }
    
    // Load saved state from localStorage
    // Default to collapsed (true) if no saved state exists
    const savedState = localStorage.getItem(STORAGE_KEY);
    const isCollapsed = savedState === null ? true : savedState === 'true';
    
    if (isCollapsed) {
      container.classList.add(COLLAPSED_CLASS);
    }
    
    updateIcons(isCollapsed);
    
    // Toggle sidebar on button click
    if (toggle) {
      toggle.addEventListener('click', toggleSidebar);
    }
    
    if (toggleMobile) {
      toggleMobile.addEventListener('click', toggleSidebar);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
  
  // Navigation tree expand/collapse functionality
  const NAV_EXPANDED_KEY = 'github-readme-theme-nav-expanded';
  
  function getExpandedPaths() {
    const stored = localStorage.getItem(NAV_EXPANDED_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  function setExpandedPaths(paths) {
    localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(paths));
  }
  
  function getItemPath(item) {
    const link = item.querySelector('a');
    if (!link) return null;
    const href = link.getAttribute('href');
    if (!href) return null;
    // Normalize path - remove trailing slash and make relative
    return href.replace(/\/$/, '') || '/';
  }
  
  function expandItem(item) {
    item.classList.add('expanded');
    const path = getItemPath(item);
    if (path) {
      const expanded = getExpandedPaths();
      if (!expanded.includes(path)) {
        expanded.push(path);
        setExpandedPaths(expanded);
      }
    }
  }
  
  function collapseItem(item) {
    item.classList.remove('expanded');
    const path = getItemPath(item);
    if (path) {
      const expanded = getExpandedPaths();
      const index = expanded.indexOf(path);
      if (index > -1) {
        expanded.splice(index, 1);
        setExpandedPaths(expanded);
      }
    }
  }
  
  function isItemExpanded(item) {
    return item.classList.contains('expanded');
  }
  
  function hasChildren(item) {
    const children = item.querySelector(':scope > .nav-children');
    return children && children.children.length > 0;
  }
  
  function expandPathToCurrentPage() {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const allItems = document.querySelectorAll('.nav-item');
    
    // Find the active item
    let activeItem = null;
    allItems.forEach(item => {
      const itemPath = getItemPath(item);
      if (itemPath === currentPath) {
        activeItem = item;
      }
    });
    
    if (!activeItem) return;
    
    // Expand all parent items to reveal the active item
    let parent = activeItem.parentElement.closest('.nav-item');
    while (parent) {
      expandItem(parent);
      parent = parent.parentElement.closest('.nav-item');
    }
  }
  
  function initNavItems() {
    // Start with all items collapsed
    const allItems = document.querySelectorAll('.nav-item');
    allItems.forEach(item => {
      item.classList.remove('expanded');
      const children = item.querySelector(':scope > .nav-children');
      if (children) {
        // Remove !important override from CSS
        children.style.setProperty('display', 'none', 'important');
      }
    });
    
    // Restore expanded state from localStorage
    const expandedPaths = getExpandedPaths();
    allItems.forEach(item => {
      const path = getItemPath(item);
      if (path && expandedPaths.includes(path)) {
        expandItem(item);
        const children = item.querySelector(':scope > .nav-children');
        if (children) {
          children.style.setProperty('display', 'block', 'important');
        }
      }
    });
    
    // Expand path to current page
    expandPathToCurrentPage();
    
    // After expanding, remove !important from all children so normal CSS can work
    const allChildren = document.querySelectorAll('.nav-children');
    allChildren.forEach(children => {
      if (children.style.display === 'block' || children.style.display === '') {
        children.style.removeProperty('display');
      }
    });
    
    // Handle clicks on nav item links
    allItems.forEach(item => {
      const link = item.querySelector('a');
      if (!link) return;
      
      link.addEventListener('click', function(e) {
        // If item has children and is collapsed, expand it and prevent navigation
        // If item has children and is expanded, allow navigation
        // If item has no children, allow navigation
        if (hasChildren(item) && !isItemExpanded(item)) {
          e.preventDefault();
          const children = item.querySelector(':scope > .nav-children');
          expandItem(item);
          if (children) {
            children.style.setProperty('display', 'block', 'important');
          }
        }
        // Otherwise, let the link navigate normally
      });
    });
  }
  
  // Initialize nav items when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavItems);
  } else {
    initNavItems();
  }
})();
