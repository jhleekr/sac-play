const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xhr.responseText);
        let USR_INFO;
        if (res.result===1) {
            USR_INFO = res;
        } else {
            USR_INFO = null;
        }
        const usrLoad = new CustomEvent('usrLoad', {"detail": USR_INFO});          
        window.dispatchEvent(usrLoad);
    } else if (this.status == 401 && this.readyState == this.DONE) {
        USR_INFO = null;
        const usrLoad = new CustomEvent('usrLoad', {"detail": USR_INFO});          
        window.dispatchEvent(usrLoad);
    }
};
if (getCookie("-sp-sess")==undefined) {
    const usrLoad = new CustomEvent('usrLoad', {"detail": null});
    window.dispatchEvent(usrLoad);
} else {
    xhr.open("POST", "https://api.sac.today/usr", true);
    xhr.setRequestHeader("Authorization", "Basic "+getCookie("-sp-sess"));
    xhr.send();
}