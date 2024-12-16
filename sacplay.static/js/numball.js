window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
});
let active = true;
function get() {
    if (!active) {return;}
    active = false;
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            window.location.href='/baseb?s='+res.tid;
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            alert("잔액이 부족합니다.");
            window.location.href='/main/';
        }
    };
    xhr.open("POST", "https://api.sac.today/startbb", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr.send();
}