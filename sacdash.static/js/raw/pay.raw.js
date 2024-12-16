let html5QrcodeScanner;
window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing/";
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
		"reader",
		{
			fps: 5, qrbox: { width: 250, height: 250 },
			supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
			formatsToSupport: [Html5QrcodeSupportedFormats.AZTEC]
		},
		/* verbose= */ false);

    document.getElementById("btn1").onclick = function(){payment();};
    document.getElementById("btn2").onclick = function(){step1();};
});

let scan, done;
function onScanSuccess(decodedText, decodedResult) {
    if (!scan) {
        return;
    }
    // handle the scanned code as you like, for example:
    scan = false;
    cle("MATCH");
    console.log(`Code matched = ${decodedText}`, decodedResult);
    out("MATCH\n["+decodedText+"]");
    dopayment(decodedText);
}
function onScanFailure(error) {
    if (!scan) {
        return;
    }
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    console.warn(`Code scan error = ${error}`);
    out("STANDBY");
}

function cle(s) {
	document.getElementById("logg").innerHTML = s;
}
function out(s) {
	document.getElementById("txt4").innerHTML = s;
}
function step1() {
    window.location.href="/paymo/";
}
function step2() {
    document.getElementById("reader").style.display="block";
    document.getElementById("btn2").style.display="none";
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="flex";
    scan = true;
	html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}
function step3() {
    document.getElementById("reader").style.display="none";
    document.getElementById("btn2").style.display="block";
    scan = false;
    done = true;
}

let ti, cmnt, amnt;
function payment() {
    step2();
    if (ti>0) {return;}
    ti = 30;
    cle("WAIT(0)");
    cmnt = document.getElementById("name").value;
    if (document.getElementById("name").value.length==0) {
        cmnt="--noname";
    }
    amnt = document.getElementById("amnt").value;
    done = false;
    trypayment();
}
function trypayment() {
    if (done) {return;}
    ti-=1;
    if (ti<1) {
        ti = 0;
        cle("결제 실패 (대기시간 초과)");
        step3();
        return;
    }
    cle("스캔 대기중 "+String(ti));
    setTimeout(trypayment, 1000);
}
function dopayment(tkn) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            cle("WAIT(1)");
            dopayment2(tkn);
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            cle("결제 실패 (0)");
            step3();
        }
    }
    x.open("POST", "https://api.sac.today/a/tint", true);
    x.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    x.send();
}
function dopayment2(tkn) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.result == 1) {
                out("MATCH SUBMIT DONE\n["+tkn+"]");
                dopayment3();
                cle("SEND DATA");
            } else {
                out("MATCH SUBMIT WRONG\n["+tkn+"]");
                step3();
                return;
            }
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("MATCH SUBMIT FAIL\n["+tkn+"]");
            step3();
            return;
        }
    }
    x.open("POST", "https://api.sac.today/a/scan", true);
    var fd = new FormData();
    fd.append("txt", tkn);
    x.setRequestHeader("Authorization", "Basic "+getCookie("-sp-admin-sess"));
    x.send(fd);
    out("MATCH SUBMIT\n["+tkn+"]");
}
function dopayment3() {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.readyState == this.DONE) {
            if (this.status==201) {
                cle("스캔 대기중 "+String(ti));
                setTimeout(dopayment3, 1000);
                return;
            }
            if (this.status==200) {
                var res = JSON.parse(x.responseText);
                if (res.result==1) {
                    cle("결제 성공");
                    step3();
                    ti = 0;
                    return;
                }
            }
            if (this.status==400) {
                var res = JSON.parse(x.responseText);
                if (res.detail==1) {
                    cle("결제 실패 (금액 오류)");
                    step3();
                    ti = 0;
                    return;
                } else if (res.detail==2) {
                    cle("결제 실패 (토큰 만료)");
                    step3();
                    ti = 0;
                    return;
                } else if (res.detail==3) {
                    cle("결제 실패 (잔액 부족)");
                    step3();
                    ti = 0;
                    return;
                } else if (res.detail==4) {
                    cle("결제 실패 (항목길이초과)");
                    step3();
                    ti = 0;
                    return;
                }
            }
            cle("서버 오류");
            step3();
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