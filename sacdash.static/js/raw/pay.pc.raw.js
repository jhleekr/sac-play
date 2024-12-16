let bname;
window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing/";
    }

    try {
        var s = 'https://dash.sac.today/scanner?sid='+getCookie("-sp-admin-sess");
        // The return value is the canvas element
        let canvas = bwipjs.toCanvas('qr', {
                bcid:        'qrcode',       // Barcode type
                text:        s,    // Text to encode
                scale:       15,               // 3x scaling factor
            });
    } catch (e) {
        // `e` may be a string or Error object
    }
    
    document.getElementById("btn1").onclick = function(){payment();};
    document.getElementById("qr").onclick = function(){toggle();};
    document.getElementById("qrlock").onclick = function(){toggle();};
});

function toggle() {
    if (document.getElementById("qrlock").style.display=="block") {
        document.getElementById("qrlock").style.display = "none";
        document.getElementById("qr").style.display = "block";
    } else {
        document.getElementById("qrlock").style.display = "block";
        document.getElementById("qr").style.display = "none";
    }
}

let ti, cmnt, amnt;
function payment() {
    document.getElementById("btn1").innerText="결제 대기중";
    if (ti>0) {return;}
    ti = 30;
    document.getElementById("logg").innerText="WAIT(0)";
    cmnt = document.getElementById("name").value;
    if (document.getElementById("name").value.length==0) {
        cmnt="--noname";
    }
    amnt = document.getElementById("amnt").value;
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            document.getElementById("logg").innerText="WAIT(1)";
            setTimeout(trypayment, 1000);
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            document.getElementById("logg").innerText="결제 실패 (0)";
            document.getElementById("btn1").innerText="결제";
        }
    }
    x.open("POST", "https://api.sac.today/a/tint", true);
    x.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    x.send();
}
function trypayment() {
    ti-=1;
    if (ti<1) {
        ti = 0;
        document.getElementById("logg").innerText="결제 대기중";
        document.getElementById("btn1").innerText="결제";
        return;
    }
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.readyState == this.DONE) {
            if (this.status==201) {
                document.getElementById("logg").innerText="스캔 대기중 "+String(ti);
                setTimeout(trypayment, 1000);
                return;
            }
            if (this.status==200) {
                var res = JSON.parse(x.responseText);
                if (res.result==1) {
                    document.getElementById("logg").innerText="결제 성공";
                    document.getElementById("btn1").innerText="결제";
                    ti = 0;
                    return;
                }
            }
            if (this.status==400) {
                var res = JSON.parse(x.responseText);
                if (res.detail==1) {
                    document.getElementById("logg").innerText="결제 실패 (금액 오류)";
                    document.getElementById("btn1").innerText="결제";
                    ti = 0;
                    return;
                } else if (res.detail==2) {
                    document.getElementById("logg").innerText="결제 실패 (토큰 만료)";
                    document.getElementById("btn1").innerText="결제";
                    ti = 0;
                    return;
                } else if (res.detail==3) {
                    document.getElementById("logg").innerText="결제 실패 (잔액 부족)";
                    document.getElementById("btn1").innerText="결제";
                    ti = 0;
                    return;
                } else if (res.detail==4) {
                    document.getElementById("logg").innerText="결제 실패 (항목길이초과)";
                    document.getElementById("btn1").innerText="결제";
                    ti = 0;
                    return;
                }
            }
            document.getElementById("logg").innerText="서버 오류";
            document.getElementById("btn1").innerText="결제";
            ti = 0;
            return;
        }
    }
    x.open("POST", "https://api.sac.today/a/tpay", true);
    var fd = new FormData;
    fd.append("name", cmnt);
    fd.append("price", amnt);
    x.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    x.send(fd);
}
