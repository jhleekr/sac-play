let t,e,n,i,s,a;function o(t,n){e&&(e=!1,r("MATCH"),u("MATCH\n["+t+"]"),f(t))}function d(t){e&&u("STANDBY")}function r(t){document.getElementById("logg").innerHTML=t}function u(t){document.getElementById("txt4").innerHTML=t}function c(){window.location.href="/paymo/"}function l(){document.getElementById("reader").style.display="block",document.getElementById("btn2").style.display="none",document.getElementById("step1").style.display="none",document.getElementById("step2").style.display="flex",e=!0,t.render(o,d)}function p(){document.getElementById("reader").style.display="none",document.getElementById("btn2").style.display="block",e=!1,n=!0}function m(){l(),i>0||(i=30,r("WAIT(0)"),s=document.getElementById("name").value,0==document.getElementById("name").value.length&&(s="--noname"),a=document.getElementById("amnt").value,n=!1,y())}function y(){if(!n){if(i-=1,i<1)return i=0,r("결제 실패 (대기시간 초과)"),void p();r("스캔 대기중 "+String(i)),setTimeout(y,1e3)}}function f(t){var e=new XMLHttpRequest;e.onreadystatechange=function(){if(200==this.status&&this.readyState==this.DONE){JSON.parse(e.responseText);r("WAIT(1)"),h(t)}200!=this.status&&this.readyState==this.DONE&&(r("결제 실패 (0)"),p())},e.open("POST","https://api.sac.today/a/tint",!0),e.setRequestHeader("Authorization","Basic "+getCookie("-sp-admin-sess")),e.send()}function h(t){var e=new XMLHttpRequest;e.onreadystatechange=function(){if(200==this.status&&this.readyState==this.DONE){if(1!=JSON.parse(e.responseText).result)return u("MATCH SUBMIT WRONG\n["+t+"]"),void p();u("MATCH SUBMIT DONE\n["+t+"]"),T(),r("SEND DATA")}if(200!=this.status&&this.readyState==this.DONE)return u("MATCH SUBMIT FAIL\n["+t+"]"),void p()},e.open("POST","https://api.sac.today/a/scan",!0);var n=new FormData;n.append("txt",t),e.setRequestHeader("Authorization","Basic "+getCookie("-sp-admin-sess")),e.send(n),u("MATCH SUBMIT\n["+t+"]")}function T(){var t=new XMLHttpRequest;t.onreadystatechange=function(){if(this.readyState==this.DONE){if(201==this.status)return r("스캔 대기중 "+String(i)),void setTimeout(T,1e3);if(200==this.status)if(1==(e=JSON.parse(t.responseText)).result)return r("결제 성공"),p(),void(i=0);if(400==this.status){var e;if(1==(e=JSON.parse(t.responseText)).detail)return r("결제 실패 (금액 오류)"),p(),void(i=0);if(2==e.detail)return r("결제 실패 (토큰 만료)"),p(),void(i=0);if(3==e.detail)return r("결제 실패 (잔액 부족)"),p(),void(i=0);if(4==e.detail)return r("결제 실패 (항목길이초과)"),p(),void(i=0)}return r("서버 오류"),p(),void(i=0)}},t.open("POST","https://api.sac.today/a/tpay",!0);var e=new FormData;e.append("name",s),e.append("price",a),t.setRequestHeader("Authorization","Basic "+getCookie("-sp-admin-sess")),t.send(e)}window.addEventListener("usrLoad",(function(e){null===e.detail&&(window.location.href="/landing/"),t=new Html5QrcodeScanner("reader",{fps:5,qrbox:{width:250,height:250},supportedScanTypes:[Html5QrcodeScanType.SCAN_TYPE_CAMERA],formatsToSupport:[Html5QrcodeSupportedFormats.AZTEC]},!1),document.getElementById("btn1").onclick=function(){m()},document.getElementById("btn2").onclick=function(){c()}}));