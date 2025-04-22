let lastScrollY = window.scrollY;
let currentIndex = 0;
const items = document.querySelectorAll('.portfolio-item');

// Funktionen für zeigen/verstecken
const showSection = (index) => {
    items.forEach((item, i) => {
        item.classList.remove('active-in', 'active-out');
        if (i === index) {
            item.classList.add('active-in');
        } else if (i === index - 1) {
            item.classList.add('active-out');
        }
    });
};

// Scroll-Überwachung
const onScroll = () => {
    const scrollY = window.scrollY;
    const scrollingDown = scrollY > lastScrollY;

    if (scrollingDown && currentIndex < items.length - 1) {
        const nextItem = items[currentIndex + 1];
        const nextItemTop = nextItem.offsetTop;

        if (scrollY + window.innerHeight > nextItemTop + 100) {
            currentIndex++;
            showSection(currentIndex);
        }
    } else if (!scrollingDown && currentIndex > 0) {
        const currentItemTop = items[currentIndex].offsetTop;

        if (scrollY + window.innerHeight < currentItemTop + 100) {
            currentIndex--;
            showSection(currentIndex);
        }
    }

    lastScrollY = scrollY;
};

window.addEventListener('scroll', onScroll);
showSection(0); // beim Start
