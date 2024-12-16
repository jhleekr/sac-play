window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }

    set();
    setInterval(set, 10000);
});

function set() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            setup(res.data, res.total);
        }
    };
    xhr.open("POST", "https://api.sac.today/s/pending", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    xhr.send();
}
function setup(data, total) {
    if (total==0) {
        document.getElementById("list").innerHTML = '<div class="ibm med">표시할 내용이 없습니다.</div>';
        return;
    }
    var str = '';
    for (var i=0; i<data.length; i++) {
        var dat = data[i];
        str += '<div id="' + dat.tid + '" class="record">' +
            '<div class="ibm sml">부스명: '+dat.issuer+'</div>' +
            '<div class="ibm sml">대상: '+dat.name+'</div>' +
            '<div class="ibm med">지급 사유: '+dat.name+'</div>' +
            '<div class="ibm med">'+dat.amnt.toLocaleString("ko-KR")+'M</div>' +
            '<div class="ibm sml" onclick="ad(0, \'' + dat.tid + '\');">승인</div>' +
            '<div class="ibm sml" onclick="ad(1, \'' + dat.tid + '\');">거절</div>' +
            '</div>';
    }
    document.getElementById("list").innerHTML = str;
}

function ad(t, d) {
    document.getElementById(d).style.display = "none";
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            alert("정상 처리되었습니다.");
        } else if (this.status != 200 && this.readyState == this.DONE) {
            document.getElementById(d).style.display = "grid";
        }
    };
    var fd = new FormData();
    fd.append("data", d);
    if (t==0) {
        xhr.open("POST", "https://api.sac.today/s/aprv", true);
    } else if (t==1) {
        xhr.open("POST", "https://api.sac.today/s/deny", true);
    }
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    xhr.send(fd);
}