// Vorschau + Delete nur in admin.html
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('admin-stories');
    if (!container) return;

    const stories = JSON.parse(localStorage.getItem('stories')) || [];

    if (stories.length === 0) {
        container.innerHTML += '<p>No stories saved yet.</p>';
        return;
    }

    stories.forEach((story, index) => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'admin-story-entry';
        storyDiv.innerHTML = `
      <h3>${story.title}</h3>
      <p>${story.text}</p>
      <img src="${story.imageUrl}" alt="${story.title}" style="max-width:150px; margin-top:10px;">
      <br>
      <button class="delete-story" data-index="${index}">🗑️ Delete</button>
      <hr>
    `;
        container.appendChild(storyDiv);
    });

    // Delete-Funktion
    const deleteButtons = document.querySelectorAll('.delete-story');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (confirm('Delete this story?')) {
                const updated = stories.filter((_, i) => i !== index);
                localStorage.setItem('stories', JSON.stringify(updated));
                location.reload();
            }
        });
    });
});
