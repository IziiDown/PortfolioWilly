const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

// Configuration de la taille du canvas
// On veut qu'il prenne toute la largeur et hauteur de la fenêtre
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray; // Tableau qui contiendra toutes nos particules

// Gestion de la souris
// On stocke la position de la souris pour l'interaction
let mouse = {
    x: null,
    y: null,
    radius: (canvas.height / 110) * (canvas.width / 110) // Rayon d'interaction autour de la souris
}

// Ecouteur d'événement : quand la souris bouge, on met à jour ses coordonnées
window.addEventListener('mousemove',
    function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    }
);

// Configuration de la "Planète" (Zone Interdite pour les particules)
// Basé sur votre image, la planète est à droite.
let planet = {
    x: canvas.width * 0.86, // Le centre est aux 80% vers la droite
    y: canvas.height / 2,   // Au milieu verticalement
    radius: canvas.height * 0.85 // Rayon plus large pour couvrir les coins
};

// Création de la classe Particule AKA le plan de construction de chaque point
class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX; // Vitesse horizontale
        this.directionY = directionY; // Vitesse verticale
        this.size = size;
        this.color = color; // Expecting 'r, g, b' string format for easy opacity handling
        this.history = []; // Mémoire des positions précédentes pour la traînée
    }

    // Méthode pour dessiner la particule (le point)
    draw() {
        // C'est ICI qu'on vérifie si on est "derrière" la planète
        let dx = this.x - planet.x;
        let dy = this.y - planet.y;
        let distance = Math.sqrt(dx*dx + dy*dy);

        // Si la particule est DANS le cercle de la planète, on ne la dessine pas !
        if (distance < planet.radius) {
            this.history = []; // On efface la traînée si elle est cachée
            return; 
        }

        // Dessiner la traînée (queue de l'étoile)
        for(let i = 0; i < this.history.length; i++){
            ctx.beginPath();
            // On fait varier la taille : plus c'est loin dans le passé (i petit), plus c'est petit
            let trailSize = this.size * (i / this.history.length);
            ctx.arc(this.history[i].x, this.history[i].y, trailSize, 0, Math.PI * 2, false);
            
            // On fait varier l'opacité : plus c'est loin, plus c'est transparent
            let opacity = i / this.history.length; 
            ctx.fillStyle = 'rgba(' + this.color + ', ' + opacity + ')'; 
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(' + this.color + ', 0.8)'; // Couleur des points
        ctx.fill();
    }

    // Méthode pour mettre à jour la position de la particule (l'animation)
    update() {
        // Vérifier si la particule touche le bord du canvas, si oui on inverse la direction
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // Vérification de la collision avec la souris
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Si la souris est proche (dans le rayon), la particule fuit la souris
        // VELOCITY CAP: On ne pousse que de 2 pixels max par frame
        if (distance < mouse.radius + this.size) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                this.x += 2;
            }
            if (mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 2;
            }
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                this.y += 2;
            }
            if (mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 2;
            }
        }
        
        // Mouvement normal
        this.x += this.directionX;
        this.y += this.directionY;

        // On ajoute la position actuelle à l'historique pour la traînée
        this.history.push({x: this.x, y: this.y});
        if (this.history.length > 20) {
            this.history.shift(); // On garde les 20 dernières positions pour une longue traînée
        }

        // On redessine le point à sa nouvelle position
        this.draw();
    }
}

// Fonction d'initialisation : crée toutes les particules
function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 15000; // Beaucoup moins de particules

    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1; // Taille plus petite (entre 1 et 3)
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 0.4) - 0.5; // Vitesse TRÈS lente (max 0.2)
        let directionY = (Math.random() * 0.4) - 0.2;
        
        // Palette extraite de l'image (Blanc, Bleu pâle, Doré pâle)
        let colors = [
            '255, 255, 255', // Blanc classique
            '255, 255, 255', // Plus de chance d'avoir du blanc
            '174, 203, 235', // Bleu étoile (AECBEB)
            '232, 203, 163'  // Doré étoile (E8CBA3)
        ];
        let color = colors[Math.floor(Math.random() * colors.length)];

        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

// Fonction d'animation : boucle infini qui rafraichit l'écran
function animate() {
    requestAnimationFrame(animate); 
    ctx.clearRect(0, 0, innerWidth, innerHeight); // On efface tout le tableau avant de redessiner

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(); // On bouge chaque point
    }
     // connect(); // On dessine les traits entre les points proches
}

// Fonction pour dessiner les lignes entre les points proches
/*function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                           ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            
            // Si deux points sont assez proches, on trace une ligne
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                ctx.strokeStyle = 'rgba(255, 255, 255, ' + opacityValue + ')'; // Couleur des lignes (Blanc transparent)
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}*/

// Si on redimensionne la fenêtre, on réinitialise pour éviter les déformations
window.addEventListener('resize',
    function() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        mouse.radius = ((canvas.height / 80) * (canvas.height / 80));
        
        // On recalcule la position de la planète si l'écran change de taille
        planet.x = canvas.width * 0.8;
        planet.y = canvas.height / 2;
        planet.radius = canvas.height * 0.85;

        init();
    }
);

// Désactiver la détection de souris quand elle quitte l'écran
window.addEventListener('mouseout',
    function() {
        mouse.x = undefined;
        mouse.y = undefined;
    }
)

init(); // On lance la création
animate(); // On lance l'animation

// Animation d'apparition au scroll (Scroll Reveal)
function reveal() {
  var reveals = document.querySelectorAll(".reveal");

  for (var i = 0; i < reveals.length; i++) {
    var windowHeight = window.innerHeight;
    var elementTop = reveals[i].getBoundingClientRect().top;
    var elementVisible = 150; // Marge pour déclencher l'effet (plus c'est grand, plus il faut scroller)

    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    } else {
      // Optionnel : retirer la classe pour rejouer l'anim quand on remonte
        reveals[i].classList.remove("active");
    }
  }
}

window.addEventListener("scroll", reveal);

// Important : On appelle reveal() tout de suite au cas où on est déjà en bas de page au chargement
reveal();

// Carousel Logic
const slides = document.querySelectorAll('.carousel-slide');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
let currentSlide = 0;

function showSlide(n) {
    // Hide all slides
    slides.forEach(slide => {
        slide.classList.remove('active');
        // Reset animation by removing and adding class or triggering reflow (simple remove/add works for display: none)
    });
    
    // Calculate index
    currentSlide = (n + slides.length) % slides.length;
    
    // Show new slide
    slides[currentSlide].classList.add('active');
}

if(prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
}

// Portfolio Tab System
const projectData = {
    personal: [
        { name: "Mon Portfolio", link: "#" },
    ],
    enterprise: [
        { name: "Pas encore de réel projet d'entreprise", link: "#" },
    ],
    school: [
        { name: "Projet C (Pendu)", link: "#" },
        { name: "Question pour un champion VBA", link: "#" },
        { name: "Site Vitrine", link: "#" }
    ]
};

const folderContainers = document.querySelectorAll('.folder-container');
const projectDisplay = document.getElementById('project-display');
const displayTitle = document.getElementById('display-title');
const displayList = document.getElementById('display-list');
const portfolioSection = document.getElementById('portfolio');

function updateDisplay(category) {
    const data = projectData[category];
    if (!data) return;

    // Update Title
    const titles = {
        personal: "Projets Personnels",
        enterprise: "Projets Entreprise",
        school: "Projets École"
    };
    displayTitle.textContent = titles[category];

    // Update List
    displayList.innerHTML = data.map(project => `
        <li>
            <a href="${project.link}" target="_blank">${project.name}</a>
        </li>
    `).join('');

    // Show Display
    projectDisplay.classList.add('active');
}

// Show Display (with timeout logic)
let hideTimeout;

folderContainers.forEach(folder => {
    folder.addEventListener('mouseenter', () => {
        // Cancel any pending hide action
        clearTimeout(hideTimeout);
        
        // Remove active class from all folders
        folderContainers.forEach(f => f.classList.remove('active'));
        // Add to current
        folder.classList.add('active');
        
        // Update Display
        const category = folder.getAttribute('data-category');
        updateDisplay(category);
    });
});

// Hide display when leaving the portfolio section
portfolioSection.addEventListener('mouseleave', () => {
    // Add a grace period before hiding
    hideTimeout = setTimeout(() => {
        projectDisplay.classList.remove('active');
        folderContainers.forEach(f => f.classList.remove('active'));
    }, 400); // 400ms delay to allow catching the mouse back
});

// Also cancel hide if re-entering the display area itself (just in case)
projectDisplay.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
});