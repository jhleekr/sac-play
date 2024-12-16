window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing/";
    }

    document.getElementById("welcome").innerText="환영합니다. 오늘은 SAC "+e.detail.date+"일차 입니다.";

    document.querySelector("#stat :nth-child(1)").innerHTML="부스명: "+e.detail.name;

    if (!e.detail.give) {
        document.getElementById("give").style.display="none";
        document.getElementById("rewd").style.display="none";
    }
    if (!e.detail.sell) {
        document.getElementById("sell").style.display="none";
    }
    if (!e.detail.sell&&!e.detail.give) {
        document.getElementById("vwst").style.display="none";
    }
    if (!e.detail.aanc) {
        document.getElementById("aanc").style.display="none";
    }

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            processstat(res, e);
        }
    };
    xhr.open("POST", "https://api.sac.today/a/stat", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    xhr.send();
});

function processstat(INFO, e) {
    let uSet = new Set();
    let give = 0;
    let agive = 0;
    let sell = 0;
    for (a of INFO.sell) {
        uSet.add(a.owner);
        sell -= a.amount;
    }
    for (a of INFO.give) {
        uSet.add(a.owner);
        give += a.amount;
    }
    for (a of INFO.rewd) {
        uSet.add(a.owner);
        agive += a.amount;
    }

    if (e.detail.sell||e.detail.give) { document.querySelector("#stat :nth-child(2)").innerHTML="총 이용자수: "+String(uSet.size); }
    else { document.querySelector("#stat :nth-child(2)").innerHTML="총 이용자수: 해당없음(관리자)"; }
    if (e.detail.give) { document.querySelector("#stat :nth-child(4)").innerHTML="지급금액: "+String(give)+" (상금: "+String(agive)+")"; }
    else { document.querySelector("#stat :nth-child(4)").innerHTML="지급금액: 해당없음"; }
    if (e.detail.sell) { document.querySelector("#stat :nth-child(5)").innerHTML="수익금액: "+String(sell); }
    else { document.querySelector("#stat :nth-child(5)").innerHTML="수익금액: 해당없음"; }
}