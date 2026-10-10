var move = null
$(function () {
    if ($('.nav-content .active').attr('controlname') != 'HourChangesPublish') return
    Date.prototype.Format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "H+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
    // -----------------------------------------------------------------------------------------初始化地图
    var nodataarea = ['台湾', '香港', '澳门']

    var map = new T.Map('map-container', {
        minZoom: 4,
        maxBounds: new T.LngLatBounds(
            new T.LngLat(170.77, 55.01),
            new T.LngLat(44.56, 2.81)
        )
    })
    var zoom = 4
    //禁用原来的滚轮事件
    map.disableScrollWheelZoom()
    map.centerAndZoom(new T.LngLat(107.1928875, 38.346062532), zoom)
    var control = new T.Control.Zoom();
    //添加缩放平移控件
    map.addControl(control);
    //重新写火狐和谷歌的滚轮事件
    document.getElementById('map-container').addEventListener('DOMMouseScroll', function (e) {
        //console.log(e)
        e.preventDefault();
        e.detail > 0 ? map.zoomOut() : map.zoomIn();
    })
    //谷歌
    document.getElementById('map-container').addEventListener('mousewheel', function (e) {
        //console.log(e)
        e.preventDefault();
        e.wheelDelta < 0 ? map.zoomOut() : map.zoomIn();
    })
    map.on('zoomend', function () {
        var newZoom = map.getZoom()
        if ((newZoom < 7 && zoom >= 7) || (newZoom >= 7 && zoom < 7)) {
            zoom = newZoom
            renderPoint()
            if (zoom >= 7) {
                map.removeOverLay(mask)
            } else {
                map.addOverLay(mask)
            }
        } else {
            zoom = newZoom
        }
    })

    function getTextLevel(name) {
        var level = 0
        switch (name) {
            case '优':
                level = 1
                break
            case '良':
                level = 2
                break
            case '轻度污染':
                level = 3
                break
            case '中度污染':
                level = 4
                break
            case '重度污染':
                level = 5
                break
            case '严重污染':
                level = 6
                break
            default:
                break
        }
        return level
    }

    var levels = ['无数据', '优', '良', '轻度污染', '中度污染', '重度污染', '严重污染']

    // -----------------------------------------------------------------------------------------添加中国边界
    function init(sel, transform) {
        var upd = sel.selectAll('path.geojson').data(countries)
        upd
            .enter()
            .append('path')
            .attr('class', 'geojson')
            .attr('stroke', '#1890ff')
            .attr('fill', '#1890ff')
            .attr('fill-opacity', '0.1')
    }

    function redraw(sel, transform) {
        sel.selectAll('path.geojson').each(
            function (d, i) {
                d3.select(this).attr('d', transform.pathFromGeojson)
            }
        )
    }

    var countries = []
    var countriesOverlay = new T.D3Overlay(init, redraw)

    function addRegion(res) {
        countries = res.features
        map.addOverLay(countriesOverlay)
        countriesOverlay.bringToBack()
    }

    // -----------------------------------------------------------------------------------------添加中国蒙版
    var mask = null
    function addMask(data) {
        var points = [
            new T.LngLat(-360, 90),
            new T.LngLat(-360, -90),
            new T.LngLat(360, -90),
            new T.LngLat(360, 90)
        ]
        var points1 = []
        data.features.forEach(group => {
            group.geometry.coordinates.forEach(arr => {
                var path = []
                arr.forEach(point => {
                    if (Array.isArray(point[0])) {
                        point.forEach(p => {
                            path.push(new T.LngLat(p[0], p[1]))
                        })
                    } else {
                        path.push(new T.LngLat(point[0], point[1]))
                    }
                })
                points1.push(path)
            })
        })

        mask = new T.Polygon([points, points1], {
            color: "black",
            weight: 3,
            opacity: 0.2,
            fillColor: "rgb(157, 203, 245)",
            fillOpacity: 1
        });
        map.addOverLay(mask);
    }

    // -----------------------------------------------------------------------------------------自定义点位样式
    function replaceSub(res) {
        var title = res.replace('PM2.5', 'PM<sub>2.5</sub>')
        title = title.replace('PM10', 'PM<sub>10</sub>')
        title = title.replace('NO2', 'NO<sub>2</sub>')
        title = title.replace('O3', 'O<sub>3</sub>')
        title = title.replace('SO2', 'SO<sub>2</sub>')
        return title
    }
    var pollutantSubName = 'AQI'
    var pollutantValueKey = 'AQI'
    var pollutantLevelKey = 'Quality'
    var publicPoint = T.Overlay.extend({
        initialize: function (lnglat, data, mini) {
            this.lnglat = lnglat;
            // this.setOptions(options);
            this.data = data;
            this.mini = mini
        },

        onAdd: function (map) {
            this.map = map;
            var div = this.div = document.createElement("div");
            var level = pollutantLevelKey == 'Quality' ? getTextLevel(this.data.Quality) : this.data[pollutantLevelKey]
            var name = 'public-point level' + level
            if (this.mini) name += ' mini'
            div.className = name
            div.innerText = this.data[pollutantValueKey]
            div.setAttribute('_city', this.data.StationCode)

            var wave = document.createElement("span");
            wave.className = 'wave'

            var wave1 = document.createElement("span");
            wave1.className = 'wave1'
            wave.appendChild(wave1)

            var wave2 = document.createElement("span");
            wave2.className = 'wave2'
            wave.appendChild(wave2)

            div.appendChild(wave)

            var that = this;

            //div.onmouseover = function () {
            //    if ($(this).find('.public-popup').length == 0) {
            //        var popup = $(
            //            '<div class="public-popup">' +
            //            '<div class="public-popup-pin"></div>' +
            //            '<div class="public-popup-name">' +
            //            '<span class="public-popup-marker bg-' + level + '"></span>' +
            //            '<span>' + that.data.PositionName + '</span>' +
            //            '<span class="public-popup-tip">' + replaceSub(pollutantSubName) + '</span>' +
            //            '<span class="public-popup-close" onclick="closePopup()">×</span>' +
            //            '</div>' +
            //            '<div class="public-popup-content">' +
            //            '<div class="public-popup-left">' + that.data[pollutantValueKey] + '</div>' +
            //            '<div class="public-popup-center">' +
            //            '<div class="public-popup-level bg-' + level + '">' + levels[level] + '</div>' +
            //            '</div>' +
            //            '<div class="public-popup-right">' +
            //            '<p><span>' + that.data.TimePointStr + '</span> 发布</p>' +
            //            '<p>首要污染物：<span>' + replaceSub(that.data.PrimaryPollutant) + '</span></p>' +
            //            '</div>' +
            //            '</div>' +
            //            '<div class="public-popup-health"><div>健康指引：</div><div>' + (that.data.Unheathful || '—') + '</div></div>' +
            //            '<div class="public-popup-advice"><div>建议措施：</div><div>' + (that.data.Measure || '—') + '</div></div>' +
            //            '</div>'
            //        )
            //    }
            //    $(this).css({ zIndex: 20000 })
            //    var pos = $(this)[0].getBoundingClientRect()
            //    popup.css({
            //        position: 'fixed',
            //        zIndex: 100,
            //        left: pos.left + 'px',
            //        top: pos.top + 'px',
            //        transform: that.mini ? 'translate3d(-195px, -100%, 0)' : 'translate3d(-185px, -100%, 0)',
            //        marginTop: '-10px'
            //    })
            //    $('body').append(popup)
            //}

            //div.onclick = function () {
            //    stationCode = that.data.StationCode
            //    var stationName = that.data.PositionName
            //    var cityCode = that.data.CityCode
            //    var cityName = that.data.Area
            //    $('.public-popup').remove()
            //    // 切换省份,城市
            //    var provinceHead = cityCode.toString().slice(0, 2)
            //    $('#province-list .active').removeClass('active')
            //    var province = $('#province-list [_code="' + provinceHead + '"]')
            //    var provinceId = province.attr('_id')
            //    province.addClass('active')
            //    initProvinceCityData(provinceId, cityCode)
            //    // 联动地图底部echarts
            //    $('#chart-station').text(stationName)
            //    initChartData(stationCode)
            //    // 联动右侧点位列表
            //    initCityStationData(cityName, stationCode)
            //    // 定位地图范围
            //    map.centerAndZoom(new T.LngLat(that.data.Longitude, that.data.Latitude), 9)
            //    // 联动右侧城市详情
            //    getCityDetail(cityCode)
            //    // 高亮地图点位
            //    setTimeout(function () {
            //        lightMapStation(stationCode)
            //    }, 300)
            //}

            //div.onmouseout = function () {
            //    $(this).css({ zIndex: 1000 })
            //    $('.public-popup').remove()
            //}

            map.getPanes().overlayPane.appendChild(this.div);
            this.update(this.lnglat);
        },

        onRemove: function () {
            var parent = this.div.parentNode;
            if (parent) {
                parent.removeChild(this.div);
                this.map = null;
                this.div = null;
            }
        },

        setLnglat: function (lnglat) {
            this.lnglat = lnglat;
            this.update();
        },
        getLnglat: function () {
            return this.lnglat;
        },
        setPos: function (pos) {
            this.lnglat = this.map.layerPointToLngLat(pos);
            this.update();
        },
        update: function () {
            var pos = this.map.lngLatToLayerPoint(this.lnglat);
            this.div.style.top = (pos.y - 35) + "px";
            this.div.style.left = (pos.x - 15) + "px";
        }
    });

    // -----------------------------------------------------------------------------------------获取全国边界
    $.get('/Content/Scripts/Map/China.json').done(res => {
        // addRegion(res)
        addMask(res)
    })

    // -----------------------------------------------------------------------------------------加载点位数据
    var mapData = []
    var publicPoints = []
    var xhr1 = null
    var queryDate = '2024-01-05 14:00'
    function initData(isFresh) {
        var url = '/HourChangesPublish/GetAQIHistoryByConditionHis'
        if (xhr1) xhr1.abort()
        xhr1 = $.post(url, {
            date: queryDate
        }).done(function (res) {
            if ($('.nav-content .active').attr('controlname') != 'HourChangesPublish') return
            mapData = res
            $('.map-time').text(res[0].TimePointStr)
            renderPoint()
            xhr1 = null
            /*if (isFresh) alert('刷新成功')*/
        })
    }

    function renderPoint() {
        clearPoint()
        mapData.forEach(function (item) {
            var point = new T.LngLat(item.Longitude, item.Latitude);
            var marker = new publicPoint(point, item, zoom < 7);
            publicPoints.push(marker)
            map.addOverLay(marker)
        })
    }

    function clearPoint() {
        publicPoints.forEach(function (marker) {
            map.removeOverLay(marker)
        })
        publicPoints = []
    }



   
    

    // -----------------------------------------------------------------------------------------获取城市详情
    function getCityDetail(code) {
        $.post('/CityData/GetAQIDataPublishLiveInfo?cityCode=' + code).done(function (res) {
            var co = 36
            var pm10 = 420
            var pm25 = 250
            var so2 = 1600
            var o3 = 500
            var no2 = 565
            circularProgressBar.refreshDaQi(res.AQI)
            $('.data-area').text(res.Area)
            $('.data-aqi').text(res.AQI)
            $('.data-co').text(res.CO)
            $('.data-no2').text(res.NO2)
            $('.data-o3').text(res.O3)
            $('.data-pm25').text(res.PM2_5)
            $('.data-pm10').text(res.PM10)
            $('.data-so2').text(res.SO2)

            $('.data-co-bar').width(parseFloat(res.CO) / co * 100 + '%').attr('class', 'poll-bar data-co-bar bg-' + res.COLevel)
            $('.data-no2-bar').width(parseFloat(res.NO2) / no2 * 100 + '%').attr('class', 'poll-bar data-no2-bar bg-' + res.NO2Level)
            $('.data-o3-bar').width(parseFloat(res.O3 / o3) * 100 + '%').attr('class', 'poll-bar data-o3-bar bg-' + res.O3Level)
            $('.data-pm25-bar').width(parseFloat(res.PM2_5) / pm25 * 100 + '%').attr('class', 'poll-bar data-pm25-bar bg-' + res.PM2_5Level)
            $('.data-pm10-bar').width(parseFloat(res.PM10) / pm10 * 100 + '%').attr('class', 'poll-bar data-pm10-bar bg-' + res.PM10Level)
            $('.data-so2-bar').width(parseFloat(res.SO2) / so2 * 100 + '%').attr('class', 'poll-bar data-so2-bar bg-' + res.SO2Level)

            $('.data-timepoint').text(new Date(res.TimePoint).Format('MM月dd日HH:00'))
            $('.data-primary').text(res.PrimaryPollutant)
            //$('.data-heath').text(res.Unheathful)
            //$('.data-measure').text(res.Unheathful)
            $('.data-quality').text(res.Quality)
            $('.data-quality').parent().attr('class', 'aqi-label bg-' + getTextLevel(res.Quality))
            $("#marquee1").html('<li>健康影响: <span class="data-heath">' + res.Unheathful + '</span></li >')
            $("#marquee1").marquee();
        })
    }





    // -----------------------------------------------------------------------------------------切换污染物
    $('.poll-select > div').click(function () {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
        pollutantSubName = $(this).text()
        pollutantLevelKey = $(this).attr('_level')
        pollutantValueKey = $(this).attr('_value')
        $('.chart-tab').attr('_pollutant', pollutantValueKey)
        $('.chart-pollutant').html(replaceSub(pollutantSubName))
        renderPoint()
        if (chartType == 2 && pollutantSubName == 'AQI') { //分指数时切换到AQI时需要重新请求
            chartType = 1
            $('.chart-tab-item').removeClass('active').eq(0).addClass('active')
            initChartData(stationCode)
        } else {
            renderChart()
        }
    })

    //时间轴
    var timelineHourData = [];
    var timeData = []

    var now = new Date()
    var minute = now.getMinutes()

    for (var i = 0; i < 25; i++) {
        const newTime = new Date(now.getTime()  - 1000 * 60 * 60 * i)
        if (i == 0) {
            if (minute > 20) {
                timelineHourData.push(newTime.Format('MM-dd HH时'))
                timeData.push(newTime.Format('yyyy-MM-ddTHH:00:00'))
            }
        } else if (i == 24) {
            if (minute <= 20) {
                timelineHourData.push(newTime.Format('MM-dd HH时'))
                timeData.push(newTime.Format('yyyy-MM-ddTHH:00:00'))
            }
        } else {
            timelineHourData.push(newTime.Format('MM-dd HH时'))
            timeData.push(newTime.Format('yyyy-MM-ddTHH:00:00'))
        }
        //if (timelineHourData.length == 24) queryDate = newTime.Format('yyyy-MM-dd HH:00:00')
    }

    timeData.reverse()
    timelineHourData.reverse()


    //var timelineHourData = $("#timelineHourData").val();
    //var timelineDayData = $("#timelineDayData").val();
    //var timeJsonData =  ViewData["fileNameTimePart"];

    var timelineJsonData = timelineHourData;
    var currentIndex = 0, cellWidth, interval = 1;
    var timer, time;

    if (timelineJsonData.length > 10) interval = Math.ceil(timelineJsonData.length / 10);

    function moveTimeline(index) {
        currentIndex = index;
        var currentWidth = (currentIndex * 2 + 1) * cellWidth;
        $("#slider .completed").css("width", currentWidth + "px");
        var timetip = $("#slider .timetip");
        timetip.css("left", currentWidth + "px");
        timetip.find("div").text(timelineJsonData[currentIndex]);
    }

    function moveTo(index) {
        moveTimeline(index);

        var a = JSON.stringify(timeData[index]).replace("T", " ").replace(/\"/g, "");
        $("#time").val(a);
        time = $("#time").val();
        /*console.log(a)*/
        queryDate = a
        initData()
    }

    move = function (move) {//时间轴前移或后移
        if ($('.nav-content .active').attr('controlname') != 'HourChangesPublish') {
            clearInterval(timer);
            return
        }
        currentIndex += move;
        if (currentIndex < 0) {
            currentIndex += timelineJsonData.length;
        } else if (currentIndex == timelineJsonData.length) {
            currentIndex = 0;
        }
        moveTo(currentIndex);
    }

    function initTimeline(data) {
        //alert(JSON.stringify(timeData));
        //alert(timelineJsonData);
        cellWidth = $("#slider .slider-bar").width() / (data.length * 2 + 1);

        //alert(data);
        var amount = $("#slider .amount");
        var spans = [];
        data.forEach((item, i) => {
            spans.push($("<span data-index='" + i + "' data-time='" + item + "' style='left:" + (i * 2 + 1) * cellWidth + "px'></span>"));
        })
        //注释，下面的遍历多了i=pip
        //for (var i in data) {
        //    spans.push($("<span data-index='" + i + "' data-time='" + data[i] + "' style='left:" + (i * 2 + 1) * cellWidth + "px'></span>"));
        //}
        for (var i = 0; i < data.length; i += interval) {
            spans[i].addClass("highlight");//有class="highlight"才会显示，没有则会隐藏时间文字，interval
            spans[i].append($("<ins>" + data[i] + "</ins>"));//data[i]显示：08-27 00时，时间轴文字    （stn_realtimevalue表-可直接输出datatime）（两小时为一个刻度）
        }
        amount.append(spans);
        amount.find("span").css("width", cellWidth * 2);
        //move(0);
        move(timeData.length - 1);
        $("#slider .pause").click(function () {
            $(this).hide();
            $("#slider .playing").show();
            clearInterval(timer);
        });
        $("#slider .playing").click(function () {
            $(this).hide();
            $("#slider .pause").show();
            timer = setInterval(move, 3000, 1);
        });
        $("#slider").find("span").click(function () {
            moveTo($(this).data("index") - 0);
            //clearmap();
        });
    }
    initTimeline(timelineHourData)
    //initData()
    window.addEventListener('resize', function () {
        cellWidth = $("#slider .slider-bar").width() / (timelineHourData.length * 2 + 1);
        var currentWidth = (currentIndex * 2 + 1) * cellWidth;
        $("#slider .completed").css("width", currentWidth + "px");
        var timetip = $("#slider .timetip");
        timetip.css("left", currentWidth + "px");
    })
})