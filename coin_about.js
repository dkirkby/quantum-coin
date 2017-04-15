$(document).ready(function() {

    var now_playing = 0;
    var num_slides = $('#slides img').length;

    for(var i = 0; i < num_slides; i++) {
        if(i == now_playing) continue;
        $('.slide-' + i).hide();
        $('.caption-' + i).hide();
    }
    $('#next').click(function() {
        $('.slide-'+now_playing).hide();
        $('.caption-'+now_playing).hide();
        now_playing = (now_playing+1)%num_slides;
        $('.slide-'+now_playing).show();
        $('.caption-'+now_playing).show();
    });
    $('#prev').click(function() {
        $('.slide-'+now_playing).hide();
        $('.caption-'+now_playing).hide();
        now_playing = (now_playing+num_slides-1)%num_slides;
        $('.slide-'+now_playing).show();
        $('.caption-'+now_playing).show();
    });
});
