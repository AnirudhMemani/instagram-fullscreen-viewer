function removeSiblingDivs() {
    try {
        // Find all video elements
        const videos = document.getElementsByTagName('video');
        const images = document.getElementsByTagName('img');

        // Iterate through each video
        for (const video of videos) {
            const parent = video.parentElement;
            if (!parent) continue;

            // Get all children of the parent
            const siblings = parent.children;

            // Remove all div siblings
            for (let i = siblings.length - 1; i >= 0; i--) {
                const sibling = siblings[i];
                if (sibling !== video && sibling.tagName.toLowerCase() === 'div') {
                    sibling.remove();
                }
            }

            // Enable video controls
            video.controls = true;
        }

        for (const img of images) {
            img.style.objectFit = 'contain';
            const parent = img?.parentElement;
            if (!parent) continue;

            const parentSiblings = parent?.parentElement?.children;
            if (!parentSiblings) continue;

            for (let i = parentSiblings?.length - 1; i >= 0; i--) {
                const sibling = parentSiblings?.[i];
                if (sibling && sibling !== parent && sibling?.tagName?.toLowerCase() === 'div') {
                    sibling?.remove();
                }
            }
        }
    } catch (error) {
        console.error("ERROR occurred in the extension:", error);
    }
}

function handleImageClick(event) {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else if (event.target.tagName.toLowerCase() === 'img') {
        event.target.requestFullscreen();
    }
}

// Run initially
removeSiblingDivs();

// Add click listener for images
document.addEventListener('click', handleImageClick, true);

// Create a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver(removeSiblingDivs);

// Start observing the document with the configured parameters
observer.observe(document.body, {
    childList: true,
    subtree: true
});