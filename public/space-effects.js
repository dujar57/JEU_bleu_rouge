// Créer des étoiles animées dans le fond
function createSpaceBackground() {
    const particles = document.getElementById('particles');
    if (!particles) return;
    
    // Créer des étoiles fixes
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 2 + 1) + 's';
        particles.appendChild(star);
    }
    
    // Créer des planètes/orbes lumineux
    for (let i = 0; i < 5; i++) {
        const orb = document.createElement('div');
        orb.className = 'space-orb';
        orb.style.left = Math.random() * 100 + '%';
        orb.style.top = Math.random() * 100 + '%';
        orb.style.animationDelay = Math.random() * 5 + 's';
        orb.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particles.appendChild(orb);
    }
    
    // Créer des météores occasionnels
    setInterval(() => {
        if (Math.random() > 0.7) {
            createMeteor();
        }
    }, 3000);
}

function createMeteor() {
    const particles = document.getElementById('particles');
    if (!particles) return;
    
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.left = Math.random() * 100 + '%';
    meteor.style.top = -10 + 'px';
    particles.appendChild(meteor);
    
    setTimeout(() => {
        meteor.remove();
    }, 2000);
}

// Effet de parallaxe avec la souris
function initParallax() {
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
        
        // Déplacer les éléments en parallaxe
        document.querySelectorAll('.star').forEach((star, index) => {
            const speed = (index % 3 + 1) * 20;
            star.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
        });
        
        document.querySelectorAll('.space-orb').forEach((orb, index) => {
            const speed = (index % 2 + 1) * 30;
            orb.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px) scale(${1 + Math.abs(mouseX) * 0.2})`;
        });
    });
}

// Effet de pulsation sur les boutons au survol
function initButtonEffects() {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
            createSparkles(this);
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function createSparkles(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = rect.left + Math.random() * rect.width + 'px';
        sparkle.style.top = rect.top + Math.random() * rect.height + 'px';
        document.body.appendChild(sparkle);
        
        setTimeout(() => {
            sparkle.remove();
        }, 1000);
    }
}

// Initialiser tous les effets
window.addEventListener('DOMContentLoaded', () => {
    createSpaceBackground();
    initParallax();
    initButtonEffects();
});
