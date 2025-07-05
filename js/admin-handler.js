import { supabase } from './config.js';

// 🔐 Auth check
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) window.location.href = "login.html";
})();

// 📝 Neue Story speichern
document.getElementById('story-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('story-title').innerHTML.trim();
    const text = document.getElementById('story-text').innerHTML.trim();
    const fileInput = document.getElementById('story-image-file');
    const file = fileInput.files[0];
    const isPublished = document.getElementById('story-published').checked;

    if (!file) return alert("❌ No image selected.");

    const user = await supabase.auth.getUser();
    const filePath = `${user.data.user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase
        .storage.from('story-images')
        .upload(filePath, file);

    if (uploadError) return alert("❌ Upload failed: " + uploadError.message);

    const { data: publicUrlData } = supabase
        .storage.from('story-images')
        .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    const { error } = await supabase
        .from('stories')
        .insert([{
            title,
            text,
            image_url: imageUrl,
            user_id: user.data.user.id,
            is_published: isPublished
        }]);

    if (error) {
        alert("❌ Failed to save story: " + error.message);
    } else {
        alert("✅ Story saved!");
        location.reload();
    }
});


// 🔃 Bestehende Stories laden + Admin prüfen
document.addEventListener('DOMContentLoaded', async () => {
    const loginBtn = document.getElementById("login-btn");
    const navAdmin = document.querySelector('a[href="admin.html"]');
    const container = document.getElementById("admin-stories");

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const { data: isAdmin, error } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();

    const isAuthorized = !!isAdmin;
    console.log("🔐 User ID:", user.id);
    console.log("🛂 Admin erlaubt:", isAuthorized);

    if (window.location.pathname.includes("admin.html") && !isAuthorized) {
        window.location.href = "index.html";
    }

    if (loginBtn) loginBtn.style.display = "none";
    if (navAdmin) navAdmin.style.display = isAuthorized ? "inline-block" : "none";

    if (!isAuthorized || !container) return;

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
            <img src="${story.image_url}" alt="${story.title}" class="preview-image" style="max-width:150px;"><br>
            <input type="file" class="edit-image-file" accept="image/*" style="display:none;"><br>
            <label>
              <input type="checkbox" class="publish-checkbox" ${story.is_published ? 'checked' : ''}> Veröffentlicht
            </label>
            <br>
            <button class="edit-story" data-id="${story.id}">✏️ Edit</button>
            <button class="save-story" data-id="${story.id}" style="display:none;">💾 Save</button>
            <button class="delete-story" data-id="${story.id}">🗑️ Delete</button>
            <hr>
        `;
        container.appendChild(storyDiv);

        const titleEl = storyDiv.querySelector('h3');
        const textEl = storyDiv.querySelector('p');
        const imageInput = storyDiv.querySelector('.image-url-input');
        const fileInput = storyDiv.querySelector('.edit-image-file');
        const previewImage = storyDiv.querySelector('.preview-image');
        const publishCheckbox = storyDiv.querySelector('.publish-checkbox');
        const editBtn = storyDiv.querySelector('.edit-story');
        const saveBtn = storyDiv.querySelector('.save-story');

        editBtn.addEventListener('click', () => {
            titleEl.contentEditable = "true";
            textEl.contentEditable = "true";
            imageInput.disabled = false;
            fileInput.style.display = "inline-block";
            editBtn.style.display = "none";
            saveBtn.style.display = "inline-block";
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = (e) => previewImage.src = e.target.result;
                reader.readAsDataURL(fileInput.files[0]);
            }
        });

        saveBtn.addEventListener('click', async () => {
            const newTitle = titleEl.innerText.trim();
            const newText = textEl.innerText.trim();
            const published = publishCheckbox.checked;
            let newImageUrl = imageInput.value.trim();

            if (fileInput.files.length > 0) {
                const { data: user } = await supabase.auth.getUser();
                const file = fileInput.files[0];
                const filePath = `${user.user.id}/${Date.now()}_${file.name}`;

                const { error: uploadError } = await supabase
                    .storage.from('story-images')
                    .upload(filePath, file);

                if (uploadError) return alert("❌ Upload failed: " + uploadError.message);

                const { data: publicUrlData } = supabase
                    .storage.from('story-images')
                    .getPublicUrl(filePath);

                newImageUrl = publicUrlData.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('stories')
                .update({
                    title: newTitle,
                    text: newText,
                    image_url: newImageUrl,
                    is_published: published
                })
                .eq('id', story.id);

            if (updateError) {
                alert("❌ Could not update story.");
            } else {
                alert("✅ Story updated!");
                titleEl.contentEditable = "false";
                textEl.contentEditable = "false";
                imageInput.disabled = true;
                fileInput.style.display = "none";
                editBtn.style.display = "inline-block";
                saveBtn.style.display = "none";
            }
        });

        const deleteBtn = storyDiv.querySelector('.delete-story');
        deleteBtn.addEventListener('click', async () => {
            if (confirm("Delete this story?")) {
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
const saveAuthorBtn = document.getElementById("save-author");
if (saveAuthorBtn) {
    saveAuthorBtn.addEventListener("click", async () => {
        const author = document.getElementById("site-author").value.trim();

        const { error } = await supabase
            .from('site_config')
            .upsert([{ key: 'author_name', value: author }], { onConflict: ['key'] });

        if (error) alert("❌ Could not save name.");
        else alert("✅ Author name updated.");
    });

    window.execCmd = function(command, value = null) {
        document.execCommand(command, false, value);
    };

    document.querySelectorAll('.editor-toolbar button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const command = button.getAttribute('data-command');
            const value = button.getAttribute('data-value') || null;
            document.execCommand(command, false, value);
        });
    });
}
