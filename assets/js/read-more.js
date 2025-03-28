// Read More add buttons actions and apply start Styles
function startReadMore() {
    const btns = document.getElementsByClassName("read-more-button");
    for(let btn of btns){
        let parent = btn.parentNode;
        hideReadMoreText(parent);
        btn.addEventListener('click', function() {
            showReadMoreText(parent, btn);
        });
    }
}

function hideReadMoreText(element) {
    applyStyleReadMoreText(element, "inline", "none");
}

function showReadMoreText(element, btn){
    btn.remove();
    applyStyleReadMoreText(element, "none", "inline");
}

// Apply Styles to more and dot elements
function applyStyleReadMoreText(element, dotDisplay, moreTExtDisplay) {
    let dot = element.querySelector(".dots");
    let moreText = element.querySelector(".more");
    dot.style.display = dotDisplay;  
    moreText.style.display = moreTExtDisplay;
}


startReadMore();