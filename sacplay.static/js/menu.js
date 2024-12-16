function scrollOff() {
    document.querySelector('#menu').onscroll = function(e){e.preventDefault();};
    document.querySelector('#menu').ontouchmove = function(e){e.preventDefault();};
    document.querySelector('#menu').onwheel = function(e){e.preventDefault();};
}
function scrollOn() {
    document.querySelector('#menu').onscroll = function(e){};
    document.querySelector('#menu').ontouchmove = function(e){};
    document.querySelector('#menu').onwheel = function(e){};
}
function openmenu() {
    document.getElementById("menu-outer").style.display = "block";
    scrollOff();
    var target = document.getElementById("menu");
    var player = target.animate([
        { left: '100%'},
        { left: 'var(--menu-position)'}
    ],{
        duration : 200,
        delay : 0
    });
    target.style.left = "var(--menu-position)";
}
function closemenu() {
    var target = document.getElementById("menu");
    var player = target.animate([
        { left: 'var(--menu-position)'},
        { left: '100%'}
    ],{
        duration : 200,
        delay : 0
    });
    target.style.left = "100%";
    setTimeout(function(){document.getElementById("menu-outer").style.display = "none";scrollOn();}, 300);
}