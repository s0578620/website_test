import { supabase } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('portfolio-stories');
    if (!container) return;

    const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = '<p>⚠️ Failed to load stories. Please try again later.</p>';
        console.error("Error fetching stories:", error);
        return;
    }

    if (!stories || stories.length === 0) {
        container.innerHTML = '<p>No stories to display yet.</p>';
        return;
    }

    stories.forEach(story => {
        const section = document.createElement('section');
        section.className = 'portfolio-item';
        section.innerHTML = `
            <div class="text">
                <h2>${story.title}</h2>
                <p>${story.text}</p>
            </div>
            <div class="image">
                <img src="${story.image_url}" alt="${story.title}" loading="lazy">
            </div>
        `;
        container.appendChild(section);
    });
});
