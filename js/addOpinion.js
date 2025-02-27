
export default function processOpnFrmData(event) {
   
    event.preventDefault();


    const nopName = document.getElementById("nameElm").value.trim();
    const nopEmail = document.getElementById("email").value.trim();
    const nopImageURL = document.getElementById("image_url").value.trim() || "fig/giphy.gif";
    const nopOpinion = document.getElementById("opnElm").value.trim();
    const nopKeywords = document.getElementById("keywords").value.trim() || "I love KotobaWiki";
    
    if (nopName === "" || nopEmail === "" || nopOpinion === "") {
        window.alert("Please, fill in all required fields (name, email, opinion).");
        return;
    }

    const newOpinion = {
        name: nopName,
        email: nopEmail,
        image_url: nopImageURL,
        comment: nopOpinion,
        keywords: nopKeywords,
        created: new Date(),
    };
    

    let opinions = [];

    if (localStorage.opinions) {
        opinions = JSON.parse(localStorage.opinions);
    }

    opinions.push(newOpinion);
    localStorage.opinions = JSON.stringify(opinions);
    
    window.location.hash = "#opinions";
}
