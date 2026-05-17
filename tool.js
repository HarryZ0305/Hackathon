import { db } from './firebase.js';
import { ref, get, update }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { GEMINI_API_KEY } from './config.js';

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
    if (!res.ok) {
        console.error('Gemini API error', res.status, json);
        throw new Error('Gemini API ' + res.status + ': ' + (json.error?.message || 'unknown'));
    }
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
    const state = (profile.state || '').trim();

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

    return `You are an opportunity matcher for me. Recommend 5 relevant opportunities
(competitions, summer programs, internships, scholarships, hackathons, volunteer roles,
clubs, or events) that fit my profile below. Prefer well-known, recurring programs that
are likely to actually exist.

DEADLINE CONSTRAINT (very important): Today is ${today}. Only include opportunities whose
APPLICATION DEADLINE (not event date) falls between today and ${twoWeeks} (the next 14
days, inclusive). Skip anything whose application window has already closed or whose
deadline is more than 2 weeks away. The "data" field below must reflect the APPLICATION
DEADLINE, not the event date.

${zip || state ? `LOCATION PRIORITY: ${state ? `I'm in ${state}.` : ''} ${zip ? `My ZIP code is ${zip}.` : ''}
Prefer in-person opportunities within driving distance of ${zip || state}. At least 3 of
the 5 should be in-person in/near ${zip || state}; up to 2 may be online.` :
'No location provided — opportunities can be anywhere or online.'}

Return ONLY a JSON array. Each item must have EXACTLY these three string fields:
- "title": the program / event name
- "data": format as "Apply by Month Date • City, State" for in-person, or "Apply by Month Date • Online" for virtual. The date must be the APPLICATION DEADLINE and must fall within the next 14 days from ${today}.
- "description": 2-3 sentences written in SECOND PERSON addressed to me (use "you" and "your", never "he/she/the student"). Explain what the opportunity is, when the event takes place, and why YOU would be a good fit.

Do not include any other prose outside the JSON.

My profile:
- Name: ${profile.fullName || 'unspecified'}
- Grade / Year: ${profile.gradeYear || 'unspecified'}
- State: ${state || 'unspecified'}
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
    title: 'Analyzing Profile...',
    data: 'Searching for matches...',
    description: '<span class="loading-skeleton">Finding the best matches in your area...</span>'
}];
let index = 0;

function render() {
    titleElement.textContent = opportunities[index].title;
    dataElement.textContent = opportunities[index].data;
    descriptionElement.innerHTML = opportunities[index].description;
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

const saveButton = document.getElementById('saveBtn');

saveButton.addEventListener('click', async function() {
    const username = sessionStorage.getItem('username');
    if (!username) return;

    const currentEvent = opportunities[index];
    
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;

    try {
        const userRef = ref(db, 'users/' + username);
        const snap = await get(userRef);
        const profile = snap.exists() ? snap.val() : {};
        
        let savedEvents = profile.savedEvents || [];
        if (!Array.isArray(savedEvents)) savedEvents = Object.values(savedEvents);

        const alreadySaved = savedEvents.find(e => e.title === currentEvent.title);
        
        if (!alreadySaved) {
            savedEvents.push(currentEvent);
            await update(userRef, { savedEvents: savedEvents });
            saveButton.textContent = "Saved ✓";
        } else {
            saveButton.textContent = "Already Saved";
        }
    } catch (err) {
        console.error("Error saving event:", err);
        saveButton.textContent = "Error";
    }

    setTimeout(() => {
        saveButton.textContent = "Save to Library";
        saveButton.disabled = false;
    }, 2000);
});