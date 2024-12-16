window.addEventListener("usrLoad", function(e) {
    if (e.detail!==null) {
        window.location.href = "/main/";
    }

    document.getElementById("lgnbtn").onclick = function(){login();};
    document.addEventListener("keyup", function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });
});
function login() {
    document.getElementById("lgnbtn").style.display="none";
    document.getElementById("pending").style.display="block";
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            setCookie("-sp-admin-sess", res.sess, options={"max-age": 86400, secure: true, samesite: "lax"});
            window.location.href = "/main";
        } else if (this.status == 401 && this.readyState == this.DONE) {
            alert("로그인에 실패하였습니다.");
        } else if (this.status == 422 && this.readyState == this.DONE) {
            alert("ID/PW를 입력해주세요.");
        }
        document.getElementById("lgnbtn").style.display="block";
        document.getElementById("pending").style.display="none";
    };
    var fd = new FormData();
    fd.append("uid", document.getElementById("id").value);
    fd.append("upw", document.getElementById("pswd").value);
    xhr.open("POST", "https://api.sac.today/a/login", true);
    xhr.send(fd);
}