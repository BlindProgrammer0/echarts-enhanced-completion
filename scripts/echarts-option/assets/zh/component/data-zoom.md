# dataZoom(Array|Object)

`dataZoom` 组件 用于区域缩放，从而能自由关注细节的数据信息，或者概览数据整体，或者去除离群点的影响。


现在支持这几种类型的 `dataZoom` 组件：

+ [内置型数据区域缩放组件（dataZoomInside）](~dataZoom-inside)：内置于坐标系中，使用户可以在坐标系上通过鼠标拖拽、鼠标滚轮、手指滑动（触屏上）来缩放或漫游坐标系。

+ [滑动条型数据区域缩放组件（dataZoomSlider）](~dataZoom-slider)：有单独的滑动条，用户在滑动条上进行缩放或漫游。

+ [框选型数据区域缩放组件（dataZoomSelect）](~toolbox.feature.dataZoom)：提供一个选框进行数据区域缩放。即 [toolbox.feature.dataZoom](~toolbox.feature.dataZoom)，配置项在 `toolbox` 中。


如下例子：
~[600x400](${galleryViewPath}doc-example/scatter-dataZoom-all&edit=1&reset=1)

<br>

---

**✦ dataZoom 和 数轴的关系 ✦**

`dataZoom` 主要是对 `数轴（axis）` 进行操作（控制数轴的显示范围，或称窗口（window））。

> 可以通过 [dataZoom.xAxisIndex](~dataZoom.xAxisIndex) 或 [dataZoom.yAxisIndex](~dataZoom.yAxisIndex) 或 [dataZoom.radiusAxisIndex](~dataZoom.radiusAxisIndex) 或 [dataZoom.angleAxisIndex](~dataZoom.angleAxisIndex) 来指定 `dataZoom` 控制哪个或哪些数轴。

`dataZoom` 组件可 **同时存在多个**，起到共同控制的作用。如果多个 `dataZoom` 组件共同控制同一个数轴，他们会自动联动。

<br>

---

**✦ dataZoom 组件如何影响轴和数据 ✦**



`dataZoom` 的运行原理是通过 `数据过滤` 以及在内部设置轴的显示窗口来达到 `数据窗口缩放` 的效果。

数据过滤模式（[dataZoom.filterMode](~dataZoom.filterMode)）的设置不同，效果也不同。

可选值为：

+ 'filter'：当前数据窗口外的数据，被 **过滤掉**。即 **会** 影响其他轴的数据范围。每个数据项，只要有一个维度在数据窗口外，整个数据项就会被过滤掉。

+ 'weakFilter'：当前数据窗口外的数据，被 **过滤掉**。即 **会** 影响其他轴的数据范围。每个数据项，只有当全部维度都在数据窗口同侧外部，整个数据项才会被过滤掉。

+ 'empty'：当前数据窗口外的数据，被 **设置为空**。即 **不会** 影响其他轴的数据范围。

+ 'none': 不过滤数据，只改变数轴范围。

如何设置，由用户根据场景和需求自己决定。经验来说：

+ 当『只有 X 轴 或 只有 Y 轴受 `dataZoom` 组件控制』时，常使用 `filterMode: 'filter'`，这样能使另一个轴自适应过滤后的数值范围。

+ 当『X 轴 Y 轴分别受 `dataZoom` 组件控制』时：

    + 如果 X 轴和 Y 轴是『同等地位的、不应互相影响的』，比如在『双数值轴散点图』中，那么两个轴可都设为 `fiterMode: 'empty'`。

    + 如果 X 轴为主，Y 轴为辅，比如在『柱状图』中，需要『拖动 `dataZoomX` 改变 X 轴过滤柱子时，Y 轴的范围也自适应剩余柱子的高度』，『拖动 `dataZoomY` 改变 Y 轴过滤柱子时，X 轴范围不受影响』，那么就 X轴设为 `fiterMode: 'filter'`，Y 轴设为 `fiterMode: 'empty'`，即主轴 `'filter'`，辅轴 `'empty'`。

下面是个具体例子：

```javascript
option = {
    dataZoom: [
        {
            id: 'dataZoomX',
            type: 'slider',
            xAxisIndex: [0],
            filterMode: 'filter'
        },
        {
            id: 'dataZoomY',
            type: 'slider',
            yAxisIndex: [0],
            filterMode: 'empty'
        }
    ],
    xAxis: {type: 'value'},
    yAxis: {type: 'value'},
    series{
        type: 'bar',
        data: [
            // 第一列对应 X 轴，第二列对应 Y 轴。
            [12, 24, 36],
            [90, 80, 70],
            [3, 9, 27],
            [1, 11, 111]
        ]
    }
}
```
上例中，`dataZoomX` 的 `filterMode` 设置为 `'filter'`。于是，假设当用户拖拽 `dataZoomX`（不去动 `dataZoomY`）导致其 valueWindow 变为 `[2, 50]` 时，`dataZoomX` 对 series.data 的第一列进行遍历，窗口外的整项去掉，最终得到的 series.data 为：

```javascript
[
    // 第一列对应 X 轴，第二列对应 Y 轴。
    [12, 24, 36],
    // [90, 80, 70] 整项被过滤掉，因为 90 在 dataWindow 之外。
    [3, 9, 27]
    // [1, 11, 111] 整项被过滤掉，因为 1 在 dataWindow 之外。
]
```

过滤前，series.data 中对应 Y 轴的值有 `24`、`80`、`9`、`11`，过滤后，只剩下 `24` 和 `9`，那么 Y 轴的显示范围就会自动改变以适应剩下的这两个值的显示（如果 Y 轴没有被设置 `min`、`max` 固定其显示范围的话）。

所以，`filterMode: 'filter'` 的效果是：过滤数据后使另外的轴也能自动适应当前数据的范围。

再从头来，上例中 `dataZoomY` 的 `filterMode` 设置为 `'empty'`。于是，假设当用户拖拽 `dataZoomY`（不去动 `dataZoomX`）导致其 dataWindow 变为 `[10, 60]` 时，`dataZoomY` 对 series.data 的第二列进行遍历，窗口外的值被设置为 empty （即替换为 NaN，这样设置为空的项，其所对应柱形，在 X 轴还有占位，只是不显示出来）。最终得到的 series.data 为：

```javascript
[
    // 第一列对应 X 轴，第二列对应 Y 轴。
    [12, 24, 36],
    [90, NaN, 70], // 设置为 empty (NaN)
    [3, NaN, 27],  // 设置为 empty (NaN)
    [1, 11, 111]
]
```

这时，series.data 中对应于 X 轴的值仍然全部保留不受影响，为 `12`、`90`、`3`、`1`。那么用户对 `dataZoomY` 的拖拽操作不会影响到 X 轴的范围。这样的效果，对于离群点（outlier）过滤功能，比较清晰。

如下面的例子：
~[600x400](${galleryViewPath}doc-example/bar-dataZoom-filterMode&edit=1&reset=1)



另外，如果在任一个数轴上设置了 `min`、`max`（如设置 `yAxis: {min: 0, max: 400}`），那么这个数轴无论如何也不会被其他数轴的 dataZoom 行为影响了。

<br>

---

**✦ 数据窗口的设置 ✦**

`dataZoom` 的数据窗口范围的设置，目前支持两种形式：

+ 百分比形式：即设置 [dataZoom.start](~dataZoom.start) 和 [dataZoom.end](~dataZoom.end)。

+ 绝对数值形式：即设置 [dataZoom.startValue](~dataZoom.startValue) 和 [dataZoom.endValue](~dataZoom.endValue)。

注意：当使用百分比形式指定 `dataZoom` 范围时，且处于如下场景（或类似场景）中，`dataZoom` 的结果是和 `dataZoom` 组件的定义顺序相关的。

```javascript
option = {
    dataZoom: [
        {
            id: 'dataZoomX',
            type: 'slider',
            xAxisIndex: [0],
            filterMode: 'filter', // 设定为 'filter' 从而 X 的窗口变化会影响 Y 的范围。
            start: 30,
            end: 70
        },
        {
            id: 'dataZoomY',
            type: 'slider',
            yAxisIndex: [0],
            filterMode: 'empty',
            start: 20,
            end: 80
        }
    ],
    xAxis: {
        type: 'value'
    },
    yAxis: {
        type: 'value'
        // yAxis 中并没有使用 min、max 来显示限定轴的显示范围。
    },
    series{
        type: 'bar',
        data: [
            // 第一列对应 X 轴，第二列对应 Y 轴。
            [12, 24, 36],
            [90, 80, 70],
            [3, 9, 27],
            [1, 11, 111]
        ]
    }
}
```

在上例中，`dataZoomY` 的 `start: 20, end: 80` 到底表示什么意思？

+ 如果 `yAxis.min`、`yAxis.max` 进行了直接设置：

    那么 `dataZoomY` 的 `start: 20, end: 80` 表示 `yAxis.min` ~ `yAxis.max` 的 `20%` 到 `80%`。

+ 如果 `yAxis.min`、`yAxis.max` 没有设置：

    + 如果 `dataZoomX` 设置为 `filterMode: 'empty'`：

        那么 `dataZoomY` 的 `start: 20, end: 80` 表示 series.data 中 `dataMinY` ~ `dataMaxY`（即上例中的 `9` ~ `80`）的 `20%` 到 `80%`。

    + 如果 `dataZoomX` 设置为 `filterMode: 'filter'`：

        那么，因为 `dataZoomX` 定义 `dataZoomY` 组件之前，所以 `dataZoomX` 的 `start: 30, end: 70` 表示全部数据的 `30%` 到 `70%`，而 `dataZoomY` 组件的 `start: 20, end: 80` 表示经过 `dataZoomX` 过滤处理后，所得数据集的 `20%` 到 `80%`。

        如果需要改变这种处理顺序，那么改变 `dataZoomX` 和 `dataZoomY` 在 option 中的出现顺序即可。
