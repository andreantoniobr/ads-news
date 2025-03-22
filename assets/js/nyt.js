const scroll = document.getElementById("scroller");
const load = document.getElementById("loading");

async function loadItems() {
    load.style.display= 'block';
    const news = await getData();

    console.log("deu certo DUZENTO");

    load.style.display= 'none';
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
    const noticias = [];

    for (let news of results){

        if (news.url.includes("http")){

            const noticia = {
                "seção": news.section,
                "titulo": news.title,
                "resumo": news.abstract,
                "url": news.url
            }

            noticias.push(noticia)
        }
    }

    if (noticias.length !== 0){
        console.log(noticias);
        return noticias;
    } else {
        console.log("Deu merda Papai");
    }   
}