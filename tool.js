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
            tools: [{ google_search: {} }]
        })
    });

    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function extractJsonArray(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('[');
    const end = candidate.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
        throw new Error('No JSON array found in response');
    }
    return JSON.parse(candidate.slice(start, end + 1));
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

    return `You are an opportunity matcher for me. Use Google Search to find 5 REAL, currently
open or upcoming opportunities (competitions, summer programs, internships, scholarships,
hackathons, volunteer roles, clubs, or events) that fit my profile below. Do NOT invent
opportunities — every one must be a real event verified via search results.

${zip ? `LOCATION PRIORITY: My ZIP code is ${zip}. Use Google Search to identify the city/region
this ZIP code is in, and prefer in-person opportunities within driving distance. At least 3 of
the 5 must be in-person near ${zip}; up to 2 may be online.` :
'No ZIP code provided — opportunities can be anywhere or online.'}

Return ONLY a JSON array (wrapped in \`\`\`json ... \`\`\` fence is fine). Each item must have
EXACTLY these three string fields:
- "title": the real program / event name
- "data": format as "Month Date • City, State" for in-person, or "Month Date • Online" for virtual. Use the actual published date.
- "description": 2-3 sentences written in SECOND PERSON addressed to me (use "you" and "your", never "he/she/the student"). Explain what the opportunity is and why YOU would be a good fit.

Do not include any other prose outside the JSON.

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
const previousButton = document.getElementById('prevBtn');
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

previousButton.addEventListener('click', function() {
    content.className = 'slide-next';
    setTimeout(function() {
        index = (index - 1 + opportunities.length) % opportunities.length;
        render();
        content.className = 'slide-left';
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

        const parsed = extractJsonArray(reply);

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
