// --- 社群分享模組 (Social Wall Module) ---

window.renderSocialPosts = function() {
    const container = document.getElementById('social-feed-container');
    container.innerHTML = "";
    socialPosts.forEach(post => {
        const isOwnPost = isLoggedIn && currentUser && post.author === currentUser.name;
        
        let commentsHTML = "";
        if (post.comments.length > 0) {
            commentsHTML = post.comments.map(c => `
                <div class="flex items-start space-x-2 mt-2">
                    <img src="${c.avatar}" class="w-6 h-6 rounded-full object-cover">
                    <div class="bg-gray-100 rounded-xl px-3 py-1.5 flex-1">
                        <p class="text-xs font-bold text-gray-800">${c.author}</p>
                        <p class="text-xs text-gray-700">${c.text}</p>
                    </div>
                </div>
            `).join('');
        }

        const postHTML = `
            <div id="post-${post.id}" class="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 space-y-3">
                <div class="flex justify-between items-start">
                    <div class="flex justify-between items-center w-full">
                        <div class="flex items-center space-x-3">
                            <img src="${post.avatar}" class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <h4 class="font-bold text-sm text-gray-800">${post.author}</h4>
                                <p class="text-xs text-gray-400">${post.time}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${isOwnPost ? `
                                <button onclick="editPost(${post.id})" class="text-gray-400 hover:text-blue-600 transition"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="deletePost(${post.id})" class="text-gray-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash"></i></button>
                            ` : `<button onclick="toggleFollow(this)" class="text-xs font-bold text-blue-600 border border-blue-600 px-3 py-1 rounded-full hover:bg-blue-50 transition">追蹤</button>`}
                        </div>
                    </div>
                </div>
                <div id="post-content-view-${post.id}">
                    <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">${formatHashtags(post.text)}</p>
                    ${post.image ? `<img src="${post.image}" class="w-full max-h-80 object-cover rounded-xl mt-2">` : ''}
                </div>
                <div id="post-edit-view-${post.id}" class="hidden space-y-2 mt-2">
                    <textarea id="edit-textarea-${post.id}" class="w-full min-h-[60px] p-2 text-sm text-gray-700 bg-gray-50 rounded-xl focus:outline-none border border-gray-200 resize-none">${post.text}</textarea>
                    <div class="flex justify-end space-x-2">
                        <button onclick="cancelEditPost(${post.id})" class="text-xs text-gray-500 hover:text-gray-700">取消</button>
                        <button onclick="saveEditPost(${post.id})" class="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">儲存</button>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-2 text-gray-500 text-xs font-medium border-t border-gray-50">
                    <button onclick="likePost(this, ${post.id})" class="flex items-center space-x-1 hover:text-rose-600 transition"><i class="fa-regular fa-heart text-base"></i> <span>${post.likes}</span></button>
                    <button onclick="document.getElementById('comments-section-${post.id}').classList.toggle('hidden')" class="flex items-center space-x-1 hover:text-blue-600 transition"><i class="fa-regular fa-comment text-base"></i> <span>${post.comments.length}</span></button>
                </div>
                
                <div id="comments-section-${post.id}" class="hidden border-t border-gray-50 pt-2 space-y-2">
                    <div class="flex space-x-2 items-center">
                        <img src="${isLoggedIn ? currentUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" class="w-8 h-8 rounded-full object-cover border border-gray-200">
                        <input type="text" id="comment-input-${post.id}" placeholder="留個言吧..." class="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                        <button onclick="addComment(${post.id})" class="text-blue-600 font-bold text-xs"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                    <div class="space-y-1">
                        ${commentsHTML}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += postHTML;
    });
};

window.createNewPost = function() {
    if(!isLoggedIn) { alert("請先登入才能發布貼文喔！"); switchPage('login'); return; }
    const text = document.getElementById('post-textarea').value.trim();
    if (!text && !currentPostImage) { alert('請輸入內容或上傳相片！'); return; }

    const newPost = {
        id: Date.now(),
        author: currentUser.name,
        avatar: currentUser.avatar,
        time: "剛剛",
        text: text,
        image: currentPostImage,
        likes: 0,
        comments: []
    };

    socialPosts.unshift(newPost);
    document.getElementById('post-textarea').value = ""; 
    clearPostImage();
    renderSocialPosts();
    
    syncMemberPosts(text);
    AppPersistence.autoSave();
};

window.likePost = function(button, postId) {
    const icon = button.querySelector('i');
    const post = socialPosts.find(p => p.id === postId);
    if(post) {
        if (icon.classList.contains('fa-regular')) {
            post.likes++;
        } else {
            post.likes--;
        }
        renderSocialPosts();
        AppPersistence.autoSave();
    }
};
