const xhr_ = new XMLHttpRequest();
xhr_.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xhr_.responseText);
        try {
            let canvas = bwipjs.toCanvas('qr', {
                    bcid:        'azteccode',
                    text:        res["tid"],
                    scale:       15,
                });
        } catch (e) {
            
        }
        var ts = Math.floor(+ new Date() / 1000);
        setTimer(30-ts-32400+res["timestamp"]);
    }
};
function updateqr() {
    xhr_.open("POST", "https://api.sac.today/rt", true);
    xhr_.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr_.send();
}
function setTimer(n) {
    document.getElementById("timetxt2").innerHTML = n+"초";
    document.getElementById("barfront").style.width = Math.min(80,(80/30*n))+"%";
    if(n>0){setTimeout(setTimer, 1000, n-1);}
    else{updateqr();}
}
window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
    updateqr();
});