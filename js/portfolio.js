// portfolio.js
import { supabase } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('portfolio-stories');
    if (!container) return;

    const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Fehler beim Laden der Stories:', error.message);
        container.innerHTML = '<p>Failed to load stories.</p>';
        return;
    }

    if (!stories || stories.length === 0) {
        container.innerHTML = '<p>No public stories available.</p>';
        return;
    }

    console.log('Geladene Stories:', stories);

    stories.forEach(story => {
        console.log('Geladene Story:', story);

        const section = document.createElement('section');
        section.className = 'portfolio-item';

        section.innerHTML = `
            <div class="portfolio-image">
                <img src="${story.image_url || ''}" alt="${story.title}" />
            </div>
            <div class="portfolio-text">
                <h2>${story.title || 'Untitled'}</h2>
                <div class="story-content">
                    ${story.text || ''}
                </div>
            </div>
        `;

        container.appendChild(section);
    });
});
