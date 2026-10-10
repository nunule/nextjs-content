$(function () {
    if ($('.nav-content .active').attr('controlname') != 'StationPublish') return
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

            div.onmouseover = function () {
                if ($(this).find('.public-popup').length == 0) {
                    var popup = $(
                        '<div class="public-popup">' +
                        '<div class="public-popup-pin"></div>' +
                        '<div class="public-popup-name">' +
                        '<span class="public-popup-marker bg-' + level + '"></span>' +
                        '<span>' + that.data.PositionName + '</span>' +
                        '<span class="public-popup-tip">' + replaceSub(pollutantSubName) + '</span>' +
                        '<span class="public-popup-close" onclick="closePopup()">×</span>' +
                        '</div>' +
                        '<div class="public-popup-content">' +
                        '<div class="public-popup-left">' + that.data[pollutantValueKey] + '</div>' +
                        '<div class="public-popup-center">' +
                        '<div class="public-popup-level bg-' + level + '">' + levels[level] + '</div>' +
                        '</div>' +
                        '<div class="public-popup-right">' +
                        '<p><span>' + that.data.TimePointStr + '</span> 发布</p>' +
                        '<p>首要污染物：<span>' + replaceSub(that.data.PrimaryPollutant) + '</span></p>' +
                        '</div>' +
                        '</div>' +
                        '<div class="public-popup-health"><div>健康指引：</div><div>' + (that.data.Unheathful || '—') + '</div></div>' +
                        '<div class="public-popup-advice"><div>建议措施：</div><div>' + (that.data.Measure || '—') + '</div></div>' +
                        '</div>'
                    )
                }
                $(this).css({ zIndex: 20000 })
                var pos = $(this)[0].getBoundingClientRect()
                popup.css({
                    position: 'fixed',
                    zIndex: 100,
                    left: pos.left + 'px',
                    top: pos.top + 'px',
                    transform: that.mini ? 'translate3d(-195px, -100%, 0)' : 'translate3d(-185px, -100%, 0)',
                    marginTop: '-10px'
                })
                $('body').append(popup)
            }

            div.onclick = function () {
                stationCode = that.data.StationCode
                var stationName = that.data.PositionName
                var cityCode = that.data.CityCode
                var cityName = that.data.Area
                $('.public-popup').remove()
                // 切换省份,城市
                var provinceHead = cityCode.toString().slice(0, 2)
                $('#province-list .active').removeClass('active')
                var province = $('#province-list [_code="' + provinceHead + '"]')
                var provinceId = province.attr('_id')
                province.addClass('active')
                initProvinceCityData(provinceId, cityCode)
                // 联动地图底部echarts
                $('#chart-station').text(stationName)
                initChartData(stationCode)
                // 联动右侧点位列表
                initCityStationData(cityName, stationCode)
                // 定位地图范围
                map.centerAndZoom(new T.LngLat(that.data.Longitude, that.data.Latitude), 9)
                // 联动右侧城市详情
                getCityDetail(cityCode)
                // 高亮地图点位
                setTimeout(function () {
                    lightMapStation(stationCode)
                }, 300)
            }

            div.onmouseout = function () {
                $(this).css({ zIndex: 1000 })
                $('.public-popup').remove()
            }

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
    function initData(isFresh) {
        var url = '/HourChangesPublish/GetAllAQIPublishLive'
        if (xhr1) xhr1.abort()
        xhr1 = $.post(url, {}).done(function (res) {
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
    initData()

    // -----------------------------------------------------------------------------------------定位省份或城市
    var administrative = null
    $(function () {
        administrative = new T.AdministrativeDivision();
    })
    function locationRegion(name) {
        //var config = {
        //    needSubInfo: false,
        //    needAll: false,
        //    needPolygon: true,
        //    needPre: true,
        //    searchType: 1,
        //    searchWord: name
        //}
        //if (administrative) administrative.search(config, function (res) {
        //    //console.log(res)
        //    map.centerAndZoom(new T.LngLat(res.data[0].lnt, res.data[0].lat), res.data[0].level)
        //});
        if (name == '中国') {
            map.centerAndZoom(new T.LngLat(107.1928875, 38.346062532), 4)
        }
        $.get('https://api.tianditu.gov.cn/v2/administrative', {
            tk: '5f480632025dbbc0075c3fb0ddccd166',
            keyword: name
        }).done(function (res) {
            console.log(res)
            if (res.data && res.status == 200) {
                var data = res.data.district.filter(e => e.level == 3 || e.level == 4)[0]
                if (data) {
                    map.centerAndZoom(new T.LngLat(data.center.lng, data.center.lat), data.level == 3 ? 7 : 6)
                }
            } else {
                alert(res.message)
            }
        })
    }

    // -----------------------------------------------------------------------------------------定位省份或城市
    var dayChart = echarts.init(document.getElementById('pollutantChart'))
    var levelStyle = {
        '优': 'a',
        '良': 'b',
        '轻度': 'c',
        '中度': 'd',
        '重度': 'e',
        '严重': 'f'
    }
    var levelNum = {
        '优': '1',
        '良': '2',
        '轻度': '3',
        '中度': '4',
        '重度': '5',
        '严重': '6'
    }
    function richStyle(r, g, b, textColor) {
        return {
            color: textColor || 'rgb(' + r + ', ' + g + ', ' + b + ')',
            borderWidth: 1,
            borderColor: 'rgb(' + r + ', ' + g + ', ' + b + ')',
            backgroundColor: 'rgba(' + r + ', ' + g + ', ' + b + ', 0.2)',
            width: 30,
            height: 20,
            align: 'center'
        }
    }

    // -----------------------------------------------------------------------------------------获取城市24小时数据
    var xhr2 = null
    var chartType = '1'
    var chartData = []
    function initChartData(code) {
        var url =
            chartType == '1'
                ? '/HourChangesPublish/GetAqiHistoryByCondition?stationCode='
                : '/HourChangesPublish/GetIAqiHistoryByCondition?stationCode='
        dayChart.showLoading({
            text: '加载中...'
        })
        if (xhr2) xhr2.abort()
        xhr2 = $.post(url + code, {}).done(res => {
            dayChart.hideLoading()
            chartData = res
            renderChart()
        })
    }

    function renderChart() {
        var valueKey = chartType == '1' ? pollutantValueKey : 'I' + pollutantValueKey
        var data = chartData.sort(function (a, b) {
            return a.TimePoint.slice(6, 19) - b.TimePoint.slice(6, 19)
        }).map(function (item) {
            return {
                value: item[valueKey],
                level: pollutantLevelKey == 'Quality' ? item.Quality.slice(0, 2) : levels[item[pollutantLevelKey]].slice(0, 2),
                desc: valueKey.indexOf('PM') != -1 ? item[valueKey + "_24h"] : ""
            }
        })
        var xAxisData = chartData.map(function (item) {
            return item.TimePointStr.slice(3)
        })
        var option = {
            grid: {
                left: 10,
                right: 10,
                bottom: 10,
                top: 30
            },
            tooltip: {
                trigger: 'axis',
                formatter: function (param) {
                    //console.log(param)
                    var serName = param[0].seriesName;
                    var tooltip = '<div>' + param[0].name + '</div>'
                    tooltip += '<span class="tooltip-point bg-' + levelNum[param[0].data.level] + '"></span>'
                    tooltip += chartType == '1' ? (replaceSub(serName) + '：') : '分指数：'
                    tooltip += param[0].value
                    tooltip += chartType == '1' ? (serName == 'CO' ? 'mg/m³' : param[0].seriesName == 'AQI' ? '' : 'μg/m³') : '（无量纲）'
                    tooltip += (chartType == '1' && serName.indexOf('PM') != -1) ? "<br/>" + param[0].data.desc : ""

                    return tooltip
                }
            },
            xAxis: {
                position: 'top',
                axisLine: { show: false },
                axisTick: { show: false },
                type: 'category',
                data: xAxisData
            },
            yAxis: {
                type: 'value',
                max: function (v) {
                    return Math.ceil((v.max + v.max - v.min) / 10) * 10
                },
                min: function (v) {
                    return Math.floor(v.min / 10) * 10
                },
                splitLine: { show: false },
                axisLabel: { show: false }
            },
            series: [
                {
                    data: data,
                    name: pollutantSubName,
                    type: 'line',
                    color: '#999999',
                    symbol: 'circle',
                    label: {
                        show: true,
                        align: 'center',
                        formatter: function (e) {
                            var value = e.data.value
                            var level = e.data.level
                            return (
                                '{' +
                                levelStyle[level] +
                                '|' +
                                level +
                                '}\n\n' +
                                value
                            )
                        },
                        rich: {
                            a: richStyle(0, 228, 0),
                            b: richStyle(
                                255,
                                255,
                                0,
                                '#A58A00'
                            ),
                            c: richStyle(
                                255,
                                126,
                                0
                            ),
                            d: richStyle(255, 0, 0),
                            e: richStyle(153, 0, 76),
                            f: richStyle(126, 0, 35)
                        }
                    }
                }
            ]
        }
        dayChart.resize()
        dayChart.setOption(option)

    }

    // -----------------------------------------------------------------------------------------获取省份列表
    function initProvinceData() {
        $.get('/CityData/GetProvince').done(function (res) {
            $('#province-list').html('')
            res.forEach(function (province) {
                var name = province.ProvinceName
                var id = province.Id
                var code = province.ProvinceCode
                if (nodataarea.includes(name)) {
                    var item = $('<li class="light-text">' + name + '</li>')
                } else {
                    var item = $('<li class="normal-text" _id="' + id + '" _code="' + code.toString().slice(0, 2) + '">' + name + '</li>')
                    item.click(function () {
                        // 高亮
                        $('#province-list .active').removeClass('active')
                        $(this).addClass('active')
                        // 定位地图
                        locationRegion(name)
                        // 获取省份城市列表
                        initProvinceCityData(id)
                    })
                }
                $('#province-list').append(item)
            })
            $('#province-list .normal-text').eq(0).addClass('active')
            initProvinceCityData(res[0].Id)
        })
    }
    initProvinceData()

    // -----------------------------------------------------------------------------------------获取城市列表
    function initProvinceCityData(id, active) {
        $.get('/CityData/GetCitiesByPid?pid=' + id).done(function (res) {
            $('#city-list').html('')
            res.forEach(function (city) {
                var name = city.CityName
                var code = city.CityCode
                var item = $('<li class="normal-text" _code="' + code + '">' + name + '</li>')
                item.click(function () {
                    // 高亮
                    $('#city-list .active').removeClass('active')
                    $(this).addClass('active')
                    initCityStationData(name)
                    locationRegion(name)
                    getCityDetail(code)
                })
                $('#city-list').append(item)
                if (active == code) {
                    item.addClass('active')
                }
            })
            if (!active) { // 不传城市默认选中第一个
                $('#city-list .normal-text').eq(0).addClass('active')
                initCityStationData(res[0].CityName)
                getCityDetail(res[0].CityCode)
            }
        })
    }

    // -----------------------------------------------------------------------------------------获取城市点位监测数据列表
    var stationCode = ''
    function initCityStationData(name, code) {
        $.get('/CityData/GetAQIDataPublishLive?cityName=' + name).done(function (res) {
            $('#station-list').html('')
            res.forEach(function (station) {
                var PositionName = station.PositionName
                var AQI = station.AQI
                var PM2_5 = station.PM2_5
                var PM10 = station.PM10
                var SO2 = station.SO2
                var NO2 = station.NO2
                var CO = station.CO
                var O3 = station.O3
                var item = $('<li><div title="'
                    + PositionName
                    + '">'
                    + PositionName
                    + '</div><div>'
                    + AQI
                    + '</div><div>'
                    + PM2_5
                    + '</div><div>'
                    + PM10
                    + '</div><div>'
                    + SO2
                    + '</div><div>'
                    + NO2
                    + '</div><div>'
                    + CO
                    + '</div><div>'
                    + O3
                    + '</div></li>')
                item.click(function () {
                    $(this).siblings().removeClass("active");
                    $(this).addClass("active");

                    map.centerAndZoom(new T.LngLat(station.Longitude, station.Latitude), 11)
                    setTimeout(() => { 

                        lightMapStation(station.StationCode)
                    }, 200)
                    stationCode = station.StationCode
                    //lightMapStation(station.StationCode)
                    initChartData(station.StationCode)
                    $('#chart-station').text(station.PositionName)
                })
                $('#station-list').append(item)
                if (code == station.StationCode) {
                    item.addClass('active')
                }
            })
            if (!code) {
                initChartData(res[0].StationCode)
                stationCode = res[0].StationCode
                $('#chart-station').text(res[0].PositionName)
            }
        })
    }

    function lightMapStation(code) {
        $('.public-point').removeClass('light')
        $('.public-point[_city=' + code + ']').addClass('light')
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

    // -----------------------------------------------------------------------------------------搜索城市
    var showSearch = false

    function searchStation(value) {
        var allStation = mapData.filter(function (station) {
            return station.PositionName.includes(value)
        })
        $('#search-list').html('')
        if (allStation.length == 0) {
            $('#search-list').text('未搜索到相应点位')
        } else {
            allStation.forEach(station => {
                var item = $('<li>' + station.PositionName + '</li>')
                item.click(function () {
                    $('#station-search').attr('_code', station.StationCode).val(station.PositionName)
                    $('#search-list').hide()
                    // 切换省份,城市
                    var provinceHead = station.CityCode.toString().slice(0, 2)
                    $('#province-list .active').removeClass('active')
                    var province = $('#province-list [_code="' + provinceHead + '"]')
                    var provinceId = province.attr('_id')
                    province.addClass('active')
                    initProvinceCityData(provinceId, station.CityCode)
                    // 联动地图底部echarts
                    $('#chart-station').text(station.PositionName)
                    initChartData(station.StationCode)
                    // 联动右侧点位列表
                    initCityStationData(station.Area, station.StationCode)
                    // 定位地图范围
                    map.centerAndZoom(new T.LngLat(station.Longitude, station.Latitude), 9)
                    // 联动右侧城市详情
                    getCityDetail(station.CityCode)
                    // 高亮地图点位
                    setTimeout(function () {
                        lightMapStation(station.StationCode)
                    }, 300)
                    stationCode = station.StationCode
                })
                $('#search-list').append(item)
            })
        }
    }

    $('#station-search').focus(function () {
        showSearch = true
        $('#search-list').show()
        $('#search-list').html('')
        searchStation($(this).val())
        $(".icon-close").show();
    })

    $('#station-search').blur(function () {
        showSearch = false
        setTimeout(function () {
            if (!showSearch) $('#search-list').hide();
            $(".icon-close").hide();
        }, 200)

    })
    $(".icon-close").click(function () {
        $('#station-search').val('');
        $('#station-search').focus();
    })
    $('#station-search').on('input', function () {
        searchStation($(this).val())
    })

    //$('.icon-search').click(function () {
    //    var station = mapData.find(function (station) {
    //        return station.PositionName.includes($('#station-search').val())
    //    })
    //    if (station) {
    //        lightMapStation(station.StationCode)
    //    }
    //})

    // -----------------------------------------------------------------------------------------返回全国
    $('#nation').click(function () {
        locationRegion('中国')
    })

    // -----------------------------------------------------------------------------------------切换污染物
    $('.poll-select > div').click(function () {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
        pollutantSubName = $(this).text()
        pollutantLevelKey = $(this).attr('_level')
        pollutantValueKey = $(this).attr('_value')
        $('.chart-tab').attr('_pollutant', pollutantValueKey)
        $('.chart-pollutant').html(replaceSub(pollutantSubName))
        $('#chartTt').html(pollutantSubName == 'AQI' ? "过去24小时变化趋势" : "过去24小时浓度变化趋势")

        renderPoint()
        if (chartType == 2 && pollutantSubName == 'AQI') { //分指数时切换到AQI时需要重新请求
            chartType = 1
            $('.chart-tab-item').removeClass('active').eq(0).addClass('active')
            initChartData(stationCode)
        } else {
            renderChart()
        }
    })

    // -----------------------------------------------------------------------------------------监听达标变化
    $(window).resize(function () {
        dayChart.resize()
    })

    // -----------------------------------------------------------------------------------------切换图表
    $('.chart-tab-item').click(function () {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
        if ($(this).attr('_type') != chartType) {
            chartType = $(this).attr('_type')
            initChartData(stationCode)
        }
    })

    // -----------------------------------------------------------------------------------------刷新
    $('.btn-panel-refresh').click(function () {
        initData(true)
        locationRegion('中国')
        $('#province-list li').removeClass('active').eq(0).addClass('active')
        initProvinceCityData($('#province-list li').eq(0).attr('_id'))
    })
})