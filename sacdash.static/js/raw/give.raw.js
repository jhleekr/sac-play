window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing/";
    }

    var scan = true;
    function onScanSuccess(decodedText, decodedResult) {
        if (!scan) {
            return;
        }
        // handle the scanned code as you like, for example:
        scan = false;
        cle("MATCH");
        console.log(`Code matched = ${decodedText}`, decodedResult);
        out("MATCH\n["+decodedText+"]");
        submit(getCookie("-sp-admin-sess"), decodedText);
        setTimeout(function(){scan = true;}, 5000);
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
	html5QrcodeScanner = new Html5QrcodeScanner(
		"reader",
		{
			fps: 5, qrbox: { width: 250, height: 250 },
			supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
			formatsToSupport: [Html5QrcodeSupportedFormats.AZTEC]
		},
		/* verbose= */ false);
	html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});

function out(s) {
	document.getElementById("txt2").innerHTML = s;
}
function cle(s) {
	document.getElementById("txt4").innerHTML = s;
}
function submit(sid, txt) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.result == 1) {
                submit1(sid, txt);
                cle("SUBMIT SCAN");
            } else {
                cle("INIT FAIL 2");
            }
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            cle("INIT FAIL 1");
        }
    }
    x.open("POST", "https://api.sac.today/a/tint", true);
    x.setRequestHeader("Authorization", "Basic "+sid);
    x.send();
    cle("INIT");
}
function submit1(sid, txt) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.result == 1) {
                out("MATCH SUBMIT DONE\n["+txt+"]");
                submit2(sid, txt);
                cle("SEND DATA");
            } else {
                out("MATCH SUBMIT WRONG\n["+txt+"]");
            }
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("MATCH SUBMIT FAIL\n["+txt+"]");
        }
    }
    x.open("POST", "https://api.sac.today/a/scan", true);
    var fd = new FormData();
    fd.append("txt", txt);
    x.setRequestHeader("Authorization", "Basic "+sid);
    x.send(fd);
    out("MATCH SUBMIT\n["+txt+"]");
}
function submit2(sid, txt) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.result == 1) {
                cle("SUCCESS");
            } else {
                cle("DATA FAIL 2");
            }
            return;
        }
        if (this.status == 400 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.detail == 2) {
                cle("DATA FAIL 3 (이미 참여보상 지급이 완료되었습니다)");
            }
            return;
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            cle("DATA FAIL 1");
        }
    }
    x.open("POST", "https://api.sac.today/a/give", true);
    x.setRequestHeader("Authorization", "Basic "+sid);
    x.send();
}