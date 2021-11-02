# series.boxplot(Object)

[Boxplot](https://en.wikipedia.org/wiki/Box_plot) 中文可以称为『箱形图』、『盒须图』、『盒式图』、『盒状图』、『箱线图』，是一种用作显示一组数据分散情况资料的统计图。它能显示出一组数据的最大值、最小值、中位数、下四分位数及上四分位数。

**示例如下：**

~[600x400](${galleryViewPath}boxplot-light-velocity&edit=1&reset=1)

也支持多个 `series` 在同一个坐标系中，参见 [例子](${galleryEditorPath}boxplot-multi&edit=1&reset=1)。

<ExampleBaseOption name="boxplot" title="盒须图" title-en="Boxplot">
const option = {
     title: [{
             text: "Michelson-Morley Experiment",
             left: "center"
         }
     ],
     xAxis: {
         type: "category",
         data: ["0", "1", "2", "3", "4"],
         boundaryGap: true,
         nameGap: 30,
         splitArea: {
             show: false
         },
         axisLabel: {
             formatter: "expr {value}"
         },
         splitLine: {
             show: false
         },
     },
     yAxis: {
         type: "value",
         name: "km/s minus 299,000",
         splitArea: {
             show: true,
         },
     },
     series: [{
         name: "boxplot",
         type: "boxplot",
         data: [
             [655, 850, 940, 980, 1070],
             [760, 800, 845, 885, 960],
             [780, 840, 855, 880, 940],
             [720, 767.5, 815, 865, 920],
             [740, 807.5, 810, 870, 950],
         ]
     }]
}
</ExampleBaseOption>

## type(string) = 'boxplot'











## hoverAnimation(boolean) = true

是否开启 hover 在 box 上的动画效果。

## layout(string) = null

<ExampleUIControlEnum options="horizontal,vertical">

布局方式，可选值：

+ `'horizontal'`：水平排布各个 box。

+ `'vertical'`：竖直排布各个 box。

默认值根据当前坐标系状况决定：如果 `category` 轴为横轴，则水平排布；否则竖直排布；如果没有 `category` 轴则水平排布。

## boxWidth(Array) = [7, 50]

<ExampleUIControlPercentVector default="7,50" min="0" dims="min,max" />

box 的宽度的上下限。数组的意思是：`[min, max]`。

可以是绝对数值，如 `[7, 50]`，也可以是百分比，如 `['40%', '90%']`。百分比的意思是，最大可能宽度（bandWidth）的百分之多少。

## itemStyle(Object)

盒须图样式。



## emphasis(Object)

盒须图高亮样式



### itemStyle(Object)



## blur(Object)



淡出时的图形样式和标签样式。开启 [emphasis.focus](~series-boxplot.emphasis.focus) 后有效

### itemStyle(Object)



## select(Object)



数据选中时的图形样式和标签样式。开启 [selectedMode](~series-funnel.selectedMode) 后有效。

### itemStyle(Object)











## data(Array)

数据格式是如下的二维数组。

```javascript
[
    [655, 850, 940, 980, 1175],
    [672.5, 800, 845, 885, 1012.5],
    [780, 840, 855, 880, 940],
    [621.25, 767.5, 815, 865, 1011.25],
    { // 数据项也可以是 Object，从而里面能含有对此数据项的特殊设置。
        value: [713.75, 807.5, 810, 870, 963.75],
        itemStyle: {...}
    },
    ...
]
```

二维数组的每一数组项（上例中的每行）是渲染一个box，它含有五个量值，依次是：

```javascript
[min,  Q1,  median (or Q2),  Q3,  max]
```

**数据的处理**

ECharts 并不内置对原始数据的处理，输入给 `boxplot` 的数据须是如上五个统计结果量值。

但是 ECharts 也额外提供了简单的 [原始数据处理函数](https://github.com/apache/echarts/tree/master/extension/dataTool)，如这个 [例子](${galleryEditorPath}boxplot-light-velocity&edit=1&reset=1) 使用了`echarts.dataTool.prepareBoxplotData` 来进行简单的数据统计。

### name(string)

数据项名称。

### value(Array)

数据值。

```javascript
[min,  Q1,  median (or Q2),  Q3,  max]
```



### itemStyle(Object)

盒须图单个数据样式。



### emphasis(Object)

盒须图单个数据高亮状态配置。

#### itemStyle(Object)



### blur(Object)



盒须图单个数据淡出状态配置。

#### itemStyle(Object)



### select(Object)



盒须图单个数据选中状态配置。

#### itemStyle(Object)













#${prefix} animationDuration(number|Function) = ${defaultAnimationDuration|default(1000)}

<ExampleUIControlNumber min="0" default="${defaultAnimationDuration|default(1000)}" step="20" clean="true" />

初始动画的时长，支持回调函数，可以通过每个数据返回不同的时长实现更戏剧的初始动画效果：

```js
animationDuration: function (idx) {
    // 越往后的数据时长越大
    return idx * 100;
}
```

#${prefix} animationEasing(string) = ${defaultAnimationEasing|default('cubicOut')}

<ExampleUIControlEnum options="linear,quadraticIn,quadraticOut,quadraticInOut,cubicIn,cubicOut,cubicInOut,quarticIn,quarticOut,quarticInOut,quinticIn,quinticOut,quinticInOut,sinusoidalIn,sinusoidalOut,sinusoidalInOut,exponentialIn,exponentialOut,exponentialInOut,circularIn,circularOut,circularInOut,elasticIn,elasticOut,elasticInOut,backIn,backOut,backInOut,bounceIn,bounceOut,bounceInOut" clean="true" />

初始动画的缓动效果。不同的缓动效果可以参考 [缓动示例](${galleryEditorPath}line-easing)。

{{ if: !${noAnimationDelay} }}
#${prefix} animationDelay(number|Function) = 0

初始动画的延迟，支持回调函数，可以通过每个数据返回不同的 delay 时间实现更戏剧的初始动画效果。

如下示例：
```js
animationDelay: function (idx) {
    // 越往后的数据延迟越大
    return idx * 100;
}
```

也可以看[该示例](${galleryEditorPath}bar-animation-delay)
{{ /if }}
