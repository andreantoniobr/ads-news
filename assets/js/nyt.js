
const btnAPI = document.getElementById("teste");
const scroll = document.getElementById("scroller");
const noticias = [];
//const load = document.getElementById("loading");

const newsContainer = document.getElementById("infinite-news");

async function loadItems() {
    //load.style.display= 'block';
    let news = await getData();
    addnewsHtml(news);
    console.log("deu certo DUZENTO");

    //load.style.display= 'none';
}

window.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  
    // Check if user scrolled near the bottom
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      loadItems();
    }
});



// Função que faz a requisição e filtra os dados necessários
function getData(){
    fetch('https://api.nytimes.com/svc/topstories/v2/science.json?api-key=hyXSpS2x5GNRT75A2GZmJG6wEwAgJdkO')
    .then(response => {
        if (!response.ok) throw new Error('500');
        return response.json();
    })
    .then(data => {
        dataToJson(data);
    })
    .catch(error => console.error('Erro:', error));
}
 
function dataToJson(data) {
    const results = data.results;
    for (let news of results){
        if (news.url.includes("http")){
            const noticia = {
                "secao": news.section,
                "titulo": news.title,
                "resumo": news.abstract,
                "url": news.url
            }
            noticias.push(noticia)
        }
    } 
}

function addnewsHtml() { 
    for(let news of noticias) {
        let newsHtml = "";
        newsHtml += '<div class="row"><article><div class="featured-post-2 mb-2 mb-lg-4 pb-2 pb-lg-4 border-bottom"><a href="' + news.url + '" title="' + news.titulo + '"><div class="featured-post-container">';
        newsHtml += '<div><div class="featured-post-img"><picture>';
        newsHtml += '<img src="assets/images/01.jpg" alt="">';
        newsHtml += '</picture></div><div class="featured-post-text">';
        newsHtml += '<h2>' + news.titulo + '</h2>';
        newsHtml += '<p>' + news.resumo + '</p>';
        newsHtml += '<span>2 dias atrás</span>';
        newsHtml += '</div></div></div></a></div></article></div>';
        //console.log(news.titulo);
        //newsContainer.innerHTML(newsHtml);
        newsContainer.insertAdjacentHTML('beforeend', newsHtml);
    }  
}

