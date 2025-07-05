import { supabase } from './config.js';

// 🔐 Auth check – nur eingeloggte dürfen weiter
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) window.location.href = "login.html";
})();

// 📝 Neue Story speichern
document.getElementById('story-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('story-title').value.trim();
    const text = document.getElementById('story-text').value.trim();
    const file = document.getElementById('story-image-file').files[0];

    if (!title || !text || !file) return alert("❌ All fields required, including image.");

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return alert("❌ Could not get user.");

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    // 📤 Upload image to Supabase Storage
    const { error: uploadError } = await supabase
        .storage
        .from('story-images')
        .upload(filePath, file);

    if (uploadError) {
        alert("❌ Upload failed: " + uploadError.message);
        return;
    }

    const { data: publicUrlData } = supabase
        .storage
        .from('story-images')
        .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    // 📦 Insert story
    const { error } = await supabase
        .from('stories')
        .insert([{ title, text, image_url: imageUrl, user_id: userId }]);

    if (error) {
        alert("❌ Failed to save story: " + error.message);
    } else {
        alert("✅ Story saved!");
        location.reload();
    }
});

// 🔃 Autorname & Storyliste beim Laden
document.addEventListener('DOMContentLoaded', async () => {
    // Autorname laden
    const authorInput = document.getElementById("site-author");
    if (authorInput) {
        const { data, error } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'author_name')
            .single();
        if (!error && data?.value) authorInput.value = data.value;
    }

    // Stories laden
    const container = document.getElementById('admin-stories');
    if (!container) return;

    const { data: stories, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError || !stories?.length) {
        container.innerHTML += '<p>No stories saved yet.</p>';
        return;
    }

    stories.forEach(story => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'admin-story-entry';
        storyDiv.innerHTML = `
            <h3 contenteditable="false">${story.title}</h3>
            <p contenteditable="false">${story.text}</p>
            <input type="text" class="image-url-input" value="${story.image_url}" style="width: 100%; margin: 10px 0;" disabled>
            <img src="${story.image_url}" alt="${story.title}" class="preview-image" style="max-width:150px; margin-top:10px;"><br>
            <button class="edit-story" data-id="${story.id}">✏️ Edit</button>
            <button class="save-story" data-id="${story.id}" style="display:none;">💾 Save</button>
            <button class="delete-story" data-id="${story.id}">🗑️ Delete</button>
            <hr>
        `;
        container.appendChild(storyDiv);

        const titleEl = storyDiv.querySelector('h3');
        const textEl = storyDiv.querySelector('p');
        const imageInput = storyDiv.querySelector('.image-url-input');
        const previewImage = storyDiv.querySelector('.preview-image');
        const editBtn = storyDiv.querySelector('.edit-story');
        const saveBtn = storyDiv.querySelector('.save-story');

        // ✏️ Edit
        editBtn.addEventListener('click', () => {
            [titleEl, textEl].forEach(el => el.contentEditable = "true");
            imageInput.disabled = false;
            editBtn.style.display = "none";
            saveBtn.style.display = "inline";
        });

        // 💾 Save
        saveBtn.addEventListener('click', async () => {
            const newTitle = titleEl.innerText.trim();
            const newText = textEl.innerText.trim();
            const newImageUrl = imageInput.value.trim();

            const { error } = await supabase
                .from('stories')
                .update({ title: newTitle, text: newText, image_url: newImageUrl })
                .eq('id', story.id);

            if (error) {
                alert("❌ Could not update story.");
                console.error(error);
            } else {
                alert("✅ Story updated!");
                [titleEl, textEl].forEach(el => el.contentEditable = "false");
                imageInput.disabled = true;
                previewImage.src = newImageUrl;
                editBtn.style.display = "inline";
                saveBtn.style.display = "none";
            }
        });

        // 🗑️ Delete
        storyDiv.querySelector('.delete-story').addEventListener('click', async () => {
            if (confirm('Delete this story?')) {
                const { error } = await supabase
                    .from('stories')
                    .delete()
                    .eq('id', story.id);
                if (error) alert("❌ Delete failed.");
                else location.reload();
            }
        });
    });
});

// 🚪 Logout
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    });
}

// ✏️ Autorname speichern
document.getElementById('save-author')?.addEventListener('click', async () => {
    const author = document.getElementById("site-author").value.trim();
    const { error } = await supabase
        .from('site_config')
        .upsert([{ key: 'author_name', value: author }], { onConflict: ['key'] });

    if (error) {
        alert("❌ Could not save name.");
        console.error(error);
    } else {
        alert("✅ Author name updated.");
    }
});
