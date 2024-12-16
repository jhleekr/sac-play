let edate;
window.addEventListener("usrLoad", function(e) {
    if (e.detail===null) {
        window.location.href = "/landing";
    }
    processBanner();
    document.getElementById("welcome").innerText="반가워요 "+e.detail.name+"님, 오늘은 SAC "+e.detail.date+"일차 입니다.";
    document.getElementById("account").innerHTML="&nbsp;&nbsp;SAC Pay "+e.detail.ano.substr(0,4)+"-"+e.detail.ano.substr(4,4)+" ⎘";
    document.getElementById("balances").innerText=e.detail.balance.toLocaleString("ko-KR")+'px';
    document.getElementById("account").onclick = function(){
        copyContent(e.detail.ano);
    }
    edate = e.detail.date;
});
String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
const BOX_FORMAT = '<div class="box twoi" style="background-color: {0};"> \
{1} \
<div class="ibm"> \
    <div class="med">{2} ({3})</div> \
    <div class="xsml"> \
        {4} \
    </div> \
</div> \
</div>\n';
const COLORS = ["#feeaff", "#ffe8e8", "#feffd1", "#effdd3", "#def2ff"];
const shuffle = (array) => {array.sort(() => Math.random() - 0.5);}
var NUMBERS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33];
function processBanner() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == this.DONE) {
            const BANNER_DATA = JSON.parse(xhr.responseText);
            var time = new Date();
            var day = time.getDate() + 1100;
            if (time.getMonth()<=9) {
                document.getElementById("bannerzone").innerHTML = '<div class="padt"></div><div class="med cent pre">행사 기간에 표시됩니다!</div>';
                return;
            }
            var inner = "";
            shuffle(NUMBERS);
            console.log(NUMBERS);
            for (const key in BANNER_DATA) {
                const obj = BANNER_DATA[NUMBERS[key]];
                if (obj.daterange[0] <= day && day <= obj.daterange[1]) {
                    inner += BOX_FORMAT.format(COLORS[obj.color], obj.ilink, obj.name, obj.place, obj.text);
                }
            }
            document.getElementById("bannerzone").innerHTML = inner;
        } else if (this.readyState == this.DONE) {
            window.location.reload();
        }
    };
    xhr.open("GET", "https://play.sac.today/res/banner.json", true);
    xhr.send();
}
const copyContent = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        alert("계좌번호가 복사되었습니다.");
    } catch (e) {
        alert("계좌번호 복사에 실패하였습니다.");
    }
}