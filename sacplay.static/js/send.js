let USR_INFO;
window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
    USR_INFO = e.detail;
    document.getElementById("balance").innerText='잔액: '+e.detail.balance.toLocaleString("ko-KR")+'M';
});
function send() {
    if(document.getElementById("ano").value.length!=8) {
        alert("계좌번호가 잘못되었습니다. 숫자만 입력해주세요.");
        return;
    }
    ano = document.getElementById("ano").value;
    try{
        if (Number(document.getElementById("amnt").value)>USR_INFO.balance) {
            alert("잔액이 부족합니다.");
            return;
        } else if (Number(document.getElementById("amnt").value)<=0) {
            alert("금액이 유효하지 않습니다.");
            return;
        }
    }catch{
        alert("금액이 유효하지 않습니다.");
        return;
    }
    amnt = Number(document.getElementById("amnt").value);
    if(document.getElementById("cmnt").value.length>10 || document.getElementById("cmnt").value.length<1) {
        alert("통장 표기는 최대 10글자만 가능합니다.");
        return;
    }
    cmnt = document.getElementById("cmnt").value;
    const xhr_QN = new XMLHttpRequest();
    xhr_QN.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr_QN.responseText);
            openpop(res.name, amnt, USR_INFO.ano, ano, cmnt);
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            alert("계좌번호가 잘못되었습니다.");
        }
    };
    xhr_QN.onerror = function(){
        alert("계좌번호가 잘못되었습니다.");
    }
    var fd = new FormData();
    fd.append("ano", document.getElementById("ano").value);
    xhr_QN.open("POST", "https://api.sac.today/qn", true);
    xhr_QN.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr_QN.send(fd);
}
function scrollOffP() {
    document.querySelector('#outer-l2').onscroll = function(e){e.preventDefault();};
    document.querySelector('#outer-l2').ontouchmove = function(e){e.preventDefault();};
    document.querySelector('#outer-l2').onwheel = function(e){e.preventDefault();};
}
function scrollOnP() {
    document.querySelector('#outer-l2').onscroll = function(e){};
    document.querySelector('#outer-l2').ontouchmove = function(e){};
    document.querySelector('#outer-l2').onwheel = function(e){};
}
function openpop(txt, amnt, exac, inac, cmnt) {
    document.getElementById("l2-t1").innerHTML='<span class="bold">'+txt+'</span>님 에게';
    document.getElementById("l2-t2").innerHTML='<span class="bold">'+amnt+'M</span>을 송금합니다.';
    document.getElementById("l2-exac").innerHTML=exac.substr(0,4)+"-"+exac.substr(4,4);
    document.getElementById("l2-inac").innerHTML=txt+'<br>'+inac.substr(0,4)+"-"+inac.substr(4,4);
    document.getElementById("l2-amnt").innerHTML=amnt.toLocaleString("ko-KR")+'M';
    document.getElementById("l2-cmnt").innerHTML=cmnt;
    document.getElementById("btn3").onclick = function(e){sendcfm(txt, amnt, exac, inac, cmnt)};

    document.getElementById("outer-l2").style.display = "flex";
    scrollOffP();
    var target = document.getElementById("outer-l2");
    target.style.height = "100vh";
    var player = target.animate([
        { top: 'calc(100vh - 604px)'},
        { top: '-604px'}
    ],{
        duration : 200,
        delay : 0
    });
    target.style.top = "-604px";
}
function sendcfm(txt, amnt, exac, inac, cmnt) {
    document.getElementById("btn3").onclick = function(e){};
    var xhr_SD = new XMLHttpRequest();
    xhr_SD.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr_SD.responseText);
            alert("송금이 완료되었습니다.");
            window.location.href='/main/';
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            alert("송금 중 문제가 발생하였습니다.");
        }
    };
    var fd = new FormData();
    fd.append("ano", inac);
    fd.append("amnt", amnt);
    fd.append("desc", cmnt);
    xhr_SD.open("POST", "https://api.sac.today/sd", true);
    xhr_SD.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr_SD.send(fd);
}
function closepop() {
    var target = document.getElementById("outer-l2");
    var player = target.animate([
        { top: '-604px'},
        { top: 'calc(100vh - 604px)'}
    ],{
        duration : 200,
        delay : 0
    });
    target.style.top = "calc(100vh - 604px)";
    setTimeout(function(){document.getElementById("outer-l2").style.display = "none";target.style.height = "0vh";scrollOnP();}, 300);
}