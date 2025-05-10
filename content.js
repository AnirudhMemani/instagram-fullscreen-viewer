// Wait for Instagram to initialize
function waitForInstagram() {
  return new Promise((resolve) => {
    const checkReady = () => {
      // Check if main Instagram content is loaded
      // Look for multiple indicators that the app is fully loaded
      if (document.querySelector('main[role="main"]')) {
        setTimeout(resolve, 200);
      } else {
        setTimeout(checkReady, 200);
      }
    };
    checkReady();
  });
}

// Store viewer state between instances
const viewerState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  currentImageSrc: null,
};

function removeSiblingDivs() {
  try {
    // Find all video elements
    const videos = document.getElementsByTagName("video");
    const images = document.getElementsByTagName("img");

    // Iterate through each video
    for (const video of videos) {
      const parent = video.parentElement;
      if (!parent) continue;

      // Get all children of the parent
      const siblings = parent.children;

      // Remove all div siblings
      for (let i = siblings.length - 1; i >= 0; i--) {
        const sibling = siblings[i];
        if (sibling !== video && sibling.tagName.toLowerCase() === "div") {
          sibling.remove();
        }
      }

      // Enable video controls
      video.controls = true;

      // Store the initial muted state
      let userMutedState = video.muted;

      // Add event listeners to maintain user's audio preference
      video.addEventListener("volumechange", () => {
        userMutedState = video.muted;
      });

      video.addEventListener("play", () => {
        video.muted = userMutedState;
      });

      video.addEventListener("ended", () => {
        video.muted = userMutedState;
      });
    }

    for (const img of images) {
      img.style.objectFit = "contain";
      const parent = img?.parentElement;
      if (!parent) continue;

      const parentSiblings = parent?.parentElement?.children;

      if (!parentSiblings) continue;

      for (let i = parentSiblings?.length - 1; i >= 0; i--) {
        const sibling = parentSiblings?.[i];
        if (sibling && sibling !== parent && sibling?.tagName?.toLowerCase() === "div") {
          const classCount = sibling.classList?.length || 0;
          if (classCount <= 2) {
            sibling?.remove();
          }
        }
      }
    }
  } catch (error) {
    console.error("ERROR occurred in the extension:", error);
  }
}

function handleImageClick(event) {
  try {
    const target = event.target;

    // Handle video clicks differently
    if (target.tagName.toLowerCase() === "video") {
      // Don't exit fullscreen when clicking video
      return;
    }

    // Handle other fullscreen cases
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (target.tagName.toLowerCase() === "img" && target.parentElement.tagName.toLowerCase() !== "span") {
      // Check if the image has the specific referrerpolicy
      if (target.getAttribute("referrerpolicy") === "origin-when-cross-origin") {
        // Let the default action continue for these images
        return;
      }

      // Check if parent has specific padding-bottom style (typically for specific image containers)
      const computedStyle = window.getComputedStyle(target.parentElement);
      const paddingBottom = computedStyle.paddingBottom;

      // Calculate the percentage if it's in pixels
      if (paddingBottom.endsWith("px")) {
        const paddingPx = parseFloat(paddingBottom);
        const parentWidth = target.parentElement.clientWidth;
        const paddingPercentage = (paddingPx / parentWidth) * 100;

        // Check if it's approximately 133.333% (allow some margin for rounding)
        if (paddingPercentage > 130 && paddingPercentage < 136) {
          console.log("Skipping image due to specific padding-bottom style equivalent to ~133.333%");
          return;
        }
      } else if (paddingBottom === "133.333%") {
        console.log("Skipping image due to specific padding-bottom percentage style");
        return;
      }

      // Create custom image viewer instead of using native fullscreen
      createImageViewer(target);
    }
  } catch (error) {
    console.error("Error in handleImageClick:", error);
  }
}

// Function to create a custom image viewer with zoom and close button
function createImageViewer(imgElement) {
  // Check if viewer already exists and remove it
  const existingViewer = document.querySelector(".instagram-fullscreen-viewer");
  if (existingViewer) {
    // If we're opening a different image, reset the state
    if (viewerState.currentImageSrc !== imgElement.src) {
      viewerState.scale = 1;
      viewerState.translateX = 0;
      viewerState.translateY = 0;
    }
    document.body.removeChild(existingViewer);
  }

  // Update current image source
  viewerState.currentImageSrc = imgElement.src;

  // Create overlay container
  const overlay = document.createElement("div");
  overlay.className = "instagram-fullscreen-viewer";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 1)";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  // Create image container for zoom/pan
  const imgContainer = document.createElement("div");
  imgContainer.style.position = "relative";
  imgContainer.style.overflow = "hidden";
  imgContainer.style.width = "100%";
  imgContainer.style.height = "100%";
  imgContainer.style.display = "flex";
  imgContainer.style.justifyContent = "center";
  imgContainer.style.alignItems = "center";

  // Create image element
  const img = document.createElement("img");
  img.src = imgElement.src;
  img.style.maxWidth = "100%";
  img.style.maxHeight = "100%";
  img.style.objectFit = "contain";
  img.style.transition = "transform 0.1s ease";
  img.style.cursor = "zoom-in";

  // Create close button with improved visibility
  const closeButton = document.createElement("div");
  closeButton.innerHTML = "✕";
  closeButton.style.position = "absolute";
  closeButton.style.top = "20px";
  closeButton.style.right = "20px";
  closeButton.style.width = "40px";
  closeButton.style.height = "40px";
  closeButton.style.borderRadius = "50%";
  closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
  closeButton.style.color = "white";
  closeButton.style.fontSize = "24px";
  closeButton.style.fontWeight = "bold";
  closeButton.style.display = "flex";
  closeButton.style.justifyContent = "center";
  closeButton.style.alignItems = "center";
  closeButton.style.cursor = "pointer";
  closeButton.style.zIndex = "1000000";
  closeButton.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";

  img.style.cursor = viewerState.scale > 1 ? "grab" : "zoom-in";

  // Apply stored transform immediately
  img.style.transform = `translate(${viewerState.translateX}px, ${viewerState.translateY}px) scale(${viewerState.scale})`;

  // Add zoom functionality
  let scale = viewerState.scale;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = viewerState.translateX;
  let translateY = viewerState.translateY;

  // Zoom with mouse wheel
  imgContainer.addEventListener("wheel", (e) => {
    e.preventDefault();

    // Get cursor position relative to image
    const rect = img.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the old scale and new scale
    const oldScale = scale;
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    scale = Math.max(1, Math.min(5, scale + delta));

    if (scale > 1) {
      // Calculate how much the point under the cursor should move
      const distX = mouseX - rect.width / 2;
      const distY = mouseY - rect.height / 2;

      // Adjust translation to keep the point under cursor fixed
      translateX = translateX - distX * (scale / oldScale - 1);
      translateY = translateY - distY * (scale / oldScale - 1);
    } else {
      // Reset translation when zooming back to 1
      translateX = 0;
      translateY = 0;
    }

    updateTransform();

    // Update cursor based on zoom level
    img.style.cursor = scale > 1 ? "grab" : "zoom-in";
  });

  // Prevent click propagation to avoid creating multiple viewers
  imgContainer.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Pan when zoomed in
  img.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Allow dragging regardless of zoom level
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    img.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      e.preventDefault();
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    }
  });

  // Add event listeners to handle drag end
  const mouseUpHandler = () => {
    if (isDragging) {
      isDragging = false;
      img.style.cursor = scale > 1 ? "grab" : "zoom-in";
      // Don't reset scale or translation here
    }
  };

  document.addEventListener("mouseup", mouseUpHandler);

  // Remove mouseleave handler to prevent resetting position when mouse leaves the image
  // img.addEventListener("mouseleave", mouseUpHandler);

  function updateTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // Update the persistent state
    viewerState.scale = scale;
    viewerState.translateX = translateX;
    viewerState.translateY = translateY;
  }

  function resetViewerState() {
    viewerState.currentImageSrc = null;
    viewerState.scale = 1;
    viewerState.translateX = 0;
    viewerState.translateY = 0;
  }

  // Common function to close the viewer
  const closeViewer = () => {
    if (document.body.contains(overlay)) {
      resetViewerState();
      document.body.removeChild(overlay);
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("keydown", escKeyHandler);
    }
  };

  // Close on button click
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    closeViewer();
  });

  // Also close on overlay background click (but not on image)
  imgContainer.addEventListener("click", (e) => {
    if (e.target === imgContainer) {
      closeViewer();
    }
  });

  // Add ESC key handler to close viewer
  const escKeyHandler = (e) => {
    if (e.key === "Escape") {
      closeViewer();
    }
  };
  document.addEventListener("keydown", escKeyHandler);

  // Add elements to DOM
  imgContainer.appendChild(img);
  overlay.appendChild(imgContainer);
  imgContainer.appendChild(closeButton);
  document.body.appendChild(overlay);
}

// Initialize with proper timing
async function initialize() {
  try {
    await waitForInstagram();

    // Run initially
    removeSiblingDivs();

    // Add click listener for images
    document.addEventListener("click", handleImageClick, true);

    // Create a MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver(removeSiblingDivs);

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
}

// Start initialization
initialize();
