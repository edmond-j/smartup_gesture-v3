var config;
var per = {
    begin: function () {
        chrome.runtime.sendMessage({type: "per_getconf"}, function (response) {
            if (response) {
                console.log(response);
                config = response;
                per.init();
            }
        });
    },
    getI18n: function (str) {
        return chrome.i18n.getMessage(str) || str;
    },
    init: function () {
        console.log(config);
        per.pers = config.pers ? config.pers : null;
        per.orgs = config.orgs ? config.orgs : null;
        console.log(per.pers);
        //show request permissions
        var strs = "";
        for (var i = 0; per.pers && i < per.pers.length; i++) {
            strs = strs + " " + per.pers[i];
        }
        for (var i = 0; per.orgs && i < per.orgs.length; i++) {
            strs = strs + " " + per.orgs[i];
        }
        document.querySelector("#perlist").textContent = strs;
        document.querySelector("#per_msg").innerText = config.msg ? config.msg : "";

        var i18nOBJ = document.querySelectorAll("[data-i18n]");
        for (var i = 0; i < i18nOBJ.length; i++) {
            var trans = per.getI18n(i18nOBJ[i].dataset.i18n);
            if (!trans) {
                continue;
            }
            if (i18nOBJ[i].tagName.toLowerCase() == "input" && i18nOBJ[i].type == "button") {
                i18nOBJ[i].value = trans;
            } else {
                i18nOBJ[i].textContent = trans;
            }
        }
        window.addEventListener("click", this, false);
        window.addEventListener("unload", this, false);
    },
    handleEvent: function (e) {
        switch (e.type) {
            case "click":
                if (e.target.id == "getpers") {
                    // 提前声明，避免异步闭包踩未赋值变量
                    const checkRequest = (granted) => {
                        if (granted) {
                            // fire-and-forget：不带回调，避免“port closed”
                            chrome.runtime.sendMessage({type: "per_clear", pers: per.pers});

                            let count = 5;
                            const perlistbox = document.querySelector("#perlistbox");
                            const perbtnbox = document.querySelector("#perbtnbox");
                            if (perlistbox) perlistbox.style.cssText += "font-size:18px;color:red;text-align:center;";
                            if (perbtnbox) perbtnbox.remove();

                            const tick = () => {
                                if (count) {
                                    if (perlistbox)
                                        perlistbox.textContent = per.getI18n("getper_after") + " " + count + " s.";
                                    count -= 1;
                                    window.setTimeout(tick, 1000);
                                } else {
                                    window.close();
                                }
                            };
                            tick();
                        } else {
                            alert(per.getI18n("getper_fail"));
                            window.close();
                        }
                    };

                    // 统一用同一个回调
                    if (per.pers && per.orgs) {
                        chrome.permissions.request({permissions: per.pers, origins: per.orgs}, checkRequest);
                    } else if (per.pers) {
                        chrome.permissions.request({permissions: per.pers}, checkRequest);
                    } else if (per.orgs) {
                        chrome.permissions.request({origins: per.orgs}, checkRequest);
                    }
                }
                break;

            case "unload":
                chrome.runtime.sendMessage({type: "per_clear", pers: per.pers});
                break;
        }
    },
};
per.begin();
