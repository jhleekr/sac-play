function e(){document.getElementById("lgnbtn").style.display="none",document.getElementById("pending").style.display="block";const e=new XMLHttpRequest;e.onreadystatechange=function(){if(200==this.status&&this.readyState==this.DONE){var t=JSON.parse(e.responseText);setCookie("-sp-admin-sess",t.sess,options={"max-age":86400,secure:!0,samesite:"lax"}),window.location.href="/main"}else 401==this.status&&this.readyState==this.DONE?alert("로그인에 실패하였습니다."):422==this.status&&this.readyState==this.DONE&&alert("ID/PW를 입력해주세요.");document.getElementById("lgnbtn").style.display="block",document.getElementById("pending").style.display="none"};var t=new FormData;t.append("uid",document.getElementById("id").value),t.append("upw",document.getElementById("pswd").value),e.open("POST","https://api.sac.today/a/login",!0),e.send(t)}window.addEventListener("usrLoad",(function(t){null!==t.detail&&(window.location.href="/main/"),document.getElementById("lgnbtn").onclick=function(){e()},document.addEventListener("keyup",(function(t){"Enter"===t.key&&e()}))}));