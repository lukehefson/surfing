#!/usr/bin/env node

/**
 * Generator script for GitHub README Theme
 * 
 * Scans the repository for README.md files and generates:
 * - Jekyll pages in _generated/
 * - Navigation data in _data/nav.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get repo root (parent of scripts directory)
const REPO_ROOT = path.resolve(__dirname, '..');
const GENERATED_DIR = path.join(REPO_ROOT, '_generated');
const DATA_DIR = path.join(REPO_ROOT, '_data');
const NAV_JSON_PATH = path.join(DATA_DIR, 'nav.json');

// Read config from _config.yml
function readConfig() {
  const configPath = path.join(REPO_ROOT, '_config.yml');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  
  const config = {
    repo_owner: 'your-username',
    repo_name: 'your-repo',
    repo_branch: 'main'
  };
  
  // Simple YAML parsing for our needs
  configContent.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*["']?([^"']+)["']?$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      if (key in config) {
        config[key] = value;
      }
    }
  });
  
  return config;
}

// Find all README.md files in the repository
function findReadmeFiles(dir = REPO_ROOT, relativePath = '') {
  const readmes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    // Skip hidden files, node_modules, and generated directories
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === '_generated' ||
        entry.name === '_site' ||
        entry.name === 'scripts' ||
        entry.name === 'docs' ||
        entry.name === 'vendor') {
      continue;
    }
    
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      readmes.push(...findReadmeFiles(fullPath, relPath));
    } else if (entry.name === 'README.md') {
      readmes.push({
        fullPath,
        relativePath: relativePath || '.',
        isRoot: relativePath === ''
      });
    }
  }
  
  return readmes;
}

// URL encode each path segment
function encodePathSegments(pathStr) {
  return pathStr.split(path.sep)
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

// Generate breadcrumb array
function generateBreadcrumb(relativePath, repoName) {
  const breadcrumb = [];
  
  // Root breadcrumb
  breadcrumb.push({
    title: repoName,
    url: '/'
  });
  
  if (relativePath === '.') {
    return breadcrumb;
  }
  
  // Build path segments
  const segments = relativePath.split(path.sep);
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    currentPath = currentPath ? path.join(currentPath, segments[i]) : segments[i];
    breadcrumb.push({
      title: segments[i],
      url: '/' + encodePathSegments(currentPath) + '/'
    });
  }
  
  return breadcrumb;
}

// Generate page URL
function generatePageUrl(relativePath) {
  if (relativePath === '.') {
    return '/';
  }
  return '/' + encodePathSegments(relativePath) + '/';
}

// Generate edit URL
function generateEditUrl(relativePath, config) {
  const readmePath = relativePath === '.' 
    ? 'README.md' 
    : path.join(relativePath, 'README.md').replace(/\\/g, '/');
  
  return `https://github.com/${config.repo_owner}/${config.repo_name}/edit/${config.repo_branch}/${encodeURIComponent(readmePath)}`;
}

// Read README content
function readReadmeContent(fullPath) {
  return fs.readFileSync(fullPath, 'utf-8');
}

// Generate Jekyll page file
function generatePage(readme, config) {
  const pageUrl = generatePageUrl(readme.relativePath);
  const breadcrumb = generateBreadcrumb(readme.relativePath, config.repo_name);
  const editUrl = generateEditUrl(readme.relativePath, config);
  const content = readReadmeContent(readme.fullPath);
  
  // Extract title from first H1 if present, otherwise use directory name or repo name
  let title = config.repo_name;
  if (readme.relativePath !== '.') {
    const segments = readme.relativePath.split(path.sep);
    title = segments[segments.length - 1];
  }
  
  const frontMatter = {
    layout: 'default',
    readme_path: readme.relativePath === '.' ? 'README.md' : path.join(readme.relativePath, 'README.md').replace(/\\/g, '/'),
    page_url: pageUrl,
    breadcrumb: breadcrumb,
    edit_url: editUrl,
    title: title
  };
  
  // Generate YAML front matter
  const yaml = `---\n` +
    `layout: ${frontMatter.layout}\n` +
    `readme_path: "${frontMatter.readme_path}"\n` +
    `page_url: "${frontMatter.page_url}"\n` +
    `edit_url: "${frontMatter.edit_url}"\n` +
    `title: "${frontMatter.title}"\n` +
    `breadcrumb:\n` +
    frontMatter.breadcrumb.map(crumb => 
      `  - title: "${crumb.title}"\n    url: "${crumb.url}"`
    ).join('\n') +
    `\n---\n\n`;
  
  return yaml + content;
}

// Generate placeholder page for container directories
function generateContainerPage(containerPath, config) {
  const pageUrl = generatePageUrl(containerPath);
  const breadcrumb = generateBreadcrumb(containerPath, config.repo_name);
  
  // Extract title from directory name
  const segments = containerPath.split(path.sep);
  const title = segments[segments.length - 1];
  
  const frontMatter = {
    layout: 'default',
    readme_path: '',
    page_url: pageUrl,
    breadcrumb: breadcrumb,
    edit_url: '',
    title: title,
    is_container: true
  };
  
  const placeholderContent = `This directory is a container for other pages and has no content of its own.`;
  
  // Generate YAML front matter
  const yaml = `---\n` +
    `layout: ${frontMatter.layout}\n` +
    `readme_path: ""\n` +
    `page_url: "${frontMatter.page_url}"\n` +
    `edit_url: ""\n` +
    `title: "${frontMatter.title}"\n` +
    `is_container: true\n` +
    `breadcrumb:\n` +
    frontMatter.breadcrumb.map(crumb => 
      `  - title: "${crumb.title}"\n    url: "${crumb.url}"`
    ).join('\n') +
    `\n---\n\n` +
    placeholderContent;
  
  return yaml;
}

// Find container directories (directories without READMEs that contain nested dirs with READMEs)
function findContainerDirectories(readmes) {
  const readmePaths = new Set();
  readmes.forEach(r => {
    if (!r.isRoot) {
      readmePaths.add(r.relativePath);
    }
  });
  
  const containerPaths = new Set();
  
  // For each README path, check all parent directories
  for (const readmePath of readmePaths) {
    const segments = readmePath.split(path.sep);
    // Check each parent directory
    for (let i = 1; i < segments.length; i++) {
      const parentPath = segments.slice(0, i).join(path.sep);
      // If parent doesn't have a README, it's a container
      if (!readmePaths.has(parentPath)) {
        containerPaths.add(parentPath);
      }
    }
  }
  
  return Array.from(containerPaths).map(containerPath => ({
    relativePath: containerPath,
    isRoot: false,
    isContainer: true
  }));
}

// Build navigation tree
function buildNavTree(readmes, containers, repoName) {
  const tree = {
    root: null,
    children: []
  };
  
  // Find root README
  const rootReadme = readmes.find(r => r.isRoot);
  if (rootReadme) {
    tree.root = {
      title: repoName,
      url: '/'
    };
  }
  
  // Build a set of all paths that have READMEs or are containers
  const readmePaths = new Set();
  readmes.forEach(r => {
    if (!r.isRoot) {
      readmePaths.add(r.relativePath);
    }
  });
  
  const containerPaths = new Set();
  containers.forEach(c => {
    containerPaths.add(c.relativePath);
  });
  
  // Combined set of all valid paths (READMEs and containers)
  const allValidPaths = new Set([...readmePaths, ...containerPaths]);
  
  // Helper function to find the closest parent path that has a README or is a container
  function findParentPath(dirPath) {
    if (!dirPath || dirPath === '.') return null;
    const segments = dirPath.split(path.sep);
    for (let i = segments.length - 1; i > 0; i--) {
      const parentPath = segments.slice(0, i).join(path.sep);
      if (allValidPaths.has(parentPath)) {
        return parentPath;
      }
    }
    return null;
  }
  
  // Build tree structure - include directories that have READMEs or are containers
  const nodeMap = new Map();
  
  // Combine readmes and containers, sort by path
  const allItems = [
    ...readmes.filter(r => !r.isRoot),
    ...containers
  ].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  
  for (const item of allItems) {
    const pageUrl = generatePageUrl(item.relativePath);
    const segments = item.relativePath.split(path.sep);
    const segment = segments[segments.length - 1]; // Last segment is the directory name
    
    // Find or create node
    let node = nodeMap.get(item.relativePath);
    
    if (!node) {
      node = {
        title: segment,
        url: pageUrl,
        children: []
      };
      nodeMap.set(item.relativePath, node);
      
      // Find parent and add to appropriate level
      const parentPath = findParentPath(item.relativePath);
      if (parentPath) {
        const parentNode = nodeMap.get(parentPath);
        if (parentNode) {
          parentNode.children.push(node);
          parentNode.children.sort((a, b) => a.title.localeCompare(b.title));
        }
      } else {
        // No parent, add to root level
        tree.children.push(node);
        tree.children.sort((a, b) => a.title.localeCompare(b.title));
      }
    } else {
      // Node exists, just ensure URL is correct
      node.url = pageUrl;
    }
  }
  
  return tree;
}

// Main generation function
function generate() {
  console.log('Generating README site...');
  
  const config = readConfig();
  console.log(`Repository: ${config.repo_owner}/${config.repo_name}`);
  
  // Find all README files
  let readmes = findReadmeFiles();
  
  // Additional safety: filter out any READMEs in vendor or other excluded paths
  const beforeFilter = readmes.length;
  readmes = readmes.filter(r => {
    const pathStr = r.relativePath === '.' ? '' : r.relativePath;
    const fullPath = r.fullPath || '';
    const shouldExclude = pathStr.includes('vendor') || 
                          pathStr.includes('node_modules') ||
                          pathStr.includes('_generated') ||
                          pathStr.includes('_site') ||
                          fullPath.includes('vendor') ||
                          fullPath.includes('node_modules');
    
    if (shouldExclude) {
      console.log(`Excluding README: ${r.relativePath} (fullPath: ${fullPath})`);
    }
    
    return !shouldExclude;
  });
  
  if (beforeFilter !== readmes.length) {
    console.log(`Filtered out ${beforeFilter - readmes.length} README(s) from excluded paths`);
  }
  
  console.log(`Found ${readmes.length} README file(s) after filtering`);
  readmes.forEach(r => {
    console.log(`  - ${r.relativePath}`);
  });
  
  // Find container directories
  const containers = findContainerDirectories(readmes);
  if (containers.length > 0) {
    console.log(`Found ${containers.length} container directory/directories:`);
    containers.forEach(c => {
      console.log(`  - ${c.relativePath} (container)`);
    });
  }
  
  // Clean and create directories
  if (fs.existsSync(GENERATED_DIR)) {
    fs.rmSync(GENERATED_DIR, { recursive: true });
  }
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Generate pages for READMEs
  if (readmes.length === 0) {
    // No READMEs found - create minimal placeholder
    const placeholderContent = `---
layout: default
readme_path: ""
page_url: "/"
edit_url: ""
title: "${config.repo_name}"
breadcrumb:
  - title: "${config.repo_name}"
    url: "/"
---

# ${config.repo_name}

No README files found in this repository.
`;
    const outputPath = path.join(GENERATED_DIR, 'index.md');
    fs.writeFileSync(outputPath, placeholderContent, 'utf-8');
    console.log(`Generated placeholder: ${outputPath}`);
  } else {
    for (const readme of readmes) {
      const pageContent = generatePage(readme, config);
      
      let outputPath;
      if (readme.isRoot) {
        // Create in _generated for organization
        const generatedPath = path.join(GENERATED_DIR, 'index.md');
        fs.writeFileSync(generatedPath, pageContent, 'utf-8');
        console.log(`Generated: ${generatedPath}`);
        
        // Also create root index.md so Jekyll serves it as the homepage
        const rootPath = path.join(REPO_ROOT, 'index.md');
        fs.writeFileSync(rootPath, pageContent, 'utf-8');
        console.log(`Generated: ${rootPath}`);
      } else {
        // Create in _generated for organization
        const dirPath = path.join(GENERATED_DIR, readme.relativePath);
        fs.mkdirSync(dirPath, { recursive: true });
        const generatedPath = path.join(dirPath, 'index.md');
        fs.writeFileSync(generatedPath, pageContent, 'utf-8');
        console.log(`Generated: ${generatedPath}`);
        
        // Also create in root so Jekyll serves it at the correct URL
        const rootDirPath = path.join(REPO_ROOT, readme.relativePath);
        fs.mkdirSync(rootDirPath, { recursive: true });
        const rootPath = path.join(rootDirPath, 'index.md');
        fs.writeFileSync(rootPath, pageContent, 'utf-8');
        console.log(`Generated: ${rootPath}`);
      }
    }
  }
  
  // Generate pages for container directories
  for (const container of containers) {
    const pageContent = generateContainerPage(container.relativePath, config);
    
    // Create in _generated for organization
    const dirPath = path.join(GENERATED_DIR, container.relativePath);
    fs.mkdirSync(dirPath, { recursive: true });
    const generatedPath = path.join(dirPath, 'index.md');
    fs.writeFileSync(generatedPath, pageContent, 'utf-8');
    console.log(`Generated container page: ${generatedPath}`);
    
    // Also create in root so Jekyll serves it at the correct URL
    const rootDirPath = path.join(REPO_ROOT, container.relativePath);
    fs.mkdirSync(rootDirPath, { recursive: true });
    const rootPath = path.join(rootDirPath, 'index.md');
    fs.writeFileSync(rootPath, pageContent, 'utf-8');
    console.log(`Generated container page: ${rootPath}`);
  }
  
  // Generate navigation tree (includes both READMEs and containers)
  const navTree = buildNavTree(readmes, containers, config.repo_name);
  // Ensure nav.json always has valid structure even if empty
  if (!navTree.root && navTree.children.length === 0) {
    navTree.root = {
      title: config.repo_name,
      url: '/'
    };
  }
  fs.writeFileSync(NAV_JSON_PATH, JSON.stringify(navTree, null, 2), 'utf-8');
  console.log(`Generated: ${NAV_JSON_PATH}`);
  
  console.log('Generation complete!');
}

// Run generator
try {
  generate();
} catch (error) {
  console.error('Error generating site:', error);
  process.exit(1);
}

