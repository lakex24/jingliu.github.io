// Initialize all elements with config values
function initializeConfig() {
    if (typeof window.CONFIG === 'undefined') {
        console.error('CONFIG is not defined');
        return;
    }

    const config = window.CONFIG;
    console.log('Initializing with config:', config);

    // Direct assignments for critical elements
    document.title = config.sitename;
    document.getElementById('page-title').textContent = config.sitename;
    document.getElementById('nav-name').textContent = config.name;
    document.getElementById('footer-year').textContent = config.year;
    document.getElementById('footer-name').textContent = config.name;
}

// Initialize video player
function initializeVideoPlayer() {
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) return;

    const video = videoContainer.querySelector('video');
    const playButton = videoContainer.querySelector('.play-button');
    
    video.load();
    
    // Add error handling
    video.addEventListener('error', function(e) {
        console.error('Video error:', e);
        console.error('Video error code:', video.error ? video.error.code : 'unknown');
    });
    
    // Wait for video metadata to load before seeking
    video.addEventListener('loadedmetadata', function() {
        console.log('Video metadata loaded successfully');
        video.currentTime = 0.1;
        // Ensure play button is visible initially
        playButton.style.display = 'block';
    });
    
    video.addEventListener('canplay', function() {
        console.log('Video can start playing');
    });
    
    video.addEventListener('play', function() {
        console.log('Video play event fired');
        playButton.style.display = 'none';
    });
    
    video.addEventListener('playing', function() {
        console.log('Video is actually playing');
    });
    
    video.addEventListener('stalled', function() {
        console.log('Video stalled');
    });
    
    video.addEventListener('waiting', function() {
        console.log('Video waiting for data');
    });
    
    videoContainer.addEventListener('click', function() {
        console.log('Video container clicked, video paused:', video.paused, 'currentTime:', video.currentTime, 'duration:', video.duration);
        
        // Reset video to beginning and play
        video.currentTime = 0;
        video.play().then(() => {
            console.log('Video play started successfully');
            playButton.style.display = 'none';
        }).catch(error => {
            console.error('Error playing video:', error);
        });
    });
    
    video.addEventListener('ended', function() {
        video.currentTime = 0.1;
        playButton.style.display = 'block';
    });
    
    video.addEventListener('pause', function() {
        playButton.style.display = 'block';
    });
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeConfig();
    initializeVideoPlayer();

    // Set background image
    document.querySelector('.home-bg').style.backgroundImage = `url(${CONFIG.backgroundImage})`;

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 75,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active nav item on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
});
