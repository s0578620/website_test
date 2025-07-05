import { supabase } from './config.js';

// 🔐 Auth check – nur eingeloggte dürfen weiter
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    }
})();

// 📝 Neue Story speichern
document.getElementById('story-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('story-title').value.trim();
    const text = document.getElementById('story-text').value.trim();
    const fileInput = document.getElementById('story-image-file');
    const file = fileInput.files[0];

    if (!file) return alert("❌ No image selected.");

    const user = await supabase.auth.getUser();
    const filePath = `${user.data.user.id}/${Date.now()}_${file.name}`;

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

    const { error } = await supabase
        .from('stories')
        .insert([{ title, text, image_url: imageUrl, user_id: user.data.user.id }]);

    if (error) {
        alert("❌ Failed to save story: " + error.message);
    } else {
        alert("✅ Story saved!");
        location.reload();
    }
});

// 🔃 Bestehende Stories & Autor laden
document.addEventListener('DOMContentLoaded', async () => {
    const authorInput = document.getElementById("site-author");
    if (authorInput) {
        const { data, error } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'author_name')
            .single();
        if (!error && data?.value) authorInput.value = data.value;
    }

    const container = document.getElementById('admin-stories');
    if (!container) return;

    const { data: stories, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError || !stories || stories.length === 0) {
        container.innerHTML += '<p>No stories saved yet.</p>';
        return;
    }

    stories.forEach(story => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'admin-story-entry';
        storyDiv.innerHTML = `
            <h3 contenteditable="false">${story.title}</h3>
            <p contenteditable="false">${story.text}</p>
            <input type="text" class="image-url-input" value="${story.image_url}" style="width:100%; margin:10px 0;" disabled>
            <img src="${story.image_url}" alt="${story.title}" class="preview-image" style="max-width:150px; margin-top:10px;"><br>
            <input type="file" class="edit-image-file" accept="image/*" style="display:none; margin-top:10px;">
            <br>
            <button class="edit-story" data-id="${story.id}">✏️ Edit</button>
            <button class="save-story" data-id="${story.id}" style="display:none;">💾 Save</button>
            <button class="delete-story" data-id="${story.id}">🗑️ Delete</button>
            <hr>
        `;
        container.appendChild(storyDiv);

        const titleEl = storyDiv.querySelector('h3');
        const textEl = storyDiv.querySelector('p');
        const editBtn = storyDiv.querySelector('.edit-story');
        const saveBtn = storyDiv.querySelector('.save-story');
        const imageInput = storyDiv.querySelector('.image-url-input');
        const fileInput = storyDiv.querySelector('.edit-image-file');
        const previewImage = storyDiv.querySelector('.preview-image');

        // ✏️ Edit
        editBtn.addEventListener('click', () => {
            titleEl.contentEditable = "true";
            textEl.contentEditable = "true";
            imageInput.disabled = false;
            fileInput.style.display = "inline-block";
            titleEl.focus();
            editBtn.style.display = "none";
            saveBtn.style.display = "inline-block";
        });

        // 👁️‍🗨️ Vorschau des neuen Bilds live anzeigen
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });

        // 💾 Save
        saveBtn.addEventListener('click', async () => {
            const newTitle = titleEl.innerText.trim();
            const newText = textEl.innerText.trim();
            let newImageUrl = imageInput.value.trim();

            if (fileInput.files.length > 0) {
                const user = await supabase.auth.getUser();
                const file = fileInput.files[0];
                const filePath = `${user.data.user.id}/${Date.now()}_${file.name}`;

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

                newImageUrl = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('stories')
                .update({ title: newTitle, text: newText, image_url: newImageUrl })
                .eq('id', story.id);

            if (error) {
                alert("❌ Could not update story.");
            } else {
                alert("✅ Story updated!");
                titleEl.contentEditable = "false";
                textEl.contentEditable = "false";
                imageInput.disabled = true;
                fileInput.style.display = "none";
                previewImage.src = newImageUrl;
                editBtn.style.display = "inline-block";
                saveBtn.style.display = "none";
            }
        });

        // 🗑️ Delete
        const deleteBtn = storyDiv.querySelector('.delete-story');
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Delete this story?')) {
                const { error } = await supabase
                    .from('stories')
                    .delete()
                    .eq('id', story.id);

                if (error) {
                    alert("❌ Delete failed.");
                } else {
                    location.reload();
                }
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
const saveAuthorBtn = document.getElementById("save-author");
if (saveAuthorBtn) {
    saveAuthorBtn.addEventListener("click", async () => {
        const author = document.getElementById("site-author").value.trim();

        const { error } = await supabase
            .from('site_config')
            .upsert([{ key: 'author_name', value: author }], { onConflict: ['key'] });

        if (error) {
            alert("❌ Could not save name.");
        } else {
            alert("✅ Author name updated.");
        }
    });
}
