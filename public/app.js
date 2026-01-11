// Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const selectFilesBtn = document.getElementById('select-files-btn');
const previewSection = document.getElementById('preview-section');
const imageGrid = document.getElementById('image-grid');
const fileCountEl = document.getElementById('file-count');
const addMoreBtn = document.getElementById('add-more-btn');
const startAnalyzeBtn = document.getElementById('start-analyze-btn');
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const userNotesEl = document.getElementById('user-notes');

// Result Elements
const personaContent = document.getElementById('persona-content');
const talksContent = document.getElementById('talks-content');
const planContent = document.getElementById('plan-content');
const risksContent = document.getElementById('risks-content');

// State
let selectedFiles = [];
const fileKeys = new Set(); // Prevent duplicates

// Event Listeners
selectFilesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

addMoreBtn.addEventListener('click', () => {
    fileInput.value = ''; // Reset to allow re-selecting same files if needed
    fileInput.click();
});

startAnalyzeBtn.addEventListener('click', analyze);

// Functions
function handleFiles(files) {
    const incoming = Array.from(files);
    let addedCount = 0;
    
    incoming.forEach(file => {
        // Simple key to avoid duplicate files
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        
        if (!fileKeys.has(key)) {
            // Validate image type
            if (file.type.startsWith('image/')) {
                fileKeys.add(key);
                selectedFiles.push(file);
                addedCount++;
            }
        }
    });

    if (addedCount > 0) {
        updatePreview();
    }
}

function updatePreview() {
    // Show preview section if files exist
    if (selectedFiles.length > 0) {
        previewSection.hidden = false;
        fileCountEl.textContent = selectedFiles.length;
    } else {
        previewSection.hidden = true;
    }

    // Re-render grid
    imageGrid.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'image-item';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFile(index);
        };

        item.appendChild(img);
        item.appendChild(removeBtn);
        imageGrid.appendChild(item);
    });
}

function removeFile(index) {
    const fileToRemove = selectedFiles[index];
    const key = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
    
    fileKeys.delete(key);
    selectedFiles.splice(index, 1);
    updatePreview();
}

async function analyze() {
    // Validation
    if (selectedFiles.length < 5) {
        alert('请至少上传 5 张截图才能进行准确分析');
        return;
    }

    // UI Updates
    loadingEl.hidden = false;
    resultsEl.hidden = true;
    startAnalyzeBtn.disabled = true;
    
    // Prepare Data
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('images', file));
    formData.append('notes', userNotesEl.value || '');

    try {
        const resp = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            throw new Error(errorData.error || '分析请求失败');
        }

        const data = await resp.json();
        renderResults(data);

    } catch (error) {
        alert('分析失败: ' + error.message);
    } finally {
        loadingEl.hidden = true;
        startAnalyzeBtn.disabled = false;
    }
}

function renderResults(rootData) {
    resultsEl.hidden = false;
    // Scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth' });

    const data = rootData.analysis || rootData;
    const meta = rootData.meta || {};

    // Warning Banner
    const warningEl = document.getElementById('warning-banner');
    if (meta.warning) {
        warningEl.textContent = meta.warning;
        warningEl.hidden = false;
    } else {
        warningEl.hidden = true;
    }

    // Persona Section
    const traits = data.personality?.traits || data.persona?.traits || [];
    const socialStyle = data.personality?.style?.social || data.persona?.style?.social || '—';
    const humorStyle = data.personality?.style?.humor || data.persona?.style?.humor || '—';
    const interests = data.personality?.interests || data.persona?.interests || [];
    
    const interestTags = interests
        .map(i => `<span class="tag">${i.tag}</span>`)
        .join('');

    personaContent.innerHTML = `
        <h3>🎭 人物画像</h3>
        <p><strong>核心特质：</strong>${traits.join('、') || '暂无分析'}</p>
        <p><strong>社交风格：</strong>${socialStyle}</p>
        <p><strong>幽默指数：</strong>${humorStyle}</p>
        <div style="margin-top: 10px;">${interestTags}</div>
    `;

    // Talks Section
    const talks = data.chat_suggestions || data.talks || [];
    const talksHtml = talks.map((t, idx) => {
        const text = typeof t === 'string' ? t : t.text;
        const tone = typeof t === 'string' ? '话术建议' : t.tone;
        return `
        <div class="talk">
            <div>
                <strong style="font-size: 12px; color: #667eea; margin-bottom: 4px; display: block;">${tone}</strong>
                <p style="font-size: 14px; line-height: 1.5;">${text}</p>
            </div>
            <button class="copy" onclick="copyText('${text.replace(/'/g, "\\'")}')">复制</button>
        </div>`;
    }).join('');
    
    talksContent.innerHTML = `<h3>💬 高情商回复</h3>${talksHtml || '<p>暂无建议</p>'}`;

    // Plan Section
    const guide = data.action_guide || data.plan?.steps || [];
    let stepsHtml = '';
    if (guide.length > 0 && typeof guide[0] === 'string') {
        stepsHtml = guide.map((s, i) => `<li style="margin-bottom: 8px;">Day ${i+1}: ${s}</li>`).join('');
    } else {
        stepsHtml = guide.map(s => `<li style="margin-bottom: 8px;">Day ${s.day}: ${s.message}</li>`).join('');
    }
    
    planContent.innerHTML = `<h3>📅 7天行动计划</h3><ul style="padding-left: 20px; color: #4a5568;">${stepsHtml || '<li>暂无计划</li>'}</ul>`;

    // Risks Section
    const risks = data.risks || [];
    if (risks.length > 0) {
        risksContent.innerHTML = `<h3>⚠️ 潜在雷区</h3><ul style="padding-left: 20px; color: #e53e3e;">${risks.map(r => `<li style="margin-bottom: 5px;">${r}</li>`).join('')}</ul>`;
        document.querySelector('.risks-card').hidden = false;
    } else {
        document.querySelector('.risks-card').hidden = true;
    }
}

// Global helper for copy button
window.copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板');
    }).catch(() => {
        console.error('复制失败');
    });
};
