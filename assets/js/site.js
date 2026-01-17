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
    const toggleDesktop = document.getElementById('sidebar-toggle-desktop');
    const navButtonMobile = document.getElementById('nav-button-mobile');
    const container = document.querySelector('.' + SITE_CONTAINER_CLASS);
    
    if (!container) {
      return;
    }
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // On mobile, handle full-screen navigation
      const closeButton = document.getElementById('sidebar-close-mobile');
      
      function closeMobileSidebar() {
        container.classList.remove('sidebar-open-mobile');
      }
      
      if (navButtonMobile) {
        navButtonMobile.addEventListener('click', function() {
          container.classList.add('sidebar-open-mobile');
        });
      }
      
      if (closeButton) {
        closeButton.addEventListener('click', closeMobileSidebar);
      }
      
      // Close sidebar when clicking on a link
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.addEventListener('click', function(e) {
          // If clicking on a link, close the sidebar after a short delay
          if (e.target.closest('a')) {
            setTimeout(closeMobileSidebar, 300);
          }
        });
      }
    } else {
      // Desktop behavior
      // Load saved state from localStorage
      // Default to collapsed (true) if no saved state exists
      const savedState = localStorage.getItem(STORAGE_KEY);
      const isCollapsed = savedState === null ? true : savedState === 'true';
      
      if (isCollapsed) {
        container.classList.add(COLLAPSED_CLASS);
      }
      
      updateIcons(isCollapsed);
      
      // Toggle sidebar on button click (both in sidebar and content header)
      if (toggle) {
        toggle.addEventListener('click', toggleSidebar);
      }
      
      if (toggleDesktop) {
        toggleDesktop.addEventListener('click', toggleSidebar);
      }
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
      const isMobileNow = window.innerWidth <= 768;
      if (isMobileNow !== isMobile) {
        // Reload page behavior changes on resize
        location.reload();
      }
    });
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

  function createCopyIcon() {
    return '<svg class="octicon octicon-copy" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 6.75C0 5.784.784 5 1.75 5H5v1H1.75A.75.75 0 0 0 1 6.75v7.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75V11h1v3.25A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.75a.75.75 0 0 0-.75.75v7.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-7.5a.75.75 0 0 0-.75-.75Z"></path></svg>';
  }

  function createCheckIcon() {
    return '<svg class="octicon octicon-check" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L6.75 10.19l5.97-5.97a.75.75 0 0 1 1.06 0Z"></path></svg>';
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    textArea.style.left = '-1000px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
    return Promise.resolve();
  }

  function showCopiedState(button) {
    button.classList.add('is-copied');
    button.setAttribute('aria-label', 'Copied');
    clearTimeout(button._copyResetTimer);
    button._copyResetTimer = setTimeout(() => {
      button.classList.remove('is-copied');
      button.setAttribute('aria-label', 'Copy code');
    }, 2000);
  }

  function initCodeCopyButtons() {
    const codeBlocks = document.querySelectorAll('.markdown-body pre > code');
    codeBlocks.forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      if (!pre || pre.dataset.copyButton === 'true') return;

      pre.dataset.copyButton = 'true';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.setAttribute('aria-label', 'Copy code');
      button.innerHTML = '<span class="code-copy-label" aria-hidden="true">Copied!</span>' +
        createCopyIcon() +
        createCheckIcon();

      button.addEventListener('click', () => {
        const code = codeBlock.textContent || '';
        copyToClipboard(code).then(() => showCopiedState(button));
      });

      pre.appendChild(button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodeCopyButtons);
  } else {
    initCodeCopyButtons();
  }

  // Generate IDs for headings that don't have them
  function slugifyHeading(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function initHeadingIds() {
    const usedIds = new Set();
    document.querySelectorAll('[id]').forEach(el => {
      usedIds.add(el.id);
    });

    const headings = document.querySelectorAll(
      '.markdown-body h1, .markdown-body h2, .markdown-body h3, ' +
      '.markdown-body h4, .markdown-body h5, .markdown-body h6'
    );

    headings.forEach(heading => {
      if (heading.id) return;
      const base = slugifyHeading(heading.textContent || '');
      if (!base) return;

      let candidate = base;
      let suffix = 1;
      while (usedIds.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }

      heading.id = candidate;
      usedIds.add(candidate);
    });
  }

  // Header anchor link functionality
  function createLinkIcon() {
    // Simple link icon (Feather icons style)
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#24292f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
  }

  function initHeaderAnchorLinks() {
    var headers = document.querySelectorAll('.markdown-body h1[id], .markdown-body h2[id], .markdown-body h3[id], .markdown-body h4[id], .markdown-body h5[id], .markdown-body h6[id]');
    
    headers.forEach(function(header) {
      // Skip if already processed
      if (header.dataset.anchorLink === 'true') return;
      
      header.dataset.anchorLink = 'true';
      header.classList.add('heading-with-anchor');
      
      // Create the anchor link element
      var anchor = document.createElement('a');
      anchor.className = 'header-anchor-link';
      anchor.href = '#' + header.id;
      anchor.setAttribute('aria-label', 'Link to this section');
      anchor.innerHTML = createLinkIcon();
      
      // Append the anchor link to the header
      header.appendChild(anchor);
    });
  }

  // Initialize heading IDs first, then add anchor links
  function initHeadingsAndAnchors() {
    initHeadingIds();
    initHeaderAnchorLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeadingsAndAnchors);
  } else {
    initHeadingsAndAnchors();
  }
})();
