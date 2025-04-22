document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('portfolio-stories');
    if (!container) return;

    const stories = JSON.parse(localStorage.getItem('stories')) || [];

    stories.forEach(story => {
        const section = document.createElement('section');
        section.className = 'portfolio-item active-in';

        section.innerHTML = `
      <div class="text">
        <h2>${story.title}</h2>
        <p>${story.text}</p>
      </div>
      <div class="image">
        <img src="${story.imageUrl}" alt="${story.title}">
      </div>
    `;

        container.appendChild(section);
    });
});
