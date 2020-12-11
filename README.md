## 上传组件——前后端不分离 简介参考下面地址：
1、效果如图所示（仅支持一次一个上传；选择即马上上传）：【此demo兼容ie9-11；上传接口的响应头中的'Content-type'请设置为'text/html;charset=utf-8'】
一、下载文件及运行demo：
上传组件带简单接口的完整测试包文件见附件【upload_backend.zip】，目录结构如下：
│ index.js     // nodejs编写的服务器及后台上传接口
│ package.json     // 依赖文件记录
├─upload_images    // 上传的文件存储的位置
├─demo     // uploader 组件（主要组件代码）

请下载附件后，在文件夹根目录运行以下命令（请先安装node.js）：
npm install
node index.js
然后浏览器中    【<本电脑ip>:3111】   访问。
二、主要的demo目录结构如下：
├─demo
│ │ index.html     // 页面
│ │
│ └─iu-assets     // 相关资源
│ delete.png
│ iu-css.css     // less编译后的组件样式
│ iu-css.less     // less的组件样式
│ iu-source.js      // 组件js
│ upload.png

三、使用文件上传需要引入两种资源：JS, CSS。
jquery引用说明：jquery版本在【1.7.2+】  到 【3.5.1】 都可以。一般项目中都已经引用了jquery，如果项目中的jquery可以正常使用的话，则不需要另外引用jquery或者改jquery引用版本。
``` javascript
// 头部引入资源
<!--引入JS&CSS：jquery可引入其他版本，或引入本地版本-->
<script type="text/javascript" src="//lib.baomitu.com/jquery/2.2.4/jquery.min.js"></script>
<link rel="stylesheet" href="./iu-assets/iu-css.css">
```

四、主页面结构：
``` javascript
<div class="iu-module">
    <div class="iu-btns">
        <div id="picker" class="iu-choose-btn">
            <label>选择文件</label>
        </div>
        <i class="iu-remark">支持文件格式：xxxx\xxxxx\xxx，单个文件大小不超过xxxxkb。</i>
    </div>
    <!--用来存放文件信息-->
    <ul id="iu-list" class="iu-list">
    </ul>
</div>
<script src="./iu-assets/iu-source.js"></script>
```
上传类对象：
``` javascript
var uploader = new IUploader({
    $picker: $('#picker'), // 选择文件的按钮的jquery对象【必需】
    $list: $('#iu-list'), // 展示的文件列表的jquery对象【必需】
    // accept: { // 允许上传的类型【非必需：默认无类型限制】
    //     extensions: 'gif,jpg,jpeg,bmp,png', // 检测类型
    //     mimeTypes: 'image/*' // 选择框中的过滤类型
    // },
    canDelete: true, // 是否可以删除【非必需：默认不可删除】
    fileSingleSizeLimit: '40000', // 允许上传的单个文件的大小，单位：字节【非必需：默认无大小限制】
    allowNum: 4,  // 允许上传文件的个数【非必需：默认无数量限制】
    server: '/upload.do?action=uploadFile', // 后台上传接口【必需】
    /**
     * 成功的条件【必需】
     * @param {接口返回对象} response
     */
    successOption: function (response) {
        return response.state === 'SUCCESS'
    },
    /**
     * 成功的回调函数【非必需】
     * @param {接口返回对象} response
     */
    uploadCallback: function (response) {
        console.log(response)
    },
    /**
     * 失败的回调函数【非必需】
     * @param {接口返回对象} response
     */
    errorCallback: function (response) {
        console.log(response)
    },
    /**
     * 删除的回调函数【非必需：默认直接移除展示文件】
     * @param {附件id} id
     */
    deleteCallback: function (id) {
        console.log(id)
        var _this = this;
        setTimeout(function () {
            // 必需要：要执行页面展示文件删除
            _this.deleteItem(id);
        }, 1000);
    }
});
 
 
// 动态修改接口路径
// uploader.changeServer('xxxxx');
```

IUploader使用的参数说明：
$picker  {Object} [必选]  →  指定选择文件的按钮容器的jquery对象。
$list  {Object} [必选]   → 展示的文件列表的jquery对象。
accept  {Object} [可选] [默认值：null]  →  指定接受哪些类型的文件。 由于目前还有ext转mimeType表，所以这里需要分开指定。
extensions {String}  →  允许的文件后缀，不带点，多个用逗号分割。
mimeTypes {String}  →  多个用逗号分割。
canDelete  {Boolean}[可选] [默认值：undefined]  →  上传的文件是否可以删除（true的话，文件上传成功后会显示删除图标）。
fileSingleSizeLimit   {int} [可选] [默认值：undefined]  →  验证单个文件大小是否超出限制, 超出则不允许加入队列。（其中ie9中文件大小前端限制不了，需要后端接口做限制）
allowNum  {Boolean}[可选] [默认值：undefined]  →  允许上传的文件个数，上传的失败的文件会自动移除，移除后不算作内。
server  {String}[必选]   →  后台上传接口，默认是post方法。


IUploader传入的函数说明：
successOption	
response对象
接口上传成功的条件。内部需要用作判断，是移除文件还是展示文件。

uploadCallback
response对象
接口正常返回数据的回调函数，可做扩展。

errorCallback	
response对象
接口失败后的回调函数，可做扩展。

deleteCallback	
附件id
删除文件的时候的回调函数，可做扩展。

另外提供一个可动态修改接口路径的方法：
``` javascript
// 动态修改接口路径
uploader.changeServer('xxxxx');
```

五、demo中的iu-source.js方法（主要代码：如下）：
上传限制的提示语及显示方法可在beforeUpload中修改
对接口返回数据需要做些通用的处理的话，在upComplete中的JSON.parse(res)这个地方可先对res进行一些处理
