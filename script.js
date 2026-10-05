// DOM Elements
const searchSection = document.getElementById('search-section');
const resumeContainer = document.getElementById('resume-container');
const resumeDiv = document.getElementById('resume');
const usernameInput = document.getElementById('username-input');
const generateBtn = document.getElementById('generate-btn');
const backBtn = document.getElementById('back-btn');
const downloadBtn = document.getElementById('download-btn');
const errorMsg = document.getElementById('error-msg');
const loader = document.getElementById('loader');

// Event Listeners
generateBtn.addEventListener('click', generateResume);
usernameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') generateResume();
});

backBtn.addEventListener('click', () => {
    resumeContainer.classList.add('hidden');
    searchSection.classList.remove('hidden');
    usernameInput.value = '';
});

downloadBtn.addEventListener('click', () => {
    const element = document.getElementById('resume');
    const opt = {
        margin:       0,
        filename:     `${usernameInput.value}_github_resume.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
});

// Main Function
async function generateResume() {
    const username = usernameInput.value.trim();
    if (!username) return;

    // Reset UI
    errorMsg.classList.add('hidden');
    loader.classList.remove('hidden');
    generateBtn.disabled = true;

    try {
        // Fetch User Data
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) throw new Error('User not found');
        const userData = await userRes.json();

        // Fetch Repositories
        const repoRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        const reposData = await repoRes.json();

        buildResume(userData, reposData);
        
        // Switch Views
        searchSection.classList.add('hidden');
        resumeContainer.classList.remove('hidden');
    } catch (error) {
        errorMsg.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

function buildResume(user, repos) {
    // Sort repos by stars (descending) and exclude forks
    const topRepos = repos
        .filter(repo => !repo.fork)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5); // Get top 5 repos

    // Format Date
    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let html = `
        <div class="header">
            <img src="${user.avatar_url}" alt="Profile Picture" crossorigin="anonymous">
            <div>
                <h1>${user.name || user.login}</h1>
                <p>${user.bio || 'GitHub Developer'}</p>
                <div class="contact-info">
                    ${user.location ? `<span><i class="fas fa-map-marker-alt"></i> ${user.location}</span>` : ''}
                    <span><i class="fab fa-github"></i> github.com/${user.login}</span>
                    ${user.blog ? `<span><i class="fas fa-link"></i> ${user.blog}</span>` : ''}
                </div>
            </div>
        </div>

        <h2 class="section-title">GitHub Stats</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <h3>${user.public_repos}</h3>
                <p>Repositories</p>
            </div>
            <div class="stat-box">
                <h3>${user.followers}</h3>
                <p>Followers</p>
            </div>
            <div class="stat-box">
                <h3>${user.following}</h3>
                <p>Following</p>
            </div>
            <div class="stat-box">
                <h3>${joinDate}</h3>
                <p>Joined</p>
            </div>
        </div>

        <h2 class="section-title">Top Projects</h2>
        <div class="repo-list">
    `;

    if (topRepos.length === 0) {
        html += `<p>No public original repositories found.</p>`;
    } else {
        topRepos.forEach(repo => {
            html += `
                <div class="repo-item">
                    <h3>${repo.name}</h3>
                    <p>${repo.description || 'No description provided.'}</p>
                    <div class="repo-meta">
                        ${repo.language ? `<span><i class="fas fa-code"></i> ${repo.language}</span>` : ''}
                        <span><i class="fas fa-star"></i> ${repo.stargazers_count} Stars</span>
                        <span><i class="fas fa-code-branch"></i> ${repo.forks_count} Forks</span>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    resumeDiv.innerHTML = html;
}
