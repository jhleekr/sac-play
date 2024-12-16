window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
});
function getUrlParams() {
	var params = {};
	window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
		params[key] = value;
	});
	return params;
}
var params = getUrlParams();
let g;
let ratio = [-1,1,0.75,0.5,0.3,0.25,0.2,0.15,0.1,0.075,0.05,0.025,0,0,0,0,0,0,0,0,0];
function get() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(xhr.responseText);
            if (res.s==5) {
                alert("20번의 추측으로도 정답을 찾지 못하셨네요 :( 위로의 의미로 1px를 지급해드릴게요 >,<");
                window.location.href="/numball/";
                return;
            }
            if (res.s==4) {
                alert("정답을 맞추셨습니다! 정답은 "+g+"입니다. 보상으로 "+(ratio[res.b]*g).toFixed()+"px를 지급해드렸습니다.");
                window.location.href="/numball/";
                return;
            }
            document.getElementById("guessl").innerHTML+="<tr><td>"+g+"</td><td>"+res.s+"S"+res.b+"B</td></tr>";
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            alert("잘못된 요청입니다.");
        }
    };
    xhr.open("POST", "https://api.sac.today/guessbb", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    var fd = new FormData();
    fd.append("tid", params["s"]);
    fd.append("guess", document.getElementById("gues").value);
    g = document.getElementById("gues").value;
    document.getElementById("gues").value = "";
    xhr.send(fd);
}