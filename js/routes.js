
import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";
import articleFormsHandler from "./articleFormsHandler.js";


export default [

    {
        //the part after '#' in the url (so-called fragment):
        hash: "welcome",
        ///id of the target html element:
        target: "router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    {
        hash: "articles",
        target: "router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash: "main",
        target: "m",
        getTemplate: createHtml4Main
    },
    {
        hash: "artEdit",
        target: "router-view",
        getTemplate: editArticle
    },
    {
        hash: "artInsert",
        target: "router-view",
        getTemplate: addArticle
    },
    {
        hash: "opinions",
        target: "router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash: "article",
        target: "router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash: "addOpinion",
        target: "router-view",
        getTemplate: (targetElm) => {
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
            if (localStorage.getItem("userName")) {
                document.getElementById("nameElm").value = localStorage.getItem("userName");
            }
            document.getElementById("opnFrm").onsubmit = processOpnFrmData;
        }
    },
    {
        hash: "artDelete",
        target: "router-view",
        getTemplate: deleteArticle,
    },
    {
        hash: "findArtbyTag",
        target: "router-view",
        getTemplate: findByTag
    },
    {
        hash: "addComment",
        target: "router-view",
        getTemplate: postComment
    },
    {
        hash: "comments",
        target: "router-view",
        getTemplate: displayComments
    },


];
const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 9;
const counter = 0;
let currentroch = 0;
let totalpagerach = 0;


function createHtml4opinions(targetElm) {
    const opinionsFromStorage = localStorage.opinions;
    let opinions = [];

    if (opinionsFromStorage) {
        opinions = JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();   
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}
async function createHtml4Main(targetElm, current) {
    let articlesCount = 0;
    const fetchArticlesCount = fetch(`${urlBase}/article`)
    .then(response => response.json())
    .then(data => {
        articlesCount = parseInt(data.meta.totalCount);
        return articlesCount;
    })
    .catch(error => {
        console.error("Fetch error:", error);
        return 0;
    });
    const fetchArticlesContent = fetchAndDisplayArticles("router-view", current, articlesPerPage);
    
    await Promise.all([fetchArticlesCount, fetchArticlesContent]);

    let totalCount = parseInt(articlesCount / articlesPerPage);
    current = parseInt(current);
    const data4rendering = {
        currPage: current,
        pageCount: totalCount
    };
    totalpagerach = totalCount;
    currentroch = current;

    if (current > 1) {
        data4rendering.prevPage = current - 1;
    }

    if (current < totalCount) {
        data4rendering.nextPage = current + 1;
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-main").innerHTML,
        data4rendering
    );

    
}


async function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash) {
    try {
        const offset = Number(offsetFromHash);
        const totalCount = Number(totalCountFromHash);

        let urlQuery;

        if (offset && totalCount) {
            const newOffset = offset * articlesPerPage;
            urlQuery = `?offset=${newOffset}&max=${articlesPerPage}`;
        } else {
            urlQuery = `?max=${articlesPerPage}`;
        }

        const url = `${urlBase}/article/${urlQuery}`;
        const response = await fetch(url);
        const responseJSON = await response.json();

        addArtDetailLink2ResponseJson(responseJSON);

        for (const article of responseJSON.articles) {
            const articleUrl = `${urlBase}/article/${article.id}`;
            const articleResponse = await fetch(articleUrl);
            const articleBody = (await articleResponse.json()).content;
            article.content = articleBody;
        }

        document.getElementById(targetElm).innerHTML = Mustache.render(
            document.getElementById("template-articles").innerHTML,
            responseJSON
        );
    } catch (error) {
        const errMsgObj = { errMessage: error.message };
        document.getElementById(targetElm).innerHTML =
            Mustache.render(
                document.getElementById("template-articles-error").innerHTML,
                errMsgObj
            );
    }
}

function addArtDetailLink2ResponseJson(responseJSON) {
    responseJSON.articles = responseJSON.articles.map(
        article => (
            {
                ...article,
                detailLink: `#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
            }
        )
    );
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments, false);

}


function findByTag(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    let teg = document.getElementById("tag").value.trim();
    console.log(teg);
    let offset = 20 + counter * 20;
    const totalCount = Number(totalCountFromHash);
    let urlQuery = `?tag=${teg}&?offset=${offset}&max=${articlesPerPage}`;
    console.log(urlQuery);
    const url = `${urlBase}/article${urlQuery}`;

    function fetchArticleContent(article) {
        return new Promise((resolve, reject) => {
            const articleUrl = `${urlBase}/article/${article.id}`;
            let articleRequest = new XMLHttpRequest();
            articleRequest.addEventListener("load", function () {
                if (this.status === 200) {
                    const articleBody = JSON.parse(this.responseText).content;
                    article.content = articleBody;
                    resolve(article);
                } else {
                    reject({ errMessage: this.responseText });
                }
            });

            articleRequest.open("GET", articleUrl, true);
            articleRequest.send();
        });
    }

    function reqListener() {
        if (this.status == 200) {
            const responseJSON = JSON.parse(this.responseText);
            addArtDetailLink2ResponseJson(responseJSON);


            const articlePromises = responseJSON.articles.map(fetchArticleContent);

            
            Promise.all(articlePromises)
                .then(articlesWithData => {
                    responseJSON.articles = articlesWithData;

                    document.getElementById(targetElm).innerHTML =
                        Mustache.render(
                            document.getElementById("template-articles").innerHTML,
                            responseJSON
                        );

                    const incrementCount = document.getElementById("increment-count");
                    const decrementCount = document.getElementById("decrement-count");

                    if (incrementCount && decrementCount) {
                        incrementCount.addEventListener("click", () => {
                            if (counter != 0) {
                                counter--;
                            }
                            window.location.hash = "#main/1";
                            window.location.hash = "#main/1";
                        });

                        decrementCount.addEventListener("click", () => {
                            counter++;
                            window.location.hash = "#main/1";
                            window.location.hash = "#main/1";
                        });
                    }
                })
                .catch(error => {
                    console.error("Error fetching article content:", error);
                });
        } else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        }
    }

    console.log(url);
    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}






function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    function reqListener() {
       
        console.log(this.responseText)
        if (this.status == 200) {
            const responseJSON = JSON.parse(this.responseText)
            if (forEdit) {
                if (localStorage.getItem("userName")) {
                    responseJSON.author = localStorage.getItem("userName");
                }
                responseJSON.formTitle = "Article Edit";
                responseJSON.submitBtTitle = "Save article";
                responseJSON.backLink = `#main/${currentroch}/${totalpagerach}/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                if (!window.artFrmHandler) {
                    window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
                }
                window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", artIdFromHash, offsetFromHash, totalCountFromHash);
            } else {
                responseJSON.backLink = `#main/${currentroch}/${totalpagerach}${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink =
                    `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink =
                    `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                displayComments(responseJSON.id, 0);
                responseJSON.JSONComments = responseJSONComment;
                responseJSON.addComm = `#addComment/${responseJSON.id}/${totalCountFromHash}`;
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
                    const authorInput = document.getElementById("author3");
                if (localStorage.getItem("userName") && authorInput) {
                    authorInput.value = localStorage.getItem("userName");
                }
            }
        } else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        }
    }

    console.log(url)
    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}


function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments, true);

}

function addArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/`;

    function reqListener() {

        if (this.status === 200) {

            const responseJSON = JSON.parse(this.responseText)
            if (localStorage.getItem("userName")) {
                responseJSON.author = localStorage.getItem("userName");
            }
            responseJSON.formTitle = "Add Article";
            responseJSON.submitBtTitle = "Save article";
            responseJSON.backLink = `#main/1`;
            totalCountFromHash = Math.ceil(
                responseJSON.meta.totalCount / 20
            );
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-article-form").innerHTML,
                    responseJSON
                );
            if (!window.artFrmHandler) {
                window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
            }
            window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", -1,
                0, totalCountFromHash);

        }
        else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        }
    }

    console.log(url);
    let ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}

function deleteArticle(targetElm, artIdFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    function reqListener() {
       

        console.log("You deleted article");
    }

    console.log(url)
    let ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("DELETE", url, true);
    ajax.send();

    window.location.hash = "#main/1";
}

let responseJSONComment = null;

function displayComments(id, comOffsets) {

    const url = `${urlBase}/article/${id}/comment/?max=10&offset=${comOffsets}`;
    function comm() {
        console.log("comments");
        console.log(this.responseText);
        if (this.status === 200) {
            
            responseJSONComment = JSON.parse(this.responseText);
            
            responseJSONComment.comments.forEach(comment => {
                comment.dateCreated = new Date(comment.dateCreated).toDateString();

            });

        } else {
            alert("Error responseJSONComment");
        }
    }


    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", comm);
    ajax.open("GET", url, false);
    ajax.send();
}


function postComment(targetElm, artId, offsetFromHash) {
    console.log(document.getElementById("author3"));
    const commentsData =
    {
        author: document.getElementById("author3").value.trim(),
        text: document.getElementById("title3").value.trim()
    };
    if (commentsData.text === "" || commentsData.author === "") {
        window.alert("Please, enter both your name and comment");
        return;
    }
    const postReqSettings =
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify(commentsData)
    };
    fetch(`${urlBase}/article/${artId}/comment`, postReqSettings)  
        .then(() => window.location.hash = `#article/${artId}/${offsetFromHash}`);


}
