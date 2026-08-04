/**
 * TubeMeta - Main Application Logic
 * 100% Client-Side YouTube Metadata & Thumbnail Analyzer
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('analyzer-form');
  const urlInput = document.getElementById('youtube-url');
  const skeletonScreen = document.getElementById('skeleton-screen');
  const dashboardContent = document.getElementById('dashboard-content');
  const errorBanner = document.getElementById('error-banner');
  const errorMessage = document.getElementById('error-message');

  // Video Info Elements
  const videoCardPreview = document.getElementById('video-card-preview');
  const videoPlayLink = document.getElementById('video-play-link');
  const videoTitle = document.getElementById('video-title');
  const videoAuthorLink = document.getElementById('video-author-link');
  const videoDirectLink = document.getElementById('video-direct-link');
  const copyVideoLinkBtn = document.getElementById('copy-video-link-btn');
  const videoStatDuration = document.getElementById('video-stat-duration');
  
  // Thumbnail Grid & Description Elements
  const thumbnailsGrid = document.getElementById('thumbnails-grid');
  const descriptionBox = document.getElementById('description-box');
  const copyDescriptionBtn = document.getElementById('copy-description-btn');
  
  // History Elements
  const historyGrid = document.getElementById('history-grid');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Global variables
  let currentVideoData = null;

  // Initialize History
  renderHistory();

  // Handle URL Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputUrl = urlInput.value.trim();
    if (!inputUrl) return;

    analyzeVideo(inputUrl);
  });

  // Handle Copy Video Link
  copyVideoLinkBtn.addEventListener('click', () => {
    if (currentVideoData && currentVideoData.videoUrl) {
      navigator.clipboard.writeText(currentVideoData.videoUrl)
        .then(() => showToast('Video URL copied to clipboard!'))
        .catch(() => showToast('Failed to copy URL', 'error'));
    }
  });

  // Handle Copy Full Description/Summary
  copyDescriptionBtn.addEventListener('click', () => {
    const textToCopy = descriptionBox.innerText;
    navigator.clipboard.writeText(textToCopy)
      .then(() => showToast('Full summary copied to clipboard!'))
      .catch(() => showToast('Failed to copy summary', 'error'));
  });

  // Clear History
  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('tubemeta_history');
    renderHistory();
    showToast('Analysis history cleared.');
  });

  /**
   * Main Analyzer Process
   */
  async function analyzeVideo(urlOrId) {
    const videoId = extractVideoId(urlOrId);
    
    if (!videoId) {
      showError('Invalid YouTube URL or Video ID. Please check the link and try again.');
      return;
    }

    // Reset UI
    hideError();
    showLoading(true);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

    try {
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Video not found or private (404).');
        } else {
          throw new Error('Failed to retrieve video metadata from YouTube.');
        }
      }

      const data = await response.json();
      
      currentVideoData = {
        id: videoId,
        title: data.title,
        author: data.author_name,
        authorUrl: data.author_url,
        thumbnailUrl: data.thumbnail_url,
        videoUrl: videoUrl,
        timestamp: Date.now()
      };

      // Populate UI with retrieved Metadata
      videoCardPreview.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      videoPlayLink.href = videoUrl;
      videoTitle.textContent = data.title;
      videoAuthorLink.textContent = data.author_name;
      videoAuthorLink.href = data.author_url || `https://www.youtube.com/@${encodeURIComponent(data.author_name)}`;
      videoDirectLink.href = videoUrl;
      
      // Keep it honest: Duration is not supplied in standard YouTube oEmbed responses
      videoStatDuration.textContent = 'Available on YouTube';

      // Load Description Summary
      loadDescriptionSummary(currentVideoData);

      // Save to LocalStorage History
      saveToHistory(currentVideoData);

      // Load & Render Thumbnail Qualities Grid
      await renderThumbnailSuite(videoId);

      // Show Dashboard Content
      showLoading(false);
    } catch (err) {
      showError(err.message || 'Network error. Please check your connection and try again.');
      showLoading(false);
    }
  }

  /**
   * Smart YouTube URL Parser
   * Reliably extracts 11-character video ID from any format
   */
  function extractVideoId(url) {
    if (!url) return null;
    url = url.trim();

    // 1. Check if input is already a raw 11-char video ID
    if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    // 2. Comprehensive URL extraction regex patterns
    // Coax matching for watch?v=, embed/, shorts/, live/, youtu.be/
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }

    // 3. Robust Search Query & Path Parsing fallback
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
        const v = parsedUrl.searchParams.get('v');
        if (v && v.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
          return v;
        }

        // Search paths like /shorts/ID or /live/ID
        const pathParts = parsedUrl.pathname.split('/');
        for (const part of pathParts) {
          if (part.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(part)) {
            return part;
          }
        }
      }
    } catch (e) {
      // URL constructor failed, ignore and try general lookbehinds
    }

    // 4. Secondary fallback regex for custom links
    const altRegex = /(?:vi\/|v=|\/embed\/|\/shorts\/|\/live\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/;
    const altMatch = url.match(altRegex);
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }

    return null;
  }

  /**
   * Render Thumbnail Suite
   * Validates and displays available thumbnail sizes in a grid
   */
  async function renderThumbnailSuite(videoId) {
    thumbnailsGrid.innerHTML = '';
    
    const qualities = [
      { key: 'maxres', label: 'Maximum HD', file: 'maxresdefault.jpg', res: '1280x720', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
      { key: 'sd', label: 'Standard', file: 'sddefault.jpg', res: '640x480', url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg` },
      { key: 'hq', label: 'High Quality', file: 'hqdefault.jpg', res: '480x360', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
      { key: 'mq', label: 'Medium', file: 'mqdefault.jpg', res: '320x180', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
      { key: 'small', label: 'Small', file: 'default.jpg', res: '120x90', url: `https://img.youtube.com/vi/${videoId}/default.jpg` }
    ];

    // Validate images asynchronously and append them
    for (const q of qualities) {
      const card = document.createElement('div');
      card.className = 'thumbnail-card';
      card.id = `thumb-card-${q.key}`;

      // Temporary Loading state inside card
      card.innerHTML = `
        <div class="thumb-image-wrapper">
          <div class="skeleton skeleton-img" style="width: 100%; height: 100%; margin: 0;"></div>
        </div>
      `;
      thumbnailsGrid.appendChild(card);

      validateThumbnailUrl(q.url, (isValid) => {
        if (isValid) {
          card.innerHTML = `
            <div class="thumb-image-wrapper">
              <img src="${q.url}" alt="${q.label} thumbnail" class="thumb-image" loading="lazy">
              <span class="thumb-badge">${q.label}</span>
              <span class="resolution-badge">${q.res}</span>
            </div>
            <div class="thumb-actions">
              <button class="thumb-action-btn" data-action="open" data-url="${q.url}">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
              </button>
              <button class="thumb-action-btn" data-action="copy" data-url="${q.url}">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
              <button class="thumb-action-btn" data-action="download" data-url="${q.url}" data-name="tubemeta_${videoId}_${q.key}.jpg">
                <i class="fa-solid fa-download"></i> Save
              </button>
            </div>
          `;

          // Add Action Event Listeners
          const openBtn = card.querySelector('[data-action="open"]');
          const copyBtn = card.querySelector('[data-action="copy"]');
          const downloadBtn = card.querySelector('[data-action="download"]');

          openBtn.addEventListener('click', () => window.open(q.url, '_blank'));
          
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(q.url)
              .then(() => showToast(`${q.label} URL copied!`))
              .catch(() => showToast('Failed to copy link', 'error'));
          });

          downloadBtn.addEventListener('click', () => {
            downloadImage(q.url, downloadBtn.getAttribute('data-name'));
          });

        } else {
          // If image does not exist, show "Not available" placeholder
          card.innerHTML = `
            <div class="thumb-error-placeholder">
              <i class="fa-solid fa-image-slash"></i>
              <span>${q.label} Resolution</span>
              <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Not available for this video</p>
            </div>
          `;
        }
      });
    }
  }

  /**
   * Gracefully handle 404 images
   * YouTube returns a 120x90 default image when higher resolutions don't exist
   */
  function validateThumbnailUrl(url, callback) {
    const img = new Image();
    img.onload = function() {
      // If a maxres (or sd/hq/mq) URL yields a 120x90 image, it's actually YouTube's fallback placeholder!
      if (img.naturalWidth === 120 && img.naturalHeight === 90 && !url.endsWith('/default.jpg')) {
        callback(false);
      } else {
        callback(true);
      }
    };
    img.onerror = function() {
      callback(false);
    };
    img.src = url;
  }

  /**
   * Trigger direct file download using Canvas Blob method (fallback to New Tab download if CORS error occurs)
   */
  async function downloadImage(url, filename) {
    showToast('Preparing download...');
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Request CORS access
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
              showToast('Download complete!');
            } else {
              throw new Error('Canvas conversion yielded empty blob.');
            }
          }, 'image/jpeg', 0.95);
        } catch (err) {
          // If canvas taint occurs, fallback to open in tab + copy URL
          window.open(url, '_blank');
          showToast('Image opened. Save manually (CORS restriction).');
        }
      };
      img.onerror = function() {
        window.open(url, '_blank');
        showToast('Image opened. Save manually.');
      };
      img.src = url;
    } catch (e) {
      window.open(url, '_blank');
      showToast('Image opened. Save manually.');
    }
  }

  /**
   * Load description summary and legal note
   */
  function loadDescriptionSummary(video) {
    descriptionBox.innerHTML = '';
    
    const summaryText = `=== TubeMeta Video Metadata Summary ===
Title        : ${video.title}
Channel      : ${video.author}
Channel URL  : ${video.authorUrl}
Video URL    : ${video.videoUrl}
Thumbnail    : https://img.youtube.com/vi/${video.id}/maxresdefault.jpg

=== Full Description ===
Note: Under YouTube's security & copyright policy, full descriptions and comment threads are kept on YouTube servers to maintain platform integrity. 

To view the description, interact with comments, or subscribe to the creator:
1. Click the "Open YouTube" button on this page.
2. Read the description directly in the video drawer.
`;

    const summaryContent = document.createElement('div');
    summaryContent.className = 'description-text';
    summaryContent.innerText = summaryText;

    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'description-fallback';
    noticeDiv.innerHTML = `
      <i class="fa-solid fa-arrow-up-right-from-square" style="color: var(--primary); font-size: 1.75rem; margin-bottom: 0.5rem;"></i>
      <p>Video details parsed! For full description and comment interaction, view the official YouTube video page.</p>
      <a href="${video.videoUrl}" target="_blank" class="btn-outline" style="margin-top: 0.5rem; background-color: var(--primary-light); display: inline-flex;">
        Open Video Page <i class="fa-solid fa-angle-right"></i>
      </a>
    `;

    descriptionBox.appendChild(summaryContent);
    descriptionBox.appendChild(noticeDiv);
  }

  /**
   * Save analyzed videos to local history (max 15 items)
   */
  function saveToHistory(video) {
    let history = JSON.parse(localStorage.getItem('tubemeta_history')) || [];
    
    // Check if video is already present, if so remove it
    history = history.filter(item => item.id !== video.id);
    
    // Add to front of the list
    history.unshift({
      id: video.id,
      title: video.title,
      author: video.author,
      thumbnailUrl: video.thumbnailUrl
    });

    // Capped at 15 items
    if (history.length > 15) {
      history = history.slice(0, 15);
    }

    localStorage.setItem('tubemeta_history', JSON.stringify(history));
    renderHistory();
  }

  /**
   * Render History Drawer UI
   */
  function renderHistory() {
    const history = JSON.parse(localStorage.getItem('tubemeta_history')) || [];
    
    if (history.length === 0) {
      historyGrid.innerHTML = `
        <div class="history-empty">
          <i class="fa-solid fa-folder-open"></i>
          <span>No analyzed videos yet</span>
          <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Your last 15 analyzed videos will appear here.</p>
        </div>
      `;
      return;
    }

    historyGrid.innerHTML = '';
    history.forEach(video => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.title = `Re-analyze: ${video.title}`;
      card.innerHTML = `
        <div class="history-thumb-wrapper">
          <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.title} thumbnail" class="history-thumb" loading="lazy">
        </div>
        <div class="history-title-text">${video.title}</div>
      `;

      card.addEventListener('click', () => {
        urlInput.value = `https://www.youtube.com/watch?v=${video.id}`;
        analyzeVideo(video.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      historyGrid.appendChild(card);
    });
  }

  /**
   * Toggle loading skeletal screens
   */
  function showLoading(isLoading) {
    if (isLoading) {
      skeletonScreen.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
    } else {
      skeletonScreen.classList.add('hidden');
      dashboardContent.classList.remove('hidden');
    }
  }

  /**
   * UI Error banners
   */
  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    // Scroll to error banner
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  /**
   * Create dynamic Toast messages
   */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation';
    
    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);

    // Fade out and remove automatically
    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2700);
  }
});
