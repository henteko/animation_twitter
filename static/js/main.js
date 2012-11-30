var _messages;
$(function() {
        var canvas = $('canvas')[0];
        $(canvas).attr({height: $("#wrapper").height()});
        $(canvas).attr({width: $("#wrapper").width()});


        var messages = [];
        var images   = [];

        var show = function(send_ms) {
            //send_msは、つぶやき + |*141 + screen_name です
            send_ms.match(/(.*)\|{141}(.*)/);
            var text      = RegExp.$1;
            var user_name = RegExp.$2;

            var img = create_image(user_name);
            var ms = create_messages(text, img);
            for(var i=0; i< ms.length; i++) {
                messages.push(ms[i]);
            }    
        }

        console.log('ws://' + window.location.host + window.location.pathname);
        var ws       = new WebSocket('ws://' + window.location.host + window.location.pathname);
        ws.onopen    = function()  { };
        ws.onclose   = function()  { };
        ws.onmessage = function(m) { show(m.data); };
        ws.onerror   = function(e) { console.log('error: ' + e); };


        //reloadMessages(onReload);
        onReload(messages, images);

        // アニメーションのため定期実行
        setInterval(function() {
                $(_messages).each(function(idx, msg) {
                    if(msg.end_y > msg.position.y || msg.finish) {
                    if(msg.tita < 20) {
                    msg.finish = true;
                    //対数螺旋アニメーション
                    var r = 100 * Math.pow(0.9, msg.tita);
                    msg.position.x = r * Math.cos(msg.tita) + msg.start_position.x;
                    msg.position.y = r * Math.sin(msg.tita) + msg.end_y;
                    msg.tita += 0.15;
                    }else {
                    if(msg.stop_time < 0) {
                    msg.position_v.vy += 0.098;
                    //爆散アニメーション
                    msg.position.x += msg.position_v.vx;
                    msg.position.y += msg.position_v.vy;

                    // 空気抵抗による減速
                    msg.position_v.vx *= 0.92;
                    msg.position_v.vy *= 0.92;

                    //透明に
                    msg.alpha -= 0.005;
                    if(msg.img != null) msg.img.alpha -= 0.005;


                    if(msg.alpha < 0) {
                        _messages.splice(idx,1); 
                    }

                    }else {
                        msg.stop_time--;
                        if(msg.img != null) {
                            msg.img.alpha += msg.img.valpha;
                            if(msg.img.alpha > 1) msg.img.alpha = 1.0;
                        }
                    }

                    }

                    }else {
                        if (msg.position.y < 0) {
                            //ピューと上がる所アニメーション
                            msg.position.y = msg.start_position.y;
                        } else {
                            msg.position.y -= 4;
                        }
                    }

                    //揺れる
                    //msg.position.x += msg.role;
                    //msg.role *= -1;
                });
                onReload(_messages);
        }, 10);
});

function create_messages(text, img) {
    var messages = [];
    var dd = text.length / (text.length / 6);
    var px = Math.floor( Math.random() * $("#wrapper").width() - 150 );
    while(px <= 100) {
        px = Math.floor( Math.random() * $("#wrapper").width() - 150 );
    }
    var py = $("#wrapper").height();
    var ey = Math.floor( Math.random() * ($("#wrapper").height() / 10)) + 50;

    img.position.x = px - 10;
    img.position.y = ey - 20;
    img.valpha     = dd / (text.length * 6);
    for(var i=0; i< text.length; i++) {
        var h_img = null;
        if(i == 0) h_img = img;
        var d = (dd * (text.length - i));
        messages.push(create_message(text.charAt(i), px, py+(i*20), ey, d, h_img));
    }
    return messages;
}

function create_message(text, px, py, ey, d, img) {
    var _vx = Math.random() * 20 - 10;
    var _vy = Math.random() * 20 - 10;
    var _vz = Math.random() * 20 - 10;
    var len = Math.sqrt(Math.pow(_vx, 2)+Math.pow(_vy, 2)+Math.pow(_vz, 2));
    _vx = _vx / len * 10;
    _vy = _vy / len * 10;
    _vz = _vz / len * 10;

    return {
             content: text,
             color: randomColor(),
             alpha: 1.0,
             delta: Math.floor( Math.random()*30 ) + 1,
             direction: 1,
             role: 1,
             tita: 1,
             position: ({x: px, y: py}),
             position_v: ({vx: _vx, vy: _vy}),
             stop_time: d,
             start_position: ({x: px, y: px}),
             end_y: ey,
             img: img,
             finish: false
    };
}

function create_image(user_name, px, py) {
    var img = new Image();
    img.src = "http://api.twitter.com/1/users/profile_image?screen_name=" + user_name;
    return {
              position: ({x: 0, y: 0}),
              alpha: 0.0,
              valpha: 0.0,
              src: img 
    };
}


function onReload(messages) {
    var canvas = $('canvas')[0];
    $('canvas').css('background-color', 'black');
    var context = canvas.getContext('2d');

    // キャンバスクリア
    context.clearRect(0, 0, $(canvas).width(), $(canvas).height());
    $(messages).each(function(idx, msg) {

            if(msg.img != null) {
                context.globalAlpha = msg.img.alpha;
                context.drawImage(msg.img.src, msg.img.position.x, msg.img.position.y, 40, 40);
            }
            
            context.font = 'Normal 14pt System';
            context.shadowColor = 'white';
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowBlur = 10;
            context.fillStyle = randomColor();
            context.globalAlpha = msg.alpha;
            context.fillText(msg.content, msg.position.x, msg.position.y);
            
            });

    _messages = messages;
}


function randomColor(){
    //HSL
    var colorHue = Math.floor( Math.random() * 360 );
    return "hsl(" + colorHue + ", 100%, 50% )";


    //RGB
    //var cseed = Math.floor( Math.random()*100 );
    //var cnum = ( cseed++ * 0x552433 ) % 0x1000000; // 色の計算 R ≒ 256 * n / 3, G ≒ 256 * n / 7, B ≒ 256 * n / 5
    //var hex = "000000" + cnum.toString(16);
    //return "#" + hex.substr( hex.length - 6, 6 );
}


function expandCanvas(canvas){
    var b = document.body;
    var d = document.documentElement;
    canvas.width = Math.max(b.clientWidth , b.scrollWidth, d.scrollWidth, d.clientWidth);
    canvas.height = Math.max(b.clientHeight , b.scrollHeight, d.scrollHeight, d.clientHeight);
    return canvas;
}
