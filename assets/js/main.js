// Prevent on Click Scroll page to top
const links = document.getElementsByTagName("a");
for(link of links) {
    link.setAttribute("onclick", "return false;");
}

// Carousel
const mainCarousel = document.querySelector('#main-carousel');
const carousel = new bootstrap.Carousel(mainCarousel, {
  interval: 4000,
  touch: true
})