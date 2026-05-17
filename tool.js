const opportunities = [
    { 
        title: "Event 1 Name", 
        data: "Month Date • City, State or Online", 
        description: "Description 1" 
    },
    { 
        title: "Event 2 Name", 
        data: "Month Date • City, State or Online", 
        description: "Description 2" 
    },
    { 
        title: "Event 3 Name", 
        data: "Month Date • City, State or Online", 
        description: "Description 3" 
    }
];

let index = 0;

const titleElement = document.getElementById('title');
const dataElement = document.getElementById('data');
const descriptionElement = document.getElementById('description');

const nextButton = document.getElementById('nextBtn');

const content = document.getElementById('content');

nextButton.addEventListener('click', function() {
    
    content.className = 'slide-left';
    setTimeout(function() {

        index++;
        if (index >= opportunities.length) {
            index = 0;
        }
    
        titleElement.textContent = opportunities[index].title;
        dataElement.textContent = opportunities[index].data;
        descriptionElement.textContent = opportunities[index].description;

        cardContent.className = 'slide-next';

        setTimeout(function() {
            cardContent.className = 'visible';
        }, 50);
    }, 300);
});

titleElement.textContent = opportunities[index].title;
dataElement.textContent = opportunities[index].data;
descriptionElement.textContent = opportunities[index].description;