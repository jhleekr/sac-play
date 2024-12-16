window.addEventListener("usrLoad", function(e) {
    if (e.detail!==null) {
        window.location.href = "/main";
    }
    
    document.getElementById("lgnbtn").onclick = function(){login();};
});
function login() {
    document.getElementById("lgnbtn").style.display="none";
    document.getElementById("pending").style.display="block";
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            var w = window.open(res["send_to"], "_blank", "menubar=no, toolbar=no");
            var i = setInterval(function(){
                w.postMessage({"content": ""}, "*")
            }, 100);
            setTimeout(function(e){
                document.getElementById("lgnbtn").style.display="block";
                document.getElementById("pending").style.display="none";
                return;
            }, 3000);
            window.addEventListener("message", function(e){
                clearInterval(i);
                res = e.data;
                w.close();
                setTimeout(function(res){
                    if (res.status!=200) {
                        switch (res.detail) {
                            case 1:
                                alert("구글 로그인에 실패하였습니다.");
                                break;
                            case 2:
                                alert("미등록 사용자입니다. (버튼 하단 주의사항 참고)");
                                break;
                            default:
                                alert("알 수 없는 오류입니다");
                        }
                        document.getElementById("lgnbtn").style.display="block";
                        document.getElementById("pending").style.display="none";
                        return;
                    }
                    setCookie("-sp-lang", res.lang, options={secure: true, samesite: "lax"});
                    setCookie("-sp-sess", res.sess, options={"max-age": 86400, secure: true, samesite: "lax"});
                    window.location.href = "/main";
                },200,res);
            });
        }
    };
    xhr.open("POST", "https://api.sac.today/login", true);
    xhr.send();
}