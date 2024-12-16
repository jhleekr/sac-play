let N = 6;

window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            setup(res.data, res.total, 1);
        }
    };
    var fd = new FormData();
    fd.append("s", 0);
    fd.append("n", N);
    xhr.open("POST", "https://api.sac.today/rcd", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr.send(fd);
});

function getdat(cur) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            setup(res.data, res.total, cur);
        }
    };
    var fd = new FormData();
    fd.append("s", (cur-1)*N);
    fd.append("n", N);
    xhr.open("POST", "https://api.sac.today/rcd", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr.send(fd);
}

function setup(data, total, cur) {
    tot = Math.floor((total+N-1)/N);
    document.getElementById("count").innerHTML = cur + "/" + tot;
    if (cur==1) {
        document.getElementById("left").onclick = function(e){};
        document.getElementById("left").style.color = "grey";
    } else {
        document.getElementById("left").onclick = function(e){getdat(cur-1)};
        document.getElementById("left").style.color = "black";
    }
    if (cur==tot) {
        document.getElementById("right").onclick = function(e){};
        document.getElementById("right").style.color = "grey";
    } else {
        document.getElementById("right").onclick = function(e){getdat(cur+1)};
        document.getElementById("right").style.color = "black";
    }
    if (total==0) {
        document.getElementById("records").innerHTML = '<div class="padt"></div><div class="ibm med">표시할 내용이 없습니다.</div><div class="padt"></div>';
        return;
    }
    var str = '';
    for (var i=0; i<data.length; i++) {
        var dat = data[i];
        str += '<div class="record">' +
            '<div class="record-date ibm sml"><span class="bold">'+dat.time.split(',')[0]+'</span> '+dat.time.split(',')[1]+'</div>' +
            '<div class="record-cmnt ibm med bold">'+dat.desc+'</div>';
        if (dat.apvd=="취소" || dat.apvd=="대기중") {
            str += '<div class="record-amnt ibm med bold" style="color: lightgray;">+'+dat.amnt.toLocaleString("ko-KR")+'px</div>';
        } else if (dat.amnt>0 && dat.apvd!="대기중") {
            str += '<div class="record-amnt ibm med bold" style="color: cornflowerblue;">+'+dat.amnt.toLocaleString("ko-KR")+'px</div>';
        } else {
            str += '<div class="record-amnt ibm med bold">'+dat.amnt.toLocaleString("ko-KR")+'px</div>';
        }
        str += '<div class="record-apvd ibm sml">'+dat.apvd+'</div>';
        str += '</div>' +
            '<div class="nl"></div>';
    }
    document.getElementById("records").innerHTML = str;
}
