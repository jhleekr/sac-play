window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
});
function get() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            alert(res.amnt+"px 당첨!");
            window.location.href='/main/';
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            alert("오늘의 출석 보상을 이미 받으셨습니다.");
            window.location.href='/main/';
        }
    };
    xhr.open("POST", "https://api.sac.today/gift", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr.send();
}