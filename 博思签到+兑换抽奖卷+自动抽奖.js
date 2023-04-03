// ==UserScript==
// @name         博思自动签到
// @namespace    倚楼听风雨
// @description  博思论坛自动签到
// @version      1.1.6
// @icon         http://learn.iflysse.com/web/favicon.ico
// @description  博思平台签到，需要先登录http://learn.iflysse.com/Login.aspx，不用再打开浏览器啦
// @author       倚楼听风雨
// @crontab      * 1-23 once * *
// @grant GM_xmlhttpRequest
// @grant GM_notification
// @connect learn.iflysse.com
// @connect learn.iflysse.com
// @cloudCat
// @exportCookie domain=.iflysse.com
// ==/UserScript==


return new Promise((resolve, reject) => {
    var Frequency = 10;//重试的次数
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://learn.iflysse.com/net-api/excitation/sign/sign',
        responseType: "json",
        onload: function (xhr) {
            console.log("响应信息：" + xhr.response);
            if (xhr.response.status == 1) {

                if (xhr.response.msg == '无权操作,身份信息为空！') {
                    GM_notification({
                        title: '博思平台自动签到 - ScriptCat',
                        text: '网络错误,博思平台签到失败',
                    });
                    reject('网络错误,博思平台签到失败');
                } else {
                    GM_notification({
                        title: '博思平台',
                        text: xhr.response.msg,
                        image: "https://c-ssl.dtstatic.com/uploads/blog/202201/20/20220120085118_c542f.gif",
                        timeout: 3000,
                    });

                    //记录日志，不然脚本无法结束！
                    resolve('签到完成！' + xhr.response);
                }
            }
            if (xhr.response.status == 1001) {
                GM_notification({
                    title: '博思平台',
                    text: xhr.response.msg,
                    timeout: 3000,
                });

                //记录日志，不然脚本无法结束！
                resolve('重复签到' + xhr.response);
            }


            //平台维护，就会签到失败
            if (xhr.response.status == 0) {
                GM_notification({
                    title: '博思平台',
                    text: xhr.response.msg,
                    timeout: 3000,
                });

                //记录日志，不然脚本无法结束！
                resolve('重复签到' + xhr.response);
            }

            //兑换抽奖卷
            ExchangeLottery();

            //开始抽奖
            LuckDraw();
        },
        onerror: function () {
            GM_notification({
                title: '博思平台自动签到 - ScriptCat',
                text: '网络错误,博思平台签到失败',
            });
            reject('网络错误,博思平台签到失败');
        }
    });

    //休眠函数
    function sleep(d) {
        for (var t = Date.now(); Date.now() - t <= d;);
    }

    //-------------------兑换抽奖卷-----------------------------
    function ExchangeLottery() {
        var element, input, imgIndex, canvasIndex, inputIndex;
        var localRules = [];
        var queryUrl = "http://captcha.zwhyzzz.top:8092/"
        var exist = false;
        var iscors = false;
        var firstin = true;
        var b64mai;

        function getBase64Image(img) {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, img.width, img.height);
            var dataURL = canvas.toDataURL("image/png");
            return dataURL
            // return dataURL.replace("data:image/png;base64,", "");
        }


        var img = document.createElement('img');
        img.src = "http://learn.iflysse.com/Pages/Shop/CheckCodeForExchange.aspx?ID=9885032b-40a5-41d0-914a-ee6b2cebb7c4&r=285";  //此处自己替换本地图片的地址
        img.crossOrigin = 'anonymous'
        img.onload = function () {
            var data = getBase64Image(img);
            var img1 = document.createElement('img');
            img1.src = data;
            document.body.appendChild(img1);
            // console.log("图片码："+data);

            //搜索,字符串的位置
            var position = data.indexOf(',');

            //截取formhash的值
            var formhash = data.slice(position + 1);
            console.log("图片码:" + formhash);
            b64mai = formhash;

            //-------------------------开始识别验证码-----------------------------------
            //识别验证码（自定义规则）
            const datas = {
                "ImageBase64": String(b64mai),
            }
            GM_xmlhttpRequest({
                method: "POST",
                url: queryUrl + "identify_GeneralCAPTCHA",
                data: JSON.stringify(datas),
                headers: {
                    "Content-Type": "application/json",
                },
                responseType: "json",
                onload: function (response) {
                    // console.log(response);
                    if (response.status == 200) {
                        try {
                            var result = response.response["result"];
                            console.log("识别结果：" + result);


                            //------------------------------开始兑换-----------------------------

                            console.log("-------------------兑换抽奖卷-----------------------------");
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: 'http://learn.iflysse.com/Handler/Shop/ShopWriteSession.ashx',
                                data: 'action=0&ID=9885032b-40a5-41d0-914a-ee6b2cebb7c4&Code=' + result,
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                                },
                                responseType: "json",
                                onload: function (xhr) {
                                    console.log("响应信息：" + xhr.responseText);

                                    var xhrjson = JSON.parse(xhr.responseText);

                                    console.log("123" + xhrjson.Msg);

                                    //-------------查看是否有兑换成功的字符串(Msg)
                                    var MarkerBit1 = xhrjson.Msg.indexOf('兑换成功');
                                    MarkerBit1 = xhrjson.Msg.indexOf('您今日购买次数已超过限购数量');
                                    console.log("MarkerBit1--" + MarkerBit1);

                                    if (MarkerBit1 != -1) {
                                        GM_notification({
                                            title: '博思平台',
                                            text: xhrjson.Msg,
                                            timeout: 3000,
                                        });
                                        //开始抽奖(防止抽奖完才开始兑换)
                                        LuckDraw();

                                        //记录日志，不然脚本无法结束！
                                        resolve('兑换成功' + ret);
                                    }

                                    if (MarkerBit1 == -1) {
                                        GM_notification({
                                            title: '博思平台',
                                            text: "兑换失败",
                                            timeout: 2000,
                                        });
                                        Frequency--;
                                        console.log("第" + (10 - Frequency) + "次验证码识别错误，开始第" + (11 - Frequency) + "次验证码识别");

                                        // //验证码识别错误，继续进行兑换(休眠20秒钟)
                                        sleep(20000);
                                        if (Frequency > 0) {
                                            // //继续调用兑换抽奖卷的方法
                                            ExchangeLottery();
                                        }
                                        //记录日志，不然脚本无法结束！
                                        resolve('验证码错误：' + ret);
                                    }

                                },
                                onerror: function () {
                                    GM_notification({
                                        title: '博思平台自动签到 - ScriptCat',
                                        text: '网络错误,博思平台签到失败',
                                    });
                                    reject('网络错误,博思平台签到失败');
                                }
                            });

                        }
                        catch (e) {
                            if (response.responseText.indexOf("接口请求频率过高") != -1)
                                GM_notification({
                                    title: '验证码识别平台',
                                    text: response.responseText,
                                    timeout: 3000,
                                });
                            console.log(response.responseText);
                            topNotice(response.responseText);
                            //记录日志，不然脚本无法结束！
                            resolve('接口请求频率过高' + response.responseText);

                        }
                    }
                    else {
                        console.log("识别失败");
                    }
                }
            });
        }
    }


    //--------------开始抽奖---------------------------
    function LuckDraw() {
        console.log("--------------开始抽奖---------------------------");
        //自动抽奖
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'http://learn.iflysse.com/Handler/Shop/LotteryDraw.ashx',
            data: "Action=4&LuckDrawID=d202331d-c158-4959-bf62-cd221f2300c0",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
            },//请求头信息
            responseType: "json",
            onload: function (xhr) {

                console.log("抽奖响应信息：" + xhr.response.Msg);
                console.log("抽奖响应信息：" + xhr.response.Data.PrizeName);

                if (xhr.response.Result == true) {
                    GM_notification({
                        title: '抽奖成功',
                        text: xhr.response.Data.PrizeName,
                        image: "https://c-ssl.dtstatic.com/uploads/blog/202211/26/20221126062717_b4a03.gif",
                        timeout: 3000,
                    });

                    //记录抽奖信息
                    resolve('抽奖完成！' + xhr.response);

                    sleep(2000);

                    //进行递归调用
                    LuckDraw();
                }
                console.log("暂无抽奖卷，停止抽奖。");
                reject('网络错误,博思平台签到失败');
                return;
            },
            onerror: function () {
                GM_notification({
                    title: '博思平台自动签到 - ScriptCat',
                    text: '网络错误,博思平台签到失败',
                });
                reject('网络错误,博思平台签到失败');
            }
        });
    }
});


