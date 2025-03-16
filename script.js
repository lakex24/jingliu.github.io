document.addEventListener('DOMContentLoaded', function() {
    // Populate configuration values
    document.getElementById('page-title').textContent = `${CONFIG.name} - Research Portfolio`;
    document.getElementById('nav-name').textContent = CONFIG.name;
    document.getElementById('header-name').textContent = CONFIG.name;
    document.getElementById('header-title').textContent = CONFIG.title;
    document.getElementById('contact-email').textContent = CONFIG.email;
    document.getElementById('contact-institution').textContent = CONFIG.institution;
    document.getElementById('footer-year').textContent = CONFIG.year;
    document.getElementById('footer-name').textContent = CONFIG.name;

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
