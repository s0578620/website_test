const form = document.getElementById('story-form');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('story-title').value.trim();
    const text = document.getElementById('story-text').value.trim();
    const imageUrl = document.getElementById('story-image').value.trim();

    if (!title || !text || !imageUrl) {
        alert('Please fill out all fields!');
        return;
    }

    const newStory = { title, text, imageUrl };

    const existingStories = JSON.parse(localStorage.getItem('stories')) || [];
    existingStories.push(newStory);
    localStorage.setItem('stories', JSON.stringify(existingStories));

    alert('Story saved successfully!');
    form.reset();
});
