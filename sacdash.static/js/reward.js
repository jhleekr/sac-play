window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }

    document.getElementById("btn1").onclick = function(){rewd();};
});

function rewd() {
    document.getElementById("btn1").style.display = "none";
    var x = new XMLHttpRequest();
    x.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            alert(String(res.count)+"명을 대상으로 신청이 완료되었습니다.");
            window.location.href='/main';
            return;
        }
        if (this.status == 400 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.detail==2) {
                alert("문제가 발생하였습니다. (사유재확인요망)");
                return;
            } else if (res.detail==5) {
                alert("문제가 발생하였습니다. (금액재확인요망)");
                return;
            }
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            alert("문제가 발생하였습니다. ()");
        }
    };
    var fd = new FormData();
    fd.append("desc", document.getElementById("desc").value);
    fd.append("stuid", document.getElementById("stuid").value);
    fd.append("amnt", document.getElementById("amnt").value);
    x.open("POST", "https://api.sac.today/a/rewd", true);
    x.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    x.send(fd);
}