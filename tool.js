import { db } from './firebase.js';
import { ref, get }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const GEMINI_API_KEY = 'AIzaSyD528ZLpj7BageBvFPdFC8rcnQMCXmXFKw';
const GEMINI_MODEL = 'gemini-2.5-flash';

async function askGemini(prompt) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        })
    });

    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function arrify(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') return Object.values(v);
    return [];
}

function buildPrompt(profile) {
    const eduList = arrify(profile.education).map(function(e) {
        return '  • ' + [e.school, e.degree, e.start, e.end, e.gpa, e.desc].filter(Boolean).join(' | ');
    }).join('\n') || '  (none)';

    const expList = arrify(profile.experience).map(function(e) {
        return '  • ' + [e.role, e.org, e.type, e.start, e.end, e.desc].filter(Boolean).join(' | ');
    }).join('\n') || '  (none)';

    const skills = arrify(profile.skills).join(', ') || 'unspecified';
    const interests = arrify(profile.interests).join(', ') || 'unspecified';

    const zip = (profile.zipCode || '').trim();

    return `You are an opportunity matcher for me. Given my profile below,
recommend 5 real, relevant opportunities (competitions, summer programs, internships,
scholarships, hackathons, volunteer roles, or clubs) that fit me.

${zip ? `LOCATION PRIORITY: My ZIP code is ${zip}. Strongly prefer opportunities that are physically
located within driving distance of this ZIP code (same city, county, or metro area). It is fine
to include 1-2 online opportunities, but at least 3 of the 5 must be in-person near ${zip}.` :
'No ZIP code provided — opportunities can be anywhere or online.'}

Return ONLY a JSON array. Each item must have EXACTLY these three string fields:
- "title": the program / event name
- "data": format as "Month Date • City, State" (for in-person, use the actual city near my ZIP) or "Month Date • Online" (use a realistic upcoming date)
- "description": 2-3 sentences explaining what it is and why it fits me

Do not include any other text, markdown, or explanation outside the JSON.

My profile:
- Name: ${profile.fullName || 'unspecified'}
- Grade / Year: ${profile.gradeYear || 'unspecified'}
- ZIP Code: ${zip || 'unspecified'}
- Bio: ${profile.bio || 'unspecified'}
- Education:
${eduList}
- Experience:
${expList}
- Skills: ${skills}
- Interests: ${interests}`;
}

const titleElement = document.getElementById('title');
const dataElement = document.getElementById('data');
const descriptionElement = document.getElementById('description');
const nextButton = document.getElementById('nextBtn');
const content = document.getElementById('content');

let opportunities = [{
    title: 'Loading...',
    data: 'Fetching recommendations',
    description: 'Searching for opportunities tailored to your profile.'
}];
let index = 0;

function render() {
    titleElement.textContent = opportunities[index].title;
    dataElement.textContent = opportunities[index].data;
    descriptionElement.textContent = opportunities[index].description;
}

render();

nextButton.addEventListener('click', function() {
    content.className = 'slide-left';
    setTimeout(function() {
        index = (index + 1) % opportunities.length;
        render();
        content.className = 'slide-next';
        setTimeout(function() { content.className = 'visible'; }, 50);
    }, 300);
});

(async function init() {
    const username = sessionStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html?redirect=tool.html';
        return;
    }

    try {
        const snap = await get(ref(db, 'users/' + username));
        const profile = snap.exists() ? snap.val() : {};

        const prompt = buildPrompt(profile);
        const reply = await askGemini(prompt);
        console.log('Gemini raw reply:', reply);

        const parsed = JSON.parse(reply);
        if (Array.isArray(parsed) && parsed.length > 0) {
            opportunities = parsed;
            index = 0;
            render();
        }
    } catch (err) {
        console.error('Failed to fetch opportunities:', err);
        opportunities = [{
            title: 'Could not load',
            data: 'Try again later',
            description: err.message
        }];
        render();
    }
})();
