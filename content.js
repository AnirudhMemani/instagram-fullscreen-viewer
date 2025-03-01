// Wait for Instagram to initialize
function waitForInstagram() {
    return new Promise(resolve => {
        const checkReady = () => {
            // Check if main Instagram content is loaded
            if (document.querySelector('main[role="main"]')) {
                resolve();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    });
}

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

            // Store the initial muted state
            let userMutedState = video.muted;

            // Add event listeners to maintain user's audio preference
            video.addEventListener('volumechange', () => {
                userMutedState = video.muted;
            });

            video.addEventListener('play', () => {
                video.muted = userMutedState;
            });

            video.addEventListener('ended', () => {
                video.muted = userMutedState;
            });
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
    try {
        const target = event.target;

        // Handle video clicks differently
        if (target.tagName.toLowerCase() === 'video') {
            // Don't exit fullscreen when clicking video
            return;
        }

        // Handle other fullscreen cases
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (target.tagName.toLowerCase() === 'img' && target.parentElement.tagName.toLowerCase() !== 'span') {
            target.requestFullscreen();
        }
    } catch (error) {
        console.error("Error in handleImageClick:", error);
    }
}

// Initialize with proper timing
async function initialize() {
    try {
        await waitForInstagram();
        
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
    } catch (error) {
        console.error("Error initializing extension:", error);
    }
}

// Start initialization
initialize();