function decodeJwtResponse(credential) {
    try {
        const payload = JSON.parse(atob(credential.split(".")[1]));
        return payload;
    } catch (e) {
        console.error("Error decoding JWT:", e);
        return null;
    }
}


function handleCredentialResponse(response) {
    const payload = decodeJwtResponse(response.credential);

    if (payload) {
        
        localStorage.setItem("userName", payload.given_name);
        localStorage.setItem("userImage", payload.picture);

    
        MiniProfile(payload.given_name, payload.picture);
    } else {
        console.error("Sign-in failed.");
    }
}


function signOut() {
    
    localStorage.removeItem("userName");
    localStorage.removeItem("userImage");

 
    document.getElementById("g_id_onload").style.display = "block";
    document.querySelector(".g_id_signin").style.display = "block";
    document.getElementById("miniProfile").style.display = "none";
}


function MiniProfile(name, image) {
    document.getElementById("userName").textContent = name;
    document.getElementById("userImage").src = image;


    document.getElementById("g_id_onload").style.display = "none";
    document.querySelector(".g_id_signin").style.display = "none";
    document.getElementById("miniProfile").style.display = "flex";
}


document.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem("userName");
    const userImage = localStorage.getItem("userImage");

    if (userName && userImage) {
        MiniProfile(userName, userImage);
    }
});