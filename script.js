```javascript
const images = document.querySelectorAll(".image-box img");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");

let currentImage = 0;

// Open Lightbox
images.forEach((image, index) => {

    image.addEventListener("click", function () {

        currentImage = index;

        lightboxImage.src = image.src;

        lightbox.style.display = "flex";
    });

});

// Close Lightbox
function closeLightbox() {
    lightbox.style.display = "none";
}

// Next / Previous
function changeImage(direction) {

    currentImage += direction;

    if (currentImage >= images.length) {
        currentImage = 0;
    }

    if (currentImage < 0) {
        currentImage = images.length - 1;
    }

    lightboxImage.src = images[currentImage].src;
}

// Filter Images
function filterImages(category) {

    const boxes = document.querySelectorAll(".image-box");

    boxes.forEach(box => {

        if (category === "all") {
            box.style.display = "block";
        }

        else if (box.classList.contains(category)) {
            box.style.display = "block";
        }

        else {
            box.style.display = "none";
        }

    });
}

// Close when clicking outside image
lightbox.addEventListener("click", function(event) {

    if (event.target === lightbox) {
        closeLightbox();
    }

});

// Keyboard Navigation
document.addEventListener("keydown", function(event) {

    if (lightbox.style.display === "flex") {

        if (event.key === "ArrowRight") {
            changeImage(1);
        }

        if (event.key === "ArrowLeft") {
            changeImage(-1);
        }

        if (event.key === "Escape") {
            closeLightbox();
        }
    }

});
```
